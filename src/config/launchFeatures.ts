const enabled = (value: string | boolean | undefined, fallback: boolean) => {
  if (value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return value.toLowerCase() === 'true';
};

export const launchFeatures = {
  campus: enabled(import.meta.env.VITE_ENABLE_CAMPUS, false),
  marketplace: enabled(import.meta.env.VITE_ENABLE_MARKETPLACE, false),
  examRooms: enabled(import.meta.env.VITE_ENABLE_EXAM_ROOMS, false),
  tutoring: enabled(import.meta.env.VITE_ENABLE_TUTORING, false),
  community: enabled(import.meta.env.VITE_ENABLE_COMMUNITY, false),
  listenAndLearn: enabled(import.meta.env.VITE_ENABLE_LISTEN_AND_LEARN, true),
  talkAndLearn: enabled(import.meta.env.VITE_ENABLE_TALK_AND_LEARN, true),
  notebook: enabled(import.meta.env.VITE_ENABLE_NOTEBOOK, true),
  teacherClasses: enabled(import.meta.env.VITE_ENABLE_TEACHER_CLASSES, true),
  // Soma Paper Studio & Assessment Engine Flags
  paperStudioEnabled: enabled(import.meta.env.VITE_ENABLE_PAPER_STUDIO, true),
  uploadBlueprintEnabled: enabled(import.meta.env.VITE_ENABLE_UPLOAD_BLUEPRINT, true),
  schoolWorkspaceEnabled: enabled(import.meta.env.VITE_ENABLE_SCHOOL_WORKSPACE, false),
  sellerEarningsEnabled: enabled(import.meta.env.VITE_ENABLE_SELLER_EARNINGS, false),
  docxExportEnabled: enabled(import.meta.env.VITE_ENABLE_DOCX_EXPORT, true),
} as const;