const MINOR = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor",
  "on", "at", "to", "by", "in", "of", "up", "as", "vs",
]);

export function toTitleCase(str: string): string {
  return str
    .trim()
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      return i === 0 || !MINOR.has(lower)
        ? lower.charAt(0).toUpperCase() + lower.slice(1)
        : lower;
    })
    .join(" ");
}
