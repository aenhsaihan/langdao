const express = require("express");
const router = express.Router();

// Validation helper
function validateMaterialParams(params) {
  const { language, proficiencyLevel, lessonFocus, sessionDuration } = params;

  const errors = [];

  if (!language || typeof language !== "string" || !language.trim()) {
    errors.push("language is required and must be a non-empty string");
  }

  const validLevels = ["Beginner", "Intermediate", "Advanced"];
  if (!proficiencyLevel || !validLevels.includes(proficiencyLevel)) {
    errors.push(
      `proficiencyLevel must be one of: ${validLevels.join(", ")}`
    );
  }

  const validFoci = [
    "Conversational",
    "Informational",
    "Daily Life",
    "Grammar",
    "Vocabulary",
    "Pronunciation",
  ];
  if (!lessonFocus || !validFoci.includes(lessonFocus)) {
    errors.push(`lessonFocus must be one of: ${validFoci.join(", ")}`);
  }

  const validDurations = [15, 30, 45, 60, 90];
  if (
    !sessionDuration ||
    !validDurations.includes(Number(sessionDuration))
  ) {
    errors.push(
      `sessionDuration must be one of: ${validDurations.join(", ")} minutes`
    );
  }

  return errors;
}

// Construct system prompt for Gemini
function constructSystemPrompt(params) {
  const { language, proficiencyLevel, lessonFocus, sessionDuration } = params;

  return `You are an expert language teacher creating a lesson plan.

Teaching Language: ${language}
Student Level: ${proficiencyLevel}
Lesson Focus: ${lessonFocus}
Session Duration: ${sessionDuration} minutes

Create a structured lesson plan with:
1. Learning objectives (2-3 clear goals)
2. Warm-up activity (5 minutes)
3. Main activities (with timing)
4. Practice exercises
5. Wrap-up and homework suggestions

Format the response in clear sections with headings. Use markdown formatting for better readability.`;
}

// POST /api/materials/generate
router.post("/generate", async (req, res) => {
  try {
    const { language, proficiencyLevel, lessonFocus, sessionDuration } =
      req.body;

    // Validate input parameters
    const validationErrors = validateMaterialParams(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return res.status(500).json({
        error: "Configuration error, please contact support",
      });
    }

    // Construct the prompt
    const prompt = constructSystemPrompt({
      language,
      proficiencyLevel,
      lessonFocus,
      sessionDuration,
    });

    // Call Gemini API
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`Generating materials for ${language} (${proficiencyLevel}, ${lessonFocus}, ${sessionDuration}min)`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error:", response.status, errorData);

      // Handle specific error cases
      if (response.status === 429) {
        return res.status(429).json({
          error: "Too many requests, please try again in a few minutes",
        });
      } else if (response.status === 401 || response.status === 403) {
        return res.status(500).json({
          error: "Configuration error, please contact support",
        });
      } else if (response.status >= 500) {
        return res.status(503).json({
          error: "AI service temporarily unavailable",
        });
      } else {
        return res.status(500).json({
          error: "Failed to generate materials",
        });
      }
    }

    const data = await response.json();

    // Extract generated content
    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Failed to generate content";

    console.log(`✅ Materials generated successfully (${content.length} chars)`);

    // Return generated materials
    res.json({
      content,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating materials:", error);

    // Handle network errors
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Connection error, please check your internet",
      });
    }

    res.status(500).json({
      error: "Failed to generate materials",
    });
  }
});

module.exports = router;
