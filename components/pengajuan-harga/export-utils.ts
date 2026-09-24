import { PengajuanHargaItem } from './types';

/**
 * Ekspor data ke format CSV
 */
export function exportToCSV(items: PengajuanHargaItem[], filename = 'Pengajuan_Harga_Material'): void {
  const headers = [
    'No',
    'Kode',
    'Item',
    'Ukuran',
    'Merk',
    'Warna',
    'Tipe',
    'Tebal',
    'Permukaan',
    'Kategori',
    'Implementasi',
    'Lokasi',
    'Informasi Tambahan',
    'Deskripsi Lengkap (Otomatis)',
    'Status',
    'Tanggal Pengajuan',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = items.map((item, idx) => [
    idx + 1,
    escapeCSV(item.kode),
    escapeCSV(item.item),
    escapeCSV(item.ukuran),
    escapeCSV(item.merk),
    escapeCSV(item.warna),
    escapeCSV(item.tipe),
    escapeCSV(item.tebal),
    escapeCSV(item.permukaan),
    escapeCSV(item.kategori),
    escapeCSV(item.implementasi),
    escapeCSV(item.lokasi),
    escapeCSV(item.informasiTambahan),
    escapeCSV(item.deskripsiOtomatis),
    escapeCSV(item.status || 'DIAJUKAN'),
    escapeCSV(item.tanggalPengajuan || '-'),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor data ke format Excel XML/HTML (Natively opens in MS Excel with formatting)
 */
export function exportToExcel(items: PengajuanHargaItem[], filename = 'Pengajuan_Harga_Material'): void {
  const headers = [
    'No',
    'Kode',
    'Item',
    'Ukuran',
    'Merk',
    'Warna',
    'Tipe',
    'Tebal',
    'Permukaan',
    'Kategori',
    'Implementasi',
    'Lokasi',
    'Informasi Tambahan',
    'Deskripsi Lengkap (Otomatis)',
    'Status',
    'Tanggal Pengajuan',
  ];

  const tableRows = items.map((item, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center; font-weight: bold; background-color: #eff6ff;">${item.kode}</td>
      <td style="font-weight: bold;">${item.item}</td>
      <td>${item.ukuran}</td>
      <td style="font-weight: bold;">${item.merk}</td>
      <td>${item.warna}</td>
      <td>${item.tipe}</td>
      <td style="text-align: center;">${item.tebal}</td>
      <td>${item.permukaan}</td>
      <td>${item.kategori}</td>
      <td style="font-weight: bold;">${item.implementasi}</td>
      <td>${item.lokasi}</td>
      <td style="font-style: italic;">${item.informasiTambahan || '-'}</td>
      <td>${item.deskripsiOtomatis}</td>
      <td style="text-align: center;">${item.status || 'DIAJUKAN'}</td>
      <td style="text-align: center;">${item.tanggalPengajuan || '-'}</td>
    </tr>
  `).join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Pengajuan Harga Material</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        th { background-color: #dc2626; color: #ffffff; font-weight: bold; text-align: left; padding: 8px 12px; border: 1px solid #b91c1c; }
        td { padding: 6px 10px; border: 1px solid #e2e8f0; vertical-align: middle; font-size: 11pt; font-family: Calibri, sans-serif; }
      </style>
    </head>
    <body>
      <h2 style="font-family: Calibri, sans-serif; color: #1e293b;">SPARTA — MASTER SPESIFIKASI & PENGAJUAN PENETAPAN HARGA</h2>
      <p style="font-family: Calibri, sans-serif; color: #64748b; font-size: 10pt;">Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor data ke format PDF menggunakan jsPDF + jspdf-autotable
 */
export async function exportToPDF(items: PengajuanHargaItem[], filename = 'Pengajuan_Harga_Material'): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(220, 38, 38); // Alfamart Primary Red
  doc.rect(30, 24, pageWidth - 60, 48, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SPARTA — PENGAJUAN PENETAPAN HARGA MATERIAL', 45, 46);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Divisi Building & Maintenance | Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | Total: ${items.length} Item`,
    45,
    60
  );

  // Table Data
  const head = [[
    'No',
    'Kode',
    'Item',
    'Ukuran',
    'Merk',
    'Warna',
    'Tipe',
    'Tebal',
    'Permukaan',
    'Kategori',
    'Imp.',
    'Lokasi',
    'Deskripsi Lengkap (Otomatis)',
  ]];

  const body = items.map((item, idx) => [
    idx + 1,
    item.kode,
    item.item,
    item.ukuran,
    item.merk,
    item.warna,
    item.tipe,
    item.tebal,
    item.permukaan,
    item.kategori,
    item.implementasi,
    item.lokasi,
    item.deskripsiOtomatis,
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 85,
    margin: { left: 30, right: 30 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      valign: 'middle',
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.5,
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 24 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 46 },
      2: { cellWidth: 48 },
      3: { halign: 'center', cellWidth: 38 },
      4: { cellWidth: 50 },
      5: { cellWidth: 42 },
      6: { cellWidth: 58 },
      7: { halign: 'center', cellWidth: 32 },
      8: { cellWidth: 52 },
      9: { cellWidth: 68 },
      10: { halign: 'center', cellWidth: 38 },
      11: { cellWidth: 54 },
      12: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

