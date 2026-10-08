const FIRST_NUMBER = 1001;

/** Next id of the form PREFIX-1234: one above the highest existing id with that prefix. */
export function nextId(prefix: string, existing: Iterable<string>): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let highest = FIRST_NUMBER - 1;
  for (const id of existing) {
    const match = pattern.exec(id);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `${prefix}-${highest + 1}`;
}
