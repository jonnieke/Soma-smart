/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_CAMPUS?: string;
  readonly VITE_ENABLE_MARKETPLACE?: string;
  readonly VITE_ENABLE_EXAM_ROOMS?: string;
  readonly VITE_ENABLE_TUTORING?: string;
  readonly VITE_ENABLE_COMMUNITY?: string;
  readonly VITE_ENABLE_LISTEN_AND_LEARN?: string;
  readonly VITE_ENABLE_TALK_AND_LEARN?: string;
  readonly VITE_ENABLE_NOTEBOOK?: string;
  readonly VITE_ENABLE_TEACHER_CLASSES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}