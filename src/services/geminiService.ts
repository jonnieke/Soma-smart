import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ExplanationResult, QuizData, TeacherNote, RevisionMode, TutoringStep, ExamQuestion, ExamAnalysis, TutorResponse } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || 'DUMMY_KEY_FOR_DEV'
});

if (!apiKey) {
  console.warn("Using DUMMY_KEY_FOR_DEV. Results will fail. Please check .env and Vite config.");
}

const MODEL_NAME = "gemini-2.5-flash"; // Validated from models list for 2026 env

// --- Helper: File to Base64 ---
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- LEARNER FEATURES ---

export const explainImage = async (base64Image: string, mimeType: string, level: 'Simple' | 'Exam'): Promise<ExplanationResult> => {
  const model = MODEL_NAME;

  const prompt = `
    Analyze this image. It is likely a textbook page, homework, or notes.
    1. Extract the main topic.
    2. Explain the content in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    3. Provide 3-5 short bullet points summarizing the key takeaways.
    4. Suggest 3 short related topics for further learning.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Markdown formatted explanation" },
            summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining image:", error);
    throw error;
  }
};

export const explainAudio = async (base64Audio: string, mimeType: string, level: 'Simple' | 'Exam'): Promise<ExplanationResult> => {
  const model = MODEL_NAME;

  const prompt = `
    Listen to this audio. It is likely a student asking a question or reading study material.
    1. Transcribe the audio to text.
    2. Extract the main topic.
    3. Explain the content or answer the question in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    4. Provide 3-5 short bullet points summarizing the key takeaways.
    5. Suggest 3 short related topics for further learning.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Markdown formatted explanation" },
            summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["transcript", "topic", "explanation", "summaryPoints", "relatedTopics"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining audio:", error);
    throw error;
  }
};

import { getContext } from './contextService';

export const explainTopic = async (topic: string, level: 'Simple' | 'Exam'): Promise<ExplanationResult> => {
  const model = MODEL_NAME;
  const context = getContext();

  let contextInstruction = "";
  if (context) {
    contextInstruction = `
    IMPORTANT: You have been provided with specific source material called "${context.name}".
    You MUST answer the question using ONLY this source material. Do not use outside knowledge unless necessary to clarify terms.
    
    Source Material:
    "${context.content.substring(0, 30000)}" 
    `;
    // Note: 30k chars is a safe limit for Flash model context window, though it handles much more.
  }

  const prompt = `
    ${contextInstruction}

    Explain the topic "${topic}" in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    1. Provide a clear explanation.
    2. Provide 3-5 short bullet points summarizing key takeaways.
    3. Suggest 3 short related topics for further learning.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Markdown formatted explanation" },
            summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining topic:", error);
    throw error;
  }
};

export const generateQuiz = async (content: string, topic: string): Promise<QuizData> => {
  const model = MODEL_NAME;

  const prompt = `
    Based on the following content about "${topic}":
    "${content.substring(0, 5000)}" 
    
    Generate a quiz with:
    - Exactly 3 Multiple Choice Questions (MCQ)
    
    For each question, provide the correct answer and a brief explanation of why.
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["MCQ", "SHORT"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Only for MCQ" },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["topic", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generateQuickQuiz = async (content: string, topic: string): Promise<QuizData> => {
  const model = MODEL_NAME;

  const prompt = `
    Based on the explanation of "${topic}", generate a quick "Sticky Quiz" to test immediate retention.
    
    Generate exactly 3 simple Multiple Choice Questions (MCQ).
    
    Content: "${content.substring(0, 3000)}"
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["MCQ"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["topic", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating quick quiz:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<void> => {
  // Use Browser Native TTS for robustness and zero cost/latency
  return new Promise((resolve, reject) => {
    try {
      if (!window.speechSynthesis) {
        reject(new Error("Browser does not support TTS"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Default to English, could be dynamic
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      window.speechSynthesis.cancel(); // Cancel any current speech
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      reject(e);
    }
  });
};

// --- TEACHER FEATURES ---

export const convertNotes = async (base64Data: string, mimeType: string): Promise<TeacherNote> => {
  const model = MODEL_NAME;

  const prompt = `
    Analyze this document. 
    1. Create structured lesson notes (headings, key concepts, examples).
    2. Create a simplified version suitable for students to study from directly.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            structuredNotes: { type: Type.STRING, description: "Markdown" },
            simplifiedNotes: { type: Type.STRING, description: "Markdown" }
          },
          required: ["topic", "structuredNotes", "simplifiedNotes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      ...result
    };
  } catch (error) {
    console.error("Error converting notes:", error);
    throw error;
  }
};

export const processVoiceNote = async (audioBase64: string): Promise<TeacherNote> => {
  const model = MODEL_NAME;

  const prompt = `
        Transcribe this audio recording from a teacher.
        Based on the transcription:
        1. Create structured lesson notes.
        2. Create a simplified version for students.
        Output JSON.
    `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/mp3", data: audioBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            structuredNotes: { type: Type.STRING },
            simplifiedNotes: { type: Type.STRING }
          },
          required: ["topic", "structuredNotes", "simplifiedNotes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    const result = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      ...result
    };

  } catch (error) {
    console.error("Error processing voice note:", error);
    throw error;
  }
}

export const generateTeacherQuiz = async (topic: string): Promise<QuizData> => {
  return generateQuiz("", topic);
}

// --- ASK SOMA CHATBOT ---

export const askSoma = async (userQuery: string, chatHistory: { role: 'user' | 'model', text: string }[]): Promise<string> => {
  const model = MODEL_NAME;

  // Construct prompt with history manually
  const systemInstruction = "You are Soma, a helpful, friendly, and encouraging AI learning assistant for the Soma Smart app. Your goal is to guide students, parents, and teachers. Help them navigate features:\n\n1. **Scanning**: Tell them they can scan textbooks to get simple explanations.\n2. **Voice Notes**: Explain how teachers can record notes to simplify them.\n3. **Quizzes**: Mention that quizzes are auto-generated from their content.\n4. **Student ID**: Remind them their ID is for login and parent tracking.\n\nKeep answers short (under 3 sentences) and fun. Use emojis! 🌟";

  const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Soma'}: ${msg.text}`).join('\n');
  const fullPrompt = `${systemInstruction}\n\n${historyText}\nUser: ${userQuery}\nSoma:`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: fullPrompt }]
      }
    });

    const text = response.text;
    if (!text) return "I'm thinking... but got stuck! 😅";
    return text;
  } catch (error) {
    console.error("Error asking Soma:", error);
    return "Oops! My brain is a bit foggy right now. ☁️ Try again later!";
  }
};

// --- REVISION ASSISTANT FEATURES ---

export const analyzeExamPaper = async (base64Image: string, mimeType: string): Promise<ExamAnalysis> => {
  const model = MODEL_NAME;

  const prompt = `
    Analyze this exam paper image.
    1. Identify the Subject and Grade Level.
    2. Extract all visible questions.
    3. For each question, identify the Topic, Sub-Strand (CBC), and Competency being tested.
    
    Output JSON structure:
    {
      "subject": "string",
      "grade": "string",
      "questions": [
        { 
          "id": number, 
          "number": "string (e.g. 1a)", 
          "text": "string content", 
          "topic": "string",
          "subStrand": "string",
          "competency": "string",
          "marks": number (or 0 if not shown)
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            grade: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  number: { type: Type.STRING },
                  text: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  subStrand: { type: Type.STRING },
                  competency: { type: Type.STRING },
                  marks: { type: Type.INTEGER }
                },
                required: ["id", "number", "text", "topic", "competency"]
              }
            }
          },
          required: ["subject", "grade", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as ExamAnalysis;
  } catch (error) {
    console.error("Error analyzing exam:", error);
    throw error;
  }
};

export const getRevisionTutorResponse = async (
  question: ExamQuestion,
  currentStep: TutoringStep,
  history: { role: 'user' | 'model', text: string }[],
  mode: RevisionMode
): Promise<TutorResponse> => {
  const model = MODEL_NAME;

  const systemInstruction = `
    You are Soma Smart Revision Assist, an expert CBC/CBE-aligned learning coach for Kenyan learners.
    Tone: Patient, Encouraging, Clear, Non-judgmental.
    
    Your goal is to guide the learner through ONE question at a time using a strict 4-step pedagogical flow.
    
    Current Question: "${question.text}"
    Topic: ${question.topic}
    Competency: ${question.competency}
    
    Current Step: ${currentStep}
    Mode: ${mode}
    
    INSTRUCTIONS FOR CURRENT STEP:
    
    IF STEP = 'A_UNDERSTAND':
      - Ask: "What is this question testing?"
      - Explain the competency and real-life importance.
      - Rewrite visual quesiton in simple words if needed.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'B_THINKING':
      - Explain HOW to think about this question.
      - "First, think about..."
      - Warn about common mistakes.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'C_SOLUTION':
      - provide step-by-step solution in simple language.
      - Number your steps.
      - Show formulas/reasoning clearly.
      
    IF STEP = 'D_REFLECTION':
      - Provide final answer clearly.
      - Add a short reflection: "This answer shows the competency of..."
      
    Output JSON:
    {
      "text": "Your teaching response here (use Markdown for formatting)",
      "step": "${currentStep}", 
      "nextStep": "The next logical step (e.g. B_THINKING after A is done, or COMPLETE after D)",
      "hint": "Optional short hint if in Exam Mode"
    }
  `;

  // We only send the last few messages to keep context relevant but focused
  const chatContext = history.map(h => `${h.role}: ${h.text}`).join('\n');
  const fullPrompt = `${systemInstruction}\n\nChat History:\n${chatContext}\n\nAssistant:`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            step: { type: Type.STRING },
            nextStep: { type: Type.STRING },
            hint: { type: Type.STRING }
          },
          required: ["text", "step", "nextStep"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TutorResponse;
  } catch (error) {
    console.error("Error in revision tutor:", error);
    throw error;
  }
};
