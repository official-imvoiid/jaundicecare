/** Fills `{name}` placeholders. A placeholder with no value stays visible so the gap is noticed. */
export function format(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{([a-zA-Z]+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}
