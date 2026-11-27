"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
  isArabic?: boolean;
}

function renderMathAndPlainText(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    const mathStr = match[0];
    const isBlock = mathStr.startsWith("$$") && mathStr.endsWith("$$");

    if (!isBlock) {
      const charAfterClose = text[match.index + mathStr.length] ?? "";
      const inner = mathStr.slice(1, -1);
      // Hindari salah tafsir variabel PHP pada satu baris (mis. "$produk1 ... $nama") sebagai rumus KaTeX
      const looksLikeCodeVariables =
        /[A-Za-z0-9_]/.test(charAfterClose) ||
        /(?:->|::|;|\b(?:new|echo|return|public|private|protected|function|class)\b)/.test(inner);
      if (looksLikeCodeVariables) {
        continue;
      }
    }

    if (match.index > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}-t-${keyIdx++}`} className="whitespace-pre-wrap">
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }

    const latex = isBlock ? mathStr.slice(2, -2).trim() : mathStr.slice(1, -1).trim();

    try {
      const html = katex.renderToString(latex, {
        displayMode: isBlock,
        throwOnError: false,
        output: "htmlAndMathml",
      });

      parts.push(
        <span
          key={`${keyPrefix}-m-${keyIdx++}`}
          dangerouslySetInnerHTML={{ __html: html }}
          className={
            isBlock
              ? "block my-2 text-center overflow-x-auto py-1"
              : "inline-block px-1 align-baseline"
          }
        />
      );
    } catch {
      parts.push(
        <code
          key={`${keyPrefix}-merr-${keyIdx++}`}
          className="text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-300 px-1 rounded text-xs font-mono"
        >
          {mathStr}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`${keyPrefix}-t-${keyIdx++}`} className="whitespace-pre-wrap">
        {text.substring(lastIndex)}
      </span>
    );
  }
  return parts;
}

function renderTextWithCodeAndMath(text: string, keyPrefix: string): React.ReactNode[] {
  const codeRegex = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIdx = 0;
  let codeMatch: RegExpExecArray | null;
  let subKey = 0;

  while ((codeMatch = codeRegex.exec(text)) !== null) {
    if (codeMatch.index > lastIdx) {
      elements.push(
        ...renderMathAndPlainText(
          text.substring(lastIdx, codeMatch.index),
          `${keyPrefix}-p-${subKey++}`
        )
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
    elements.push(...renderMathAndPlainText(text.substring(lastIdx), `${keyPrefix}-p-${subKey++}`));
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

  // Ekstrak blok kode terlebih dahulu sebelum mem-parsing rumus LaTeX
  const renderedElements = useMemo(() => {
    if (!content) return null;
    return renderTextWithCodeAndMath(content, "root");
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
