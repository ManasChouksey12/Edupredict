/** Instant on-device hints — does not use the API or your free cloud quota. */
export function tryLocalDoubtAnswer(question: string): string | null {
  const q = question.toLowerCase().trim();
  if (!q) return null;

  if (
    q.includes('weight') ||
    q.includes('formula') ||
    (q.includes('how') && q.includes('predict')) ||
    q.includes('calculate')
  ) {
    return `EduPredict uses a fixed weighted mix: attendance 25%, assignment average 20%, each term test (out of 20) 15%, lab (your score ÷ total) 10%, teacher remark (out of 10) 8%, and optional previous SGPA (out of 10) 7%. Those blend into one percentage, then map to CGPA 0–10. Risk also looks at weak areas (e.g. low attendance or low term scores).`;
  }

  if (q.includes('improve') || q.includes('better grade') || q.includes('raise') || q.includes('cgpa')) {
    return `Biggest levers are usually attendance and steady assignment performance (they are heavily weighted). Next, prepare for both term tests and keep lab marks up. Ask your teacher what “teacher remark” reflects so you can target feedback. Small weekly habits beat last-minute cramming.`;
  }

  if (q.includes('risk') || q.includes('at risk')) {
    return `Risk here is a demo flag from your inputs: things like low attendance, weak assignments, or low term scores push risk up, along with a very low predicted CGPA. It is a planning hint, not a school decision. Improving the weakest highlighted factor is the fastest way to move the needle.`;
  }

  if (q.includes('accurate') || q.includes('trust') || q.includes('real')) {
    return `The score is deterministic from what you enter — same inputs give the same CGPA. It is a model for reflection and planning, not an official transcript. Use it to see where effort pays off most, then confirm anything important with your institution.`;
  }

  return null;
}
