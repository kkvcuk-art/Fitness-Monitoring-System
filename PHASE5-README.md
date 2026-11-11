# Fitness Monitoring System - Phase 5

Cumulative release: Original + Phase 1 Edge AI + Phase 2 Fall Detection + Phase 3 Real Sensors + Phase 4 Local ML + Phase 5 Environmental/Disaster Health Fusion.

## Phase 5 addition
Adds `frontend/src/services/environmentHealthFusion.js` and integrates it into the Health Monitor.

The local fusion engine combines:
- latest physiological reading
- live temperature/humidity/apparent temperature
- AQI and PM2.5
- existing local Edge-AI score
- existing local ML score

It produces a contextual risk level, environmental contribution score, detected factors, and personalized early-warning recommendations.

No health data is sent to the server by this fusion function. This is an academic early-warning prototype, not a medical diagnostic system.
