/**
 * @file serviceDescription.ts
 * @description The API only stores `title`, `description` and `expectedOutcome`, so the intro,
 * session items and audience are kept inside `description` using ONE fixed format:
 *
 *   "{intro}\n\n1. {item1}\n2. {item2}\n...\n\nPhù hợp cho: {a}, {b}, {c}"
 *
 * The outcome lives only in `expectedOutcome`; it is never written into `description` again.
 * Parsing also reads older descriptions (inline "1. … 2. …" lists and a "Sau buổi …" outcome
 * sentence) and never drops content.
 */

// TODO(api): store audience and checklist items as separate service fields instead of text.

export interface ServiceDescriptionParts {
  intro: string;
  items: string[];
  audience: string[];
}

export interface ParsedServiceDescription extends ServiceDescriptionParts {
  /** A "Sau buổi …" sentence found in old free-text descriptions (pre-structured data). */
  legacyOutcome: string | null;
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

const singleLine = (value: string) => value.replace(/\s*\n\s*/g, ' ').trim();

/** Finds a consecutive 1., 2., 3. … sequence (numbers inside sentences are ignored). */
function findItemMarkers(body: string) {
  const markers: { start: number; end: number }[] = [];
  for (const match of body.matchAll(ITEM_MARKER)) {
    if (Number(match[1]) !== markers.length + 1) continue;
    markers.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }
  return markers;
}

export function parseServiceDescription(text: string | null | undefined): ParsedServiceDescription {
  const source = (text ?? '').replace(/\r\n?/g, '\n').trim();
  const fallback: ParsedServiceDescription = {
    intro: source,
    items: [],
    audience: [],
    legacyOutcome: null,
  };
  if (!source) return fallback;

  let body = source;
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

  const markers = findItemMarkers(body);
  if (markers.length < 2) return fallback;

  // Old descriptions put the outcome sentence after the list; only look there so a
  // "Sau buổi …" sentence in the intro can never swallow the items.
  let legacyOutcome: string | null = null;
  const lastMarker = markers[markers.length - 1];
  const tail = body.slice(lastMarker.end);
  const outcomeMatch = OUTCOME_MARKER.exec(tail);
  if (outcomeMatch) {
    const start =
      lastMarker.end + outcomeMatch.index + outcomeMatch[0].length - outcomeMatch[1].length;
    legacyOutcome = trimPunctuation(body.slice(start)) || null;
    body = body.slice(0, start);
  }

  const items = markers
    .map((marker, index) => trimPunctuation(body.slice(marker.end, markers[index + 1]?.start)))
    .filter(Boolean);
  if (items.length < 2) return fallback;

  return {
    intro: body.slice(0, markers[0].start).trim().replace(/\s*:$/, ''),
    items,
    audience,
    legacyOutcome,
  };
}

/** Builds the stored `description`. Omits the audience line when there is none. */
export function serializeServiceDescription({
  intro,
  items,
  audience,
}: ServiceDescriptionParts): string {
  const cleanItems = items.map(singleLine).filter(Boolean);
  const cleanAudience = audience.map(singleLine).filter(Boolean);
  return [
    singleLine(intro),
    cleanItems.map((item, index) => `${index + 1}. ${item}`).join('\n'),
    cleanAudience.length ? `${AUDIENCE_LABEL}: ${cleanAudience.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}
