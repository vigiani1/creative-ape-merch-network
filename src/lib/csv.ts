export function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function csvRow(values: Array<string | number | null | undefined>) {
  return values.map(csvCell).join(",");
}
