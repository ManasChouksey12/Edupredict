from pathlib import Path
import re

p = Path(__file__).resolve().parent.parent / "src/context/EduPortalContext.tsx"
t = p.read_text(encoding="utf-8")

t = t.replace(
    """import { parseStudentsCsv, type ParsedCsvRow } from '../utils/parseStudentsCsv';
import { authHeader, useAuth } from './AuthContext';
import { normalizePortalRecord, toApiStudentPayload } from '../utils/portalApi';""",
    """import { parseStudentsCsv, type ParsedCsvRow } from '../utils/parseStudentsCsv';
import {
  apiPortalBatchUpsert,
  apiPortalListStudents,
  apiPortalPurgeAll,
  apiPortalUpsertStudent,
} from '../utils/api';
import { useAuth } from './AuthContext';
import { normalizePortalRecord } from '../utils/portalApi';""",
)

blk = r"async function fetchPortalStudents\(token: string\)[\s\S]*?async function persistDelete\(token: string, id: string\): Promise<void> \{\s*const r = await fetch\([\s\S]*?\);\s*if \(!r\.ok && r\.status !== 404\) throw new Error\('Could not delete record'\);\s*\}\s*\n"
t_new, n = re.subn(blk, "", t, count=1)
if n != 1:
    raise SystemExit(f"expected to remove helper block once, removed {n}")
t = t_new

t = t.replace(
    "const loaded = await fetchPortalStudents(token);",
    "const loaded = await apiPortalListStudents(token);",
)

t = re.sub(r"\bpersistPut\(token", "apiPortalUpsertStudent(token", t)

# Backend CSV: merge rows into current roster, then batch save
csv_backend = """        if (portalBackendActive && token) {
          let nextList = [...records];
          rows.forEach((row, i) => {
            const rec = recordFromParsed(row, i);
            const idx = nextList.findIndex(
              x => x.rollNumber === rec.rollNumber || x.data.name === rec.data.name
            );
            if (idx >= 0) nextList[idx] = { ...rec, id: nextList[idx].id };
            else nextList.push(rec);
          });
          const saved = await apiPortalBatchUpsert(token, nextList);
          setRecords(saved);
          return { ok: true as const, count: rows.length };
        }"""

t = re.sub(
    r"        if \(portalBackendActive && token\) \{\s*for \(let i = 0; i < rows\.length; i\+\+\) \{[\s\S]*?reloadFromBackend\(\);\s*return \{ ok: true as const, count: rows\.length \};\s*\}",
    csv_backend,
    t,
    count=1,
)

predict_backend = """      if (portalBackendActive && token) {
        const toSave: StudentRecord[] = [];
        for (let i = 0; i < predictions.length; i++) {
          const rec = recordFromPrediction(predictions[i], i);
          const existing = records.find(
            r =>
              r.rollNumber === rec.rollNumber ||
              r.data.name.trim().toLowerCase() === rec.data.name.trim().toLowerCase()
          );
          if (existing) {
            toSave.push({ ...rec, id: existing.id, rollNumber: existing.rollNumber });
          } else {
            toSave.push(rec);
          }
        }
        const saved = await apiPortalBatchUpsert(token, toSave);
        setRecords(saved);
        return predictions.length;
      }"""

t = re.sub(
    r"      if \(portalBackendActive && token\) \{[\s\S]*?await reloadFromBackend\(\);\s*return count;\s*\}",
    predict_backend,
    t,
    count=1,
)

reset_backend = """    if (portalBackendActive && token) {
      try {
        await apiPortalPurgeAll(token);
        await reloadFromBackend();
      } catch {
        /* ignore */
      }
      return;
    }"""

t = re.sub(
    r"    if \(portalBackendActive && token\) \{[\s\S]*?return;\s*\}\s*\n\s*setRecords\(initialRecords\)",
    reset_backend + "\n    setRecords(initialRecords)",
    t,
    count=1,
)

p.write_text(t, encoding="utf-8")
print("patched EduPortalContext.tsx")
