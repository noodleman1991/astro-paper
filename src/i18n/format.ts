/** Tiny "{name}" template substitution for dictionary strings. */
export function fmt(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(params[key] ?? "")
  );
}
