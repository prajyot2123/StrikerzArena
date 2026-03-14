"""
Player Classification Model
Phase 1: Deterministic weighted scoring
Phase 2: ML-ready wrapper for future model replacement
"""

CATEGORY_BASE_PRICES = {
    "Advanced":     300000,
    "Intermediate": 150000,
    "Beginner":      50000,
}


class PlayerClassifier:
    """
    Deterministic player classification based on weighted metrics.

    Scoring Formula:
    Final Score = Batting*0.30 + Bowling*0.25 + Fielding*0.15 + Fitness*0.15 + Awareness*0.10 + Experience*0.05

    Classification:
    < 45  -> Beginner
    45-70 -> Intermediate
    >= 70 -> Advanced
    """

    WEIGHTS = {
        "batting":    0.30,
        "bowling":    0.25,
        "fielding":   0.15,
        "fitness":    0.15,
        "awareness":  0.10,
        "experience": 0.05,
    }

    THRESHOLDS = {
        "beginner_max":     45,
        "intermediate_max": 70,
    }

    @staticmethod
    def calculate_score(batting, bowling, fielding, fitness, awareness, experience):
        """Calculate final player score using weighted formula."""
        # Normalize experience to 0-100 scale (cap at 50 years = 100)
        normalized_experience = min(experience * 2, 100)

        score = (
            batting    * PlayerClassifier.WEIGHTS["batting"]
            + bowling  * PlayerClassifier.WEIGHTS["bowling"]
            + fielding * PlayerClassifier.WEIGHTS["fielding"]
            + fitness  * PlayerClassifier.WEIGHTS["fitness"]
            + awareness * PlayerClassifier.WEIGHTS["awareness"]
            + normalized_experience * PlayerClassifier.WEIGHTS["experience"]
        )

        return round(score, 2)

    @staticmethod
    def classify(final_score):
        """Classify player based on final score."""
        if final_score < PlayerClassifier.THRESHOLDS["beginner_max"]:
            return "Beginner"
        elif final_score < PlayerClassifier.THRESHOLDS["intermediate_max"]:
            return "Intermediate"
        else:
            return "Advanced"

    @staticmethod
    def predict(batting, bowling, fielding, fitness, awareness, experience):
        """
        Complete prediction pipeline.
        Returns dict with category, final_score, confidence, AND basePrice.
        """
        final_score = PlayerClassifier.calculate_score(
            batting, bowling, fielding, fitness, awareness, experience
        )
        category   = PlayerClassifier.classify(final_score)
        confidence = PlayerClassifier._calculate_confidence(final_score)
        base_price = CATEGORY_BASE_PRICES.get(category, 50000)

        return {
            "category":    category,
            "final_score": final_score,
            "confidence":  confidence,
            "basePrice":   base_price,   # ADDED: Required by Node.js mlService.js
        }

    @staticmethod
    def _calculate_confidence(final_score):
        """Calculate confidence score (heuristic — distance from decision boundaries)."""
        thresholds = [45, 70]
        min_distance = min(abs(final_score - t) for t in thresholds)

        if min_distance >= 5:
            confidence = 0.85 + (min(min_distance - 5, 15) / 100)
        else:
            confidence = 0.70 + (min_distance / 10)

        return round(min(confidence, 0.95), 2)