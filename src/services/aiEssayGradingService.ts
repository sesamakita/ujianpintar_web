import { getStoredGeminiApiKey, setStoredGeminiApiKey, aiQuestionService, DEFAULT_GEMINI_MODELS } from './aiQuestionService';

const STORAGE_KEY = 'ujianpintar_gemini_api_key';

export interface EssayEvalRequest {
  id: string;
  studentName: string;
  questionText: string;
  rubricOrModelAnswer?: string;
  maxPoints: number;
  studentAnswer: string;
}

export interface EssayEvalResponse {
  id: string;
  success: boolean;
  suggestedScore: number;
  feedback: string;
  error?: string;
}

export const aiEssayGradingService = {
  getStoredApiKey(): string {
    const fromQuestionService = getStoredGeminiApiKey();
    if (fromQuestionService) return fromQuestionService;
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('gemini_api_key') ||
      localStorage.getItem('GOOGLE_GEMINI_API_KEY') ||
      ''
    ).trim();
  },

  setStoredApiKey(key: string): void {
    setStoredGeminiApiKey(key);
  },

  /**
   * Evaluate a single student essay answer using Google Gemini AI
   */
  async evaluateSingleEssay(
    item: EssayEvalRequest,
    apiKey?: string
  ): Promise<EssayEvalResponse> {
    const key = (apiKey || this.getStoredApiKey()).trim();
    if (!key) {
      return {
        id: item.id,
        success: false,
        suggestedScore: 0,
        feedback: '',
        error: 'API Key Google Gemini pribadi belum diatur. Masukkan API Key gratis Anda pada tombol Atur Key AI.',
      };
    }

    const cleanAnswer = (item.studentAnswer || '').trim();
    if (!cleanAnswer) {
      return {
        id: item.id,
        success: true,
        suggestedScore: 0,
        feedback: 'Siswa tidak menuliskan lembar jawaban uraian ini (jawaban kosong).',
      };
    }

    const systemPrompt = `Anda adalah Asisten Penilai Ujian (Educational Essay Evaluator) ahli, adil, dan objektif dalam kurikulum Indonesia.
Tugas Anda adalah menilai jawaban uraian / esai siswa berdasarkan butir soal dan kunci/rubrik acuan yang disiapkan oleh guru.

Pedoman Penilaian:
1. Pahami esensi konsep dan kebenaran makna (evaluasi semantik), bukan kesamaan kata perkata. Siswa dapat menggunakan gaya bahasa sendiri.
2. Jika butir soal tidak memiliki kunci jawaban khusus dari guru, gunakan konsep umum yang ilmiah, logis, dan relevan dengan pertanyaan.
3. Berikan skor bilangan bulat yang adil dan proporsional antara 0 sampai ${item.maxPoints} poin:
   - Sempurna / Menyeluruh (90% - 100% dari ${item.maxPoints}): Konsep tepat, runtut, dan menjawab inti pertanyaan secara lengkap.
   - Baik & Relevan (70% - 89% dari ${item.maxPoints}): Konsep utama benar dan logis, meski ada sedikit detail pendukung yang kurang.
   - Cukup / Sebagian Benar (40% - 69% dari ${item.maxPoints}): Siswa memahami sebagian konsep dasar atau menuliskan beberapa poin yang benar namun belum lengkap.
   - Kurang / Minimalis (15% - 39% dari ${item.maxPoints}): Hanya menyentuh sebagian kecil kata kunci atau gagasan awal yang relevan.
   - Tidak Relevan / Asal-asalan (0 poin): Jawaban sama sekali tidak berkaitan dengan topik soal atau teks acak tanpa makna.
4. Tuliskan "feedback" singkat (1-2 kalimat) yang edukatif, apresiatif, dan menjelaskan alasan pemberian skor tersebut.
5. Wajib merespons HANYA dalam format JSON valid:
{
  "suggestedScore": number,
  "feedback": "alasan penilaian singkat dan konstruktif"
}`;

    const userPrompt = `DATA PENILAIAN BUTIR SOAL URAIAN:
- Pertanyaan Soal: "${item.questionText}"
- Kunci / Rubrik Acuan Guru: "${item.rubricOrModelAnswer ? item.rubricOrModelAnswer.trim() : 'Gunakan pemahaman konsep umum yang ilmiah dan relevan dengan pertanyaan.'}"
- Skor Maksimal Soal: ${item.maxPoints} Poin
- Nama Siswa: ${item.studentName}
- Teks Jawaban Siswa: "${cleanAnswer}"

Berikan penilaian objektif dalam format JSON { "suggestedScore": number, "feedback": string }`;

    let candidateModels = await aiQuestionService.getAvailableModels(key);
    if (!candidateModels || candidateModels.length === 0) {
      candidateModels = DEFAULT_GEMINI_MODELS;
    }

    let lastError = '';

    for (const modelItem of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/${modelItem.ver}/models/${modelItem.name}:generateContent?key=${encodeURIComponent(key)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.85,
              maxOutputTokens: 1500,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

          if (response.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid'))) {
            return {
              id: item.id,
              success: false,
              suggestedScore: 0,
              feedback: '',
              error: 'API Key Google Gemini tidak valid. Silakan periksa kembali API Key Anda di menu Atur Key AI.',
            };
          }

          if (response.status === 429 || errMsg.includes('RESOURCE_EXHAUSTED')) {
            return {
              id: item.id,
              success: false,
              suggestedScore: 0,
              feedback: '',
              error: 'Batas kuota Gemini harian/menit terlampaui (Rate limit). Harap tunggu 1-2 menit atau buat API Key baru gratis di Google AI Studio.',
            };
          }

          lastError = errMsg;
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastError = 'AI tidak memberikan respons teks.';
          continue;
        }

        let cleanJson = rawText.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        }

        let parsed: any = null;
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          const jsonMatch =
            rawText.match(/\{[\s\S]*"suggestedScore"[\s\S]*\}/i) ||
            rawText.match(/\{[\s\S]*"score"[\s\S]*\}/i) ||
            rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch {}
          }
        }

        let rawScore =
          parsed?.suggestedScore ??
          parsed?.suggested_score ??
          parsed?.score ??
          parsed?.nilai ??
          parsed?.skor ??
          parsed?.points ??
          parsed?.earnedPoints;

        if (typeof rawScore === 'string') {
          const matchNum = rawScore.match(/(\d+(\.\d+)?)/);
          if (matchNum) {
            rawScore = parseFloat(matchNum[1]);
          }
        }

        if (rawScore === undefined || rawScore === null || isNaN(Number(rawScore))) {
          lastError = 'Format nilai AI tidak dapat diekstraksi.';
          continue;
        }

        const parsedScore = Math.max(0, Math.min(item.maxPoints, Math.round(Number(rawScore))));
        const feedbackText =
          parsed?.feedback ||
          parsed?.alasan ||
          parsed?.catatan ||
          parsed?.reason ||
          `Evaluasi AI: ${parsedScore}/${item.maxPoints} Poin.`;

        return {
          id: item.id,
          success: true,
          suggestedScore: parsedScore,
          feedback: feedbackText,
        };
      } catch (err: any) {
        lastError = err.message || 'Kesalahan memanggil AI.';
      }
    }

    return {
      id: item.id,
      success: false,
      suggestedScore: 0,
      feedback: '',
      error: lastError || 'Gagal memproses penilaian AI. Pastikan kuota API Key Gemini Anda masih aktif.',
    };
  },

  /**
   * Batch evaluate multiple student essay answers with slight throttling
   */
  async batchEvaluateEssays(
    items: EssayEvalRequest[],
    apiKey?: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<EssayEvalResponse[]> {
    const results: EssayEvalResponse[] = [];
    const total = items.length;

    for (let i = 0; i < total; i++) {
      const item = items[i];
      const res = await this.evaluateSingleEssay(item, apiKey);
      results.push(res);

      if (onProgress) {
        onProgress(i + 1, total);
      }

      // Small 250ms pause between requests to respect Gemini free-tier rate limits
      if (i < total - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    return results;
  },
};
