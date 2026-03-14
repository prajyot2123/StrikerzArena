# ML Service - Player Classification

The ML service runs as a separate Flask application for player classification.

## Quick Start

```bash
cd ml-service
pip install -r requirements.txt
python -m src.app
```

Service runs on `http://localhost:5001`

## Architecture

- **Phase 1 (Current)**: Deterministic weighted scoring
- **Phase 2 (Future)**: Machine learning model replacement

## API Endpoints

### Single Player Classification
```
POST /api/classify
Content-Type: application/json

{
  "batting_skill": 75,
  "bowling_skill": 60,
  "fielding_skill": 70,
  "fitness": 80,
  "match_awareness": 65,
  "experience": 5
}

Response:
{
  "category": "Intermediate",
  "final_score": 70.5,
  "confidence": 0.82
}
```

### Batch Classification
```
POST /api/batch-classify
Content-Type: application/json

{
  "players": [
    {
      "id": "player1",
      "batting_skill": 75,
      ...
    }
  ]
}
```

## Scoring Logic

**Final Score Formula:**
```
Score = Batting*0.30 + Bowling*0.25 + Fielding*0.15 + Fitness*0.15 + Awareness*0.10 + Experience*0.05
```

**Classification:**
- Score < 45 → Beginner
- Score 45-70 → Intermediate
- Score >= 70 → Advanced

## Future ML Integration

To replace Phase 1 with actual ML:

1. Update `src/models/classifier.py`
2. Load trained model in `__init__`
3. Replace `predict()` method with model inference
4. Keep the same API contract (input/output format)

Example structure for future enhancement:
```python
from joblib import load

class MLPlayerClassifier:
    def __init__(self, model_path):
        self.model = load(model_path)
    
    def predict(self, features):
        # Use actual ML model
        prediction = self.model.predict([features])
        return prediction
```
