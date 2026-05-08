import type {
  SerializedStudentRecord,
  StudentRecord,
} from '../types/portal';

export function normalizePortalRecord(raw: SerializedStudentRecord): StudentRecord {
  return {
    ...raw,
    prediction: {
      ...raw.prediction,
      timestamp: new Date(raw.prediction.timestamp as unknown as string),
    },
  };
}

/** Body for Spring `@RequestBody StudentRecordDto` — timestamp as ISO string. */
export function toApiStudentPayload(r: StudentRecord): SerializedStudentRecord {
  const ts =
    typeof r.prediction.timestamp === 'string'
      ? r.prediction.timestamp
      : r.prediction.timestamp.toISOString();
  return {
    ...r,
    prediction: {
      ...r.prediction,
      timestamp: ts,
    },
  } as SerializedStudentRecord;
}
