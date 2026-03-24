import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  ImprovementAction,
  PortalRole,
  StudentRecord,
  SerializedStudentRecord,
} from '../types/portal';
import type { PredictionResult } from '../types';
import { MOCK_SEED_ROWS } from '../data/mockSeed';
import { predictPerformance } from '../utils/mlModel';
import { buildCgpaHistory, DEFAULT_SEMESTERS } from '../utils/cgpaHistory';
import { parseStudentsCsv, type ParsedCsvRow } from '../utils/parseStudentsCsv';

const STORAGE_RECORDS = 'edupredict_portal_records_v1';
const STORAGE_ROLE = 'edupredict_portal_role_v1';
const STORAGE_STUDENT = 'edupredict_portal_student_v1';

function newImpId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildRecordFromSeed(row: (typeof MOCK_SEED_ROWS)[0]): StudentRecord {
  const pred = predictPerformance({ ...row.data, id: row.id });
  return {
    id: row.id,
    rollNumber: row.rollNumber,
    program: row.program,
    data: pred.student,
    prediction: { ...pred, timestamp: new Date() },
    teacherNarrative: row.teacherNarrative,
    improvementActions: row.improvements.map((text, i) => ({
      id: newImpId(`${row.id}-${i}`),
      text,
    })),
    cgpaSemesters: [...DEFAULT_SEMESTERS],
    cgpaHistory: buildCgpaHistory(pred.predictedCGPA),
  };
}

function initialRecords(): StudentRecord[] {
  return MOCK_SEED_ROWS.map(buildRecordFromSeed);
}

function serializeRecords(records: StudentRecord[]): string {
  return JSON.stringify(
    records.map(r => ({
      ...r,
      prediction: {
        ...r.prediction,
        timestamp: r.prediction.timestamp.toISOString(),
      },
    }))
  );
}

function parseRecords(json: string): StudentRecord[] | null {
  try {
    const arr = JSON.parse(json) as SerializedStudentRecord[];
    if (!Array.isArray(arr)) return null;
    return arr.map(r => ({
      ...r,
      prediction: {
        ...r.prediction,
        timestamp: new Date(r.prediction.timestamp),
      },
    }));
  } catch {
    return null;
  }
}

function recordFromParsed(row: ParsedCsvRow, index: number): StudentRecord {
  const pred = predictPerformance(row.data);
  const roll =
    row.rollNumber?.trim() ||
    `IMP${String(index + 1).padStart(3, '0')}`;
  const program = row.program?.trim() || 'Program not specified · update in teacher panel';
  const id = `imported-${roll.replace(/\s/g, '-')}-${index}`;
  return {
    id,
    rollNumber: roll,
    program,
    data: pred.student,
    prediction: { ...pred, timestamp: new Date() },
    teacherNarrative:
      pred.student.remarkCaption ||
      'Imported record — please add a teacher narrative and improvement plan.',
    improvementActions: pred.recommendations.slice(0, 5).map((text, i) => ({
      id: newImpId(`csv-${i}`),
      text,
    })),
    cgpaSemesters: [...DEFAULT_SEMESTERS],
    cgpaHistory: buildCgpaHistory(pred.predictedCGPA),
  };
}

function recordFromPrediction(prediction: PredictionResult, index: number): StudentRecord {
  const name = prediction.student.name?.trim() || `Student ${index + 1}`;
  const roll = `PRED${String(index + 1).padStart(3, '0')}`;
  const id = `pred-${name.toLowerCase().replace(/\s+/g, '-')}-${index}`;
  return {
    id,
    rollNumber: roll,
    program: 'Program not specified · update in teacher panel',
    data: prediction.student,
    prediction: { ...prediction, timestamp: new Date(prediction.timestamp) },
    teacherNarrative:
      prediction.student.remarkCaption ||
      'Generated from prediction workspace - add narrative before sharing with students.',
    improvementActions: prediction.recommendations.slice(0, 5).map((text, i) => ({
      id: newImpId(`pred-${i}`),
      text,
    })),
    cgpaSemesters: [...DEFAULT_SEMESTERS],
    cgpaHistory: buildCgpaHistory(prediction.predictedCGPA),
  };
}

interface EduPortalContextValue {
  role: PortalRole | null;
  setRole: (r: PortalRole | null) => void;
  records: StudentRecord[];
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  getRecord: (id: string) => StudentRecord | undefined;
  updateRecord: (
    id: string,
    patch: Partial<
      Pick<
        StudentRecord,
        | 'teacherNarrative'
        | 'improvementActions'
        | 'data'
        | 'rollNumber'
        | 'program'
      >
    >
  ) => void;
  addImprovement: (recordId: string, text: string) => void;
  removeImprovement: (recordId: string, actionId: string) => void;
  importCsv: (csvText: string) => { ok: true; count: number } | { ok: false; error: string };
  upsertPredictions: (predictions: PredictionResult[]) => number;
  resetDemoData: () => void;
}

const EduPortalContext = createContext<EduPortalContextValue | null>(null);

export function EduPortalProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<StudentRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_RECORDS);
      if (raw) {
        const parsed = parseRecords(raw);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return initialRecords();
  });

  const [role, setRoleState] = useState<PortalRole | null>(() => {
    try {
      const r = localStorage.getItem(STORAGE_ROLE) as PortalRole | null;
      if (r === 'teacher' || r === 'student') return r;
    } catch {
      /* ignore */
    }
    return null;
  });

  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_STUDENT);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECORDS, serializeRecords(records));
    } catch {
      /* ignore */
    }
  }, [records]);

  const setRole = useCallback((r: PortalRole | null) => {
    setRoleState(r);
    try {
      if (r) localStorage.setItem(STORAGE_ROLE, r);
      else localStorage.removeItem(STORAGE_ROLE);
    } catch {
      /* ignore */
    }
  }, []);

  const setSelectedStudentId = useCallback((id: string | null) => {
    setSelectedStudentIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_STUDENT, id);
      else localStorage.removeItem(STORAGE_STUDENT);
    } catch {
      /* ignore */
    }
  }, []);

  const getRecord = useCallback(
    (id: string) => records.find(r => r.id === id),
    [records]
  );

  const updateRecord = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          StudentRecord,
          | 'teacherNarrative'
          | 'improvementActions'
          | 'data'
          | 'rollNumber'
          | 'program'
        >
      >
    ) => {
      setRecords(prev =>
        prev.map(r => {
          if (r.id !== id) return r;
          let next: StudentRecord = { ...r, ...patch };
          if (patch.data) {
            const pred = predictPerformance({ ...patch.data, id: r.id });
            next = {
              ...next,
              data: pred.student,
              prediction: { ...pred, timestamp: new Date() },
              cgpaHistory: buildCgpaHistory(pred.predictedCGPA),
            };
          }
          return next;
        })
      );
    },
    []
  );

  const addImprovement = useCallback((recordId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setRecords(prev =>
      prev.map(r =>
        r.id === recordId
          ? {
              ...r,
              improvementActions: [
                ...r.improvementActions,
                { id: newImpId('imp'), text: t },
              ],
            }
          : r
      )
    );
  }, []);

  const removeImprovement = useCallback((recordId: string, actionId: string) => {
    setRecords(prev =>
      prev.map(r =>
        r.id === recordId
          ? {
              ...r,
              improvementActions: r.improvementActions.filter(a => a.id !== actionId),
            }
          : r
      )
    );
  }, []);

  const importCsv = useCallback((csvText: string) => {
    try {
      const rows = parseStudentsCsv(csvText).filter(r => r.data.name?.trim());
      if (rows.length === 0) return { ok: false as const, error: 'No valid rows (need a name column).' };
      setRecords(prev => {
        const next = [...prev];
        rows.forEach((row, i) => {
          const rec = recordFromParsed(row, i);
          const idx = next.findIndex(
            x =>
              x.rollNumber === rec.rollNumber ||
              x.data.name === rec.data.name
          );
          if (idx >= 0) next[idx] = { ...rec, id: next[idx].id };
          else next.push(rec);
        });
        return next;
      });
      return { ok: true as const, count: rows.length };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Import failed.',
      };
    }
  }, []);

  const upsertPredictions = useCallback((predictions: PredictionResult[]) => {
    if (predictions.length === 0) return 0;
    setRecords(prev => {
      const next = [...prev];
      predictions.forEach((prediction, i) => {
        const rec = recordFromPrediction(prediction, i);
        const idx = next.findIndex(
          x =>
            x.rollNumber === rec.rollNumber ||
            x.data.name.trim().toLowerCase() === rec.data.name.trim().toLowerCase()
        );
        if (idx >= 0) next[idx] = { ...rec, id: next[idx].id, rollNumber: next[idx].rollNumber };
        else next.push(rec);
      });
      return next;
    });
    return predictions.length;
  }, []);

  const resetDemoData = useCallback(() => {
    setRecords(initialRecords());
  }, []);

  const value = useMemo<EduPortalContextValue>(
    () => ({
      role,
      setRole,
      records,
      selectedStudentId,
      setSelectedStudentId,
      getRecord,
      updateRecord,
      addImprovement,
      removeImprovement,
      importCsv,
      upsertPredictions,
      resetDemoData,
    }),
    [
      role,
      setRole,
      records,
      selectedStudentId,
      setSelectedStudentId,
      getRecord,
      updateRecord,
      addImprovement,
      removeImprovement,
      importCsv,
      upsertPredictions,
      resetDemoData,
    ]
  );

  return <EduPortalContext.Provider value={value}>{children}</EduPortalContext.Provider>;
}

export function useEduPortal() {
  const ctx = useContext(EduPortalContext);
  if (!ctx) throw new Error('useEduPortal must be used within EduPortalProvider');
  return ctx;
}

export type { ImprovementAction };
