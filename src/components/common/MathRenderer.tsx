import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text?: string;
  math?: string;
  block?: boolean;
  className?: string;
}

/**
 * Escapes HTML characters in plain text to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely renders LaTeX string via KaTeX to HTML string
 */
function renderKatexSafe(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return `<span class="font-mono text-slate-800">${escapeHtml(latex)}</span>`;
  }
}

/**
 * Checks whether an input text contains genuine LaTeX math commands or delimiters.
 */
export function hasMath(input?: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  if (!trimmed) return false;

  // 1. Explicit math delimiters ($...$, $$...$$, \(...\), \[...\])
  if (
    /\$\$[\s\S]+?\$\$/.test(trimmed) ||
    /\\\[[\s\S]+?\\\]/.test(trimmed) ||
    /\$[^\$\n]+?\$/.test(trimmed) ||
    /\\\([\s\S]+?\\\)/.test(trimmed)
  ) {
    return true;
  }

  // 2. Specific LaTeX commands starting with backslash followed by a word
  const latexCommandRegex = /\\(frac|sqrt|times|div|pm|sum|int|alpha|beta|gamma|delta|theta|pi|le|ge|neq|in|begin|cos|sin|tan|cot|sec|csc|log|ln|lim|circ|cdot|approx|infty|vec|bar|hat|partial|degree)\b/;
  if (latexCommandRegex.test(trimmed)) {
    return true;
  }

  // 3. Isolated mathematical expressions like x^2, y_1, 10^{-3}
  if (/[a-zA-Z0-9]\^[0-9a-zA-Z\{]/.test(trimmed) || /[a-zA-Z]_[0-9a-zA-Z\{]/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Parses mixed text containing LaTeX formulas ($...$, $$...$$, \[...\], \(...\))
 * or pure LaTeX expressions and returns HTML
 */
export function formatMathAndText(input?: string, forceBlock = false): string {
  if (!input) return '';

  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. If explicitly passed as pure math without delimiters
  if (
    trimmed.startsWith('\\begin') ||
    (trimmed.startsWith('\\') && !trimmed.includes(' ') && trimmed.length > 2)
  ) {
    return renderKatexSafe(trimmed, forceBlock);
  }

  // 2. Check if the string has math delimiters ($$...$$, $...$, \[...\], \(...\))
  const mathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;

  // Process text parts outside explicit $ ... $
  function processPlainText(rawText: string): string {
    if (!rawText) return '';

    if (/^[a-zA-Z]\s*=\s*-?\d+(?:\.\d+)?$/.test(rawText.trim())) {
      return renderKatexSafe(rawText.trim(), false);
    }

    const tokenRegex = /(-?\b\d+(?:[\.,]\d+)?\b)/g;
    let lastIdx = 0;
    let out = '';
    let m: RegExpExecArray | null;

    while ((m = tokenRegex.exec(rawText)) !== null) {
      const before = rawText.slice(lastIdx, m.index);
      if (before) {
        out += `<span class="normal-text">${escapeHtml(before).replace(/\n/g, '<br/>')}</span>`;
      }
      out += renderKatexSafe(m[0], false);
      lastIdx = m.index + m[0].length;
    }

    const rest = rawText.slice(lastIdx);
    if (rest) {
      out += `<span class="normal-text">${escapeHtml(rest).replace(/\n/g, '<br/>')}</span>`;
    }

    return out;
  }

  if (!mathRegex.test(trimmed)) {
    const latexCommandRegex = /\\(frac|sqrt|times|div|pm|sum|int|alpha|beta|gamma|delta|theta|pi|le|ge|neq|in|cos|sin|tan|cot|sec|csc|log|ln|lim|circ|cdot|approx|infty|vec|bar|hat)\b/;
    if (latexCommandRegex.test(trimmed) && !trimmed.includes('<')) {
      return renderKatexSafe(trimmed, forceBlock);
    }

    return processPlainText(trimmed);
  }

  // Reset regex index
  mathRegex.lastIndex = 0;

  // Split and replace math parts
  let lastIndex = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(trimmed)) !== null) {
    const textBefore = trimmed.slice(lastIndex, match.index);
    if (textBefore) {
      result += processPlainText(textBefore);
    }

    const matchedStr = match[0];
    let formula = matchedStr;
    let isBlock = false;

    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      formula = matchedStr.slice(2, -2);
      isBlock = true;
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      formula = matchedStr.slice(2, -2);
      isBlock = true;
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      formula = matchedStr.slice(2, -2);
      isBlock = false;
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      formula = matchedStr.slice(1, -1);
      isBlock = false;
    }

    result += renderKatexSafe(formula, isBlock || forceBlock);
    lastIndex = match.index + matchedStr.length;
  }

  const remaining = trimmed.slice(lastIndex);
  if (remaining) {
    result += processPlainText(remaining);
  }

  return result;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  text,
  math,
  block = false,
  className = '',
}) => {
  const contentToRender = math || text || '';
  if (!contentToRender.trim()) return null;

  const html = formatMathAndText(contentToRender, block);

  return (
    <span
      className={`math-rendered-content inline-block leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
