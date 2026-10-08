/**
 * @file parseServiceDescription.ts
 * @description Splits a mentor's free-text service description into display parts
 * (intro, numbered items, outcome, audience). Pure helper: never drops content —
 * when the text has no usable numbering it is returned untouched as `intro`.
 */

export interface ParsedServiceDescription {
  intro: string;
  items: string[];
  outcome: string | null;
  audience: string[];
}

const AUDIENCE_MARKER = /Phù hợp cho\s*:/i;
const OUTCOME_MARKER = /(?:^|[\s.;:])(Sau buổi\b)/i;
const ITEM_MARKER = /(?:^|\s)(\d+)\.\s+/g;

function trimPunctuation(value: string) {
  return value
    .trim()
    .replace(/[\s.;,:]+$/, '')
    .trim();
}

export function parseServiceDescription(text: string): ParsedServiceDescription {
  const fallback: ParsedServiceDescription = {
    intro: text,
    items: [],
    outcome: null,
    audience: [],
  };
  if (!text?.trim()) return fallback;

  let body = text;
  let audience: string[] = [];
  const audienceMatch = AUDIENCE_MARKER.exec(body);
  if (audienceMatch) {
    audience = body
      .slice(audienceMatch.index + audienceMatch[0].length)
      .split(/,|\s+hoặc\s+/i)
      .map(trimPunctuation)
      .filter(Boolean);
    body = body.slice(0, audienceMatch.index);
  }

  let outcome: string | null = null;
  const outcomeMatch = OUTCOME_MARKER.exec(body);
  if (outcomeMatch) {
    const start = outcomeMatch.index + outcomeMatch[0].length - outcomeMatch[1].length;
    outcome = trimPunctuation(body.slice(start)) || null;
    body = body.slice(0, start);
  }

  // Only accept a consecutive 1., 2., 3. … sequence so numbers inside sentences
  // (e.g. "top 3. Sau đó") are not mistaken for list markers.
  const markers: { start: number; end: number }[] = [];
  for (const match of body.matchAll(ITEM_MARKER)) {
    if (Number(match[1]) !== markers.length + 1) continue;
    markers.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }
  if (markers.length < 2) return fallback;

  const items = markers
    .map((marker, index) => trimPunctuation(body.slice(marker.end, markers[index + 1]?.start)))
    .filter(Boolean);
  if (items.length < 2) return fallback;

  const intro = trimPunctuation(body.slice(0, markers[0].start));
  return { intro, items, outcome, audience };
}

/** Splits "Sau buổi review, bạn nhận…" into a bold lead ("Sau buổi review") and the rest. */
export function splitOutcome(outcome: string): { lead: string; rest: string } {
  const withStop = /[.!?]$/.test(outcome) ? outcome : `${outcome}.`;
  const match = /^(Sau buổi[^,:]{0,40})[,:]\s*([\s\S]+)$/i.exec(withStop);
  if (!match) return { lead: '', rest: withStop };
  return { lead: match[1].trim(), rest: match[2].trim() };
}
