/**
 * Environmental Risk Analysis Service
 *
 * Combines environmental conditions with the latest
 * personal vital readings to generate early-warning
 * health context.
 *
 * IMPORTANT:
 * These rules are informational early-warning signals.
 * They are NOT medical diagnoses.
 */

/*
 * ---------------------------------------------------------
 * HEAT STRESS ANALYSIS
 * ---------------------------------------------------------
 */

function analyzeHeatStress(environment, reading) {
  const temperature =
    Number(environment?.weather?.temperature);

  const humidity =
    Number(environment?.weather?.humidity);

  const apparentTemperature =
    Number(
      environment?.weather?.apparentTemperature
    );

  const heartRate =
    Number(reading?.heartRate);

  const activityMinutes =
    Number(reading?.activityMinutes);

  if (
    Number.isNaN(temperature) ||
    Number.isNaN(humidity)
  ) {
    return {
      status: "unknown",
      score: 0,
      message:
        "Insufficient environmental data for heat-stress analysis.",
      factors: [],
    };
  }

  let score = 0;
  const factors = [];

  /*
   * Environmental temperature
   */

  if (temperature >= 35) {
    score += 3;

    factors.push(
      "High environmental temperature"
    );
  } else if (temperature >= 32) {
    score += 2;

    factors.push(
      "Elevated environmental temperature"
    );
  } else if (temperature >= 30) {
    score += 1;

    factors.push(
      "Warm environmental conditions"
    );
  }

  /*
   * Humidity
   */

  if (humidity >= 75) {
    score += 2;

    factors.push(
      "High humidity may reduce evaporative cooling"
    );
  } else if (humidity >= 60) {
    score += 1;

    factors.push(
      "Moderately high humidity"
    );
  }

  /*
   * Apparent temperature
   */

  if (
    !Number.isNaN(apparentTemperature) &&
    apparentTemperature >= 40
  ) {
    score += 3;

    factors.push(
      "Very high apparent temperature"
    );
  } else if (
    !Number.isNaN(apparentTemperature) &&
    apparentTemperature >= 35
  ) {
    score += 2;

    factors.push(
      "Elevated apparent temperature"
    );
  }

  /*
   * Heart rate
   *
   * This is only contextual. A single heart-rate value
   * should not be treated as a diagnosis.
   */

  if (
    !Number.isNaN(heartRate) &&
    heartRate >= 110
  ) {
    score += 2;

    factors.push(
      "Elevated heart rate"
    );
  } else if (
    !Number.isNaN(heartRate) &&
    heartRate >= 100
  ) {
    score += 1;

    factors.push(
      "Heart rate is above the configured contextual threshold"
    );
  }

  /*
   * Activity
   */

  if (
    !Number.isNaN(activityMinutes) &&
    activityMinutes >= 60
  ) {
    score += 1;

    factors.push(
      "Higher recent activity"
    );
  }

  let status = "normal";

  if (score >= 7) {
    status = "critical";
  } else if (score >= 4) {
    status = "warning";
  }

  let message =
    "Environmental conditions do not currently indicate elevated heat-stress context.";

  if (status === "warning") {
    message =
      "Environmental conditions may increase heat-stress risk, especially during physical activity.";
  }

  if (status === "critical") {
    message =
      "Multiple heat-related factors are elevated. Consider reducing strenuous activity and moving to a cooler environment.";
  }

  return {
    status,
    score,
    message,
    factors,
  };
}

/*
 * ---------------------------------------------------------
 * DEHYDRATION CONTEXT ANALYSIS
 * ---------------------------------------------------------
 */

function analyzeDehydrationContext(
  environment,
  reading
) {
  const temperature =
    Number(environment?.weather?.temperature);

  const humidity =
    Number(environment?.weather?.humidity);

  const apparentTemperature =
    Number(
      environment?.weather?.apparentTemperature
    );

  const heartRate =
    Number(reading?.heartRate);

  const activityMinutes =
    Number(reading?.activityMinutes);

  if (
    Number.isNaN(temperature) &&
    Number.isNaN(humidity) &&
    Number.isNaN(apparentTemperature)
  ) {
    return {
      status: "unknown",
      score: 0,
      message:
        "Insufficient environmental data for dehydration-context analysis.",
      factors: [],
    };
  }

  let score = 0;
  const factors = [];

  /*
   * Heat
   */

  if (
    !Number.isNaN(temperature) &&
    temperature >= 35
  ) {
    score += 3;

    factors.push(
      "High environmental temperature"
    );
  } else if (
    !Number.isNaN(temperature) &&
    temperature >= 32
  ) {
    score += 2;

    factors.push(
      "Elevated environmental temperature"
    );
  }

  /*
   * Humidity
   */

  if (
    !Number.isNaN(humidity) &&
    humidity >= 75
  ) {
    score += 2;

    factors.push(
      "High humidity"
    );
  }

  /*
   * Apparent temperature
   */

  if (
    !Number.isNaN(apparentTemperature) &&
    apparentTemperature >= 40
  ) {
    score += 2;

    factors.push(
      "Very high apparent temperature"
    );
  }

  /*
   * Activity
   */

  if (
    !Number.isNaN(activityMinutes) &&
    activityMinutes >= 90
  ) {
    score += 2;

    factors.push(
      "High activity duration"
    );
  } else if (
    !Number.isNaN(activityMinutes) &&
    activityMinutes >= 60
  ) {
    score += 1;

    factors.push(
      "Elevated activity duration"
    );
  }

  /*
   * Heart rate
   */

  if (
    !Number.isNaN(heartRate) &&
    heartRate >= 110
  ) {
    score += 2;

    factors.push(
      "Elevated heart rate in environmental context"
    );
  }

  let status = "normal";

  if (score >= 7) {
    status = "critical";
  } else if (score >= 4) {
    status = "warning";
  }

  let message =
    "Current environmental and activity conditions do not indicate elevated dehydration context.";

  if (status === "warning") {
    message =
      "Heat, humidity, or activity conditions may increase fluid-loss context. Maintain adequate hydration.";
  }

  if (status === "critical") {
    message =
      "Multiple heat and activity factors are elevated. Reduce strenuous activity, seek a cooler environment, and maintain hydration.";
  }

  return {
    status,
    score,
    message,
    factors,
  };
}

/*
 * ---------------------------------------------------------
 * RESPIRATORY CONTEXT ANALYSIS
 * ---------------------------------------------------------
 */

function analyzeRespiratoryContext(
  environment,
  reading
) {
  const aqi =
    Number(environment?.airQuality?.aqi);

  const pm25 =
    Number(environment?.airQuality?.pm2_5);

  const pm10 =
    Number(environment?.airQuality?.pm10);

  const spo2 =
    Number(reading?.spo2);

  if (
    Number.isNaN(aqi) &&
    Number.isNaN(pm25) &&
    Number.isNaN(pm10)
  ) {
    return {
      status: "unknown",
      score: 0,
      message:
        "Insufficient air-quality data for respiratory-context analysis.",
      factors: [],
    };
  }

  let score = 0;
  const factors = [];

  /*
   * AQI
   */

  if (
    !Number.isNaN(aqi) &&
    aqi >= 151
  ) {
    score += 3;

    factors.push(
      "Very high AQI"
    );
  } else if (
    !Number.isNaN(aqi) &&
    aqi >= 101
  ) {
    score += 2;

    factors.push(
      "Elevated AQI"
    );
  } else if (
    !Number.isNaN(aqi) &&
    aqi >= 51
  ) {
    score += 1;

    factors.push(
      "Moderate AQI"
    );
  }

  /*
   * PM2.5
   */

  if (
    !Number.isNaN(pm25) &&
    pm25 >= 55
  ) {
    score += 3;

    factors.push(
      "High PM2.5 concentration"
    );
  } else if (
    !Number.isNaN(pm25) &&
    pm25 >= 35
  ) {
    score += 2;

    factors.push(
      "Elevated PM2.5 concentration"
    );
  }

  /*
   * PM10
   */

  if (
    !Number.isNaN(pm10) &&
    pm10 >= 150
  ) {
    score += 2;

    factors.push(
      "High PM10 concentration"
    );
  }

  /*
   * SpO2 contextual signal
   */

  if (
    !Number.isNaN(spo2) &&
    spo2 < 94
  ) {
    score += 3;

    factors.push(
      "SpO₂ is below the configured contextual threshold"
    );
  } else if (
    !Number.isNaN(spo2) &&
    spo2 < 96
  ) {
    score += 1;

    factors.push(
      "SpO₂ is slightly below the configured contextual range"
    );
  }

  let status = "normal";

  if (score >= 7) {
    status = "critical";
  } else if (score >= 4) {
    status = "warning";
  }

  let message =
    "Current air-quality conditions do not indicate elevated respiratory context.";

  if (status === "warning") {
    message =
      "Air-quality conditions may increase respiratory exposure. Consider reducing prolonged outdoor exposure if appropriate.";
  }

  if (status === "critical") {
    message =
      "Multiple air-quality or oxygen-related contextual factors are elevated. Consider reducing exposure and seeking appropriate medical guidance if symptoms occur.";
  }

  return {
    status,
    score,
    message,
    factors,
  };
}

/*
 * ---------------------------------------------------------
 * COMPLETE ENVIRONMENTAL RISK ANALYSIS
 * ---------------------------------------------------------
 */

function analyzeEnvironmentalRisks(
  environment,
  reading
) {
  const heatStress =
    analyzeHeatStress(
      environment,
      reading
    );

  const dehydration =
    analyzeDehydrationContext(
      environment,
      reading
    );

  const respiratory =
    analyzeRespiratoryContext(
      environment,
      reading
    );

  const analyses = [
    heatStress,
    dehydration,
    respiratory,
  ];

  let overallStatus = "normal";

  if (
    analyses.some(
      (item) => item.status === "critical"
    )
  ) {
    overallStatus = "critical";
  } else if (
    analyses.some(
      (item) => item.status === "warning"
    )
  ) {
    overallStatus = "warning";
  }

  return {
    overallStatus,

    heatStress,

    dehydration,

    respiratory,

    analyzedAt: new Date(),
  };
}

module.exports = {
  analyzeHeatStress,
  analyzeDehydrationContext,
  analyzeRespiratoryContext,
  analyzeEnvironmentalRisks,
};