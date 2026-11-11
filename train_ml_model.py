import json
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score

rng = np.random.default_rng(42)
n = 8000
# Synthetic demonstration data only; labels are generated from an interpretable
# risk function to create a reproducible academic model, not medical truth.
hr = rng.normal(78, 14, n).clip(45, 160)
spo2 = rng.normal(97, 2, n).clip(80, 100)
temp = rng.normal(36.8, 0.8, n).clip(34, 41)
activity = rng.normal(45, 25, n).clip(0, 180)
sleep = rng.normal(7, 1.5, n).clip(2, 12)
env_temp = rng.normal(30, 7, n).clip(15, 48)
humidity = rng.normal(60, 20, n).clip(10, 100)
aqi = rng.gamma(2.0, 45, n).clip(0, 500)
X = np.column_stack([hr, spo2, temp, activity, sleep, env_temp, humidity, aqi])

# Synthetic target: combines physiological and environmental stressors.
score = (
    0.035 * np.maximum(hr - 90, 0)
    + 0.9 * np.maximum(94 - spo2, 0)
    + 1.5 * np.maximum(temp - 37.5, 0)
    + 0.015 * np.maximum(25 - activity, 0)
    + 0.18 * np.maximum(6 - sleep, 0)
    + 0.08 * np.maximum(env_temp - 32, 0)
    + 0.025 * np.maximum(humidity - 75, 0)
    + 0.006 * np.maximum(aqi - 80, 0)
    + rng.normal(0, 0.55, n)
)
y = (score > 2.0).astype(int)

model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(max_iter=2000, random_state=42)),
])
model.fit(X, y)

scaler = model.named_steps["scaler"]
clf = model.named_steps["classifier"]

artifact = {
    "modelType": "logistic_regression",
    "version": "1.0.0",
    "training": {
        "dataset": "synthetic demonstration data",
        "samples": int(n),
        "seed": 42,
        "note": "Not trained or validated on clinical data. Academic prototype only."
    },
    "features": ["heartRate", "spo2", "bodyTemperature", "activityMinutes", "sleepHours", "environmentalTemperature", "humidity", "aqi"],
    "scaler": {"mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist()},
    "classifier": {"weights": clf.coef_[0].tolist(), "bias": float(clf.intercept_[0])},
    "metrics": {"trainingAccuracy": float(accuracy_score(y, model.predict(X)))}
}
with open("/mnt/data/phase4/frontend/src/services/mlHealthRiskModel.json", "w") as f:
    json.dump(artifact, f, indent=2)
print("accuracy", artifact["metrics"]["trainingAccuracy"])
