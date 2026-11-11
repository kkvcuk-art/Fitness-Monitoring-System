const axios = require("axios");

/**
 * Fetch current environmental conditions.
 *
 * This service is intentionally kept separate from the routes
 * so the same environmental data can later be used by:
 * - Health Monitor
 * - Heat-stress detection
 * - Respiratory-risk detection
 * - Disaster alerts
 * - AI risk analysis
 */

async function getEnvironmentalData(latitude, longitude) {
  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude === null ||
    longitude === null
  ) {
    throw new Error(
      "Latitude and longitude are required to fetch environmental data."
    );
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error(
      "Latitude and longitude must be valid numbers."
    );
  }

  if (lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (lon < -180 || lon > 180) {
    throw new Error(
      "Longitude must be between -180 and 180."
    );
  }

  /*
   * Open-Meteo provides current weather conditions
   * without requiring an API key.
   *
   * AQI is requested from the Open-Meteo Air Quality API.
   */

  const weatherUrl =
    "https://api.open-meteo.com/v1/forecast";

  const airQualityUrl =
    "https://air-quality-api.open-meteo.com/v1/air-quality";

  const weatherParams = {
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature",
    timezone: "auto",
  };

  const airQualityParams = {
    latitude: lat,
    longitude: lon,
    current:
      "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,us_aqi",
    timezone: "auto",
  };

  const [weatherResponse, airQualityResponse] =
    await Promise.all([
      axios.get(weatherUrl, {
        params: weatherParams,
        timeout: 10000,
      }),

      axios.get(airQualityUrl, {
        params: airQualityParams,
        timeout: 10000,
      }),
    ]);

  const weather = weatherResponse.data;
  const airQuality = airQualityResponse.data;

  const currentWeather = weather?.current || {};
  const currentAirQuality =
    airQuality?.current || {};

  return {
    success: true,

    location: {
      latitude: lat,
      longitude: lon,
      timezone:
        weather?.timezone || null,
    },

    weather: {
      temperature:
        currentWeather.temperature_2m ?? null,

      humidity:
        currentWeather.relative_humidity_2m ?? null,

      apparentTemperature:
        currentWeather.apparent_temperature ?? null,
    },

    airQuality: {
      aqi:
        currentAirQuality.us_aqi ?? null,

      pm10:
        currentAirQuality.pm10 ?? null,

      pm2_5:
        currentAirQuality.pm2_5 ?? null,

      carbonMonoxide:
        currentAirQuality.carbon_monoxide ?? null,

      nitrogenDioxide:
        currentAirQuality.nitrogen_dioxide ?? null,

      ozone:
        currentAirQuality.ozone ?? null,
    },

    source: "Open-Meteo",

    fetchedAt: new Date(),
  };
}

module.exports = {
  getEnvironmentalData,
};