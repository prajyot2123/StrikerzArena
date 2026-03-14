"""
Flask ML Service for Cricket Auction Platform
Handles player classification and ML predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from models.classifier import PlayerClassifier

load_dotenv()

app = Flask(__name__)

# Enable CORS so the frontend (localhost:5173) can reach ML service endpoints
CORS(app)

# Configuration
app.config["JSON_SORT_KEYS"] = False


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ML Service is running"}), 200


@app.route("/api/classify", methods=["POST"])
def classify_player():
    """
    Classify a player based on trial performance metrics.

    Request body:
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
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = [
            "batting_skill",
            "bowling_skill",
            "fielding_skill",
            "fitness",
            "match_awareness",
            "experience",
        ]

        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return (
                jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}),
                400,
            )

        # Validate value ranges
        for field in [
            "batting_skill",
            "bowling_skill",
            "fielding_skill",
            "fitness",
            "match_awareness",
        ]:
            if not (0 <= data[field] <= 100):
                return (
                    jsonify({
                        "error": f"{field} must be between 0 and 100"
                    }),
                    400,
                )

        if data["experience"] < 0:
            return (
                jsonify({"error": "experience must be non-negative"}),
                400,
            )

        # Make prediction
        result = PlayerClassifier.predict(
            batting=data["batting_skill"],
            bowling=data["bowling_skill"],
            fielding=data["fielding_skill"],
            fitness=data["fitness"],
            awareness=data["match_awareness"],
            experience=data["experience"],
        )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/batch-classify", methods=["POST"])
def batch_classify():
    """
    Classify multiple players at once.

    Request body:
    {
        "players": [
            {
                "id": "player1",
                "batting_skill": 75,
                ...
            },
            ...
        ]
    }

    Response:
    {
        "results": [
            {
                "id": "player1",
                "category": "Intermediate",
                "final_score": 70.5,
                "confidence": 0.82
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()

        if "players" not in data or not isinstance(data["players"], list):
            return jsonify({"error": "players array required"}), 400

        results = []
        for player in data["players"]:
            try:
                player_id = player.get("id")
                result = PlayerClassifier.predict(
                    batting=player.get("batting_skill", 0),
                    bowling=player.get("bowling_skill", 0),
                    fielding=player.get("fielding_skill", 0),
                    fitness=player.get("fitness", 0),
                    awareness=player.get("match_awareness", 0),
                    experience=player.get("experience", 0),
                )

                results.append({
                    "id": player_id,
                    **result,
                })
            except Exception as e:
                results.append({
                    "id": player.get("id"),
                    "error": str(e),
                })

        return jsonify({"results": results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    PORT = int(os.getenv("FLASK_PORT", 5001))
    app.run(debug=True, port=PORT, host="0.0.0.0")
