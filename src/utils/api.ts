/**
 * SPA → Spring Boot. Use empty `VITE_API_BASE` + Vite proxy in dev.
 * Production: `VITE_API_BASE=https://api.example.com`
 */

import type { PredictionResult, StudentData } from '../types';
import type { ImprovementAction, SerializedStudentRecord, StudentRecord } from '../types/portal';
import { normalizePortalRecord, toApiStudentPayload } from './portalApi';

const API_ROOT =
  typeof import.meta.env.VITE_API_BASE === 'string' ? import.meta.env.VITE_API_BASE.replace(/\/$/, '') : '';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_ROOT}${path}`;
}

export function authHeaders(token: string | null | undefined): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function authHeader(token: string | null): Record<string, string> {
  return authHeaders(token ?? undefined);
}

export async function apiHealth(): Promise<boolean> {
  try {
    const r = await fetch(apiUrl('/api/health'), { method: 'GET' });
    return r.ok;
  } catch {
    return false;
  }
}

export async function apiLogin(username: string, password: string): Promise<Response> {
  return fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function apiAuthMe(token: string): Promise<Response> {
  return fetch(apiUrl('/api/auth/me'), { headers: authHeaders(token) });
}

/** --- Portal roster (`/api/portal/students`) --- */

export async function apiPortalListStudents(token: string): Promise<StudentRecord[]> {
  const r = await fetch(apiUrl('/api/portal/students'), { headers: authHeaders(token) });
  if (!r.ok) throw new Error('Failed to load roster');
  const arr = (await r.json()) as SerializedStudentRecord[];
  return Array.isArray(arr) ? arr.map(normalizePortalRecord) : [];
}

export async function apiPortalGetStudent(token: string, id: string): Promise<StudentRecord | null> {
  const r = await fetch(apiUrl(`/api/portal/students/${encodeURIComponent(id)}`), {
    headers: authHeaders(token),
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('Failed to load student');
  const raw = (await r.json()) as SerializedStudentRecord;
  return normalizePortalRecord(raw);
}

export async function apiPortalCreateStudent(token: string, record: StudentRecord): Promise<void> {
  const r = await fetch(apiUrl('/api/portal/students'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(toApiStudentPayload(record)),
  });
  if (!r.ok) throw new Error('Could not create student');
}

export async function apiPortalUpsertStudent(token: string, record: StudentRecord): Promise<void> {
  const r = await fetch(apiUrl(`/api/portal/students/${encodeURIComponent(record.id)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(toApiStudentPayload(record)),
  });
  if (!r.ok) throw new Error('Could not save student');
}

/** Student PATCH — narrative, improvement checklist, and/or academic `data` (server ML recompute). */
export type PortalStudentPatch = {
  teacherNarrative?: string;
  improvementActions?: ImprovementAction[];
  data?: StudentData;
};

export async function apiPortalPatchStudent(
  token: string,
  studentId: string,
  patch: PortalStudentPatch
): Promise<StudentRecord | null> {
  const body: Record<string, unknown> = {};
  if (patch.teacherNarrative !== undefined) body.teacherNarrative = patch.teacherNarrative;
  if (patch.improvementActions) {
    body.improvementActions = patch.improvementActions.map((a: ImprovementAction) => ({
      id: a.id,
      text: a.text,
    }));
  }
  if (patch.data) body.data = patch.data;

  const r = await fetch(apiUrl(`/api/portal/students/${encodeURIComponent(studentId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('Could not update profile');
  const raw = (await r.json()) as SerializedStudentRecord;
  return normalizePortalRecord(raw);
}

export async function apiPortalBatchUpsert(token: string, records: StudentRecord[]): Promise<StudentRecord[]> {
  const payload = records.map(r => toApiStudentPayload(r));
  const r = await fetch(apiUrl('/api/portal/students/batch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Could not batch save students');
  const arr = (await r.json()) as SerializedStudentRecord[];
  return Array.isArray(arr) ? arr.map(normalizePortalRecord) : [];
}

export async function apiPortalDeleteStudent(token: string, id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/portal/students/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 404) throw new Error('Could not delete student');
}

export async function apiPortalPurgeAll(token: string): Promise<void> {
  const r = await fetch(apiUrl('/api/portal/students?purge=all'), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error('Could not purge roster');
}

/** --- ML `/api/ml` --- */

interface MlPredictionPayload {
  student: Partial<StudentData> & Record<string, unknown>;
  predictedCGPA: number;
  predictedFinalExam: number;
  riskLevel: string;
  confidence: number;
  recommendations: string[];
  timestamp: string;
}

export function studentDataForMlPayload(s: StudentData): Record<string, unknown> {
  return {
    id: s.id,
    name: s.name,
    attendanceRate: s.attendanceRate,
    assignments: s.assignments,
    assignmentAverage: s.assignmentAverage,
    termAssessment1: s.termAssessment1,
    termAssessment2: s.termAssessment2,
    labMarks: s.labMarks,
    labTotal: s.labTotal,
    teacherRemark: s.teacherRemark,
    remarkCaption: s.remarkCaption ?? null,
    previousSGPA: s.previousSGPA ?? null,
  };
}

export function predictionPayloadToResult(p: MlPredictionPayload): PredictionResult {
  const st = p.student;
  const assignments = Array.isArray(st.assignments)
    ? (st.assignments as unknown[]).map(x => Number(x))
    : [];
  const student: StudentData = {
    id: typeof st.id === 'string' ? st.id : undefined,
    name: typeof st.name === 'string' ? st.name : '',
    attendanceRate: Number(st.attendanceRate ?? 0),
    assignments,
    assignmentAverage: Number(st.assignmentAverage ?? 0),
    termAssessment1: Number(st.termAssessment1 ?? 0),
    termAssessment2: Number(st.termAssessment2 ?? 0),
    labMarks: Number(st.labMarks ?? 0),
    labTotal: Number(st.labTotal ?? 30),
    teacherRemark: Number(st.teacherRemark ?? 0),
    remarkCaption: typeof st.remarkCaption === 'string' ? st.remarkCaption : undefined,
    previousSGPA: st.previousSGPA != null && st.previousSGPA !== '' ? Number(st.previousSGPA) : undefined,
  };
  const risk = String(p.riskLevel || 'medium').toLowerCase();
  const riskLevel: PredictionResult['riskLevel'] =
    risk === 'low' || risk === 'medium' || risk === 'high' ? risk : 'medium';
  return {
    student,
    predictedCGPA: Number(p.predictedCGPA),
    predictedFinalExam: Math.round(Number(p.predictedFinalExam)),
    riskLevel,
    confidence: Number(p.confidence),
    recommendations: Array.isArray(p.recommendations) ? p.recommendations : [],
    timestamp: new Date(p.timestamp),
  };
}

export async function apiMlPredict(token: string, student: StudentData): Promise<PredictionResult> {
  const r = await fetch(apiUrl('/api/ml/predict'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(studentDataForMlPayload(student)),
  });
  if (!r.ok) throw new Error('ML predict failed');
  const body = (await r.json()) as MlPredictionPayload;
  return predictionPayloadToResult(body);
}

export async function apiMlPredictBatch(token: string, students: StudentData[]): Promise<PredictionResult[]> {
  if (!students.length) return [];
  const r = await fetch(apiUrl('/api/ml/predict/batch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(students.map(studentDataForMlPayload)),
  });
  if (!r.ok) throw new Error('Batch ML predict failed');
  const body = (await r.json()) as MlPredictionPayload[];
  return Array.isArray(body) ? body.map(predictionPayloadToResult) : [];
}
