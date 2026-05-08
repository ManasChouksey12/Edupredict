import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ImprovementAction,
  PortalRole,
  SerializedStudentRecord,
  StudentRecord,
} from '../types/portal';
import type { PredictionResult, StudentData } from '../types';
import { predictPerformance } from '../utils/mlModel';
import { buildCgpaHistory, DEFAULT_SEMESTERS } from '../utils/cgpaHistory';
import { parseStudentsCsv, type ParsedCsvRow } from '../utils/parseStudentsCsv';
import {
  apiPortalBatchUpsert,
  apiPortalCreateStudent,
  apiPortalDeleteStudent,
  apiPortalListStudents,
  apiPortalPatchStudent,
  apiPortalPurgeAll,
  apiPortalUpsertStudent,
} from '../utils/api';
import { normalizePortalRecord } from '../utils/portalApi';
import { useAuth } from './AuthContext';
import { EDUPREDICT_AUTH_JWT_KEY, EDUPREDICT_OFFLINE_DEMO_KEY } from './authKeys';

function mergeStudentPortalData(base: StudentData, patch: Partial<StudentData>): StudentData {
  const assignments = patch.assignments ?? base.assignments;
  const sum = assignments.reduce((s, x) => s + x, 0);
  const assignmentAverage = assignments.length
    ? (sum / (assignments.length * 10)) * 100
    : base.assignmentAverage;
  return {
    ...base,
    ...patch,
    assignments: [...assignments],
    assignmentAverage,
  };
}

const STORAGE_RECORDS = 'edupredict_portal_records_v1';
const STORAGE_ROLE = 'edupredict_portal_role_v1';
const STORAGE_STUDENT = 'edupredict_portal_student_v1';

function hasJwtServerSessionBootstrap(): boolean {
  try {
    const jwt = localStorage.getItem(EDUPREDICT_AUTH_JWT_KEY);
    const offline = localStorage.getItem(EDUPREDICT_OFFLINE_DEMO_KEY) === '1';
    return !!(jwt && !offline);
  } catch {
    return false;
  }
}

function readInitialPortalRecords(): StudentRecord[] {
  if (hasJwtServerSessionBootstrap()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS);
    if (!raw) return [];
    const parsed = parseRecords(raw);
    return parsed && parsed.length > 0 ? parsed : [];
  } catch {
    return [];
  }
}

function readInitialSelectedStudentId(): string | null {
  if (hasJwtServerSessionBootstrap()) return null;
  try {
    return localStorage.getItem(STORAGE_STUDENT);
  } catch {
    return null;
  }
}

function newImpId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
    return arr.map(normalizePortalRecord);
  } catch {
    return null;
  }
}

function recordFromParsed(row: ParsedCsvRow, index: number): StudentRecord {
  const pred = predictPerformance(row.data);
  const roll = row.rollNumber?.trim() || `IMP${String(index + 1).padStart(3, '0')}`;
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
      'Generated from prediction workspace — add narrative before sharing with students.',
    improvementActions: prediction.recommendations.slice(0, 5).map((text, i) => ({
      id: newImpId(`pred-${i}`),
      text,
    })),
    cgpaSemesters: [...DEFAULT_SEMESTERS],
    cgpaHistory: buildCgpaHistory(prediction.predictedCGPA),
  };
}

interface EduPortalContextValue {
  portalBackendActive: boolean;
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
        'teacherNarrative' | 'improvementActions' | 'data' | 'rollNumber' | 'program'
      >
    >
  ) => void;
  addImprovement: (recordId: string, text: string) => void;
  removeImprovement: (recordId: string, actionId: string) => void;
  importCsv: (csvText: string) => Promise<{ ok: true; count: number } | { ok: false; error: string }>;
  upsertPredictions: (predictions: PredictionResult[]) => Promise<number>;
  resetDemoData: () => Promise<void>;
  reloadFromBackend: () => Promise<void>;
  /** POST /api/portal/students (teacher or offline local append). */
  createStudentRecord: (record: StudentRecord) => Promise<void>;
  /** DELETE /api/portal/students/:id */
  deleteStudentRecord: (id: string) => Promise<void>;
}

const EduPortalContext = createContext<EduPortalContextValue | null>(null);

export function EduPortalProvider({ children }: { children: React.ReactNode }) {
  const { token, user, offlineDemo, authReady } = useAuth();

  const portalBackendActive = !!(token && user && authReady && !offlineDemo);

  const [records, setRecords] = useState<StudentRecord[]>(readInitialPortalRecords);

  const [role, setRoleState] = useState<PortalRole | null>(() => {
    try {
      const r = localStorage.getItem(STORAGE_ROLE) as PortalRole | null;
      if (r === 'teacher' || r === 'student') return r;
    } catch {
      /* ignore */
    }
    return null;
  });

  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(readInitialSelectedStudentId);

  const reloadFromBackend = useCallback(async () => {
    if (!portalBackendActive || !token) return;
    try {
      const loaded = await apiPortalListStudents(token);
      setRecords(loaded);
      if (user?.role === 'STUDENT') {
        if (loaded.length === 1) setSelectedStudentIdState(loaded[0].id);
        else setSelectedStudentIdState(null);
      }
    } catch {
      /* ignore transient errors — teacher can retry by refreshing */
    }
  }, [portalBackendActive, token, user?.role]);

  /** One-shot refresh when JWT session attaches; avoids wiping roster on unrelated context updates. */
  const portalHydrationKey = useMemo(
    () => {
      if (!authReady || !portalBackendActive || !token || !user) return null;
      return `${token}|${user.role}|${user.studentRoll ?? ''}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only; avoids /auth/me user object churn clearing roster.
    [authReady, portalBackendActive, token, user?.role, user?.studentRoll]
  );

  const portalHydrationAuthRef = useRef({ token, user });
  portalHydrationAuthRef.current = { token, user };

  useEffect(() => {
    if (!portalHydrationKey) return;
    let cancelled = false;
    try {
      localStorage.removeItem(STORAGE_RECORDS);
      localStorage.removeItem(STORAGE_STUDENT);
    } catch {
      /* ignore */
    }
    setRecords([]);
    setSelectedStudentIdState(null);

    void (async () => {
      const { token: t, user: u } = portalHydrationAuthRef.current;
      if (!t || !u || cancelled) return;
      try {
        const loaded = await apiPortalListStudents(t);
        if (cancelled) return;
        setRecords(loaded);
        if (u.role === 'STUDENT') {
          if (loaded.length === 1) setSelectedStudentIdState(loaded[0].id);
          else setSelectedStudentIdState(null);
        }
      } catch {
        /* ignore transient errors — teacher can retry by refreshing */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [portalHydrationKey]);

  useEffect(() => {
    if (!authReady) return;
    if (token || offlineDemo) return;
    try {
      const raw = localStorage.getItem(STORAGE_RECORDS);
      if (raw) {
        const parsed = parseRecords(raw);
        setRecords(parsed && parsed.length > 0 ? parsed : []);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    }
    setSelectedStudentIdState(null);
  }, [authReady, offlineDemo, token]);

  useEffect(() => {
    if (portalBackendActive) return;
    try {
      localStorage.setItem(STORAGE_RECORDS, serializeRecords(records));
    } catch {
      /* ignore */
    }
  }, [records, portalBackendActive]);

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
          'teacherNarrative' | 'improvementActions' | 'data' | 'rollNumber' | 'program'
        >
      >
    ) => {
      if (portalBackendActive && token && user?.role === 'STUDENT' && patch.data) {
        let snapshot: StudentRecord | undefined;
        setRecords(prev =>
          prev.map(r => {
            if (r.id !== id) return r;
            const merged = mergeStudentPortalData(r.data, patch.data!);
            snapshot = { ...r, ...patch, data: merged };
            return snapshot;
          })
        );
        if (snapshot) {
          void apiPortalPatchStudent(token, snapshot.id, {
            teacherNarrative: snapshot.teacherNarrative,
            improvementActions: snapshot.improvementActions,
            data: snapshot.data,
          })
            .then(srv => {
              if (srv) setRecords(prev => prev.map(rr => (rr.id === srv.id ? srv : rr)));
            })
            .catch(() => {});
        }
        return;
      }

      let synced: StudentRecord | undefined;

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
          synced = next;
          return next;
        })
      );

      if (portalBackendActive && token && synced) {
        if (user?.role === 'STUDENT' && !patch.data) {
          void apiPortalPatchStudent(token, synced.id, {
            teacherNarrative: synced.teacherNarrative,
            improvementActions: synced.improvementActions,
          }).catch(() => {});
        } else if (user?.role === 'TEACHER') {
          void apiPortalUpsertStudent(token, synced).catch(() => {
            /* best-effort; avoid blocking UI */
          });
        }
      }
    },
    [portalBackendActive, token, user?.role]
  );

  const addImprovement = useCallback(
    (recordId: string, text: string) => {
      const t = text.trim();
      if (!t) return;
      let synced: StudentRecord | undefined;
      setRecords(prev =>
        prev.map(r => {
          if (r.id !== recordId) return r;
          const next = {
            ...r,
            improvementActions: [...r.improvementActions, { id: newImpId('imp'), text: t }],
          };
          synced = next;
          return next;
        })
      );
      if (portalBackendActive && token && synced) {
        if (user?.role === 'STUDENT') {
          void apiPortalPatchStudent(token, synced.id, {
            teacherNarrative: synced.teacherNarrative,
            improvementActions: synced.improvementActions,
          }).catch(() => {});
        } else {
          void apiPortalUpsertStudent(token, synced).catch(() => {});
        }
      }
    },
    [portalBackendActive, token, user?.role]
  );

  const removeImprovement = useCallback(
    (recordId: string, actionId: string) => {
      let synced: StudentRecord | undefined;
      setRecords(prev =>
        prev.map(r => {
          if (r.id !== recordId) return r;
          const next = {
            ...r,
            improvementActions: r.improvementActions.filter(a => a.id !== actionId),
          };
          synced = next;
          return next;
        })
      );
      if (portalBackendActive && token && synced) {
        if (user?.role === 'STUDENT') {
          void apiPortalPatchStudent(token, synced.id, {
            teacherNarrative: synced.teacherNarrative,
            improvementActions: synced.improvementActions,
          }).catch(() => {});
        } else {
          void apiPortalUpsertStudent(token, synced).catch(() => {});
        }
      }
    },
    [portalBackendActive, token, user?.role]
  );

  const importCsv = useCallback(
    async (csvText: string) => {
      try {
        const rows = parseStudentsCsv(csvText).filter(r => r.data.name?.trim());
        if (rows.length === 0) {
          return { ok: false as const, error: 'No valid rows (need a name column).' };
        }

        if (portalBackendActive && token) {
          const batch = rows.map((row, i) => recordFromParsed(row, i));
          await apiPortalBatchUpsert(token, batch);
          await reloadFromBackend();
          return { ok: true as const, count: rows.length };
        }

        setRecords(prev => {
          const next = [...prev];
          rows.forEach((row, i) => {
            const rec = recordFromParsed(row, i);
            const idx = next.findIndex(
              x => x.rollNumber === rec.rollNumber || x.data.name === rec.data.name
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
    },
    [portalBackendActive, reloadFromBackend, token]
  );

  const upsertPredictions = useCallback(
    async (predictions: PredictionResult[]) => {
      if (predictions.length === 0) return 0;

      if (portalBackendActive && token) {
        const toSave = predictions.map((prediction, i) => {
          const rec = recordFromPrediction(prediction, i);
          const existing = records.find(
            r =>
              r.rollNumber === rec.rollNumber ||
              r.data.name.trim().toLowerCase() === rec.data.name.trim().toLowerCase()
          );
          return existing ? { ...rec, id: existing.id, rollNumber: existing.rollNumber } : rec;
        });
        await apiPortalBatchUpsert(token, toSave);
        await reloadFromBackend();
        return predictions.length;
      }

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
    },
    [portalBackendActive, records, reloadFromBackend, token]
  );

  const resetDemoData = useCallback(async () => {
    if (portalBackendActive && token) {
      try {
        await apiPortalPurgeAll(token);
        await reloadFromBackend();
      } catch {
        /* ignore */
      }
      return;
    }
    setRecords([]);
  }, [portalBackendActive, reloadFromBackend, token]);

  const deleteStudentRecord = useCallback(
    async (id: string) => {
      if (!id) return;
      if (portalBackendActive && token && user?.role === 'TEACHER') {
        try {
          await apiPortalDeleteStudent(token, id);
          await reloadFromBackend();
        } catch {
          /* ignore */
        }
      } else {
        setRecords(prev => prev.filter(r => r.id !== id));
      }
      setSelectedStudentIdState(cur => (cur === id ? null : cur));
    },
    [portalBackendActive, reloadFromBackend, token, user?.role]
  );

  const createStudentRecord = useCallback(
    async (record: StudentRecord) => {
      const idEmpty = () => ({
        ...record,
        id: '',
      });

      if (portalBackendActive && token && user?.role === 'TEACHER') {
        await apiPortalCreateStudent(token, idEmpty());
        await reloadFromBackend();
        return;
      }

      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const pred = predictPerformance({ ...record.data, id: localId });
      setRecords(prev => [
        ...prev,
        {
          ...record,
          id: localId,
          data: pred.student,
          prediction: { ...pred, timestamp: new Date() },
          cgpaHistory: buildCgpaHistory(pred.predictedCGPA),
        },
      ]);
    },
    [portalBackendActive, reloadFromBackend, token, user?.role]
  );

  const value = useMemo<EduPortalContextValue>(
    () => ({
      portalBackendActive,
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
      reloadFromBackend,
      createStudentRecord,
      deleteStudentRecord,
    }),
    [
      addImprovement,
      createStudentRecord,
      deleteStudentRecord,
      getRecord,
      importCsv,
      portalBackendActive,
      records,
      reloadFromBackend,
      removeImprovement,
      resetDemoData,
      role,
      selectedStudentId,
      setRole,
      setSelectedStudentId,
      updateRecord,
      upsertPredictions,
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
