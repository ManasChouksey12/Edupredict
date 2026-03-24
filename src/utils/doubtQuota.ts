const STORAGE_KEY = 'edupredict_doubt_cloud_used_v1';
export const DOUBT_FREE_CLOUD_LIMIT = 3;

export function getCloudDoubtUses(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function incrementCloudDoubtUses(): number {
  const next = getCloudDoubtUses() + 1;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function cloudDoubtsRemaining(): number {
  return Math.max(0, DOUBT_FREE_CLOUD_LIMIT - getCloudDoubtUses());
}
