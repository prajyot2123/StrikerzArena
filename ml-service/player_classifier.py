from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestClassifier
import numpy as np

app = Flask(__name__)


def _build_training_data():
    # Synthetic but deterministic data suitable for category separation.
    rng = np.random.default_rng(42)
    rows = []
    labels = []
    for _ in range(450):
        batting = int(rng.integers(20, 96))
        bowling = int(rng.integers(20, 96))
        fielding = int(rng.integers(20, 96))
        fitness = int(rng.integers(20, 96))
        awareness = int(rng.integers(20, 96))
        experience = int(rng.integers(0, 16))

        weighted = (
            batting * 0.30
            + bowling * 0.25
            + fielding * 0.15
            + fitness * 0.15
            + awareness * 0.10
            + experience * 2.5
        )

        if weighted >= 78:
            label = "advanced"
        elif weighted >= 55:
            label = "intermediate"
        else:
            label = "beginner"

        rows.append([batting, bowling, fielding, fitness, awareness, experience])
        labels.append(label)

    return np.array(rows), np.array(labels)


X, y = _build_training_data()
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42,
)
model.fit(X, y)

BASE_PRICE_MAP = {
    "advanced": 300000,
    "intermediate": 150000,
    "beginner": 50000,
}


def _validate_features(data):
    required = [
        "battingSkill",
        "bowlingSkill",
        "fieldingSkill",
        "fitness",
        "matchAwareness",
        "yearsOfExperience",
    ]
    missing = [key for key in required if key not in data]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"

    bounded_fields = [
        "battingSkill",
        "bowlingSkill",
        "fieldingSkill",
        "fitness",
        "matchAwareness",
    ]
    for key in bounded_fields:
        value = float(data[key])
        if value < 0 or value > 100:
            return False, f"{key} must be between 0 and 100"

    if float(data["yearsOfExperience"]) < 0:
        return False, "yearsOfExperience must be non-negative"

    return True, ""


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/classify-player", methods=["POST"])
def classify_player():
    payload = request.get_json(force=True, silent=False) or {}
    valid, message = _validate_features(payload)
    if not valid:
        return jsonify({"error": message}), 400

    vector = np.array(
        [[
            float(payload["battingSkill"]),
            float(payload["bowlingSkill"]),
            float(payload["fieldingSkill"]),
            float(payload["fitness"]),
            float(payload["matchAwareness"]),
            float(payload["yearsOfExperience"]),
        ]]
    )

    label = model.predict(vector)[0]
    probabilities = model.predict_proba(vector)[0]
    confidence = float(np.max(probabilities))

    return jsonify({
        "category": label,
        "basePrice": BASE_PRICE_MAP[label],
        "confidence": confidence,
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)

