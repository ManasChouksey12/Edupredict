/** Builds 5-point mock semester CGPA trend ending at `currentCgpa` (for charts only). */
export function buildCgpaHistory(currentCgpa: number): number[] {
  const t = Math.max(0, Math.min(10, currentCgpa));
  const start = Math.max(4, Math.min(t - 1.15, t - 0.35));
  const n = 5;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = n <= 1 ? 1 : i / (n - 1);
    const v = start + (t - start) * p;
    out.push(Number(Math.min(10, Math.max(0, v)).toFixed(2)));
  }
  return out;
}

export const DEFAULT_SEMESTERS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
