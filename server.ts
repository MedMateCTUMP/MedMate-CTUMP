import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// ✅ FIX RENDER PORT (QUAN TRỌNG NHẤT)
const PORT = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
app.use(cors({ origin: "*" }));
app.use(express.json());

// ================= DATABASE =================
const DB_FILE = path.join(process.cwd(), "db.json");

const initDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: {},
      subjects: [],
      sessions: [],
      screenTime: [],
      appLimits: [],
      pointLogs: [],
      otps: {}
    }, null, 2));
  }
};

initDb();

const readDb = () => JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
const writeDb = (data: any) =>
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// ================= GEMINI =================
let aiClient: GoogleGenAI | null = null;

const getGeminiClient = () => {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }
  return aiClient;
};

// ================= BASIC TEST =================
app.get("/", (req, res) => {
  res.json({ status: "MedMate Backend Running 🚀" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// ================= DATA API =================
app.get("/api/data", (req, res) => {
  const db = readDb();
  res.json(db);
});

// ================= GEMINI CHAT =================
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const client = getGeminiClient();

    if (!client) {
      return res.json({
        text: "⚠️ Chưa cấu hình GEMINI_API_KEY trên Render"
      });
    }

    const lastMsg = messages[messages.length - 1]?.text || "";

    const result = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: lastMsg }]
        }
      ]
    });

    res.json({ text: result.text });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "Gemini error",
      details: err.message
    });
  }
});

// ================= START SERVER =================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
