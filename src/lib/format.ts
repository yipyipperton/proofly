import { CATEGORY_LABELS, type AnalysisResult } from "./schema";

export function formatFindings(r: AnalysisResult): string {
  const lines: string[] = [];
  lines.push("Proofly scam check (advisory only, not a guarantee)");
  lines.push(`Category: ${CATEGORY_LABELS[r.category]}`);
  lines.push(`Risk: ${r.riskLevel.toUpperCase()} (${r.score}/100)`);
  lines.push("", "Summary:", r.summary);
  if (r.concerns.length) {
    lines.push("", "Key concerns:");
    r.concerns.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.title}`);
      lines.push(`   ${c.explanation}`);
      c.evidence.forEach((e) => lines.push(`   Evidence: "${e}"`));
    });
  }
  if (r.urls.length) {
    lines.push("", "Links found (not visited):");
    r.urls.forEach((u) => lines.push(`- ${u.raw.replace(/\./g, "[.]")}${u.issues.length ? ` (${u.issues.join("; ")})` : ""}`));
  }
  lines.push("", "Recommended verification steps:");
  r.verificationSteps.forEach((s) => lines.push(`- ${s}`));
  lines.push("", "Limitations:");
  r.limitations.forEach((s) => lines.push(`- ${s}`));
  return lines.join("\n");
}
