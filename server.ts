import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy GoogleGenAI initialization
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in your project settings.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Flash model cascade: primary high-availability Flash model with automatic fallbacks
const FLASH_MODELS_CASCADE = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

function is503OrUnavailable(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.statusCode || error.code || error.response?.status || error.error?.code;
  if (status === 503) return true;
  const str = (
    (typeof error === "string" ? error : "") +
    " " +
    (error.message || "") +
    " " +
    (error.statusText || "") +
    " " +
    JSON.stringify(error.error || {})
  ).toLowerCase();

  return (
    str.includes("503") ||
    str.includes("unavailable") ||
    str.includes("overloaded") ||
    str.includes("high demand") ||
    str.includes("service unavailable") ||
    str.includes("temporarily unavailable")
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function executeGeminiWithFallback(
  ai: GoogleGenAI,
  requestPayload: {
    contents: any;
    config: any;
  }
): Promise<{ responseText: string; modelUsed: string }> {
  let lastError: any = null;

  for (let i = 0; i < FLASH_MODELS_CASCADE.length; i++) {
    const currentModel = FLASH_MODELS_CASCADE[i];
    const isLastModel = i === FLASH_MODELS_CASCADE.length - 1;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini Flash Engine] Dispatching incident analysis with model: ${currentModel} (attempt ${attempt}/2)...`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: requestPayload.contents,
          config: requestPayload.config,
        });

        const text = response.text || "";
        if (!text.trim()) {
          throw new Error(`Empty response returned from model ${currentModel}`);
        }

        console.log(`[Gemini Flash Engine] Successfully generated analysis via model: ${currentModel}`);
        return {
          responseText: text,
          modelUsed: currentModel,
        };
      } catch (err: any) {
        lastError = err;
        const isUnavailable = is503OrUnavailable(err);

        console.warn(
          `[Gemini Flash Engine] Call to ${currentModel} failed (attempt ${attempt}/2):`,
          err?.status || err?.code || "",
          err?.message || err
        );

        if (isUnavailable) {
          if (attempt === 1) {
            console.log(`[Gemini Flash Engine] 503 UNAVAILABLE detected on ${currentModel}. Retrying in 800ms with jitter...`);
            await delay(800 + Math.floor(Math.random() * 200));
            continue;
          } else {
            // Second attempt on current model failed with 503; break inner loop to try next fallback Flash model
            if (!isLastModel) {
              const fallbackModel = FLASH_MODELS_CASCADE[i + 1];
              console.warn(
                `[Gemini Flash Engine] Model ${currentModel} returned 503 UNAVAILABLE twice. Automatically failing over to fallback Flash model: ${fallbackModel}`
              );
              break;
            }
          }
        } else {
          // If error is 404 (e.g. model not available in region) or 429 quota, attempt fallback model if available
          if (!isLastModel && (err?.status === 404 || err?.status === 429)) {
            console.warn(`[Gemini Flash Engine] Model ${currentModel} returned status ${err?.status}. Trying fallback model: ${FLASH_MODELS_CASCADE[i + 1]}`);
            break;
          }
          // If non-recoverable client error, throw
          throw err;
        }
      }
    }
  }

  throw lastError || new Error("All supported Gemini Flash models failed to process the request.");
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    primaryModel: FLASH_MODELS_CASCADE[0],
    fallbackModels: FLASH_MODELS_CASCADE.slice(1),
    timestamp: new Date().toISOString()
  });
});

// Cybersecurity Incident Analysis Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { rawIncident, incidentType, incidentTitle } = req.body;

    if (!rawIncident || typeof rawIncident !== "string" || !rawIncident.trim()) {
      return res.status(400).json({ error: "Missing or invalid raw incident content to analyze." });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are SentinelAI, a Principal SOC Incident Responder and Cyber Threat Intelligence Investigator.
Analyze the provided cybersecurity incident artifact (which could be raw syslog, Windows Event logs, EDR alert, Suricata/Snort alert, suspicious phishing email headers and body, firewall drop logs, IP activity, bash history, or incident description).

Return a comprehensive, highly accurate JSON analysis strictly matching the requested structure.
Categorize IOCs cleanly (IPs, Domains/URLs, File Hashes, File Paths, CVEs, Accounts/Emails).
Map to relevant MITRE ATT&CK techniques with IDs and names.
Provide an executive summary, threat severity (Critical, High, Medium, Low), attack type, deep explanation of why it is suspicious, realistic attack storyline sequence, immediate containment actions, eradication/remediation actions, and confidence assessment.`;

    const prompt = `INVESTIGATION ARTIFACT:
${incidentTitle ? `Artifact Title: ${incidentTitle}\n` : ""}${incidentType ? `Source Type: ${incidentType}\n` : ""}
Raw Incident Data / Logs / Content:
\`\`\`
${rawIncident.slice(0, 40000)}
\`\`\`

Perform a deep forensic triage and return a JSON object with this exact structure:
{
  "threatSeverity": "Critical" | "High" | "Medium" | "Low",
  "threatScore": number (1 to 100, where 90+ is Critical, 70-89 High, 40-69 Medium, 1-39 Low),
  "likelyAttackType": string (e.g., "Kerberoasting & Lateral Movement", "Spearphishing with Reverse Shell Dropper", "SQL Injection & Database Exfiltration"),
  "confidenceLevel": "High" | "Medium" | "Low",
  "confidenceScore": number (percentage e.g. 95),
  "executiveSummary": string (concise 2-3 sentence executive summary of what occurred),
  "whySuspicious": string (detailed technical explanation of anomaly, telemetry mismatch, behavioral red flags),
  "attackStoryline": [
    {
      "step": number,
      "phase": string (e.g., "Initial Access", "Execution", "Persistence", "Privilege Escalation", "Lateral Movement", "Command and Control", "Exfiltration"),
      "timestamp": string (derived from logs if present, else relative like "Phase 1 - T0"),
      "description": string,
      "techniqueId": string (e.g. "T1059.001")
    }
  ],
  "mitreAttackTechniques": [
    {
      "id": string (e.g., "T1078"),
      "name": string (e.g., "Valid Accounts"),
      "tactic": string (e.g., "Defense Evasion / Initial Access")
    }
  ],
  "indicatorsOfCompromise": [
    {
      "type": "IP" | "Domain" | "URL" | "Hash" | "File" | "Email" | "Registry" | "Command",
      "value": string,
      "reputation": "Malicious" | "Suspicious" | "Unknown",
      "context": string
    }
  ],
  "recommendedResponseActions": [
    {
      "priority": "P1 - Immediate" | "P2 - Containment" | "P3 - Eradication & Recovery",
      "action": string,
      "description": string,
      "suggestedCommand": string (optional CLI command e.g. iptables, PowerShell, or null)
    }
  ],
  "affectedAssets": [string],
  "attackVector": string
}`;

    const { responseText, modelUsed } = await executeGeminiWithFallback(ai, {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      // Fallback: extract JSON from markdown fences if any
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Unable to parse AI model response into structured cybersecurity telemetry.");
      }
    }

    // Attach model metadata
    parsedData.modelUsed = modelUsed;

    return res.json({
      success: true,
      data: parsedData,
      modelUsed,
      analyzedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze incident with AI investigator.",
      details: error?.status ? `Status: ${error.status}` : undefined
    });
  }
});

// Vite middleware or static serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    // Universal fallback for any unhandled routes in production SPA
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SentinelAI server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
