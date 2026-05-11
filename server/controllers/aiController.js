const AISemesterInsight = require("../models/AISemesterInsight");
const model = require("../services/geminiService");
const axios = require('axios');
const pdfParse = require('pdf-extraction');

const generateSemesterInsight = async (req, res) => {
  try {
     const { studentId, semester, academicYear, analytics, language, forceRegenerate } = req.body;

    // 1. Basic Input Validation
    if (!studentId || !semester || !academicYear || !analytics) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: studentId, semester, academicYear, or analytics."
      });
    }

    if (!forceRegenerate) {
      const existingInsight = await AISemesterInsight.findOne({ 
        studentId, semester, academicYear, language 
      });

      if (existingInsight) {
        return res.status(200).json({
          success: true,
          cached: true,
          insight: existingInsight.insight
        });
      }
    }

    // 3. Language Map
    const languageMap = {
      en: "English",
      am: "Amharic",
      om: "Afaan Oromo",
      ti: "Tigrinya",
      so: "Somali",
      af: "Afar"
    };
    const selectedLanguage = languageMap[language] || "English";

    // 4. Optimized Prompt
    const prompt = `
      You are an educational AI system. Analyze the following student semester performance.
      
      Semester: ${semester}
      Data: ${JSON.stringify(analytics)}
      Language for response: ${selectedLanguage}

      Rules:
      - Be professional, encouraging, and parent-friendly.
      - Return ONLY valid JSON following this exact structure:
        {
          "summary": "String",
          "strengths": ["Array of Strings"],
          "weaknesses": ["Array of Strings"],
          "recommendations": ["Array of Strings"],
          "parentGuidance": "String"
        }
    `;

    // 5. Native JSON Mode Generation 
    // (If your geminiService wrapper doesn't support the config object, you can stick to your original generateContent call, but this is the modern SDK way)
    const result = await model.generateContent({
      contents:[{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const rawText = result.response.text();
    let parsedInsight;

    // 6. Safe Parsing
    try {
      parsedInsight = JSON.parse(rawText);
    } catch (err) {
      // Fallback cleanup in case the model hallucinates markdown tags despite JSON mode
      const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      try {
         parsedInsight = JSON.parse(cleanText);
      } catch (fallbackErr) {
         console.error("AI Output parsing failed:", rawText);
         return res.status(502).json({
           success: false,
           message: "Failed to generate valid insight from AI."
         });
      }
    }

    // 7. Sanitize the parsed object ensuring proper data types
    parsedInsight = {
      summary: parsedInsight.summary || "",
      strengths: Array.isArray(parsedInsight.strengths) ? parsedInsight.strengths :[],
      weaknesses: Array.isArray(parsedInsight.weaknesses) ? parsedInsight.weaknesses :[],
      recommendations: Array.isArray(parsedInsight.recommendations) ? parsedInsight.recommendations :[],
      parentGuidance: parsedInsight.parentGuidance || ""
    };

    // 8. Save to Database (Using findOneAndUpdate with upsert prevents race conditions 

    const savedInsight = await AISemesterInsight.findOneAndUpdate(
      { studentId, semester, academicYear, language },
      { $set: { insight: parsedInsight } },
      { new: true, upsert: true } 
    );

    res.status(200).json({success: true, cached: false,insight: savedInsight.insight});
    
  } catch (err) {
    console.error("Error generating semester insight:", err);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred."
    });
  }
};

const getSavedSemesterInsight = async (req, res) => {
  try {
    const { studentId, semester, academicYear, language } = req.query;

    const existingInsight = await AISemesterInsight.findOne({ 
      studentId, 
      semester, 
      academicYear, 
      language 
    });

    if (existingInsight) {
      return res.status(200).json({
        success: true,
        insight: existingInsight.insight
      });
    }

    return res.status(200).json({
      success: true,
      insight: null 
    });

  } catch (err) {
    console.error("Error fetching saved insight:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Add this below your existing functions
const askSemesterQuestion = async (req, res) => {
  try {
    const { semester, analytics, question, language } = req.body;

    if (!analytics || !question) {
      return res.status(400).json({ success: false, message: "Missing data or question" });
    }

    // Language Map
    const languageMap = {
      en: "English",
      am: "Amharic",
      om: "Afaan Oromo",
      ti: "Tigrinya",
      so: "Somali",
      af: "Afar"
    };
    const selectedLanguage = languageMap[language] || "English";

    // Dynamic Prompt
    const prompt = `
      You are an expert, encouraging educational counselor talking directly to a parent.
      You have access to the student's data for ${semester}:
      ${JSON.stringify(analytics)}

      The parent is asking you this question:
      "${question}"

      Rules:
      - Answer clearly, briefly, and professionally.
      - Base your answer ONLY on the provided data.
      - Be empathetic and supportive.
      - Respond in ${selectedLanguage}.
      - Do not use markdown backticks or complex formatting, just standard text formatting.
    `;

    // Normal text generation (No JSON mode needed for a chat response)
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.status(200).json({
      success: true,
      answer: answer.trim()
    });

  } catch (err) {
    console.error("Ask AI Error:", err);
    res.status(500).json({ success: false, message: "Failed to process question" });
  }
};



const askBookQuestion = async (req, res) => {
  try {
    const { title, subject, gradeLevel, question, language, fileUrl } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required." });
    }

    let documentText = "";

   if (fileUrl && fileUrl.endsWith('.pdf')) {
      try {
          const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
          const dataBuffer = Buffer.from(response.data);
          const data = await pdfParse(dataBuffer);
          documentText = data.text.substring(0, 15000); 

        } catch (pdfError) {
          console.error("❌ Could not parse PDF:", pdfError.message);
        }
      } else {
          console.log("⚠️ No valid fileUrl provided or not a .pdf");
      }

    // Language Map
     const languageMap = {
      en: "English",
      am: "Amharic",
      om: "Afaan Oromo",
      ti: "Tigrinya",
      so: "Somali",
      af: "Afar"
    };
    const selectedLanguage = languageMap[language] || "English";

    const prompt = `
      You are a friendly, encouraging AI Study Tutor. 
      A ${gradeLevel} student is reading a ${subject} resource titled "${title}".
      
      Here is an excerpt from the book/document they are reading:
      """
      ${documentText ? documentText : "(Document text unavailable, rely on general knowledge about " + title + ")"}
      """

      The student asked: "${question}"

      RULES:
      1. Use the excerpt provided to answer the question if the answer is in the text.
      2. Keep it simple for a ${gradeLevel} reading level.
      3. Use emojis to make learning fun.
      4. Respond in ${selectedLanguage}.
    `;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.status(200).json({
      success: true,
      answer: answer.trim()
    });

  } catch (err) {
    console.error("AI Tutor Error:", err.statusText);
    res.status(500).json({ success: false, message: "Failed to process question." });
  }
};

module.exports = { 
  generateSemesterInsight, 
  getSavedSemesterInsight, 
  askSemesterQuestion ,
  askBookQuestion
};