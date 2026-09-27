import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/** AI responses use both dollar and TeX delimiters; keep code blocks untouched. */
export function learnerMathMarkdown(content: string): string {
  return content.split(/(```[\s\S]*?```|`[^`\n]*`)/g).map((part, index) =>
    index % 2 ? part : part
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `\n\n$$\n${math}\n$$\n\n`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math}$`)
  ).join('');
}

export default function LearnerMarkdown({ content }: { content: string }) {
  return <div className="prose prose-indigo max-w-none break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden">
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { trust: false, strict: 'ignore' }]]}>
      {learnerMathMarkdown(content)}
    </ReactMarkdown>
  </div>;
}
