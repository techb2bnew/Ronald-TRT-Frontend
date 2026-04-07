type CsvOptions = {
  filename?: string;
  fieldSeparator?: string;
  quoteStrings?: string;
  decimalSeparator?: string;
  showLabels?: boolean;
  showTitle?: boolean;
  title?: string;
  useTextFile?: boolean;
  useBom?: boolean;
  useKeysAsHeaders?: boolean;
};

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeCsv(value: string, quote: string): string {
  const escaped = value.replaceAll(quote, `${quote}${quote}`);
  return `${quote}${escaped}${quote}`;
}

export class ExportToCsv {
  private options: Required<CsvOptions>;

  constructor(options: CsvOptions = {}) {
    this.options = {
      filename: options.filename ?? "export",
      fieldSeparator: options.fieldSeparator ?? ",",
      quoteStrings: options.quoteStrings ?? "\"",
      decimalSeparator: options.decimalSeparator ?? ".",
      showLabels: options.showLabels ?? true,
      showTitle: options.showTitle ?? false,
      title: options.title ?? "",
      useTextFile: options.useTextFile ?? false,
      useBom: options.useBom ?? true,
      useKeysAsHeaders: options.useKeysAsHeaders ?? true,
    };
  }

  public generateCsv(data: Record<string, unknown>[]): void {
    if (!Array.isArray(data) || data.length === 0) return;
    const firstRow = data[0] ?? {};
    const headers = this.options.useKeysAsHeaders
      ? Object.keys(firstRow)
      : Object.keys(firstRow);

    const lines: string[] = [];

    if (this.options.showTitle && this.options.title) {
      lines.push(escapeCsv(this.options.title, this.options.quoteStrings));
      lines.push("");
    }

    if (this.options.showLabels) {
      lines.push(
        headers.map((h) => escapeCsv(normalizeValue(h), this.options.quoteStrings)).join(this.options.fieldSeparator),
      );
    }

    for (const row of data) {
      const values = headers.map((header) => {
        const raw = normalizeValue(row?.[header]);
        return escapeCsv(raw, this.options.quoteStrings);
      });
      lines.push(values.join(this.options.fieldSeparator));
    }

    const csv = lines.join("\n");
    const bom = this.options.useBom ? "\uFEFF" : "";
    const mime = this.options.useTextFile ? "text/plain;charset=utf-8;" : "text/csv;charset=utf-8;";
    const blob = new Blob([bom + csv], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${this.options.filename}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
