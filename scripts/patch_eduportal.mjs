import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fp = path.join(__dirname, '..', 'src', 'context', 'EduPortalContext.tsx');
let t = fs.readFileSync(fp, 'utf8');

const newImports = `import { parseStudentsCsv, type ParsedCsvRow } from '../utils/parseStudentsCsv';
import {
  apiPortalBatchUpsert,
  apiPortalListStudents,
  apiPortalPurgeAll,
  apiPortalUpsertStudent,
} from '../utils/api';
import { useAuth } from './AuthContext';
import { normalizePortalRecord } from '../utils/portalApi';`;

t = t.replace(
  `import { parseStudentsCsv, type ParsedCsvRow } from '../utils/parseStudentsCsv';
import { authHeader, useAuth } from './AuthContext';
import { normalizePortalRecord, toApiStudentPayload } from '../utils/portalApi';`,
  newImports
);

const s1 = 'async function fetchPortalStudents(token: string): Promise<StudentRecord[]> {';
const s2 = 'interface EduPortalContextValue';
const i1 = t.indexOf(s1);
const i2 = t.indexOf(s2);
if (i1 === -1 || i2 === -1 || i2 <= i1) throw new Error('marker mismatch');
t = t.slice(0, i1) + t.slice(i2);

t = t.replace(
  'const loaded = await fetchPortalStudents(token);',
  'const loaded = await apiPortalListStudents(token);'
);

t = t.replace(/persistPut\(token/g, 'apiPortalUpsertStudent(token');

const csvBackend = `        if (portalBackendActive && token) {
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
        }`;

t = t.replace(
  / {8}if \(portalBackendActive && token\) \{[^]*?reloadFromBackend\(\);\s*return \{ ok: true as const, count: rows\.length \};[^]*?}\n/,
  csvBackend + '\n'
);

const upsertBackend = `      if (portalBackendActive && token) {
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
      }`;

t = t.replace(
  / {6}if \(portalBackendActive && token\) \{[^]*?await reloadFromBackend\(\);\s*return count;[^]*?}\n/,
  upsertBackend + '\n'
);

const resetBackend = `    if (portalBackendActive && token) {
      try {
        await apiPortalPurgeAll(token);
        await reloadFromBackend();
      } catch {
        /* ignore */
      }
      return;
    }
    setRecords(initialRecords());`;

t = t.replace(
  / {4}if \(portalBackendActive && token\) \{[^]*?\n {4}}\n\s*setRecords\(initialRecords\(\)\);/,
  resetBackend
);

t = t.replace(
  /\[portalBackendActive, reloadFromBackend, token\]/,
  '[portalBackendActive, records, reloadFromBackend, token]'
);

fs.writeFileSync(fp, t);
