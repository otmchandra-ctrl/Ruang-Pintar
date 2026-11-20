"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
  isArabic?: boolean;
}

function renderTextWithCode(text: string, keyPrefix: string) {
  const codeRegex = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIdx = 0;
  let codeMatch: RegExpExecArray | null;
  let subKey = 0;

  while ((codeMatch = codeRegex.exec(text)) !== null) {
    if (codeMatch.index > lastIdx) {
      elements.push(
        <span key={`${keyPrefix}-t-${subKey++}`} className="whitespace-pre-wrap">
          {text.substring(lastIdx, codeMatch.index)}
        </span>
      );
    }
    const lang = codeMatch[1]?.trim();
    const codeBody = codeMatch[2]?.trimEnd();
    elements.push(
      <div
        key={`${keyPrefix}-c-${subKey++}`}
        className="my-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 p-3.5 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner leading-relaxed select-text"
      >
        {lang && (
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-800">
            {lang}
          </div>
        )}
        <pre className="m-0 p-0 font-mono whitespace-pre">{codeBody}</pre>
      </div>
    );
    lastIdx = codeRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    elements.push(
      <span key={`${keyPrefix}-t-${subKey++}`} className="whitespace-pre-wrap">
        {text.substring(lastIdx)}
      </span>
    );
  }
  return elements;
}

/**
 * MathRenderer — Merender teks campuran dengan rumus LaTeX / KaTeX ($...$ atau $$...$$),
 * blok kode sintaks pemrograman (```java ... ```), dan mendukung orientasi teks Arab (RTL).
 */
export function MathRenderer({ content, className = "", isArabic = false }: MathRendererProps) {
  // Deteksi otomatis jika teks mengandung karakter Arab
  const hasArabicChars = useMemo(() => {
    return (
      isArabic ||
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(content || "")
    );
  }, [content, isArabic]);

  // Parser teks yang memisahkan antara teks biasa, inline math ($...$), dan block math ($$...$$)
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Regex untuk memisahkan $$block$$ dan $inline$
    const parts: React.ReactNode[] = [];
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    let keyIdx = 0;

    while ((match = regex.exec(content)) !== null) {
      // Teks sebelum rumus
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        parts.push(...renderTextWithCode(textBefore, `pre-${keyIdx++}`));
      }

      const mathStr = match[0];
      const isBlock = mathStr.startsWith("$$") && mathStr.endsWith("$$");
      const latex = isBlock ? mathStr.slice(2, -2).trim() : mathStr.slice(1, -1).trim();

      try {
        const html = katex.renderToString(latex, {
          displayMode: isBlock,
          throwOnError: false,
          output: "htmlAndMathml",
        });

        parts.push(
          <span
            key={`math-${keyIdx++}`}
            dangerouslySetInnerHTML={{ __html: html }}
            className={
              isBlock
                ? "block my-2 text-center overflow-x-auto py-1"
                : "inline-block px-1 align-baseline"
            }
          />
        );
      } catch {
        // Fallback jika terjadi error sintaks LaTeX
        parts.push(
          <code
            key={`math-err-${keyIdx++}`}
            className="text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-300 px-1 rounded text-xs font-mono"
          >
            {mathStr}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Sisa teks setelah rumus terakhir
    if (lastIndex < content.length) {
      parts.push(...renderTextWithCode(content.substring(lastIndex), `post-${keyIdx++}`));
    }

    return parts;
  }, [content]);

  return (
    <div
      dir={hasArabicChars ? "rtl" : "ltr"}
      className={`leading-relaxed text-inherit ${
        hasArabicChars ? "font-serif text-lg leading-loose text-right antialiased" : ""
      } ${className}`}
    >
      {renderedElements}
    </div>
  );
}
