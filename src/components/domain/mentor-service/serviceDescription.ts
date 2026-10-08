/**
 * @file serviceDescription.ts
 * @description Converts between a mentor service's free-text `description` and its display
 * parts (intro, numbered items, outcome, audience).
 * The API stores one string, so the service form composes the parts into the format
 * that `parseServiceDescription` reads back. Parsing never drops content.
 */

// TODO(api): store audience and checklist items as separate service fields instead of text.

export interface ParsedServiceDescription {
  intro: string;
  items: string[];
  outcome: string | null;
  audience: string[];
}

export interface ServiceDescriptionParts {
  intro: string;
  items: string[];
  audience: string[];
  /** Outcome sentence kept inside the description (older services wrote it there). */
  outcome?: string;
}

const AUDIENCE_LABEL = 'Phù hợp cho';
const AUDIENCE_MARKER = /Phù hợp cho\s*:/i;
// "Sau buổi" must open a sentence so phrases like "gặp lại sau buổi học" are not split off.
const OUTCOME_MARKER = /(?:^|[.;:!?]\s+|\n\s*)(Sau buổi\b)/;
const ITEM_MARKER = /(?:^|\s)(\d+)\.\s+/g;

function trimPunctuation(value: string) {
  return value
    .trim()
    .replace(/[\s.;,:]+$/, '')
    .trim();
}

export function parseServiceDescription(text: string): ParsedServiceDescription {
  const fallback: ParsedServiceDescription = {
    intro: text ?? '',
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
  const items =
    markers.length >= 2
      ? markers
          .map((marker, index) =>
            trimPunctuation(body.slice(marker.end, markers[index + 1]?.start)),
          )
          .filter(Boolean)
      : [];

  if (items.length < 2) {
    if (!audience.length && !outcome) return fallback;
    return { intro: body.trim(), items: [], outcome, audience };
  }

  const intro = trimPunctuation(body.slice(0, markers[0].start));
  return { intro, items, outcome, audience };
}

/** Builds the description string that `parseServiceDescription` reads back into the same parts. */
export function composeServiceDescription({
  intro,
  items,
  audience,
  outcome,
}: ServiceDescriptionParts) {
  const cleanItems = items.map(trimPunctuation).filter(Boolean);
  const cleanAudience = audience.map(trimPunctuation).filter(Boolean);
  const lines: string[] = [];
  const introText = intro.trim();

  if (cleanItems.length >= 2) {
    if (introText) lines.push(`${trimPunctuation(introText)}:`);
    cleanItems.forEach((item, index) => lines.push(`${index + 1}. ${item}.`));
  } else {
    if (introText) lines.push(introText);
    if (cleanItems[0]) lines.push(`${cleanItems[0]}.`);
  }
  const outcomeText = trimPunctuation(outcome ?? '');
  if (outcomeText) {
    lines.push(
      /^Sau buổi/.test(outcomeText) ? `${outcomeText}.` : `Sau buổi tư vấn, ${outcomeText}.`,
    );
  }
  if (cleanAudience.length) lines.push(`${AUDIENCE_LABEL}: ${cleanAudience.join(', ')}.`);

  return lines.join('\n');
}

/** Splits "Sau buổi review, bạn nhận…" into a bold lead ("Sau buổi review") and the rest. */
export function splitOutcome(outcome: string): { lead: string; rest: string } {
  const withStop = /[.!?]$/.test(outcome) ? outcome : `${outcome}.`;
  const match = /^(Sau buổi[^,:]{0,40})[,:]\s*([\s\S]+)$/i.exec(withStop);
  if (!match) return { lead: '', rest: withStop };
  return { lead: match[1].trim(), rest: match[2].trim() };
}
