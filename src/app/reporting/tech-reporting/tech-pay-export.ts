import { ExportToCsv } from "export-to-csv-file";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { format } from "date-fns";
import { money, formatDatePaid, toDateInputValue, WorkOrderRow } from "./tech-pay-shared";

if (pdfFonts && (pdfFonts as { pdfMake?: { vfs?: unknown } }).pdfMake?.vfs) {
  (pdfMake as { vfs?: unknown }).vfs = (pdfFonts as { pdfMake: { vfs: unknown } }).pdfMake.vfs;
}

export type TechPayExportRow = {
  name: string;
  type: string;
  workOrderCount: number;
  totalTechPay: number;
};

export type TechPayJobSummary = {
  displayJobId: string;
  jobTitle?: string;
  jobName?: string;
  overallTotalPay?: number;
  payStatusLabel?: string;
};

export type WorkOrderExportMeta = {
  displayJobId: string;
  technicianName?: string;
  technicianType?: string;
  techTotalPay?: number;
  jobTitle?: string;
  jobName?: string;
};

const BRAND = {
  navy: "#1e3e6f",
  thBg: "#eef2f7",
  thText: "#1e293b",
  zebra: "#f8fafc",
  border: "#cbd5e1",
  muted: "#64748b",
  text: "#374151",
  totalBg: "#e2e8f0",
};

const PDF_STYLES = {
  docHeaderTitle: { fontSize: 15, bold: true, color: "#ffffff" },
  docHeaderSub: { fontSize: 9, color: "#e2e8f0", margin: [0, 3, 0, 0] },
  metaLabel: { fontSize: 7, color: BRAND.muted, bold: true, margin: [0, 0, 0, 2] },
  metaValue: { fontSize: 9, bold: true, color: "#111827" },
  th: { bold: true, fillColor: BRAND.thBg, color: BRAND.thText, fontSize: 8, alignment: "left" },
  thRight: { bold: true, fillColor: BRAND.thBg, color: BRAND.thText, fontSize: 8, alignment: "right" },
  td: { fontSize: 8, color: BRAND.text },
  tdRight: { fontSize: 8, color: BRAND.text, alignment: "right" },
  tdAlt: { fontSize: 8, color: BRAND.text, fillColor: BRAND.zebra },
  tdAltRight: { fontSize: 8, color: BRAND.text, fillColor: BRAND.zebra, alignment: "right" },
  totalRow: { bold: true, fillColor: BRAND.totalBg, fontSize: 9, color: "#111827" },
  totalRowRight: {
    bold: true,
    fillColor: BRAND.totalBg,
    fontSize: 9,
    color: "#111827",
    alignment: "right",
  },
  footer: { fontSize: 7, color: BRAND.muted, italics: true, alignment: "center" },
};

const PDF_PAGE_WIDTH = {
  portrait: 595.28,
  landscape: 841.89,
};

function getPdfContentWidth(
  orientation: "portrait" | "landscape",
  margins: [number, number, number, number]
) {
  return PDF_PAGE_WIDTH[orientation] - margins[0] - margins[2];
}

/** Fixed pt widths that sum exactly to the printable page width (pdfmake % widths shrink the table). */
function buildPdfColumnWidths(ratios: number[], contentWidth: number): number[] {
  const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
  const widths = ratios.map((ratio) => Math.floor((ratio / total) * contentWidth));
  const used = widths.reduce((sum, width) => sum + width, 0);
  widths[widths.length - 1] += contentWidth - used;
  return widths;
}

function pdfDataTable(
  body: unknown[][],
  columnRatios: number[],
  contentWidth: number,
  headerRows = 1
) {
  return {
    table: {
      headerRows,
      widths: buildPdfColumnWidths(columnRatios, contentWidth),
      body,
    },
    layout: pdfTableLayout(),
    width: contentWidth,
    margin: [0, 0, 0, 0],
  };
}

function pdfTableLayout() {
  return {
    hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
      i === 0 || i === node.table.body.length ? 0.75 : 0.35,
    vLineWidth: () => 0.35,
    hLineColor: () => BRAND.border,
    vLineColor: () => BRAND.border,
    paddingLeft: () => 7,
    paddingRight: () => 7,
    paddingTop: () => 6,
    paddingBottom: () => 6,
  };
}

function pdfDocHeader(title: string, subtitle: string) {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            fillColor: BRAND.navy,
            margin: [14, 12, 14, 12],
            stack: [
              { text: title, style: "docHeaderTitle" },
              { text: subtitle, style: "docHeaderSub" },
            ],
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 10],
  };
}

function pdfMetaCards(items: { label: string; value: string }[]) {
  const chunkSize = 4;
  const rows: { label: string; value: string }[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    rows.push(items.slice(i, i + chunkSize));
  }

  return rows.map((row) => {
    const cells = row.map((item) => ({
      stack: [
        { text: item.label.toUpperCase(), style: "metaLabel" },
        { text: item.value, style: "metaValue" },
      ],
      margin: [2, 2, 2, 2],
    }));
    while (cells.length < chunkSize) {
      cells.push({ text: "", margin: [2, 2, 2, 2] });
    }
    return {
      table: {
        widths: Array(chunkSize).fill("*"),
        body: [cells],
      },
      layout: pdfTableLayout(),
      margin: [0, 0, 0, 8],
    };
  });
}

function pdfFooter() {
  return {
    text: `Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`,
    style: "footer",
    margin: [0, 14, 0, 0],
  };
}

function tdCell(text: string, alt: boolean, right = false) {
  const style = right
    ? alt
      ? "tdAltRight"
      : "tdRight"
    : alt
      ? "tdAlt"
      : "td";
  return { text, style };
}

function thCell(text: string, right = false) {
  return { text, style: right ? "thRight" : "th" };
}

function csvFilename(slug: string) {
  return {
    filename: slug,
    fieldSeparator: ",",
    quoteStrings: '"',
    showLabels: true,
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true,
  };
}

export function resolveDatePaidText(
  wo: WorkOrderRow,
  dateDrafts?: Record<number, string>
): string {
  const id = wo.vehicleId;
  const draft = id != null ? (dateDrafts?.[id] ?? "").trim() : "";
  const raw = draft || toDateInputValue(wo.paidAt);
  if (raw) {
    try {
      return format(new Date(`${raw}T12:00:00`), "MMM d, yyyy");
    } catch {
      return raw;
    }
  }
  return formatDatePaid(wo.paidAt, wo.generatedInvoiceStatus);
}

export function exportTechPayTotalsCsv(rows: TechPayExportRow[], summary: TechPayJobSummary) {
  const slug = `tech-pay-totals-${summary.displayJobId}`.replace(/[^\w-]+/g, "-");
  const data: Record<string, string | number>[] = rows.map((row) => ({
    Tech: row.name,
    Type: row.type || "—",
    "Work Order(s) Total": row.workOrderCount ?? 0,
    [`Total Tech Pay / JobID: ${summary.displayJobId}`]: money(row.totalTechPay),
  }));

  if (rows.length > 0) {
    data.push({
      Tech: "Job Total",
      Type: "—",
      "Work Order(s) Total": "—",
      [`Total Tech Pay / JobID: ${summary.displayJobId}`]: money(summary.overallTotalPay),
    } as Record<string, string | number>);
  }

  new ExportToCsv(csvFilename(slug)).generateCsv(data);
}

export function downloadTechPayTotalsPdf(rows: TechPayExportRow[], summary: TechPayJobSummary) {
  const slug = `tech-pay-totals-${summary.displayJobId}`.replace(/[^\w-]+/g, "-");
  const jobLabel = summary.jobTitle || summary.jobName || `Job ${summary.displayJobId}`;
  const payCol = `Total Tech Pay / JobID: ${summary.displayJobId}`;

  const body: unknown[][] = [
    [thCell("Tech"), thCell("Type"), thCell("Work Order(s) Total", true), thCell(payCol, true)],
    ...rows.map((row, i) => {
      const alt = i % 2 === 1;
      return [
        tdCell(row.name, alt),
        tdCell(row.type || "—", alt),
        tdCell(String(row.workOrderCount ?? 0), alt, true),
        tdCell(money(row.totalTechPay), alt, true),
      ];
    }),
  ];

  if (rows.length > 0) {
    body.push([
      { text: "Job Total", style: "totalRow", colSpan: 3 },
      {},
      {},
      { text: money(summary.overallTotalPay), style: "totalRowRight" },
    ]);
  }

  pdfMake
    .createPdf({
      pageSize: "A4",
      pageOrientation: "portrait",
      pageMargins: [24, 24, 24, 28],
      content: [
        pdfDocHeader("Tech Pay Totals Per Job", jobLabel),
        ...pdfMetaCards([
          { label: "Job ID", value: summary.displayJobId },
          { label: "Pay Status", value: summary.payStatusLabel || "All" },
          { label: "Technicians", value: String(rows.length) },
          { label: "Job Total Pay", value: money(summary.overallTotalPay) },
        ]),
        {
          table: {
            headerRows: 1,
            widths: ["*", "18%", "16%", "22%"],
            body,
          },
          layout: pdfTableLayout(),
        },
        pdfFooter(),
      ],
      styles: PDF_STYLES,
      defaultStyle: { fontSize: 9 },
    })
    .download(`${slug}.pdf`);
}

export function exportWorkOrdersCsv(
  rows: WorkOrderRow[],
  meta: WorkOrderExportMeta,
  dateDrafts?: Record<number, string>
) {
  const slug = `tech-cars-detail-${meta.displayJobId}`.replace(/[^\w-]+/g, "-");
  const data = rows.map((wo) => ({
    "Dent Tech": wo.technicianName || meta.technicianName || "—",
    Customer: wo.customerName || "—",
    VIN: wo.vin || "—",
    "Model Year": wo.modelYear ?? "—",
    Make: wo.make || "—",
    Model: wo.model || "—",
    "Stock Number": wo.stockNumber?.trim() ? wo.stockNumber : "—",
    Color: wo.color?.trim() ? wo.color : "—",
    "Tech Pay Amount": money(wo.techPayAmount),
    "Invoice Status": wo.generatedInvoiceStatus ? "Paid" : "Unpaid",
    "Date Paid": resolveDatePaidText(wo, dateDrafts),
  }));

  new ExportToCsv(csvFilename(slug)).generateCsv(data);
}

export function downloadWorkOrdersPdf(
  rows: WorkOrderRow[],
  meta: WorkOrderExportMeta,
  dateDrafts?: Record<number, string>
) {
  const slug = `tech-cars-detail-${meta.displayJobId}`.replace(/[^\w-]+/g, "-");
  const jobLabel = meta.jobTitle || meta.jobName || "—";
  const techLabel = meta.technicianName || "—";

  const body: unknown[][] = [
    [
      thCell("Dent Tech"),
      thCell("Customer"),
      thCell("VIN"),
      thCell("Year"),
      thCell("Make"),
      thCell("Model"),
      thCell("Stock"),
      thCell("Color"),
      thCell("Tech Pay", true),
      thCell("Invoice Status"),
      thCell("Date Paid"),
    ],
    ...rows.map((wo, i) => {
      const alt = i % 2 === 1;
      return [
        tdCell(wo.technicianName || meta.technicianName || "—", alt),
        tdCell(wo.customerName || "—", alt),
        tdCell(wo.vin || "—", alt),
        tdCell(String(wo.modelYear ?? "—"), alt),
        tdCell(wo.make || "—", alt),
        tdCell(wo.model || "—", alt),
        tdCell(wo.stockNumber?.trim() ? wo.stockNumber : "—", alt),
        tdCell(wo.color?.trim() ? wo.color : "—", alt),
        tdCell(money(wo.techPayAmount), alt, true),
        tdCell(wo.generatedInvoiceStatus ? "Paid" : "Unpaid", alt),
        tdCell(resolveDatePaidText(wo, dateDrafts), alt),
      ];
    }),
  ];

  pdfMake
    .createPdf({
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [18, 18, 18, 22],
      content: [
        pdfDocHeader("Tech Cars Detail Per JobID", jobLabel),
        ...pdfMetaCards([
          { label: "Job ID", value: meta.displayJobId },
          { label: meta.technicianType || "Technician", value: techLabel },
          { label: "Tech Total", value: money(meta.techTotalPay) },
          { label: "Vehicles", value: String(rows.length) },
        ]),
        {
          table: {
            headerRows: 1,
            widths: ["15%", "11%", "18%", "6%", "8%", "8%", "8%", "7%", "9%", "9%", "10%"],
            body,
          },
          layout: pdfTableLayout(),
        },
        pdfFooter(),
      ],
      styles: PDF_STYLES,
      defaultStyle: { fontSize: 8 },
    })
    .download(`${slug}.pdf`);
}
