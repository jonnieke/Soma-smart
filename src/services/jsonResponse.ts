const stripCodeFences = (text: string): string => {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] || trimmed).trim();
};

const trimToBalancedJson = (text: string): string => {
  const cleaned = stripCodeFences(text);

  const objectStart = cleaned.indexOf('{');
  const objectEnd = cleaned.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1).trim();
  }

  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1).trim();
  }

  return cleaned;
};

const normalizeJsonSyntax = (text: string): string =>
  text
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u001F]+/g, (match) => match.replace(/[\r\n\t]/g, ' '));

export const parseModelJson = <T>(rawText: string): T => {
  const candidates = [
    rawText,
    stripCodeFences(rawText),
    trimToBalancedJson(rawText),
    normalizeJsonSyntax(trimToBalancedJson(rawText))
  ];

  const seen = new Set<string>();
  const attempts = candidates
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0 && !seen.has(candidate) && seen.add(candidate));

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`AI returned invalid JSON: ${rawText.slice(0, 240)}`);
};

