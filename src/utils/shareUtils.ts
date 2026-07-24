/**
 * Helper utility for sharing educational materials via WhatsApp and Telegram
 */

export const formatMarkdownForSocial = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    // Convert headers to bold uppercase
    .replace(/^###?\s+(.*)$/gm, '\n* $1 *\n')
    .replace(/^##?\s+(.*)$/gm, '\n* $1 *\n')
    .replace(/^#\s+(.*)$/gm, '\n* $1 *\n')
    // Keep bolding intact
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    // Clean code fences
    .replace(/```[a-z]*\n?/gi, '')
    .trim();
};

export const shareToWhatsApp = (title: string, content: string) => {
  const formattedContent = formatMarkdownForSocial(content);
  const text = `*📚 ${title.trim()}*\n\n${formattedContent}\n\n---\n*Shared via Somo Smart Teacher Studio*\nhttps://www.somaai.co.ke`;
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

export const shareToTelegram = (title: string, content: string) => {
  const formattedContent = formatMarkdownForSocial(content);
  const text = `*📚 ${title.trim()}*\n\n${formattedContent}\n\n---\n*Shared via Somo Smart Teacher Studio*`;
  const url = `https://t.me/share/url?url=${encodeURIComponent('https://www.somaai.co.ke')}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};
