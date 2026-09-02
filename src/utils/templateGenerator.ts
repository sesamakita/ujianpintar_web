import * as XLSX from 'xlsx';

export const EXCEL_TEMPLATE_DATA = [
  [
    'NO',
    'TIPE_SOAL',
    'PERTANYAAN',
    'RUMUS_LATEX',
    'OPSI_A',
    'OPSI_B',
    'OPSI_C',
    'OPSI_D',
    'OPSI_E',
    'KUNCI_JAWABAN',
    'BOBOT_POIN',
    'URL_GAMBAR'
  ],
  [
    1,
    'PG',
    'Tentukan himpunan penyelesaian dari persamaan kuadrat berikut:',
    'x^2 - 5x + 6 = 0',
    '{2, 3}',
    '{-2, -3}',
    '{1, 6}',
    '{-1, -6}',
    '{0, 6}',
    'A',
    10,
    ''
  ],
  [
    2,
    'PG',
    'Nilai turunan pertama dari fungsi f(x) = 3x^2 - 4x pada x = 2 adalah...',
    "f'(x) = 6x - 4",
    '8',
    '12',
    '16',
    '4',
    '0',
    'A',
    10,
    ''
  ],
  [
    3,
    'BS',
    'Grafik fungsi f(x) = ax^2 + bx + c selalu terbuka ke atas jika koefisien a > 0.',
    'a > 0',
    '',
    '',
    '',
    '',
    '',
    'BENAR',
    10,
    ''
  ],
  [
    4,
    'ISIAN',
    'Tentukan titik potong grafik fungsi y = x^2 - 9 dengan sumbu Y!',
    'y = 0 - 9',
    '',
    '',
    '',
    '',
    '',
    '-9',
    15,
    ''
  ],
  [
    5,
    'PG',
    'Jika matriks A = [[2, 1], [4, 3]], maka nilai determinan matriks A adalah...',
    '\\det(A) = (2)(3) - (1)(4)',
    '2',
    '4',
    '-2',
    '6',
    '10',
    'A',
    10,
    ''
  ]
];

/**
 * Downloads official Excel (.xlsx) template for UjianPintar
 */
export const downloadExcelTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet(EXCEL_TEMPLATE_DATA);

  // Set column widths for comfortable editing
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 12 }, // TIPE_SOAL
    { wch: 55 }, // PERTANYAAN
    { wch: 25 }, // RUMUS_LATEX
    { wch: 20 }, // OPSI_A
    { wch: 20 }, // OPSI_B
    { wch: 20 }, // OPSI_C
    { wch: 20 }, // OPSI_D
    { wch: 20 }, // OPSI_E
    { wch: 16 }, // KUNCI_JAWABAN
    { wch: 12 }, // BOBOT_POIN
    { wch: 25 }, // URL_GAMBAR
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Soal_UjianPintar');
  XLSX.writeFile(wb, 'Template_Soal_UjianPintar.xlsx');
};

/**
 * Downloads CSV template formatted with UTF-8 BOM
 */
export const downloadCsvTemplate = () => {
  const csvContent = EXCEL_TEMPLATE_DATA.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Soal_UjianPintar.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads Text / Aiken format template
 */
export const downloadWordTemplate = () => {
  const textContent = `FORMAT TEMPLATE SOAL UJIANPINTAR (AIKEN / TEKS FORMAT)
======================================================
Petunjuk Pengisian:
- Setiap soal dipisahkan oleh satu baris kosong.
- Pilihan ganda menggunakan format A. B. C. D. E.
- Kunci jawaban ditulis dengan format ANSWER: [HURUF/KUNCI]
- Bobot poin opsional ditulis dengan format POINTS: [ANGKA] (Default 10)
- Rumus LaTeX diawali dengan LATEX: [KODE_RUMUS]
======================================================

1. Tentukan himpunan penyelesaian dari persamaan kuadrat x^2 - 5x + 6 = 0!
LATEX: x^2 - 5x + 6 = 0
A. {2, 3}
B. {-2, -3}
C. {1, 6}
D. {-1, -6}
E. {0, 6}
ANSWER: A
POINTS: 10

2. Nilai turunan pertama dari fungsi f(x) = 3x^2 - 4x pada x = 2 adalah...
LATEX: f'(x) = 6x - 4
A. 8
B. 12
C. 16
D. 4
E. 0
ANSWER: A
POINTS: 10

3. Grafik fungsi f(x) = ax^2 + bx + c selalu terbuka ke atas jika koefisien a > 0.
TYPE: BS
LATEX: a > 0
ANSWER: BENAR
POINTS: 10

4. Tentukan titik potong grafik fungsi y = x^2 - 9 dengan sumbu Y!
TYPE: ISIAN
LATEX: y = 0 - 9
ANSWER: -9
POINTS: 15
`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Soal_UjianPintar.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
