import type { ExplanationResult } from '../types';

// Library display IDs (v-123) are not document IDs accepted by retrieval.
export function studyDocumentId(material: { id?: unknown; realId?: unknown }): string {
  const id = String(material.realId ?? material.id ?? '').trim();
  if (!/^[1-9]\d*$/.test(id))
    throw new Error(
      'This material does not have an indexed source document. Please read the source document instead.'
    );
  return id;
}

export function validateStudyGuide(result: ExplanationResult): ExplanationResult {
  // Reuse actual generated takeaways if cleanup removed a metadata-only overview.
  // Never substitute a generic template for missing lesson content.
  const explanation = typeof result?.explanation === 'string' && result.explanation.trim()
    ? result.explanation.trim()
    : result?.summaryPoints?.filter(point => typeof point === 'string' && point.trim()).join('\n\n') || '';
  if (!explanation) {
    throw new Error(
      'The study guide returned an empty introduction. Please try again or read the source document.'
    );
  }
  const subtopics = result.subtopics?.filter((section) =>
    section.blocks?.some(
      (block) =>
        (block.type === 'paragraph' && typeof block.text === 'string' && block.text.trim()) ||
        (block.type === 'list' &&
          block.items?.some((item) => typeof item === 'string' && item.trim()))
    )
  );
  if (!subtopics?.length)
    throw new Error(
      'The study guide returned no readable lesson sections. Please try again or read the source document.'
    );
  return { ...result, explanation, subtopics };
}
