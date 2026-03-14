import axios from "axios";

// ML Service runs on port 5001 (matches Flask app.py default)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

const toTitleCase = (value) => {
  if (!value || typeof value !== "string") return "Beginner";
  const lower = value.toLowerCase();
  if (lower === "advanced") return "Advanced";
  if (lower === "intermediate") return "Intermediate";
  return "Beginner";
};

const categoryToBasePrice = (category) => {
  switch (category) {
    case "Advanced":     return 300000;
    case "Intermediate": return 150000;
    default:             return 50000; // Beginner
  }
};

export const classifyPlayer = async (trialData) => {
  try {
    // FIXED: Correct endpoint is /api/classify (not /classify-player)
    // FIXED: Flask expects 'experience' (not 'yearsOfExperience')
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/classify`,
      {
        batting_skill:   trialData.battingSkill,
        bowling_skill:   trialData.bowlingSkill,
        fielding_skill:  trialData.fieldingSkill,
        fitness:         trialData.fitness,
        match_awareness: trialData.matchAwareness,
        experience:      trialData.yearsOfExperience ?? 0,  // FIXED: correct field name
      },
      { timeout: 5000 }
    );

    const category = toTitleCase(response.data.category);
    return {
      category,
      final_score: response.data.final_score ?? 0,
      confidence:  response.data.confidence ?? 0.75,
      // FIXED: basePrice derived from category (Flask classifier doesn't return it)
      basePrice:   categoryToBasePrice(category),
    };
  } catch (error) {
    console.error("ML Service Error:", error.message);
    throw new Error("Player classification failed");
  }
};