export function parseCaseDate(value: string): Date | null {
  if (!value || value === "Chưa xác định") return null;
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
