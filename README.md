
## Phase 4 — Local ML Health Risk Model

This cumulative version adds a browser-side logistic-regression inference layer on top of the Edge AI, fall detection, real-device sensor bridge, and existing backend anomaly engine.

- Model: logistic regression + standardization
- Inference: local/browser-side; no network call required for prediction
- Inputs: heart rate, SpO2, body temperature, activity, sleep, environmental temperature, humidity, AQI
- Missing sensor values: imputed locally with model training means
- Training data: synthetic demonstration data only; not clinically validated
- Existing rule/statistical anomaly detection remains available as a complementary layer

This feature is an academic early-warning prototype and must not be presented as a medical diagnostic model.
