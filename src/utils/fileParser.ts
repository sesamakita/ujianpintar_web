import * as XLSX from 'xlsx';
import type { Question, QuestionType } from '../types/exam';

export interface ParseResult {
  success: boolean;
  questions: Question[];
  errors: string[];
  warnings: string[];
  totalParsed: number;
  filename: string;
}

/**
 * Normalizes header string for flexible column matching
 */
const normalizeKey = (key: string): string => {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Parses uploaded Excel (.xlsx, .xls) or CSV file
 */
export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return resolve({
            success: false,
            questions: [],
            errors: ['File Excel tidak memiliki lembar kerja (worksheet) yang dapat dibaca.'],
            warnings: [],
            totalParsed: 0,
            filename: file.name
          });
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          return resolve({
            success: false,
            questions: [],
            errors: ['File Excel kosong atau hanya berisi baris header tanpa data soal.'],
            warnings: [],
            totalParsed: 0,
            filename: file.name
          });
        }

        // Header row mapping
        const headerRow = rawJson[0] as string[];
        const colMap: Record<string, number> = {};

        headerRow.forEach((col, idx) => {
          if (col) {
            const norm = normalizeKey(String(col));
            colMap[norm] = idx;
          }
        });

        // Resolve Column Indices with fallbacks
        const getColIdx = (...aliases: string[]): number => {
          for (const alias of aliases) {
            const norm = normalizeKey(alias);
            if (colMap[norm] !== undefined) return colMap[norm];
          }
          return -1;
        };

        const idxNo = getColIdx('no', 'nomor', 'number');
        const idxType = getColIdx('tipesoal', 'tipe', 'type', 'jenis');
        const idxQuestion = getColIdx('pertanyaan', 'soal', 'question', 'questiontext', 'tekssoal');
        const idxLatex = getColIdx('rumuslatex', 'rumus', 'formula', 'latex');
        const idxOptA = getColIdx('opsia', 'pilihana', 'a', 'optiona');
        const idxOptB = getColIdx('opsib', 'pilihanb', 'b', 'optionb');
        const idxOptC = getColIdx('opsic', 'pilihanc', 'c', 'optionc');
        const idxOptD = getColIdx('opsid', 'pilihand', 'd', 'optiond');
        const idxOptE = getColIdx('opsie', 'pilihane', 'e', 'optione');
        const idxKey = getColIdx('kuncijawaban', 'kunci', 'answer', 'key', 'jawabanbenar');
        const idxPoints = getColIdx('bobotpoin', 'bobot', 'poin', 'points', 'score', 'nilai');
        const idxImage = getColIdx('urlgambar', 'gambar', 'image', 'imageurl', 'foto');

        if (idxQuestion === -1) {
          return resolve({
            success: false,
            questions: [],
            errors: ['Kolom "PERTANYAAN" atau "SOAL" tidak ditemukan pada baris header.'],
            warnings: [],
            totalParsed: 0,
            filename: file.name
          });
        }

        const questions: Question[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r] as any[];
          if (!row || row.length === 0) continue;

          const qText = idxQuestion !== -1 ? String(row[idxQuestion] || '').trim() : '';
          if (!qText) continue; // Skip completely empty rows

          const rowNum = r + 1;
          const qNum = idxNo !== -1 && row[idxNo] ? Number(row[idxNo]) || questions.length + 1 : questions.length + 1;
          
          // Determine Question Type
          const rawType = idxType !== -1 ? String(row[idxType] || 'PG').toUpperCase().trim() : 'PG';
          let qType: QuestionType = 'multiple_choice';

          if (rawType === 'BS' || rawType.includes('BENAR') || rawType === 'TRUE_FALSE') {
            qType = 'true_false';
          } else if (rawType === 'ISIAN' || rawType.includes('SINGKAT') || rawType === 'SHORT_ANSWER') {
            qType = 'short_answer';
          }

          const latexFormula = idxLatex !== -1 && row[idxLatex] ? String(row[idxLatex]).trim() : undefined;
          const imageUrl = idxImage !== -1 && row[idxImage] ? String(row[idxImage]).trim() : undefined;
          const points = idxPoints !== -1 && row[idxPoints] ? Number(row[idxPoints]) || 10 : 10;
          const rawKey = idxKey !== -1 ? String(row[idxKey] || '').trim() : '';

          const timestamp = Date.now() + r;
          const questionId = `imported-${timestamp}-${qNum}`;

          if (qType === 'multiple_choice') {
            const rawOpts = [
              { label: 'A', text: idxOptA !== -1 ? String(row[idxOptA] || '').trim() : '' },
              { label: 'B', text: idxOptB !== -1 ? String(row[idxOptB] || '').trim() : '' },
              { label: 'C', text: idxOptC !== -1 ? String(row[idxOptC] || '').trim() : '' },
              { label: 'D', text: idxOptD !== -1 ? String(row[idxOptD] || '').trim() : '' },
              { label: 'E', text: idxOptE !== -1 ? String(row[idxOptE] || '').trim() : '' },
            ];

            const validOpts = rawOpts
              .filter((opt) => opt.text.length > 0)
              .map((opt) => ({
                id: `opt-${timestamp}-${opt.label}`,
                label: opt.label,
                text: opt.text
              }));

            if (validOpts.length < 2) {
              warnings.push(`Baris ${rowNum}: Pilihan ganda pada soal #${qNum} memiliki kurang dari 2 opsi jawaban.`);
            }

            const cleanKey = rawKey.toUpperCase().trim();
            const matchedOpt = validOpts.find((o) => o.label === cleanKey);
            const correctOptionId = matchedOpt ? matchedOpt.id : validOpts[0]?.id;

            if (!matchedOpt && cleanKey) {
              warnings.push(`Baris ${rowNum}: Kunci "${rawKey}" tidak cocok dengan label opsi A-E pada soal #${qNum}. Menggunakan opsi pertama.`);
            }

            questions.push({
              id: questionId,
              number: qNum,
              type: 'multiple_choice',
              questionText: qText,
              latexFormula,
              imageUrl,
              options: validOpts,
              correctOptionId,
              points
            });

          } else if (qType === 'true_false') {
            const tfOpts = [
              { id: `opt-${timestamp}-true`, label: 'A', text: 'Benar' },
              { id: `opt-${timestamp}-false`, label: 'B', text: 'Salah' },
            ];

            const isTrue = rawKey.toUpperCase().includes('BENAR') || rawKey.toUpperCase() === 'TRUE' || rawKey.toUpperCase() === 'A';
            const correctOptionId = isTrue ? tfOpts[0].id : tfOpts[1].id;

            questions.push({
              id: questionId,
              number: qNum,
              type: 'true_false',
              questionText: qText,
              latexFormula,
              imageUrl,
              options: tfOpts,
              correctOptionId,
              points
            });

          } else {
            // Short Answer
            questions.push({
              id: questionId,
              number: qNum,
              type: 'short_answer',
              questionText: qText,
              latexFormula,
              imageUrl,
              options: [],
              correctAnswerText: rawKey,
              points
            });
          }
        }

        if (questions.length === 0) {
          return resolve({
            success: false,
            questions: [],
            errors: ['Tidak ada butir soal valid yang dapat diekstrak dari file ini.'],
            warnings,
            totalParsed: 0,
            filename: file.name
          });
        }

        return resolve({
          success: true,
          questions,
          errors,
          warnings,
          totalParsed: questions.length,
          filename: file.name
        });

      } catch (err: any) {
        return resolve({
          success: false,
          questions: [],
          errors: [`Gagal memproses file Excel: ${err?.message || 'Format tidak dikenali.'}`],
          warnings: [],
          totalParsed: 0,
          filename: file.name
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        questions: [],
        errors: ['Terjadi kesalahan saat membaca file dari komputer.'],
        warnings: [],
        totalParsed: 0,
        filename: file.name
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses Aiken/Text format files (.txt)
 */
export const parseTextFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = String(e.target?.result || '');
        const lines = text.split(/\r?\n/);
        const questions: Question[] = [];
        const warnings: string[] = [];

        let currentQuestionText = '';
        let currentLatex: string | undefined = undefined;
        let currentType: QuestionType = 'multiple_choice';
        let currentOptions: { label: string; text: string }[] = [];
        let currentAnswer = '';
        let currentPoints = 10;

        const commitCurrent = () => {
          if (!currentQuestionText.trim()) return;

          const timestamp = Date.now() + questions.length;
          const qNum = questions.length + 1;
          const questionId = `imported-txt-${timestamp}-${qNum}`;

          if (currentType === 'multiple_choice' && currentOptions.length >= 2) {
            const mappedOpts = currentOptions.map((opt) => ({
              id: `opt-${timestamp}-${opt.label}`,
              label: opt.label,
              text: opt.text
            }));

            const matched = mappedOpts.find((o) => o.label === currentAnswer.toUpperCase().trim());
            const correctOptionId = matched ? matched.id : mappedOpts[0].id;

            questions.push({
              id: questionId,
              number: qNum,
              type: 'multiple_choice',
              questionText: currentQuestionText.trim(),
              latexFormula: currentLatex,
              options: mappedOpts,
              correctOptionId,
              points: currentPoints
            });
          } else if (currentType === 'true_false') {
            const tfOpts = [
              { id: `opt-${timestamp}-true`, label: 'A', text: 'Benar' },
              { id: `opt-${timestamp}-false`, label: 'B', text: 'Salah' },
            ];
            const isTrue = currentAnswer.toUpperCase().includes('BENAR') || currentAnswer.toUpperCase() === 'TRUE' || currentAnswer.toUpperCase() === 'A';

            questions.push({
              id: questionId,
              number: qNum,
              type: 'true_false',
              questionText: currentQuestionText.trim(),
              latexFormula: currentLatex,
              options: tfOpts,
              correctOptionId: isTrue ? tfOpts[0].id : tfOpts[1].id,
              points: currentPoints
            });
          } else {
            questions.push({
              id: questionId,
              number: qNum,
              type: 'short_answer',
              questionText: currentQuestionText.trim(),
              latexFormula: currentLatex,
              options: [],
              correctAnswerText: currentAnswer,
              points: currentPoints
            });
          }

          // Reset buffer
          currentQuestionText = '';
          currentLatex = undefined;
          currentType = 'multiple_choice';
          currentOptions = [];
          currentAnswer = '';
          currentPoints = 10;
        };

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('===') || trimmed.startsWith('FORMAT') || trimmed.startsWith('Petunjuk')) {
            if (!trimmed && currentQuestionText && currentAnswer) {
              commitCurrent();
            }
            continue;
          }

          if (trimmed.startsWith('ANSWER:')) {
            currentAnswer = trimmed.replace('ANSWER:', '').trim();
          } else if (trimmed.startsWith('LATEX:')) {
            currentLatex = trimmed.replace('LATEX:', '').trim();
          } else if (trimmed.startsWith('POINTS:')) {
            currentPoints = Number(trimmed.replace('POINTS:', '').trim()) || 10;
          } else if (trimmed.startsWith('TYPE:')) {
            const t = trimmed.replace('TYPE:', '').trim().toUpperCase();
            if (t === 'BS') currentType = 'true_false';
            if (t === 'ISIAN') currentType = 'short_answer';
          } else if (/^[A-E]\.\s+/i.test(trimmed)) {
            const label = trimmed.charAt(0).toUpperCase();
            const textVal = trimmed.substring(2).trim();
            currentOptions.push({ label, text: textVal });
          } else {
            // Continuation of question text or new question number
            const cleanedQ = trimmed.replace(/^\d+\.\s+/, '');
            currentQuestionText = currentQuestionText ? `${currentQuestionText}\n${cleanedQ}` : cleanedQ;
          }
        }

        // Commit trailing question
        commitCurrent();

        if (questions.length === 0) {
          return resolve({
            success: false,
            questions: [],
            errors: ['Format teks tidak sesuai dengan standar format Aiken/Teks UjianPintar.'],
            warnings,
            totalParsed: 0,
            filename: file.name
          });
        }

        return resolve({
          success: true,
          questions,
          errors: [],
          warnings,
          totalParsed: questions.length,
          filename: file.name
        });

      } catch (err: any) {
        return resolve({
          success: false,
          questions: [],
          errors: [`Gagal memproses file teks: ${err?.message || 'Format tidak valid.'}`],
          warnings: [],
          totalParsed: 0,
          filename: file.name
        });
      }
    };

    reader.readAsText(file);
  });
};

/**
 * Universal auto-detect parser by file extension
 */
export const parseUploadedFile = async (file: File): Promise<ParseResult> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return parseExcelFile(file);
  } else if (ext === 'txt' || ext === 'docx' || ext === 'doc') {
    return parseTextFile(file);
  } else {
    return {
      success: false,
      questions: [],
      errors: [`Format ekstensi ".${ext}" belum didukung. Silakan gunakan file .xlsx, .csv, atau .txt`],
      warnings: [],
      totalParsed: 0,
      filename: file.name
    };
  }
};
