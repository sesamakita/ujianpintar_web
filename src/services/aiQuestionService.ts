import { generateUUID } from './examService';
import type { Question, QuestionType } from '../types/exam';
import { parseGeminiError } from './botSettingsService';

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

export type AIProviderType = 'gemini' | 'custom_openai';

export interface AISettingsConfig {
  activeProvider: AIProviderType;
  geminiApiKey: string;
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;
  useChatbotAI?: boolean;
  isInheritedFromChatbot?: boolean;
}

export const AI_SETTINGS_STORAGE_KEY = 'ujianpintar_ai_settings';
export const PRIMARY_STORAGE_KEY = 'ujianpintar_gemini_api_key';
export const STORAGE_KEY_BOT_SETTINGS = 'ujianpintar_whatsapp_bot_settings';

// Legacy keys for one-time migration only. New writes go ONLY to PRIMARY_STORAGE_KEY & AI_SETTINGS_STORAGE_KEY.
const LEGACY_API_KEYS = [
  'gemini_api_key',
  'GOOGLE_GEMINI_API_KEY',
  'google_api_key',
  'ai_generator_api_key',
];

export interface ChatbotAISummary {
  hasConfig: boolean;
  provider: 'gemini' | 'groq' | 'deepseek' | 'custom_openai' | 'fallback_local';
  providerLabel: string;
  model: string;
  geminiApiKey?: string;
  customBaseUrl?: string;
  customApiKey?: string;
  customModel?: string;
}

/**
 * Membaca ringkasan setelan AI yang tersimpan di panel Otak Chatbot Super Admin
 */
export const getChatbotAISummary = (): ChatbotAISummary => {
  if (typeof window === 'undefined') {
    return { hasConfig: false, provider: 'fallback_local', providerLabel: 'Belum Ada Kunci', model: '-' };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOT_SETTINGS);
    if (!raw) return { hasConfig: false, provider: 'fallback_local', providerLabel: 'Belum Dikonfigurasi', model: '-' };
    const bot = JSON.parse(raw);
    const provider = bot.activeProvider || 'gemini';

    if (provider === 'gemini' && bot.geminiApiKey && bot.geminiApiKey.trim()) {
      return {
        hasConfig: true,
        provider: 'gemini',
        providerLabel: 'Google Gemini AI',
        model: bot.geminiModel || 'gemini-1.5-flash',
        geminiApiKey: bot.geminiApiKey.trim(),
      };
    }
    if (provider === 'groq' && bot.groqApiKey && bot.groqApiKey.trim()) {
      return {
        hasConfig: true,
        provider: 'groq',
        providerLabel: 'Groq Cloud (Llama 3.3)',
        model: bot.groqModel || 'llama-3.3-70b-versatile',
        customBaseUrl: 'https://api.groq.com/openai/v1',
        customApiKey: bot.groqApiKey.trim(),
        customModel: bot.groqModel || 'llama-3.3-70b-versatile',
      };
    }
    if (provider === 'deepseek' && bot.deepseekApiKey && bot.deepseekApiKey.trim()) {
      return {
        hasConfig: true,
        provider: 'deepseek',
        providerLabel: 'DeepSeek AI',
        model: bot.deepseekModel || 'deepseek-chat',
        customBaseUrl: 'https://api.deepseek.com/v1',
        customApiKey: bot.deepseekApiKey.trim(),
        customModel: bot.deepseekModel || 'deepseek-chat',
      };
    }
    if (provider === 'custom_openai' && bot.customApiKey && bot.customBaseUrl) {
      return {
        hasConfig: true,
        provider: 'custom_openai',
        providerLabel: 'Custom AI (OpenAI)',
        model: bot.customModel || 'gpt-4o-mini',
        customBaseUrl: bot.customBaseUrl.trim(),
        customApiKey: bot.customApiKey.trim(),
        customModel: bot.customModel || 'gpt-4o-mini',
      };
    }
    // Fallback: Jika provider di bot bukan gemini tapi ada geminiApiKey
    if (bot.geminiApiKey && bot.geminiApiKey.trim()) {
      return {
        hasConfig: true,
        provider: 'gemini',
        providerLabel: 'Google Gemini AI',
        model: bot.geminiModel || 'gemini-1.5-flash',
        geminiApiKey: bot.geminiApiKey.trim(),
      };
    }
    if (bot.groqApiKey && bot.groqApiKey.trim()) {
      return {
        hasConfig: true,
        provider: 'groq',
        providerLabel: 'Groq Cloud (Llama 3.3)',
        model: bot.groqModel || 'llama-3.3-70b-versatile',
        customBaseUrl: 'https://api.groq.com/openai/v1',
        customApiKey: bot.groqApiKey.trim(),
        customModel: bot.groqModel || 'llama-3.3-70b-versatile',
      };
    }
    if (bot.deepseekApiKey && bot.deepseekApiKey.trim()) {
      return {
        hasConfig: true,
        provider: 'deepseek',
        providerLabel: 'DeepSeek AI',
        model: bot.deepseekModel || 'deepseek-chat',
        customBaseUrl: 'https://api.deepseek.com/v1',
        customApiKey: bot.deepseekApiKey.trim(),
        customModel: bot.deepseekModel || 'deepseek-chat',
      };
    }
  } catch (e) {
    console.warn('Error reading chatbot AI summary:', e);
  }
  return { hasConfig: false, provider: 'fallback_local', providerLabel: 'Belum Ada Kunci', model: '-' };
};

/**
 * Menyinkronkan setelan AI sekolah dengan setelan Chatbot Super Admin secara instan
 */
export const syncAISettingsFromChatbot = (): {
  success: boolean;
  message: string;
  settings?: AISettingsConfig;
} => {
  const summary = getChatbotAISummary();
  if (!summary.hasConfig) {
    return {
      success: false,
      message: 'Belum ada kunci API yang tersimpan di setelan Chatbot Super Admin. Silakan buka menu Super Admin > Otak Chatbot WA untuk mengisi kunci API terlebih dahulu.',
    };
  }

  let newSettings: Partial<AISettingsConfig> = {
    useChatbotAI: true,
  };

  if (summary.provider === 'gemini') {
    newSettings = {
      activeProvider: 'gemini',
      geminiApiKey: summary.geminiApiKey || '',
      useChatbotAI: true,
    };
  } else {
    newSettings = {
      activeProvider: 'custom_openai',
      customBaseUrl: summary.customBaseUrl || 'https://api.groq.com/openai/v1',
      customApiKey: summary.customApiKey || '',
      customModel: summary.customModel || 'llama-3.3-70b-versatile',
      useChatbotAI: true,
    };
  }

  setStoredAISettings(newSettings);
  return {
    success: true,
    message: `Berhasil menyinkronkan setelan AI dari Chatbot! Menggunakan ${summary.providerLabel} (${summary.model}).`,
    settings: getStoredAISettings(),
  };
};

/**
 * Returns the user's personal API Key stored in their browser localStorage.
 * Reads the primary key, falling back to legacy keys, or Chatbot settings if personal is empty.
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

    // Fallback cerdas: Ambil dari setelan Chatbot jika kunci pribadi guru belum diisi
    const botSummary = getChatbotAISummary();
    if (botSummary.geminiApiKey) {
      return botSummary.geminiApiKey;
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
 * Reads centralized AI settings (Google Gemini & Custom OpenAI-compatible providers),
 * automatically falling back to Chatbot settings when enabled or when personal keys are blank.
 */
export const getStoredAISettings = (): AISettingsConfig => {
  const defaults: AISettingsConfig = {
    activeProvider: 'gemini',
    geminiApiKey: '',
    customBaseUrl: 'https://api.groq.com/openai/v1',
    customApiKey: '',
    customModel: 'llama-3.3-70b-versatile',
    useChatbotAI: true,
    isInheritedFromChatbot: false,
  };

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    let parsed: Partial<AISettingsConfig> = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {}
    }

    // Sync legacy/primary geminiApiKey if not present in parsed
    const primaryGeminiKey = localStorage.getItem(PRIMARY_STORAGE_KEY)?.trim() || '';
    let geminiApiKey = (parsed.geminiApiKey || primaryGeminiKey || '').trim();
    let activeProvider: AIProviderType = (parsed.activeProvider === 'custom_openai' ? 'custom_openai' : 'gemini');
    let customBaseUrl = (parsed.customBaseUrl || defaults.customBaseUrl).trim();
    let customApiKey = (parsed.customApiKey || '').trim();
    let customModel = (parsed.customModel || defaults.customModel).trim();
    const useChatbotAI = parsed.useChatbotAI !== false; // Default true (mengizinkan warisan dari Chatbot)
    let isInheritedFromChatbot = false;

    // JIKA useChatbotAI aktif dan kunci sekolah saat ini kosong, otomatis warisi dari setelan Chatbot!
    if (useChatbotAI) {
      const botSummary = getChatbotAISummary();
      if (botSummary.hasConfig) {
        if (activeProvider === 'gemini' && !geminiApiKey) {
          if (botSummary.geminiApiKey) {
            geminiApiKey = botSummary.geminiApiKey;
            isInheritedFromChatbot = true;
          } else if (botSummary.customApiKey) {
            // Chatbot menggunakan Groq/DeepSeek, sesuaikan secara cerdas
            activeProvider = 'custom_openai';
            customBaseUrl = botSummary.customBaseUrl || 'https://api.groq.com/openai/v1';
            customApiKey = botSummary.customApiKey;
            customModel = botSummary.customModel || 'llama-3.3-70b-versatile';
            isInheritedFromChatbot = true;
          }
        } else if (activeProvider === 'custom_openai' && !customApiKey) {
          if (botSummary.customApiKey) {
            customBaseUrl = botSummary.customBaseUrl || customBaseUrl;
            customApiKey = botSummary.customApiKey;
            customModel = botSummary.customModel || customModel;
            isInheritedFromChatbot = true;
          } else if (botSummary.geminiApiKey) {
            activeProvider = 'gemini';
            geminiApiKey = botSummary.geminiApiKey;
            isInheritedFromChatbot = true;
          }
        }
      }
    }

    return {
      activeProvider,
      geminiApiKey,
      customBaseUrl,
      customApiKey,
      customModel,
      useChatbotAI,
      isInheritedFromChatbot,
    };
  } catch (err) {
    console.warn('Error reading AI settings from storage:', err);
    return defaults;
  }
};

/**
 * Persists centralized AI settings and syncs primary Gemini key for backward compatibility.
 */
export const setStoredAISettings = (newSettings: Partial<AISettingsConfig>): void => {
  if (typeof window === 'undefined') return;

  try {
    const current = getStoredAISettings();
    const merged: AISettingsConfig = {
      ...current,
      ...newSettings,
      activeProvider: newSettings.activeProvider ?? current.activeProvider,
      geminiApiKey: (newSettings.geminiApiKey !== undefined ? newSettings.geminiApiKey : current.geminiApiKey).trim(),
      customBaseUrl: (newSettings.customBaseUrl !== undefined ? newSettings.customBaseUrl : current.customBaseUrl).trim(),
      customApiKey: (newSettings.customApiKey !== undefined ? newSettings.customApiKey : current.customApiKey).trim(),
      customModel: (newSettings.customModel !== undefined ? newSettings.customModel : current.customModel).trim(),
      useChatbotAI: newSettings.useChatbotAI !== undefined ? newSettings.useChatbotAI : current.useChatbotAI,
    };

    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(merged));

    // Keep primary gemini key in sync jika pengguna menginput manual
    if (newSettings.geminiApiKey !== undefined) {
      setStoredGeminiApiKey(merged.geminiApiKey);
    }
  } catch (err) {
    console.error('Failed to save AI settings:', err);
  }
};

/**
 * Checks if the currently active AI provider is properly configured with keys.
 */
export const hasActiveAIConfig = (): boolean => {
  const settings = getStoredAISettings();
  if (settings.activeProvider === 'custom_openai') {
    return Boolean(settings.customBaseUrl && settings.customApiKey && settings.customModel);
  }
  return Boolean(settings.geminiApiKey);
};

/**
 * Returns human-readable status for active AI provider.
 */
export const getActiveAIProviderInfo = (): {
  provider: AIProviderType;
  providerName: string;
  modelName: string;
  isConfigured: boolean;
  isInheritedFromChatbot: boolean;
} => {
  const settings = getStoredAISettings();
  const isInherited = Boolean(settings.isInheritedFromChatbot);

  if (settings.activeProvider === 'custom_openai') {
    const isConfigured = Boolean(settings.customBaseUrl && settings.customApiKey && settings.customModel);
    return {
      provider: 'custom_openai',
      providerName: isInherited ? 'Custom AI (Tersinkron dari Chatbot)' : 'Custom AI (OpenAI-compatible)',
      modelName: settings.customModel || 'llama-3.3-70b-versatile',
      isConfigured,
      isInheritedFromChatbot: isInherited,
    };
  }

  const isConfigured = Boolean(settings.geminiApiKey);
  return {
    provider: 'gemini',
    providerName: isInherited ? 'Google Gemini (Tersinkron dari Chatbot)' : 'Google Gemini AI Studio',
    modelName: 'Auto-fallback (Gemini Flash)',
    isConfigured,
    isInheritedFromChatbot: isInherited,
  };
};

/**
 * Test connection to custom OpenAI-compatible API (e.g. Groq, DeepSeek, OpenRouter, Mistral, Ollama).
 */
export const testCustomOpenAIConnection = async (config?: {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}): Promise<{ valid: boolean; model?: string; error?: string }> => {
  const current = getStoredAISettings();
  const baseUrl = (config?.baseUrl || current.customBaseUrl || '').trim();
  const apiKey = (config?.apiKey || current.customApiKey || '').trim();
  const model = (config?.model || current.customModel || 'gpt-4o-mini').trim();

  if (!baseUrl) {
    return { valid: false, error: 'Base URL penyedia AI kustom belum diisi.' };
  }
  if (!apiKey) {
    return { valid: false, error: 'API Key / Token penyedia AI kustom belum diisi.' };
  }

  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = cleanUrl.endsWith('/chat/completions') ? cleanUrl : `${cleanUrl}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping test. Jawab kata "PONG".' }],
        max_tokens: 15,
        temperature: 0.1,
      }),
    });

    if (response.ok) {
      return { valid: true, model };
    }

    const errJson = await response.json().catch(() => ({}));
    const errMsg = errJson?.error?.message || errJson?.message || `HTTP ${response.status}: ${response.statusText}`;

    if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        error: `Autentikasi gagal (${response.status}): ${errMsg}. Pastikan API Key / Token benar dan memiliki saldo/kredit aktif.`,
      };
    }

    if (response.status === 404) {
      if (errMsg.toLowerCase().includes('model')) {
        try {
          const modelsEndpoint = cleanUrl.endsWith('/chat/completions')
            ? cleanUrl.replace(/\/chat\/completions$/, '/models')
            : `${cleanUrl}/models`;
          const mRes = await fetch(modelsEndpoint, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          if (mRes.ok) {
            const mData = await mRes.json();
            const list: string[] = Array.isArray(mData?.data)
              ? mData.data.map((m: any) => m.id).filter(Boolean)
              : [];
            if (list.length > 0) {
              return {
                valid: false,
                error: `Model "${model}" tidak tersedia di penyedia ini. Model yang tersedia: ${list.slice(0, 6).join(', ')}. Ganti kolom Nama Model dengan salah satu model tersebut (misal: ${list[0]}).`,
              };
            }
          }
        } catch {}

        return {
          valid: false,
          error: `Nama Model "${model}" tidak tersedia di penyedia ini (${errMsg}). Sesuaikan kolom Nama Model dengan model yang disediakan server.`,
        };
      }

      return {
        valid: false,
        error: `Endpoint tidak ditemukan (404): ${errMsg}. Pastikan Base URL benar (contoh: https://organization.api-github.com/v1).`,
      };
    }

    if (response.status === 429) {
      return {
        valid: false,
        error: `Batas kuota / rate limit terlampaui (429): ${errMsg}.`,
      };
    }

    return {
      valid: false,
      error: `Gagal terhubung (${response.status}): ${errMsg}`,
    };
  } catch (err: any) {
    const isCorsOrNetwork =
      err.name === 'TypeError' ||
      (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError')));
    return {
      valid: false,
      error: isCorsOrNetwork
        ? `Koneksi diblokir oleh kebijakan keamanan peramban (CORS) atau server tidak merespons. Server penyedia (${baseUrl}) belum mengizinkan permintaan langsung dari peramban web (Access-Control-Allow-Origin). Disarankan menggunakan penyedia yang mendukung browser seperti Qodeer (https://organization.api-github.com/v1 dengan model gpt-4o) atau Google AI Studio.`
        : `Koneksi jaringan terputus: ${err.message || 'Periksa koneksi internet.'}`,
    };
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
  getAISettings: getStoredAISettings,
  setAISettings: setStoredAISettings,
  hasActiveConfig: hasActiveAIConfig,
  getActiveProviderInfo: getActiveAIProviderInfo,
  testCustomOpenAI: testCustomOpenAIConnection,
  syncFromChatbot: syncAISettingsFromChatbot,
  getChatbotSummary: getChatbotAISummary,

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
        const parsed = parseGeminiError(errJson, response.status);
        if (parsed.isFatal) {
          return {
            valid: false,
            error: parsed.message,
          };
        }

        lastError = parsed.message;
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
   * Maps raw generated question items from AI into application Question model.
   */
  mapGeneratedItems(parsedArray: GeneratedQuestionItem[], params: AIGenerateParams): Question[] {
    return parsedArray.map((item, idx) => {
      const questionId = generateUUID();
      const qType: QuestionType = item.type || (params.questionType || 'multiple_choice');

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
  },

  /**
   * Internal worker to generate a single batch (at most 5 questions per call)
   */
  async generateSingleBatch(params: AIGenerateParams): Promise<{ success: boolean; questions: Question[]; error?: string }> {
    const aiSettings = getStoredAISettings();
    const explicitKey = (params.apiKey || '').trim();
    const useGemini = Boolean(explicitKey || aiSettings.activeProvider === 'gemini');

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

      taskSpecification = `Tugas Anda adalah membuat KOMPOSISI total ${totalCount} butir soal:\n- ` + parts.join('\n- ');
    } else {
      const singleType = params.questionType || 'multiple_choice';
      const singleCount = params.count || 5;
      const typeNames: Record<QuestionType, string> = {
        multiple_choice: 'Pilihan Ganda (multiple_choice)',
        true_false: 'Benar / Salah (true_false)',
        short_answer: 'Isian Singkat (short_answer)',
        essay: 'Uraian / Esai (essay)',
      };
      taskSpecification = `Tugas Anda adalah membuat ${singleCount} butir soal jenis ${typeNames[singleType]} sesuai kisi-kisi berikut:`;
    }

    const promptText = `
Anda adalah Pakar Pembuat Soal Ujian Kurikulum Merdeka Indonesia & CBT Profesional.
${taskSpecification}

- Mata Pelajaran: ${params.subject || 'Umum'}
- Jenjang / Tingkat Kelas: ${params.gradeLevel || 'Kelas X'}
- Topik / Kisi-Kisi Materi: ${params.topic}
- Tingkat Kesulitan: ${difficultyLabels[params.difficulty]}
${params.referenceMaterial ? `- Bahan Bacaan Acuan:\n"""\n${params.referenceMaterial}\n"""` : ''}

Ketentuan Format Butir Soal per Tipe:
1. Pilihan Ganda ("type": "multiple_choice"):
   - Berikan 4 opsi (A-D) untuk SD/SMP atau 5 opsi (A-E) untuk SMA/SMK.
   - Tepat 1 opsi bernilai "isCorrect": true, lainnya false.
2. Benar / Salah ("type": "true_false"):
   - Dua opsi: [{"label": "A", "text": "Benar", "isCorrect": true/false}, {"label": "B", "text": "Salah", "isCorrect": true/false}].
3. Isian Singkat ("type": "short_answer"):
   - Jawaban eksak/singkat pada field "correctAnswerText". options: [].
4. Uraian ("type": "essay"):
   - options: []. Panduan jawaban/rubrik pada field "explanation".

ATURAN RUMUS MATEMATIKA & SAINS:
- Formula inline diapit dollar '$...$' (contoh: '$x^2 - 4x + 4 = 0$'), formula terpusat diapit '$$...$$'.

ATURAN PENJELASAN (EXPLANATION):
- "explanation" dibuat ringkas, esensial, dan langsung pada langkah kunci solusi (1-2 kalimat).

Keluarkan HANYA format JSON Object dengan struktur:
{
  "questions": [
    {
      "questionText": "Teks pertanyaan lengkap...",
      "type": "multiple_choice",
      "options": [
        { "label": "A", "text": "...", "isCorrect": true },
        { "label": "B", "text": "...", "isCorrect": false }
      ],
      "correctAnswerText": "...",
      "explanation": "Ringkasan solusi singkat...",
      "points": 10
    }
  ]
}
`;

    // -------------------------------------------------------------
    // BRANCH A: CUSTOM OPENAI-COMPATIBLE PROVIDER
    // -------------------------------------------------------------
    if (!useGemini) {
      const baseUrl = (aiSettings.customBaseUrl || '').trim();
      const apiKey = (aiSettings.customApiKey || '').trim();
      const model = (aiSettings.customModel || 'llama-3.3-70b-versatile').trim();

      if (!baseUrl || !apiKey) {
        return {
          success: false,
          questions: [],
          error: 'Penyedia AI Kustom belum dikonfigurasi lengkap (Base URL atau API Key belum diisi di Pengaturan Sekolah).',
        };
      }

      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const endpoint = cleanUrl.endsWith('/chat/completions') ? cleanUrl : `${cleanUrl}/chat/completions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds safety timeout

      try {
        let response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'Anda adalah Pakar CBT Pembuat Soal Ujian Kurikulum Merdeka Indonesia. Balas HANYA format JSON object valid dengan field "questions".'
              },
              {
                role: 'user',
                content: promptText,
              },
            ],
            temperature: 0.6,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        // Fallback retry without response_format if not supported by model/proxy
        if (!response.ok && response.status === 400) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData?.error?.message || '').toLowerCase();
          if (errMsg.includes('response_format') || errMsg.includes('schema') || errMsg.includes('unrecognized parameter')) {
            response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  {
                    role: 'system',
                    content: 'Anda adalah Pakar CBT Pembuat Soal Ujian Kurikulum Merdeka Indonesia. Balas HANYA format JSON object valid dengan field "questions".'
                  },
                  {
                    role: 'user',
                    content: promptText,
                  },
                ],
                temperature: 0.6,
              }),
              signal: controller.signal,
            });
          }
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || errData?.message || `HTTP ${response.status}: ${response.statusText}`;
          return {
            success: false,
            questions: [],
            error: `Gagal memanggil AI Kustom (${response.status}): ${errMsg}`,
          };
        }

        const data = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content;
        if (!rawContent) {
          return {
            success: false,
            questions: [],
            error: 'AI Kustom tidak mengembalikan teks jawaban.',
          };
        }

        let cleanJson = rawContent.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        }

        let parsed: any = null;
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          const arrayMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            try {
              parsed = JSON.parse(arrayMatch[0]);
            } catch {}
          } else {
            const objMatch = cleanJson.match(/\{\s*"[\s\S]*"\s*:\s*[\s\S]*\}/);
            if (objMatch) {
              try {
                parsed = JSON.parse(objMatch[0]);
              } catch {}
            }
          }
        }

        let questionList: GeneratedQuestionItem[] = [];
        if (parsed) {
          if (Array.isArray(parsed)) {
            questionList = parsed;
          } else if (Array.isArray(parsed.questions)) {
            questionList = parsed.questions;
          } else if (Array.isArray(parsed.soal)) {
            questionList = parsed.soal;
          } else if (Array.isArray(parsed.items)) {
            questionList = parsed.items;
          } else if (Array.isArray(parsed.data)) {
            questionList = parsed.data;
          } else if (parsed.questionText) {
            questionList = [parsed];
          }
        }

        if (!Array.isArray(questionList) || questionList.length === 0) {
          return {
            success: false,
            questions: [],
            error: 'Format balasan AI Kustom tidak dapat diubah menjadi daftar soal.',
          };
        }

        const mappedQuestions = this.mapGeneratedItems(questionList, params);
        return {
          success: true,
          questions: mappedQuestions,
        };
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          return {
            success: false,
            questions: [],
            error: 'Permintaan AI terhenti karena melebihi batas waktu (timeout 45 detik). Server AI merespons terlalu lambat. Coba gunakan Google Gemini AI Studio di Pengaturan Sekolah yang jauh lebih cepat dan stabil.',
          };
        }
        return {
          success: false,
          questions: [],
          error: `Gagal menghubungi penyedia AI kustom: ${err.message || 'Kesalahan jaringan/CORS'}`,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // -------------------------------------------------------------
    // BRANCH B: GOOGLE GEMINI AI STUDIO
    // -------------------------------------------------------------
    const apiKey = (explicitKey || getStoredGeminiApiKey()).trim();

    if (!apiKey) {
      return {
        success: false,
        questions: [],
        error: 'API Key Google Gemini pribadi belum diisi. Masukkan API Key gratis Anda di Pengaturan Sekolah atau tombol Atur Kunci AI.',
      };
    }

    const candidateModels = await this.getAvailableModels(apiKey);
    let lastError = 'Gagal menghubungi Gemini API.';

    // Try candidate models in order until one succeeds
    for (const item of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

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
            temperature: 0.6,
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
          signal: controller.signal,
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
              error: 'Batas kuota Gemini harian/menit terlampaui (Rate limit). Harap tunggu beberapa saat atau gunakan penyedia alternatif.',
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

        let parsed: any = null;
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          const arrayMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            try {
              parsed = JSON.parse(arrayMatch[0]);
            } catch {}
          } else {
            const objMatch = cleanJson.match(/\{\s*"[\s\S]*"\s*:\s*[\s\S]*\}/);
            if (objMatch) {
              try {
                parsed = JSON.parse(objMatch[0]);
              } catch {}
            }
          }
        }

        let parsedList: GeneratedQuestionItem[] = [];
        if (parsed) {
          if (Array.isArray(parsed)) {
            parsedList = parsed;
          } else if (Array.isArray(parsed.questions)) {
            parsedList = parsed.questions;
          } else if (Array.isArray(parsed.soal)) {
            parsedList = parsed.soal;
          } else if (Array.isArray(parsed.items)) {
            parsedList = parsed.items;
          } else if (Array.isArray(parsed.data)) {
            parsedList = parsed.data;
          } else if (parsed.questionText) {
            parsedList = [parsed];
          }
        }

        if (!Array.isArray(parsedList) || parsedList.length === 0) {
          lastError = 'Format JSON dari AI tidak sesuai format array pertanyaan.';
          continue;
        }

        const mappedQuestions = this.mapGeneratedItems(parsedList, params);

        return {
          success: true,
          questions: mappedQuestions,
        };
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          lastError = 'Permintaan ke Gemini API timeout (45 detik).';
        } else {
          lastError = err.message || 'Terjadi kesalahan sistem.';
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return {
      success: false,
      questions: [],
      error: `Gagal memanggil Gemini AI: ${lastError}`,
    };
  },

  /**
   * Main entry point to generate questions.
   * Employs intelligent parallel batching (max 5 questions per batch) so requests
   * complete in ~15-25 seconds and never hang or exceed gateway token limits.
   */
  async generateQuestions(params: AIGenerateParams): Promise<{ success: boolean; questions: Question[]; error?: string }> {
    const isSingle = params.mode === 'single' || !params.composition;
    const singleCount = params.count || 5;

    // SINGLE MODE BATCHING
    if (isSingle) {
      if (singleCount <= 5) {
        return this.generateSingleBatch(params);
      }

      // Split count into batches of max 5 questions each
      const batches: number[] = [];
      let rem = singleCount;
      while (rem > 0) {
        const batchSize = Math.min(5, rem);
        batches.push(batchSize);
        rem -= batchSize;
      }

      try {
        const batchPromises = batches.map((size) =>
          this.generateSingleBatch({ ...params, count: size })
        );
        const results = await Promise.all(batchPromises);

        const allQuestions: Question[] = [];
        let firstError: string | undefined;

        for (const res of results) {
          if (res.success && res.questions.length > 0) {
            allQuestions.push(...res.questions);
          } else if (!firstError && res.error) {
            firstError = res.error;
          }
        }

        if (allQuestions.length === 0) {
          return {
            success: false,
            questions: [],
            error: firstError || 'Gagal menghasilkan butir soal dari AI.',
          };
        }

        // Re-number sequentially
        const renumbered = allQuestions.map((q, idx) => ({
          ...q,
          number: idx + 1,
        }));

        return {
          success: true,
          questions: renumbered,
        };
      } catch (err: any) {
        return {
          success: false,
          questions: [],
          error: `Gagal memproses batch soal: ${err.message || 'Terjadi kesalahan internal'}`,
        };
      }
    }

    // MIXED MODE BATCHING
    const comp = params.composition!;
    const totalMixed = (comp.multiple_choice || 0) + (comp.true_false || 0) + (comp.short_answer || 0) + (comp.essay || 0);

    if (totalMixed <= 5) {
      return this.generateSingleBatch(params);
    }

    // Break composition into sub-batches of max 5 questions per batch
    const subBatches: AIGenerateParams[] = [];
    const typeKeys: QuestionType[] = ['multiple_choice', 'true_false', 'short_answer', 'essay'];

    for (const qType of typeKeys) {
      const typeCount = comp[qType] || 0;
      let remaining = typeCount;
      const pts = params.pointsPerType?.[qType] || params.defaultPoints || 10;

      while (remaining > 0) {
        const chunkSize = Math.min(5, remaining);
        subBatches.push({
          ...params,
          mode: 'single',
          questionType: qType,
          count: chunkSize,
          defaultPoints: pts,
        });
        remaining -= chunkSize;
      }
    }

    try {
      // Run sub-batches in parallel
      const results = await Promise.all(subBatches.map((b) => this.generateSingleBatch(b)));

      const allQuestions: Question[] = [];
      let firstError: string | undefined;

      for (const res of results) {
        if (res.success && res.questions.length > 0) {
          allQuestions.push(...res.questions);
        } else if (!firstError && res.error) {
          firstError = res.error;
        }
      }

      if (allQuestions.length === 0) {
        return {
          success: false,
          questions: [],
          error: firstError || 'Gagal menghasilkan komposisi butir soal dari AI.',
        };
      }

      // Re-number sequentially
      const renumbered = allQuestions.map((q, idx) => ({
        ...q,
        number: idx + 1,
      }));

      return {
        success: true,
        questions: renumbered,
      };
    } catch (err: any) {
      return {
        success: false,
        questions: [],
        error: `Gagal memproses komposisi soal: ${err.message || 'Terjadi kesalahan sistem'}`,
      };
    }
  },
};
