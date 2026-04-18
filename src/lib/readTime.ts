const WORDS_PER_MINUTE = 250;

export function readTimeMinutes(markdownBody: string): number {
  const words = markdownBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
