// Web sensor bridge for supported phones and Bluetooth Low Energy wearables.
// Health measurements stay in the browser unless the caller explicitly saves them.

const SERVICES = {
  heartRate: { service: "heart_rate", characteristic: "heart_rate_measurement" },
  temperature: { service: "health_thermometer", characteristic: "temperature_measurement" },
  spo2: { service: 0x1822, characteristic: 0x2a5f },
};

function ensureBluetooth() {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth is not supported in this browser. Use a supported mobile/desktop Chrome-based browser.");
  }
}

function parseHeartRate(value) {
  const flags = value.getUint8(0);
  const is16Bit = (flags & 0x01) === 1;
  return is16Bit ? value.getUint16(1, true) : value.getUint8(1);
}

function parseTemperature(value) {
  // IEEE-11073 FLOAT: 24-bit mantissa + 8-bit exponent.
  let mantissa = value.getUint8(1) | (value.getUint8(2) << 8) | (value.getUint8(3) << 16);
  if (mantissa & 0x00800000) mantissa |= 0xff000000;
  const exponent = value.getInt8(4);
  return Number((mantissa * Math.pow(10, exponent)).toFixed(2));
}

function parseSpO2(value) {
  // Bluetooth PLX Continuous Measurement: SpO2 SFLOAT starts at byte 1.
  if (value.byteLength < 3) return null;
  const raw = value.getUint16(1, true);
  const mantissa = raw & 0x0fff;
  let signedMantissa = mantissa;
  if (mantissa & 0x0800) signedMantissa = mantissa | 0xf000;
  let exponent = (raw >> 12) & 0x0f;
  if (exponent & 0x08) exponent |= 0xf0;
  const result = signedMantissa * Math.pow(10, exponent);
  return Number.isFinite(result) ? Number(result.toFixed(1)) : null;
}

export class DeviceSensorManager {
  constructor({ onUpdate, onStatus } = {}) {
    this.onUpdate = onUpdate || (() => {});
    this.onStatus = onStatus || (() => {});
    this.device = null;
    this.server = null;
    this.characteristics = [];
    this.motionHandler = null;
    this.motion = { x: 0, y: 0, z: 0, magnitude: 0 };
    this.data = { heartRate: null, spo2: null, bodyTemperature: null, source: "device_sensor", isSimulated: false };
  }

  update(patch) {
    this.data = { ...this.data, ...patch, timestamp: new Date().toISOString() };
    this.onUpdate(this.data);
  }

  async connectBluetooth() {
    ensureBluetooth();
    this.onStatus("Requesting Bluetooth wearable…");

    this.device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [SERVICES.heartRate.service] },
        { services: [SERVICES.temperature.service] },
        { services: [SERVICES.spo2.service] },
      ],
      optionalServices: [SERVICES.heartRate.service, SERVICES.temperature.service, SERVICES.spo2.service],
    });

    this.device.addEventListener("gattserverdisconnected", () => this.onStatus("Wearable disconnected."));
    this.server = await this.device.gatt.connect();

    await this.subscribe(SERVICES.heartRate, "heartRate", parseHeartRate);
    await this.subscribe(SERVICES.temperature, "bodyTemperature", parseTemperature);
    await this.subscribe(SERVICES.spo2, "spo2", parseSpO2);
    this.onStatus(`Connected: ${this.device.name || "BLE wearable"}`);
  }

  async subscribe(definition, field, parser) {
    try {
      const service = await this.server.getPrimaryService(definition.service);
      const characteristic = await service.getCharacteristic(definition.characteristic);
      await characteristic.startNotifications();
      const handler = (event) => {
        try {
          const parsed = parser(event.target.value);
          if (parsed !== null && parsed !== undefined) this.update({ [field]: parsed });
        } catch (error) {
          console.warn(`Unable to parse ${field} measurement`, error);
        }
      };
      characteristic.addEventListener("characteristicvaluechanged", handler);
      this.characteristics.push({ characteristic, handler });
    } catch (error) {
      // A wearable may expose only one of the optional health services.
      console.info(`${field} service unavailable on this wearable.`);
    }
  }

  async startMotion() {
    if (!("DeviceMotionEvent" in window)) {
      throw new Error("Device motion sensors are not available on this device.");
    }

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") throw new Error("Motion sensor permission was denied.");
    }

    this.motionHandler = (event) => {
      const a = event.accelerationIncludingGravity || event.acceleration || {};
      const x = Number(a.x || 0), y = Number(a.y || 0), z = Number(a.z || 0);
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      this.motion = { x, y, z, magnitude };
      this.onUpdate({ ...this.data, motion: this.motion, timestamp: new Date().toISOString() });
    };
    window.addEventListener("devicemotion", this.motionHandler);
    this.onStatus("Phone motion sensor active.");
  }

  stop() {
    if (this.motionHandler) window.removeEventListener("devicemotion", this.motionHandler);
    this.motionHandler = null;
    this.characteristics.forEach(({ characteristic, handler }) => {
      characteristic.removeEventListener("characteristicvaluechanged", handler);
      characteristic.stopNotifications().catch(() => {});
    });
    this.characteristics = [];
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.onStatus("Device sensors stopped.");
  }
}

export function isDeviceSensorSupported() {
  return typeof window !== "undefined" && ("DeviceMotionEvent" in window || "bluetooth" in navigator);
}
