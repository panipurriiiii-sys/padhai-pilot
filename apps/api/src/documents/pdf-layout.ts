import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import type { InstituteLetterhead } from '@padhai-pilot/shared';

/**
 * One shared A4 layout for every institute document (report card, fee receipt, salary slip, attendance
 * report, result sheet). Output is identical for web and mobile because it is rendered once, server side.
 * The header and footer come ONLY from the institute letterhead: no platform branding is ever printed.
 */
export interface TableColumn {
  header: string;
  /** Relative width weight. */
  width: number;
  align?: 'left' | 'right' | 'center';
}
export interface DocTable {
  columns: TableColumn[];
  rows: string[][];
  /** Rows rendered bold under the table, e.g. [['Total', '1,200.00']] aligned to the last two columns. */
  totals?: Array<[string, string]>;
}
export interface DocSection {
  heading?: string;
  paragraph?: string;
  table?: DocTable;
  /** Compact label/value list. */
  keyValues?: Array<[string, string]>;
}
export interface DocSpec {
  title: string;
  docNumber?: string;
  /** Shown in a two-column grid under the title. */
  meta: Array<[string, string]>;
  sections: DocSection[];
  /** Print a signature block (institute signatory). Default true. */
  signature?: boolean;
  /** Small italic note above the footer (e.g. "This is a computer generated receipt."). */
  note?: string;
  generatedOn?: string;
}

const A4: [number, number] = [595.28, 841.89];
const M = 40;
const INK = rgb(0.1, 0.12, 0.16);
const MUTED = rgb(0.38, 0.42, 0.48);
const RULE = rgb(0.82, 0.85, 0.89);
const HEAD_BG = rgb(0.94, 0.95, 0.97);

const WIN_ANSI_EXTRA = new Set(['–', '—', '‘', '’', '“', '”', '•', '…', '€']);

/** Standard PDF fonts only cover WinAnsi: map the rupee sign and replace anything else unsupported. */
export function sanitizePdfText(input: string): string {
  let out = '';
  for (const ch of String(input ?? '').replace(/₹/g, 'Rs. ').replace(/[\r\t]+/g, ' ')) {
    const c = ch.codePointAt(0) ?? 0;
    if (ch === '\n' || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || WIN_ANSI_EXTRA.has(ch)) out += ch;
    else out += '?';
  }
  return out;
}

export function hexToRgb(hex: string | undefined, fallback = rgb(0.09, 0.28, 0.55)) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  const col = rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  // Keep the accent dark enough to stay legible on white paper.
  const lum = 0.2126 * col.red + 0.7152 * col.green + 0.0722 * col.blue;
  return lum > 0.6 ? fallback : col;
}

export async function loadLogo(pdf: PDFDocument, bytes: Uint8Array | undefined): Promise<PDFImage | undefined> {
  if (!bytes || bytes.length === 0) return undefined;
  try {
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
    if (isPng) return await pdf.embedPng(bytes);
    if (isJpg) return await pdf.embedJpg(bytes);
  } catch {
    /* a bad logo never blocks a document */
  }
  return undefined;
}

export interface RenderedPdf {
  bytes: Uint8Array;
  pageCount: number;
}

export async function renderDocument(spec: DocSpec, brand: InstituteLetterhead, logoBytes?: Uint8Array): Promise<RenderedPdf> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const logo = await loadLogo(pdf, logoBytes);
  const accent = hexToRgb(brand.primaryColor);
  const instName = sanitizePdfText(brand.name || 'Institute');
  pdf.setTitle(sanitizePdfText(`${spec.title}${spec.docNumber ? ` ${spec.docNumber}` : ''}`));
  pdf.setAuthor(instName);
  pdf.setCreator(instName);
  pdf.setProducer(instName);

  const contentW = A4[0] - M * 2;
  const FOOTER_H = 46;
  let page: PDFPage;
  let y = 0;

  const wrap = (text: string, font: PDFFont, size: number, maxW: number): string[] => {
    const lines: string[] = [];
    for (const para of sanitizePdfText(text).split('\n')) {
      const words = para.split(/\s+/).filter(Boolean);
      let line = '';
      for (const w of words) {
        const trial = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(trial, size) <= maxW) line = trial;
        else {
          if (line) lines.push(line);
          // hard-break very long tokens
          let rest = w;
          while (font.widthOfTextAtSize(rest, size) > maxW && rest.length > 1) {
            let cut = rest.length - 1;
            while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxW) cut--;
            lines.push(rest.slice(0, cut));
            rest = rest.slice(cut);
          }
          line = rest;
        }
      }
      lines.push(line);
    }
    return lines;
  };

  const drawHeader = (first: boolean) => {
    y = A4[1] - M;
    let textX = M;
    const logoBox = 52;
    if (logo) {
      const scale = Math.min(logoBox / logo.width, logoBox / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      page.drawImage(logo, { x: M, y: y - h, width: w, height: h });
      textX = M + logoBox + 12;
    }
    const nameSize = first ? 17 : 12;
    page.drawText(instName, { x: textX, y: y - nameSize, size: nameSize, font: bold, color: accent });
    let ty = y - nameSize - 5;
    if (first) {
      const contact = [brand.contactPhone, brand.contactEmail, brand.website].filter(Boolean).join('   |   ');
      const lines = [
        ...wrap(brand.address ?? '', regular, 8.5, A4[0] - M - textX).filter(Boolean),
        ...(contact ? wrap(contact, regular, 8.5, A4[0] - M - textX) : []),
      ];
      for (const l of lines.slice(0, 4)) {
        page.drawText(l, { x: textX, y: ty - 8, size: 8.5, font: regular, color: MUTED });
        ty -= 11;
      }
    }
    const bottom = Math.min(ty, y - (logo ? logoBox : 0)) - 6;
    page.drawLine({ start: { x: M, y: bottom }, end: { x: A4[0] - M, y: bottom }, thickness: 1.6, color: accent });
    y = bottom - 16;
  };

  const newPage = () => {
    page = pdf.addPage(A4);
    drawHeader(pdf.getPageCount() === 1);
  };
  const ensure = (h: number) => {
    if (y - h < M + FOOTER_H) newPage();
  };
  newPage();

  // Title + document number
  page!.drawText(sanitizePdfText(spec.title.toUpperCase()), { x: M, y: y - 12, size: 13, font: bold, color: INK });
  if (spec.docNumber) {
    const t = sanitizePdfText(`No. ${spec.docNumber}`);
    page!.drawText(t, { x: A4[0] - M - bold.widthOfTextAtSize(t, 10), y: y - 11, size: 10, font: bold, color: INK });
  }
  y -= 28;

  // Meta grid (2 columns)
  if (spec.meta.length) {
    const colW = contentW / 2;
    for (let i = 0; i < spec.meta.length; i += 2) {
      ensure(18);
      for (let j = 0; j < 2 && i + j < spec.meta.length; j++) {
        const [k, v] = spec.meta[i + j];
        const x = M + j * colW;
        page!.drawText(sanitizePdfText(`${k}:`), { x, y: y - 9, size: 8.5, font: regular, color: MUTED });
        const valLines = wrap(v || '-', bold, 9.5, colW - 96);
        page!.drawText(valLines[0] ?? '-', { x: x + 88, y: y - 9, size: 9.5, font: bold, color: INK });
      }
      y -= 16;
    }
    y -= 6;
  }

  for (const sec of spec.sections) {
    if (sec.heading) {
      ensure(40);
      page!.drawText(sanitizePdfText(sec.heading), { x: M, y: y - 10, size: 10.5, font: bold, color: accent });
      y -= 18;
    }
    if (sec.paragraph) {
      for (const l of wrap(sec.paragraph, regular, 9.5, contentW)) {
        ensure(14);
        page!.drawText(l, { x: M, y: y - 9.5, size: 9.5, font: regular, color: INK });
        y -= 13;
      }
      y -= 4;
    }
    if (sec.keyValues) {
      for (const [k, v] of sec.keyValues) {
        ensure(15);
        page!.drawText(sanitizePdfText(k), { x: M, y: y - 9, size: 9.5, font: regular, color: MUTED });
        const t = sanitizePdfText(v);
        page!.drawText(t, { x: A4[0] - M - bold.widthOfTextAtSize(t, 9.5), y: y - 9, size: 9.5, font: bold, color: INK });
        page!.drawLine({ start: { x: M, y: y - 13 }, end: { x: A4[0] - M, y: y - 13 }, thickness: 0.4, color: RULE });
        y -= 16;
      }
      y -= 6;
    }
    if (sec.table) drawTable(sec.table);
  }

  function drawTable(t: DocTable) {
    const totalW = t.columns.reduce((a, c) => a + c.width, 0);
    const widths = t.columns.map((c) => (c.width / totalW) * contentW);
    const PAD = 4;
    const size = 8.8;
    const drawRow = (cells: string[], opts: { head?: boolean; zebra?: boolean; boldRow?: boolean }) => {
      const font = opts.head || opts.boldRow ? bold : regular;
      const wrapped = cells.map((c, i) => wrap(c ?? '', font, size, widths[i] - PAD * 2));
      const lines = Math.max(...wrapped.map((w) => w.length), 1);
      const h = lines * 11.5 + PAD * 2 - 1;
      if (y - h < M + FOOTER_H) {
        newPage();
        drawRow(t.columns.map((c) => c.header), { head: true });
      }
      if (opts.head) page!.drawRectangle({ x: M, y: y - h, width: contentW, height: h, color: HEAD_BG });
      else if (opts.zebra) page!.drawRectangle({ x: M, y: y - h, width: contentW, height: h, color: rgb(0.985, 0.987, 0.992) });
      let x = M;
      wrapped.forEach((ls, i) => {
        const align = t.columns[i].align ?? 'left';
        ls.forEach((l, li) => {
          const w = font.widthOfTextAtSize(l, size);
          const tx = align === 'right' ? x + widths[i] - PAD - w : align === 'center' ? x + (widths[i] - w) / 2 : x + PAD;
          page!.drawText(l, { x: tx, y: y - PAD - size - li * 11.5 + 2, size, font, color: INK });
        });
        x += widths[i];
      });
      page!.drawLine({ start: { x: M, y: y - h }, end: { x: A4[0] - M, y: y - h }, thickness: 0.4, color: RULE });
      y -= h;
    };
    ensure(40);
    drawRow(t.columns.map((c) => c.header), { head: true });
    t.rows.forEach((r, i) => drawRow(r, { zebra: i % 2 === 1 }));
    for (const [label, value] of t.totals ?? []) {
      // Totals span the table: label left of the value, both right-aligned, never wrapped into a narrow column.
      if (y - 20 < M + FOOTER_H) newPage();
      const v = sanitizePdfText(value);
      const l = sanitizePdfText(label);
      const vw = bold.widthOfTextAtSize(v, 9.5);
      page!.drawText(v, { x: A4[0] - M - PAD - vw, y: y - 14, size: 9.5, font: bold, color: INK });
      page!.drawText(l, { x: A4[0] - M - PAD - vw - 14 - bold.widthOfTextAtSize(l, 9.5), y: y - 14, size: 9.5, font: bold, color: INK });
      page!.drawLine({ start: { x: M, y: y - 20 }, end: { x: A4[0] - M, y: y - 20 }, thickness: 0.8, color: INK });
      y -= 20;
    }
    y -= 12;
  }

  if (spec.note) {
    for (const l of wrap(spec.note, italic, 8.5, contentW)) {
      ensure(13);
      page!.drawText(l, { x: M, y: y - 8.5, size: 8.5, font: italic, color: MUTED });
      y -= 12;
    }
    y -= 4;
  }

  if (spec.signature !== false) {
    ensure(70);
    y -= 28;
    const sx = A4[0] - M - 190;
    page!.drawLine({ start: { x: sx, y }, end: { x: A4[0] - M, y }, thickness: 0.7, color: INK });
    page!.drawText(sanitizePdfText(brand.signatoryName || 'Authorised Signatory'), { x: sx, y: y - 12, size: 9.5, font: bold, color: INK });
    if (brand.signatoryName) {
      page!.drawText(sanitizePdfText(brand.signatoryTitle || 'Authorised Signatory'), { x: sx, y: y - 24, size: 8.5, font: regular, color: MUTED });
    }
    page!.drawText(instName, { x: sx, y: y - (brand.signatoryName ? 36 : 24), size: 8.5, font: regular, color: MUTED });
    y -= 40;
  }

  // Footers + page numbers (second pass so we know the total)
  const pages = pdf.getPages();
  const gen = spec.generatedOn ?? new Date().toISOString().slice(0, 10);
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M + 30 }, end: { x: A4[0] - M, y: M + 30 }, thickness: 0.5, color: RULE });
    const foot = sanitizePdfText(brand.footerText || '');
    if (foot) {
      const w = regular.widthOfTextAtSize(foot.slice(0, 140), 8);
      p.drawText(foot.slice(0, 140), { x: (A4[0] - w) / 2, y: M + 18, size: 8, font: regular, color: MUTED });
    }
    p.drawText(sanitizePdfText(`${spec.docNumber ? `${spec.docNumber}  |  ` : ''}Generated ${gen}`), { x: M, y: M + 4, size: 7.5, font: regular, color: MUTED });
    const pn = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pn, { x: A4[0] - M - regular.widthOfTextAtSize(pn, 7.5), y: M + 4, size: 7.5, font: regular, color: MUTED });
  });

  return { bytes: await pdf.save(), pageCount: pages.length };
}
