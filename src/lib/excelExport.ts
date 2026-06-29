import ExcelJS from 'exceljs';

export type StyledRow = {
  type?: 'data' | 'subtotal' | 'total' | 'blank';
  cells: (string | number | null | undefined)[];
};

export interface ExportStyledExcelOptions {
  fileName: string;
  sheetName?: string;
  titleLines?: string[]; // merged header rows above table
  headers: string[];
  rows: StyledRow[];
  /** Columns (header names) with few unique values — fixed color per value + legend */
  categoryColumns?: string[];
  /** Columns (header names) with many unique values — alternating light palette */
  rotatingColumns?: string[];
}

// Light, legible palette (dark text on these)
const FIXED_PALETTE = [
  'FFFFE0B2', 'FFC8E6C9', 'FFBBDEFB', 'FFF8BBD0', 'FFD1C4E9',
  'FFFFF59D', 'FFB2DFDB', 'FFFFCCBC', 'FFCFD8DC', 'FFDCEDC8',
  'FFB3E5FC', 'FFF0F4C3', 'FFE1BEE7', 'FFFFCDD2', 'FFC5CAE9',
];

const ROTATING_PALETTE = [
  'FFE3F2FD', 'FFF1F8E9', 'FFFFF3E0', 'FFFCE4EC', 'FFEDE7F6',
  'FFE0F7FA', 'FFF9FBE7',
];

const HEADER_FILL = 'FF37474F'; // dark
const GRAND_TOTAL_FILL = 'FF263238';
const SUBTOTAL_FILL = 'FFECEFF1';
const TITLE_FILL = 'FF455A64';

function pickFixedColor(value: string, map: Map<string, string>): string {
  if (!map.has(value)) {
    const color = FIXED_PALETTE[map.size % FIXED_PALETTE.length];
    map.set(value, color);
  }
  return map.get(value)!;
}

function thinBorder() {
  const side = { style: 'thin' as const, color: { argb: 'FFCFD8DC' } };
  return { top: side, left: side, bottom: side, right: side };
}

export async function exportStyledExcel(opts: ExportStyledExcelOptions) {
  const {
    fileName, sheetName = 'Relatório',
    titleLines = [], headers, rows,
    categoryColumns = [], rotatingColumns = [],
  } = opts;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'RondaTrack 2';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: titleLines.length + 1 }],
  });

  // Title lines
  titleLines.forEach((line, i) => {
    const row = ws.addRow([line]);
    ws.mergeCells(i + 1, 1, i + 1, headers.length);
    row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: i === 0 ? 14 : 11 };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_FILL } };
    row.height = i === 0 ? 26 : 18;
  });

  // Header row
  const headerRow = ws.addRow(headers);
  // Freeze should be after header — adjust view now that we know the row index
  ws.views = [{ state: 'frozen', ySplit: headerRow.number }];
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder();
  });
  headerRow.height = 22;

  // Compute column indexes
  const colIndex = (name: string) => headers.indexOf(name); // 0-based
  const categoryColors = new Map<string, Map<string, string>>(); // colName -> value -> color
  categoryColumns.forEach((c) => categoryColors.set(c, new Map()));

  // For rotating columns: alternate when value changes
  const rotatingState = new Map<string, { lastValue: string | null; idx: number }>();
  rotatingColumns.forEach((c) => rotatingState.set(c, { lastValue: null, idx: -1 }));

  // Body rows
  rows.forEach((r) => {
    const type = r.type || 'data';
    if (type === 'blank') {
      ws.addRow([]);
      return;
    }
    const excelRow = ws.addRow(r.cells.map((v) => v ?? ''));
    excelRow.eachCell((cell, colNum) => {
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle', wrapText: true };
    });

    if (type === 'subtotal') {
      excelRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTOTAL_FILL } };
        cell.font = { italic: true, bold: true, color: { argb: 'FF263238' } };
      });
      return;
    }
    if (type === 'total') {
      excelRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAND_TOTAL_FILL } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      });
      return;
    }

    // Data row: per-column coloring
    categoryColumns.forEach((colName) => {
      const idx = colIndex(colName);
      if (idx < 0) return;
      const value = String(r.cells[idx] ?? '').trim();
      if (!value) return;
      const color = pickFixedColor(value, categoryColors.get(colName)!);
      const cell = excelRow.getCell(idx + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      cell.font = { bold: true, color: { argb: 'FF1A1A1A' } };
    });

    rotatingColumns.forEach((colName) => {
      const idx = colIndex(colName);
      if (idx < 0) return;
      const value = String(r.cells[idx] ?? '').trim();
      if (!value) return;
      const st = rotatingState.get(colName)!;
      if (value !== st.lastValue) {
        st.idx = (st.idx + 1) % ROTATING_PALETTE.length;
        st.lastValue = value;
      }
      const color = ROTATING_PALETTE[st.idx];
      const cell = excelRow.getCell(idx + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      cell.font = { bold: true, color: { argb: 'FF1A1A1A' } };
    });
  });

  // Column widths
  ws.columns.forEach((col, i) => {
    let max = headers[i]?.length ?? 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const v = cell.value ? String(cell.value) : '';
      v.split('\n').forEach((line) => { if (line.length > max) max = line.length; });
    });
    col.width = Math.min(Math.max(max + 4, 12), 50);
  });

  // Legend sheet
  const hasLegend = categoryColumns.length > 0 || rotatingColumns.length > 0;
  if (hasLegend) {
    const lws = wb.addWorksheet('Legenda');
    lws.columns = [
      { header: 'Coluna', key: 'col', width: 24 },
      { header: 'Valor', key: 'val', width: 36 },
      { header: 'Cor', key: 'color', width: 16 },
    ];
    const lheader = lws.getRow(1);
    lheader.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.alignment = { horizontal: 'center' };
      c.border = thinBorder();
    });
    lws.views = [{ state: 'frozen', ySplit: 1 }];

    categoryColumns.forEach((colName) => {
      const map = categoryColors.get(colName);
      if (!map) return;
      map.forEach((color, value) => {
        const row = lws.addRow({ col: colName, val: value, color: '' });
        const colorCell = row.getCell(3);
        colorCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        colorCell.value = ' ';
        row.eachCell((c) => { c.border = thinBorder(); });
      });
    });

    if (rotatingColumns.length > 0) {
      const note = lws.addRow({
        col: rotatingColumns.join(', '),
        val: 'Cores alternadas para separar visualmente cada item',
        color: '',
      });
      note.getCell(3).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: ROTATING_PALETTE[0] },
      };
      note.eachCell((c) => {
        c.border = thinBorder();
        c.font = { italic: true };
      });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
