import { generateUUID } from './examService';
import type { Question, QuestionType } from '../types/exam';

export interface QuestionComposition {
  multiple_choice: number;
  true_false: number;
  short_answer: number;
  essay: number;
}

export interface TypePointsConfig {
  multiple_choice: number;
  true_false: number;
  short_answer: number;
  essay: number;
}

export interface AIGenerateParams {
  subject: string;
  gradeLevel: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'hots';
  mode?: 'single' | 'mixed';
  count?: number; // for single mode
  questionType?: QuestionType; // for single mode
  composition?: QuestionComposition; // for mixed mode
  pointsPerType?: Partial<TypePointsConfig>; // points for each question type
  defaultPoints?: number; // fallback points (default 10)
  referenceMaterial?: string;
  apiKey?: string;
}

export interface GeneratedQuestionItem {
  questionText: string;
  type: QuestionType;
  options?: { label: string; text: string; isCorrect: boolean }[];
  correctAnswerText?: string;
  explanation?: string;
  points?: number;
}

const PRIMARY_STORAGE_KEY = 'ujianpintar_gemini_api_key';
// Legacy keys for one-time migration only. New writes go ONLY to PRIMARY_STORAGE_KEY.
const LEGACY_API_KEYS = [
  'gemini_api_key',
  'GOOGLE_GEMINI_API_KEY',
  'google_api_key',
  'ai_generator_api_key',
];

/**
 * Returns the user's personal API Key stored in their browser localStorage.
 * Reads the primary key, falling back to legacy keys (one-time migration).
 */
export const getStoredGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const primary = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (primary && primary.trim()) return primary.trim();

    // Migrate once from legacy keys if present
    for (const key of LEGACY_API_KEYS) {
      const val = localStorage.getItem(key);
      if (val && val.trim()) {
        const clean = val.trim();
        localStorage.setItem(PRIMARY_STORAGE_KEY, clean);
        return clean;
      }
    }
  }
  return '';
};

/**
 * Persists the user's personal API Key to the single primary key only.
 */
export const setStoredGeminiApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    const clean = (key || '').trim();
    if (clean) {
      localStorage.setItem(PRIMARY_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(PRIMARY_STORAGE_KEY);
    }
  }
};

/**
 * Checks if the user has configured their personal Gemini API Key.
 */
export const hasUserGeminiApiKey = (): boolean => {
  return Boolean(getStoredGeminiApiKey());
};

// Default fallback models in priority order (2026 Active Gemini Models)
export const DEFAULT_GEMINI_MODELS = [
  { ver: 'v1beta', name: 'gemini-3.5-flash-lite' },
  { ver: 'v1beta', name: 'gemini-3.5-flash' },
  { ver: 'v1beta', name: 'gemini-flash-lite-latest' },
  { ver: 'v1beta', name: 'gemini-flash-latest' },
  { ver: 'v1beta', name: 'gemini-3.7-flash' },
  { ver: 'v1beta', name: 'gemini-3.6-flash' },
  { ver: 'v1beta', name: 'gemini-3.1-flash-lite' },
  { ver: 'v1beta', name: 'gemini-3.8-flash' },
  { ver: 'v1', name: 'gemini-3.5-flash-lite' },
  { ver: 'v1', name: 'gemini-3.5-flash' },
  { ver: 'v1', name: 'gemini-3.7-flash' },
  { ver: 'v1', name: 'gemini-3.1-flash-lite' },
  { ver: 'v1beta', name: 'gemini-1.5-flash' },
  { ver: 'v1', name: 'gemini-1.5-flash' },
];

export const aiQuestionService = {
  getStoredApiKey: getStoredGeminiApiKey,
  setStoredApiKey: setStoredGeminiApiKey,
  hasApiKey: hasUserGeminiApiKey,

  /**
   * Dynamically query Google AI Studio ModelService to discover active models for this key
   */
  async getAvailableModels(customKey?: string): Promise<Array<{ ver: string; name: string }>> {
    const key = (customKey || getStoredGeminiApiKey()).trim();
    if (!key) return DEFAULT_GEMINI_MODELS;

    const endpoints = ['v1beta', 'v1'];
    for (const ver of endpoints) {
      try {
        const listUrl = `https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(key)}`;
        const res = await fetch(listUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.models) && data.models.length > 0) {
            const rawNames = data.models
              .filter((m: any) =>
                Array.isArray(m.supportedGenerationMethods) &&
                m.supportedGenerationMethods.includes('generateContent')
              )
              .map((m: any) => (m.name || '').replace(/^models\//, ''));

            if (rawNames.length > 0) {
              const priority = [
                'gemini-3.5-flash-lite',
                'gemini-3.5-flash',
                'gemini-flash-lite-latest',
                'gemini-flash-latest',
                'gemini-3.7-flash',
                'gemini-3.6-flash',
                'gemini-3.1-flash-lite',
                'gemini-3.8-flash',
                'gemini-2.5-flash-lite',
                'gemini-2.5-flash',
                'gemini-1.5-flash',
                'gemini-2.0-flash',
                'gemini-1.5-pro',
              ];

              const sorted = [...rawNames].sort((a, b) => {
                const idxA = priority.findIndex((p) => a === p || a.includes(p));
                const idxB = priority.findIndex((p) => b === p || b.includes(p));
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
              });

              return sorted.map((name) => ({ ver, name }));
            }
          }
        }
      } catch (err) {
        console.warn(`ListModels error on ${ver}:`, err);
      }
    }

    return DEFAULT_GEMINI_MODELS;
  },

  /**
   * Tests and validates the user's API Key against Google AI Studio API
   */
  async testApiKey(customKey?: string): Promise<{ valid: boolean; model?: string; error?: string }> {
    const keyToTest = (customKey || getStoredGeminiApiKey()).trim();

    if (!keyToTest) {
      return {
        valid: false,
        error: 'API Key belum diisi. Masukkan API Key gratis dari Google AI Studio.',
      };
    }

    const candidateModels = await this.getAvailableModels(keyToTest);
    let lastError = '';

    for (const item of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${item.ver}/models/${item.name}:generateContent?key=${encodeURIComponent(keyToTest)}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': keyToTest,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Ping test' }] }],
          }),
        });

        if (response.ok) {
          return { valid: true, model: item.name };
        }

        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid') || errMsg.includes('API key'))) {
          return {
            valid: false,
            error: `API Key tidak valid: ${errMsg}. Silakan periksa kembali kunci dari Google AI Studio.`,
          };
        }

        if (response.status === 403) {
          return {
            valid: false,
            error: `Akses ditolak (403): ${errMsg}. Pastikan API Key diizinkan untuk Generative Language API di Google Cloud / AI Studio.`,
          };
        }

        if (response.status === 429 || errMsg.includes('RESOURCE_EXHAUSTED')) {
          return {
            valid: false,
            error: 'Batas kuota harian/menit API Key ini terlampaui (429 Rate Limit). Coba beberapa saat lagi atau buat API Key baru gratis di Google AI Studio.',
          };
        }

        lastError = errMsg;
      } catch (err: any) {
        lastError = err.message || 'Koneksi jaringan terputus (CORS / AdBlocker / Browser Extension).';
      }
    }

    return {
      valid: false,
      error: lastError ? `Gagal terhubung (${lastError})` : 'Tidak dapat terhubung ke Google AI Studio. Pastikan API Key benar dan koneksi internet aktif.',
    };
  },

  /**
   * Generate questions using Google Gemini API with automatic dynamic model fallback
   */
  async generateQuestions(params: AIGenerateParams): Promise<{ success: boolean; questions: Question[]; error?: string }> {
    const apiKey = (params.apiKey || getStoredGeminiApiKey()).trim();

    if (!apiKey) {
      return {
        success: false,
        questions: [],
        error: 'API Key Google Gemini pribadi belum diisi. Masukkan API Key gratis Anda dari Google AI Studio untuk melanjutkan.',
      };
    }

    const difficultyLabels = {
      easy: 'Mudah (Pemahaman & C1-C2)',
      medium: 'Sedang (Aplikasi & C3)',
      hard: 'Sulit (Analisis & C4)',
      hots: 'HOTS / Berpikir Kritis Tingkat Tinggi (Analisis, Evaluasi, Kreasi, Studi Kasus Kontekstual & C4-C6)',
    };

    const isMixed = params.mode === 'mixed' && params.composition;
    let taskSpecification = '';

    if (isMixed && params.composition) {
      const parts: string[] = [];
      if (params.composition.multiple_choice > 0) parts.push(`${params.composition.multiple_choice} butir Pilihan Ganda (multiple_choice)`);
      if (params.composition.true_false > 0) parts.push(`${params.composition.true_false} butir Benar/Salah (true_false)`);
      if (params.composition.short_answer > 0) parts.push(`${params.composition.short_answer} butir Isian Singkat (short_answer)`);
      if (params.composition.essay > 0) parts.push(`${params.composition.essay} butir Uraian (essay)`);
      
      const totalCount = (params.composition.multiple_choice || 0) + 
                         (params.composition.true_false || 0) + 
                         (params.composition.short_answer || 0) + 
                         (params.composition.essay || 0);

      taskSpecification = `Tugas Anda adalah membuat KOMPOSISI CAMPURAN total ${totalCount} butir soal yang terdiri dari:\n- ` + parts.join('\n- ');
    } else {
      const singleType = params.questionType || 'multiple_choice';
      const singleCount = params.count || 5;
      const typeNames: Record<QuestionType, string> = {
        multiple_choice: 'Pilihan Ganda (multiple_choice)',
        true_false: 'Benar / Salah (true_false)',
        short_answer: 'Isian Singkat (short_answer)',
        essay: 'Uraian / Esai (essay)',
      };
      taskSpecification = `Tugas Anda adalah membuat ${singleCount} butir soal jenis ${typeNames[singleType]} sesuai spesifikasi berikut:`;
    }

    const promptText = `
Anda adalah Pakar Pembuat Soal Ujian Kurikulum Merdeka Indonesia & Pengembang Soal CBT Profesional.
${taskSpecification}

- Mata Pelajaran: ${params.subject || 'Umum'}
- Jenjang / Tingkat Kelas: ${params.gradeLevel || 'Kelas X'}
- Topik / Kisi-Kisi Materi: ${params.topic}
- Tingkat Kesulitan: ${difficultyLabels[params.difficulty]}
${params.referenceMaterial ? `- Bahan Bacaan / Rangkuman Materi Acuan:\n"""\n${params.referenceMaterial}\n"""` : ''}

Ketentuan Khusus Format Soal per Tipe:
1. Pilihan Ganda ("type": "multiple_choice"):
   - Berikan 4 opsi (A, B, C, D) untuk SD/SMP atau 5 opsi (A, B, C, D, E) untuk SMA/SMK.
   - Tetapkan tepat 1 opsi yang benar dengan "isCorrect": true, opsi lainnya "isCorrect": false.
2. Benar / Salah ("type": "true_false"):
   - Berupa pernyataan faktual/analisis materi.
   - Sediakan tepat 2 opsi:
     [
       { "label": "A", "text": "Benar", "isCorrect": true / false },
       { "label": "B", "text": "Salah", "isCorrect": true / false }
     ]
3. Isian Singkat ("type": "short_answer"):
   - Pertanyaan mengarah pada jawaban singkat yang pasti, terukur, dan definitif (misal: angka, istilah ilmiah, rumus, tahun, kata kunci tunggal).
   - "options" dikosongkan ([]).
   - Cantumkan kunci jawaban singkat persis pada field "correctAnswerText".
4. Uraian ("type": "essay"):
   - Pertanyaan berupa analisis mendalam, studi kasus, atau penyelesaian bertahap.
   - "options" dikosongkan ([]).
   - Cantumkan rubrik penilaian dan panduan kunci jawaban lengkap pada field "explanation".

ATURAN PENULISAN RUMUS MATEMATIKA & SAINS (SANGAT PENTING):
- SEMUA simbol, rumus, pecahan, akar, eksponen, variabel, dan persamaan HARUS selalu diapit tanda dollar '$...$' untuk formula sebaris (inline) atau '$$...$$' untuk rumus terpusat.
- Contoh pertanyaan: "Tentukan nilai $x$ dari persamaan $x^2 - 5x + 6 = 0$ jika $x > 0$!" atau "Hitunglah nilai $\\frac{1}{2} + \\sqrt{16}$!".
- Contoh pilihan jawaban: "$x = 2$ atau $x = 3$", "$\\frac{3}{4}$", "$10\\sqrt{3}\\text{ cm}$".
- JANGAN pernah menulis rumus matematika sebagai teks kode markdown mentah tanpa tanda dollar '$...$'.

Keluarkan HANYA JSON murni (array of objects) dengan struktur berikut:
[
  {
    "questionText": "Teks lengkap pertanyaan...",
    "type": "multiple_choice" | "true_false" | "short_answer" | "essay",
    "options": [
      { "label": "A", "text": "...", "isCorrect": true },
      { "label": "B", "text": "...", "isCorrect": false }
    ],
    "correctAnswerText": "...",
    "explanation": "Pembahasan / rubrik penilaian lengkap...",
    "points": 10
  }
]
`;

    const candidateModels = await this.getAvailableModels(apiKey);
    let lastError = 'Gagal menghubungi Gemini API.';

    // Try candidate models in order until one succeeds
    for (const item of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${item.ver}/models/${item.name}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const requestBody = {
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            responseMimeType: 'application/json',
          },
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

          if (response.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid'))) {
            return {
              success: false,
              questions: [],
              error: 'API Key Google Gemini pribadi Anda tidak valid. Silakan periksa kembali API Key yang Anda salin dari Google AI Studio.',
            };
          }

          if (response.status === 429) {
            return {
              success: false,
              questions: [],
              error: 'Batas kuota Gemini harian/menit terlampaui (Rate limit). Harap tunggu beberapa saat atau gunakan akun Google lain.',
            };
          }

          lastError = errMsg;
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          lastError = 'AI tidak memberikan teks balasan.';
          continue;
        }

        // Parse JSON from response
        let cleanJson = rawText.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        }

        const parsedArray: GeneratedQuestionItem[] = JSON.parse(cleanJson);

        if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
          lastError = 'Format JSON dari AI tidak sesuai format array pertanyaan.';
          continue;
        }

        // Convert into Application Question Format
        const mappedQuestions: Question[] = parsedArray.map((item, idx) => {
          const questionId = generateUUID();
          const qType: QuestionType = item.type || (params.questionType || 'multiple_choice');

          // Calculate points: check custom type points or default
          let calculatedPoints = 10;
          if (params.pointsPerType && typeof params.pointsPerType[qType] === 'number') {
            calculatedPoints = params.pointsPerType[qType]!;
          } else if (typeof params.defaultPoints === 'number') {
            calculatedPoints = params.defaultPoints;
          } else if (typeof item.points === 'number' && item.points > 0) {
            calculatedPoints = item.points;
          }

          let optionsList: { id: string; label: string; text: string }[] = [];
          let correctOptionId: string | undefined = undefined;

          if (qType === 'multiple_choice') {
            optionsList = (item.options || []).map((opt, optIdx) => ({
              id: generateUUID(),
              label: opt.label || String.fromCharCode(65 + optIdx),
              text: opt.text || '',
            }));

            const correctIdx = (item.options || []).findIndex((o) => o.isCorrect);
            if (correctIdx >= 0 && optionsList[correctIdx]) {
              correctOptionId = optionsList[correctIdx].id;
            } else if (optionsList.length > 0) {
              correctOptionId = optionsList[0].id;
            }
          } else if (qType === 'true_false') {
            const trueId = generateUUID();
            const falseId = generateUUID();
            optionsList = [
              { id: trueId, label: 'Benar', text: 'Benar' },
              { id: falseId, label: 'Salah', text: 'Salah' },
            ];

            const trueOpt = (item.options || []).find((o) => o.text?.toLowerCase().includes('benar') && o.isCorrect);
            const falseOpt = (item.options || []).find((o) => o.text?.toLowerCase().includes('salah') && o.isCorrect);

            if (trueOpt) {
              correctOptionId = trueId;
            } else if (falseOpt) {
              correctOptionId = falseId;
            } else {
              correctOptionId = trueId;
            }
          } else {
            // short_answer or essay: options empty
            optionsList = [];
          }

          return {
            id: questionId,
            number: idx + 1,
            type: qType,
            questionText: item.questionText || `Butir Soal #${idx + 1}`,
            options: optionsList,
            correctOptionId,
            correctAnswerText: item.correctAnswerText || undefined,
            explanation: item.explanation || undefined,
            points: calculatedPoints,
          };
        });

        // Successful generation!
        return {
          success: true,
          questions: mappedQuestions,
        };
      } catch (err: any) {
        console.warn(`Exception calling model ${item.name} on ${item.ver}:`, err);
        lastError = err.message || 'Terjadi kesalahan sistem.';
      }
    }

    return {
      success: false,
      questions: [],
      error: `Gagal memanggil Gemini AI: ${lastError}`,
    };
  },
};
