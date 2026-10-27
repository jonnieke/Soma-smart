import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/** AI responses use both dollar and TeX delimiters; keep code blocks untouched. */
export function learnerMathMarkdown(content: string): string {
  if (!content) return '';
  return content
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) =>
      index % 2
        ? part
        : part
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `\n\n$$\n${math}\n$$\n\n`)
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math}$`)
    )
    .join('');
}

const REMARK_PLUGINS = [remarkMath];
const REHYPE_PLUGINS: any = [
  [
    rehypeKatex,
    {
      trust: false,
      strict: 'ignore',
      throwOnError: false,
      errorColor: '#dc2626',
      maxSize: 50,
      maxExpand: 200,
    },
  ],
];

export const LearnerMarkdown: React.FC<{ content: string; className?: string }> = React.memo(
  function LearnerMarkdown({ content, className = '' }) {
    const formatted = useMemo(() => learnerMathMarkdown(content), [content]);

    return (
      <div
        className={`prose prose-indigo max-w-none break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 ${className}`}
        style={{
          contentVisibility: 'auto',
          containIntrinsicSize: '0 80px',
        }}
      >
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
          {formatted}
        </ReactMarkdown>
      </div>
    );
  }
);

export default LearnerMarkdown;
