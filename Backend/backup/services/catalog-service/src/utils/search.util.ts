export function sanitizeSearchQuery(query: string | undefined): string | undefined {
  if (!query) return undefined;
  return query
    .trim()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, ' ') 
    .substring(0, 100); 
}
export function extractKeywords(query: string): string[] {
  if (!query) return [];
  return query
    .split(' ')
    .filter(word => word.length > 2) 
    .map(word => word.toLowerCase())
    .slice(0, 10); 
}
export function buildSearchConditions(query: string) {
  const sanitized = sanitizeSearchQuery(query);
  if (!sanitized) return {};
  const keywords = extractKeywords(sanitized);
  return {
    OR: [
      { title: { contains: sanitized, mode: 'insensitive' as const } },
      { abstract: { contains: sanitized, mode: 'insensitive' as const } },
      ...(keywords.length > 0 ? [{ keywords: { hasSome: keywords } }] : []),
    ],
  };
}
export function highlightSearchTerms(text: string, query: string, maxLength: number = 200): string {
  if (!query) return text.substring(0, maxLength);
  const keywords = extractKeywords(query);
  let highlighted = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });
  return highlighted.substring(0, maxLength);
}