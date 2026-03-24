import type { PredictionResult } from '../types';

const DEFAULT_MODEL = 'gemini-2.0-flash';

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

export type CohortContext = 'session_analytics' | 'csv_batch';

export type CohortInsightPayload = {
  context: CohortContext;
  studentCount: number;
  avgPredictedCgpa: number;
  avgFinalExam: number;
  avgConfidencePercent: number;
  riskHigh: number;
  riskMedium: number;
  riskLow: number;
  gradeBands: {
    excellent_8_5_to_10: number;
    good_6_5_to_8_5: number;
    average_4_to_6_5: number;
    poor_below_4: number;
  };
  factorAverages: {
    attendancePercent: number;
    assignmentAvgPercent: number;
    term1OutOf20: number;
    term2OutOf20: number;
    labPercent: number;
    teacherRemarkOutOf10: number;
  };
};

export function isGeminiConfigured(): boolean {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

function getKeyAndModel(): { key: string; model: string } {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || typeof key !== 'string' || !key.trim()) {
    throw new Error(
      'Set VITE_GEMINI_API_KEY in a .env file (see .env.example). Get a key from Google AI Studio.'
    );
  }
  const model =
    (typeof import.meta.env.VITE_GEMINI_MODEL === 'string' &&
      import.meta.env.VITE_GEMINI_MODEL.trim()) ||
    DEFAULT_MODEL;
  return { key: key.trim(), model };
}

/**
 * Low-level Gemini call (demo: key in browser bundle).
 */
export async function generateGeminiText(
  prompt: string,
  options?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
  const { key, model } = getKeyAndModel();
  const maxOutputTokens = options?.maxOutputTokens ?? 768;
  const temperature = options?.temperature ?? 0.35;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    }),
  });

  const data = (await res.json()) as GeminiGenerateResponse;

  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini request failed (${res.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error(
      'No text returned (quota, safety filter, or empty response). Try again or check the model name.'
    );
  }

  return text;
}

export function buildCohortPayload(
  predictions: PredictionResult[],
  context: CohortContext
): CohortInsightPayload {
  const n = predictions.length;
  const avg = (fn: (p: PredictionResult) => number) =>
    n ? predictions.reduce((s, p) => s + fn(p), 0) / n : 0;

  const labPct = (p: PredictionResult) => {
    const t = p.student.labTotal || 1;
    return (p.student.labMarks / t) * 100;
  };

  return {
    context,
    studentCount: n,
    avgPredictedCgpa: Number(avg(p => p.predictedCGPA).toFixed(2)),
    avgFinalExam: Number(avg(p => p.predictedFinalExam).toFixed(1)),
    avgConfidencePercent: Number((avg(p => p.confidence) * 100).toFixed(0)),
    riskHigh: predictions.filter(p => p.riskLevel === 'high').length,
    riskMedium: predictions.filter(p => p.riskLevel === 'medium').length,
    riskLow: predictions.filter(p => p.riskLevel === 'low').length,
    gradeBands: {
      excellent_8_5_to_10: predictions.filter(p => p.predictedCGPA >= 8.5).length,
      good_6_5_to_8_5: predictions.filter(p => p.predictedCGPA >= 6.5 && p.predictedCGPA < 8.5).length,
      average_4_to_6_5: predictions.filter(p => p.predictedCGPA >= 4.0 && p.predictedCGPA < 6.5).length,
      poor_below_4: predictions.filter(p => p.predictedCGPA < 4.0).length,
    },
    factorAverages: {
      attendancePercent: Number(avg(p => p.student.attendanceRate).toFixed(1)),
      assignmentAvgPercent: Number(avg(p => p.student.assignmentAverage).toFixed(1)),
      term1OutOf20: Number(avg(p => p.student.termAssessment1).toFixed(1)),
      term2OutOf20: Number(avg(p => p.student.termAssessment2).toFixed(1)),
      labPercent: Number(avg(labPct).toFixed(1)),
      teacherRemarkOutOf10: Number(avg(p => p.student.teacherRemark).toFixed(1)),
    },
  };
}

export async function fetchGeminiCohortInsight(payload: CohortInsightPayload): Promise<string> {
  const contextLabel =
    payload.context === 'csv_batch'
      ? 'a single CSV batch upload in the app'
      : 'all students currently in the app session (Predict + Batch combined)';

  const prompt = `You help teachers and academic coordinators interpret cohort-level statistics from a demo student performance app.

Critical rules:
- Predictions and risk counts were computed by a fixed weighted formula in the app — do NOT recalculate or invent new numbers.
- You only receive aggregate counts and averages. There are NO student names — never invent names.
- Context: ${contextLabel}.

Output structure:
1) One short paragraph: overall cohort picture.
2) Three to five bullet points: priority actions (intervention, monitoring, teaching focus) grounded in the weakest factors or risk distribution.
3) One short "Limitations" line reminding this is a demo tool, not a replacement for official records.

Aggregate data (JSON):
${JSON.stringify(payload)}`;

  return generateGeminiText(prompt, { maxOutputTokens: 1024, temperature: 0.3 });
}

export async function fetchGeminiExplanation(result: PredictionResult): Promise<string> {
  const labTotal = result.student.labTotal || 1;
  const summary = {
    attendancePercent: result.student.attendanceRate,
    assignmentAveragePercent: result.student.assignmentAverage,
    termAssessment1OutOf20: result.student.termAssessment1,
    termAssessment2OutOf20: result.student.termAssessment2,
    labPercent: (result.student.labMarks / labTotal) * 100,
    teacherRemarkOutOf10: result.student.teacherRemark,
    previousSGPAOutOf10: result.student.previousSGPA ?? null,
    predictedCGPAOutOf10: result.predictedCGPA,
    predictedFinalExamOutOf100: result.predictedFinalExam,
    riskLevel: result.riskLevel,
    appRecommendations: result.recommendations,
  };

  const prompt = `You help educators interpret a student performance preview from a demo web app.

Rules:
- The app already computed CGPA, exam score, and risk using a fixed weighted formula. Do NOT recalculate or change those numbers.
- Write 2–3 short paragraphs: plain language, supportive, professional.
- Explain what the risk level implies in general terms.
- Align with the provided recommendations; you may rephrase but do not contradict them.
- Then add a section titled "Talking points (parent meeting)" with 3–5 short bullet lines a teacher could say — still consistent with the app's numbers and recommendations.
- Do not ask for more data.

Structured result (JSON):
${JSON.stringify(summary)}`;

  return generateGeminiText(prompt, { maxOutputTokens: 900, temperature: 0.35 });
}

/** Doubt solver: grounded tutor answer (uses your API key; app enforces free session limit). */
export async function fetchDoubtAnswer(userQuestion: string, sessionContext?: string): Promise<string> {
  const ctx = sessionContext
    ? `\nContext from the latest prediction in this browser session (numbers are from the app only):\n${sessionContext}\n`
    : '';

  const prompt = `You are a calm, accurate academic coach for the EduPredict student performance demo.

How the app computes predicted CGPA (0–10): inputs are turned into a weighted percentage, then scaled to 10. Weights: attendance 25%, average of assignment marks (each /10) 20%, term assessment 1 (out of 20) 15%, term assessment 2 (out of 20) 15%, lab (obtained/total) 10%, teacher remark (out of 10) 8%, optional previous SGPA (out of 10) 7%. Risk level combines these signals with CGPA thresholds.

Rules:
- Answer the student's question directly. Use short paragraphs or bullets. Aim under ~280 words.
- If they share numbers, explain what usually moves CGPA most (attendance and consistent assignments first).
- Do not claim to change official transcripts or university records. This is a study-planning aid.
- Refuse medical/legal topics; redirect to study skills.
- Do not invent grades they did not provide.

${ctx}

Student question:
${userQuestion.trim()}`;

  return generateGeminiText(prompt, { maxOutputTokens: 720, temperature: 0.42 });
}

/**
 * Maps provider errors to short assistant voice — never show raw quota URLs to end users.
 */
export function toFriendlyAssistantMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('resource_exhausted') ||
    m.includes('resource exhausted') ||
    m.includes('free_tier') ||
    m.includes('billing') ||
    m.includes('exceeded your current quota') ||
    m.includes('generate_content_free_tier') ||
    m.includes('too many requests')
  ) {
    return "Hi — I'm your study assistant. Right now I can't reach the cloud brain (usage limits or a short cooldown — totally normal on free tiers). Your scores and risk levels on this page are already computed here in the app, so you're not missing anything important. Give it a minute and I'll try again, or check your Gemini usage in Google AI Studio if you own this project.";
  }
  if (
    m.includes('api key') ||
    m.includes('permission denied') ||
    m.includes('invalid api') ||
    m.includes('401') ||
    m.includes('403') ||
    m.includes('api_key_invalid')
  ) {
    return "I couldn't connect with the right credentials. If you're running this demo yourself, double-check the Gemini key in your environment — the app's own predictions still work fine.";
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) {
    return "Hmm — the network dropped for a second. Everything you already see on this screen is safe; try again when your connection is steady.";
  }
  return "I ran into a snag answering that one. The app's numbers above are still trustworthy — we can try again in a moment.";
}
