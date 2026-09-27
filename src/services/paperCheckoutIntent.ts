type PaperMode = 'read' | 'revision';
const key = (id: string | number) => `soma.paper-intent.v1.${String(id)}`;
const memory = new Map<string, PaperMode>();

// Navigation preference only: this never grants access or stores payment details.
export function rememberPaperMode(id: string | number, mode: PaperMode) {
  memory.set(String(id), mode);
  try { sessionStorage.setItem(key(id), JSON.stringify({ mode, at: Date.now() })); } catch { /* Private browsing can block storage. */ }
}

export function paperDestination(id: string | number): string {
  let mode = memory.get(String(id)) || 'read';
  try {
    const saved = JSON.parse(sessionStorage.getItem(key(id)) || 'null');
    if (saved && Date.now() - saved.at >= 0 && Date.now() - saved.at < 86400000) {
      mode = saved.mode === 'revision' ? 'revision' : 'read';
    }
  } catch { /* Default to the reader when preferences cannot be restored. */ }
  const encoded = encodeURIComponent(String(id));
  return mode === 'revision' ? `/revision?paper=${encoded}` : `/exam-papers/${encoded}/read`;
}
