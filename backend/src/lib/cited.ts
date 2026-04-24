// Spec section D — cited.md entry builder

export interface CitedSource {
  type: string;
  ref?: string;
  url?: string;
  value?: string;
}

export interface CitedEntryInput {
  action: string;
  sessionId: string;
  reasoning: string;
  sources: CitedSource[];
}

export function buildCitedMdEntry(input: CitedEntryInput): string {
  const ts = new Date().toISOString();
  const sourceLines = input.sources.map((s) => {
    const parts = [s.type];
    if (s.ref) parts.push(`ref=${s.ref}`);
    if (s.url) parts.push(`url=${s.url}`);
    if (s.value) parts.push(`value=${s.value}`);
    return `- ${parts.join(" · ")}`;
  });
  return [
    `## DayZero · ${input.action}`,
    `**Timestamp:** ${ts}`,
    `**Session:** ${input.sessionId}`,
    `**Reasoning:** ${input.reasoning}`,
    "",
    "### Sources",
    ...sourceLines,
  ].join("\n");
}
