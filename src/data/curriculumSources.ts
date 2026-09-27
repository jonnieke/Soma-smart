/** Source links verified against KICD's regular designs pages, not search snippets.
 * Link verification does not mean the document's outcomes have been transcribed/reviewed.
 */
export const curriculumSources = [
  {
    id: 'kicd-regular-grade6-mathematics',
    frameworkId: 'fw_kicd_cbc', grade: 'Grade 6', subject: 'Mathematics',
    title: 'Grade 6 Mathematics - Revised',
    sourcePage: 'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-six-designs/',
    documentUrl: 'https://drive.google.com/file/d/1ki1N1YnslIpZomG-0IoYogkzek7CKx0j/view',
    edition: 'Revised 2024 (publication page verified)',
    pageCount: 57, permissionStatus: 'permission_required_for_full_ingestion',
    verifiedOn: '2026-09-27', mappingStatus: 'awaiting_review',
  },
  {
    id: 'kicd-regular-grade9-mathematics',
    frameworkId: 'fw_kicd_cbc', grade: 'Grade 9', subject: 'Mathematics',
    title: 'Mathematics Grade 9 - July 2024 - Revised',
    sourcePage: 'https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-nine-designs/',
    documentUrl: 'https://drive.google.com/file/d/1HgntYl8nS1zydy8k00KrjEt_zJiMqISL/view',
    edition: 'July 2024 revised (document title)',
    pageCount: 69, permissionStatus: 'permission_required_for_full_ingestion',
    verifiedOn: '2026-09-27', mappingStatus: 'awaiting_review',
  },
] as const;
