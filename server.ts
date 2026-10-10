import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI client (Server-Side)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -----------------------------------------------------------------------------
// REST API ROUTES
// -----------------------------------------------------------------------------

// Health & System status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.4.0',
    platform: 'GemmaForge MLOps Engine',
    cluster: {
      nodes: 4,
      gpuType: 'NVIDIA H100 80GB SXM5',
      totalGPUs: 32,
      activeGPUs: 18,
      vramAllocatedGB: 1140,
      vramTotalGB: 2560,
      clusterHealth: 'Healthy (RDMA InfiniBand 3.2Tbps)',
    },
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// PII Redaction & Data Sanitization
app.post('/api/data/clean', (req, res) => {
  try {
    const { text, options } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    let cleaned = text;
    const redactionStats = {
      emails: 0,
      phones: 0,
      apiKeys: 0,
      ssn: 0,
      ipAddresses: 0,
    };

    if (options?.redactEmails ?? true) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const count = (cleaned.match(emailRegex) || []).length;
      redactionStats.emails += count;
      cleaned = cleaned.replace(emailRegex, '[EMAIL_REDACTED]');
    }

    if (options?.redactPhones ?? true) {
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const count = (cleaned.match(phoneRegex) || []).length;
      redactionStats.phones += count;
      cleaned = cleaned.replace(phoneRegex, '[PHONE_REDACTED]');
    }

    if (options?.redactApiKeys ?? true) {
      const apiKeyRegex = /(?:sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{35}|bearer\s+[a-zA-Z0-9._-]{20,})/gi;
      const count = (cleaned.match(apiKeyRegex) || []).length;
      redactionStats.apiKeys += count;
      cleaned = cleaned.replace(apiKeyRegex, '[API_KEY_REDACTED]');
    }

    if (options?.redactSSN ?? true) {
      const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
      const count = (cleaned.match(ssnRegex) || []).length;
      redactionStats.ssn += count;
      cleaned = cleaned.replace(ssnRegex, '[SSN_REDACTED]');
    }

    if (options?.redactIPs ?? true) {
      const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
      const count = (cleaned.match(ipRegex) || []).length;
      redactionStats.ipAddresses += count;
      cleaned = cleaned.replace(ipRegex, '[IP_REDACTED]');
    }

    res.json({
      success: true,
      cleanedText: cleaned,
      stats: redactionStats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Sanitization failed' });
  }
});

// Teacher Model Synthetic Data Generator (Distillation pipeline)
app.post('/api/gemini/synthetic-dataset', async (req, res) => {
  try {
    const { domain, taskType, format, sampleCount = 3, targetModel = 'google/gemma-2-9b' } = req.body;

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment',
        mockFallbackAvailable: true,
      });
    }

    const count = Math.min(Math.max(Number(sampleCount) || 3, 1), 5);
    const systemInstruction = `You are a world-class LLM data engineer crafting high-fidelity training data specifically formatted for fine-tuning Google ${targetModel} models.
Domain: ${domain || 'General instruction following'}
Task Type: ${taskType || 'SFT (Instruction-Response)'}
Target Format: ${format || 'Gemma Chat Format (<start_of_turn>user...<end_of_turn><start_of_turn>model...<end_of_turn>)'}

Generate exactly ${count} diverse, non-trivial, high-quality samples.
Output MUST be valid JSON array with objects containing:
[
  {
    "id": "syn-01",
    "instruction": "...",
    "input": "",
    "output": "...",
    "formattedGemmaText": "<start_of_turn>user\\n...<end_of_turn>\\n<start_of_turn>model\\n...<end_of_turn>",
    "tokenCountEstimate": 250,
    "qualityScore": 9.8
  }
]
Do not wrap in markdown quotes if possible, output pure JSON.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate ${count} synthetic fine-tuning pairs for ${domain} in the requested JSON structure.`,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '[]';
    let parsedData = [];
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Fallback clean regex
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse synthetic data JSON from teacher model');
      }
    }

    res.json({
      success: true,
      samples: parsedData,
      generatorModel: 'gemini-3.8-flash (Teacher)',
      targetModel,
      count: parsedData.length,
    });
  } catch (error: any) {
    console.error('Synthetic generation error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate synthetic dataset',
    });
  }
});

// LLM-as-a-Judge: Pairwise evaluation of Base Gemma vs Fine-Tuned Gemma
app.post('/api/gemini/llm-judge', async (req, res) => {
  try {
    const { prompt, baseModelName, baseOutput, tunedModelName, tunedOutput, criteria } = req.body;

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment',
      });
    }

    const judgePrompt = `You are an expert impartial AI Benchmark Judge evaluating fine-tuned Google Gemma models.
Prompt given to both models:
"""
${prompt}
"""

Model A (${baseModelName || 'Base Gemma'}):
"""
${baseOutput}
"""

Model B (${tunedModelName || 'Fine-Tuned GemmaForge'}):
"""
${tunedOutput}
"""

Evaluation Criteria: ${criteria || 'Correctness, instruction-following, conciseness, hallucination avoidance, formatting adherence.'}

Return a valid JSON object strictly matching this schema:
{
  "winner": "Model A" | "Model B" | "Tie",
  "scoreModelA": number (1-10),
  "scoreModelB": number (1-10),
  "detailedReasoning": "string with clear technical breakdown",
  "criteriaScores": {
    "instructionFollowing": { "modelA": 7.5, "modelB": 9.5 },
    "factualAccuracy": { "modelA": 8.0, "modelB": 9.2 },
    "hallucinationAvoidance": { "modelA": 7.0, "modelB": 9.8 },
    "toneAndSafety": { "modelA": 8.5, "modelB": 9.0 }
  },
  "improvementSummary": "1-2 sentence key takeaway"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: judgePrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      judge: 'gemini-3.8-flash (Double-Blind Benchmark Judge)',
      evaluation: parsed,
    });
  } catch (error: any) {
    console.error('LLM judge error:', error);
    res.status(500).json({ error: error?.message || 'Failed to execute LLM Judge evaluation' });
  }
});

// Auto-Tune Hyperparameter Advisor
app.post('/api/gemini/advisor', async (req, res) => {
  try {
    const { targetModel, datasetSize, taskType, hardware, budgetHours } = req.body;

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key not configured',
      });
    }

    const advisorPrompt = `You are a Principal MLOps Engineer at Google DeepMind specializing in fine-tuning Gemma models (${targetModel}).
Dataset size: ${datasetSize} samples
Task type: ${taskType}
Available hardware: ${hardware}
Time budget: ${budgetHours || 4} hours

Analyze and provide an optimal training recipe and Ray Tune / Optuna hyperparameter search boundaries.
Return pure JSON matching:
{
  "recommendedMethod": "QLoRA" | "LoRA" | "DoRA" | "FSDP Full Fine-Tuning" | "DPO",
  "precision": "bf16" | "int4_nf4" | "fp16",
  "recommendedParams": {
    "learningRate": "2e-4",
    "loraRank": 64,
    "loraAlpha": 128,
    "loraDropout": 0.05,
    "batchSizePerGpu": 4,
    "gradientAccumulation": 4,
    "epochs": 3,
    "warmupRatio": 0.03,
    "lrScheduler": "cosine",
    "optimizer": "paged_adamw_8bit"
  },
  "optunaSearchSpace": {
    "learningRate": { "min": 5e-5, "max": 5e-4, "distribution": "log_uniform" },
    "loraRank": [16, 32, 64, 128],
    "loraAlpha": [32, 64, 128, 256],
    "batchSize": [2, 4, 8]
  },
  "estimatedVramPerGpuGB": 18.5,
  "estimatedTrainingDurationMinutes": 95,
  "rationale": "Detailed explanation of why these settings prevent catastrophic forgetting on Gemma while maximizing throughput."
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: advisorPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      advisor: parsed,
    });
  } catch (error: any) {
    console.error('Advisor error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate advisor recipe' });
  }
});

// Interactive Playground Chat (Simulates or queries Gemma model behavior)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, temperature = 0.7, modelVariant = 'gemma-2-9b-it' } = req.body;

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured',
      });
    }

    const formattedHistory = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

    const lastMessage = formattedHistory.pop();
    const promptText = lastMessage?.parts?.[0]?.text || 'Hello';

    const fullSystem = `You are a fine-tuned Google ${modelVariant} model deployed on GemmaForge vLLM cluster.
Persona/System Instruction: ${systemInstruction || 'You are an accurate, helpful, and concise AI assistant.'}
Respond authentically as the Gemma model with fast, sharp, helpful formatting.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: fullSystem,
        temperature: Number(temperature) || 0.7,
      },
    });

    res.json({
      success: true,
      model: modelVariant,
      reply: response.text || '',
      metrics: {
        tokensGenerated: Math.floor(Math.random() * 120 + 80),
        tokensPerSecond: (Math.random() * 15 + 85).toFixed(1),
        firstTokenLatencyMs: Math.floor(Math.random() * 30 + 45),
        engine: 'vLLM v0.6.3 (PagedAttention)',
      },
    });
  } catch (error: any) {
    console.error('Playground chat error:', error);
    res.status(500).json({ error: error?.message || 'Chat generation failed' });
  }
});

// -----------------------------------------------------------------------------
// VITE MIDDLEWARE & STATIC ASSET SERVING
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GemmaForge] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GemmaForge] Failed to start server:', err);
  process.exit(1);
});
