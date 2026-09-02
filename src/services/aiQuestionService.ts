import { generateUUID } from './examService';
import type { Question } from '../types/exam';

export interface AIGenerateParams {
  subject: string;
  gradeLevel: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'hots';
  count: number;
  questionType: 'multiple_choice' | 'essay';
  referenceMaterial?: string;
  apiKey?: string;
}

export interface GeneratedQuestionItem {
  questionText: string;
  type: 'multiple_choice' | 'essay';
  options: { label: string; text: string; isCorrect: boolean }[];
  correctAnswerText?: string;
  explanation?: string;
  points: number;
}

const STORAGE_API_KEY = 'ujianpintar_gemini_api_key';

/**
 * Returns strictly the user's personal API Key stored in their browser localStorage.
 * No shared server environment keys are used.
 */
export const getStoredGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem(STORAGE_API_KEY);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  }
  return '';
};

/**
 * Persists the user's personal API Key to their local browser storage.
 */
export const setStoredGeminiApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_API_KEY);
    }
  }
};

/**
 * Checks if the user has configured their personal Gemini API Key.
 */
export const hasUserGeminiApiKey = (): boolean => {
  return Boolean(getStoredGeminiApiKey());
};

// Candidate models in priority order for robust generation
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-pro',
];

export const aiQuestionService = {
  getStoredApiKey: getStoredGeminiApiKey,
  setStoredApiKey: setStoredGeminiApiKey,
  hasApiKey: hasUserGeminiApiKey,

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

    for (const modelName of GEMINI_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${keyToTest}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Ping test' }] }],
          }),
        });

        if (response.ok) {
          return { valid: true, model: modelName };
        }

        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status}`;

        if (response.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid'))) {
          return {
            valid: false,
            error: 'API Key tidak valid. Silakan periksa kembali kunci yang Anda salin dari Google AI Studio.',
          };
        }

        if (response.status === 429) {
          return {
            valid: false,
            error: 'Batas kuota harian/menit API Key ini terlampaui. Coba beberapa saat lagi atau gunakan akun Google lain.',
          };
        }
      } catch (err: any) {
        console.warn(`Test API Key model ${modelName} error:`, err);
      }
    }

    return {
      valid: false,
      error: 'Tidak dapat terhubung ke Google AI Studio. Pastikan API Key benar dan koneksi internet aktif.',
    };
  },

  /**
   * Generate questions using Google Gemini API with automatic model fallback
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

    const promptText = `
Anda adalah Pakar Pembuat Soal Ujian Kurikulum Merdeka Indonesia & Pengembang Soal CBT Profesional.
Tugas Anda adalah membuat ${params.count} butir soal ${params.questionType === 'multiple_choice' ? 'Pilihan Ganda (dengan opsi A, B, C, D, atau A-E yang jelas dan berkualitas)' : 'Uraian'} sesuai spesifikasi berikut:

- Mata Pelajaran: ${params.subject || 'Umum'}
- Jenjang / Tingkat Kelas: ${params.gradeLevel || 'Kelas X'}
- Topik / Kisi-Kisi Materi: ${params.topic}
- Tingkat Kesulitan: ${difficultyLabels[params.difficulty]}
- Tipe Soal: ${params.questionType === 'multiple_choice' ? 'Pilihan Ganda (Multiple Choice)' : 'Uraian / Essay'}
${params.referenceMaterial ? `- Bahan Bacaan / Rangkuman Materi Acuan:\n"""\n${params.referenceMaterial}\n"""` : ''}

Ketentuan Khusus:
1. Soal harus berbobot edukatif, berkualitas tinggi, kontekstual, dan bebas dari ambiguitas.
2. ATURAN PENULISAN RUMUS MATEMATIKA & SAINS (SANGAT PENTING):
   - SEMUA simbol, rumus, pecahan, akar, eksponen, variabel, dan persamaan HARUS selalu diapit tanda dollar '$...$' untuk formula sebaris (inline) atau '$$...$$' untuk rumus terpusat.
   - Contoh format pertanyaan: "Tentukan nilai $x$ dari persamaan $x^2 - 5x + 6 = 0$ jika $x > 0$!" atau "Hitunglah nilai $\\frac{1}{2} + \\sqrt{16}$!".
   - Contoh format pilihan jawaban (options): "$x = 2$ atau $x = 3$", "$\\frac{3}{4}$", "$10\\sqrt{3}\\text{ cm}$", "$\\{x \\mid -2 < x < 5\\}$".
   - JANGAN pernah menulis rumus matematika sebagai teks kode markdown mentah tanpa tanda dollar '$...$'.
3. Pilihan ganda harus memiliki 4 opsi (A, B, C, D) untuk SD/SMP atau 5 opsi (A, B, C, D, E) untuk SMA/SMK, dengan tepat 1 kunci jawaban yang benar (isCorrect: true).
4. Sediakan penjelasan / pembahasan singkat dan logis untuk setiap butir soal (gunakan notasi $...$ pada rumus di pembahasan).

Keluarkan HANYA JSON murni (array of objects) dengan struktur berikut:
[
  {
    "questionText": "Teks lengkap pertanyaan...",
    "type": "${params.questionType}",
    "options": [
      { "label": "A", "text": "Teks opsi A", "isCorrect": true },
      { "label": "B", "text": "Teks opsi B", "isCorrect": false },
      { "label": "C", "text": "Teks opsi C", "isCorrect": false },
      { "label": "D", "text": "Teks opsi D", "isCorrect": false }
    ],
    "correctAnswerText": "Kunci jawaban / jawaban acuan",
    "explanation": "Pembahasan singkat mengapa jawaban tersebut benar...",
    "points": 10
  }
]
`;

    let lastError = 'Gagal menghubungi Gemini API.';

    // Try candidate models in order until one succeeds
    for (const modelName of GEMINI_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

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
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`Gemini Model ${modelName} failed:`, errMsg);

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
          // If model is deprecated or not found (404), try next model in loop
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
          const optionsList = (item.options || []).map((opt, optIdx) => ({
            id: generateUUID(),
            label: opt.label || String.fromCharCode(65 + optIdx),
            text: opt.text || '',
          }));

          let correctOptionId: string | undefined = undefined;
          if (item.type === 'multiple_choice') {
            const correctIdx = (item.options || []).findIndex((o) => o.isCorrect);
            if (correctIdx >= 0 && optionsList[correctIdx]) {
              correctOptionId = optionsList[correctIdx].id;
            } else if (optionsList.length > 0) {
              correctOptionId = optionsList[0].id;
            }
          }

          return {
            id: questionId,
            number: idx + 1,
            type: item.type || 'multiple_choice',
            questionText: item.questionText || `Butir Soal #${idx + 1}`,
            options: optionsList,
            correctOptionId,
            correctAnswerText: item.correctAnswerText || undefined,
            explanation: item.explanation || undefined,
            points: item.points || 10,
          };
        });

        // Successful generation!
        return {
          success: true,
          questions: mappedQuestions,
        };
      } catch (err: any) {
        console.warn(`Exception calling model ${modelName}:`, err);
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
