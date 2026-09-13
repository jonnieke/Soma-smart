import React from 'react';
import { splitPaperEquations, type EquationNode } from '../../../services/paperEquationContent';

function mathRow(nodes: EquationNode[]): React.ReactElement {
  return React.createElement('mrow', null, ...nodes.map((node, key) => {
    if (node.kind === 'text') {
      const tag = /^\s+$/.test(node.value) ? 'mtext' : /^\p{N}$/u.test(node.value) ? 'mn' : /^\p{L}$/u.test(node.value) ? 'mi' : 'mo';
      return React.createElement(tag, { key }, node.value);
    }
    if (node.kind === 'fraction') return React.createElement('mfrac', { key }, mathRow(node.numerator), mathRow(node.denominator));
    if (node.kind === 'root') return node.degree
      ? React.createElement('mroot', { key }, mathRow(node.children), mathRow(node.degree))
      : React.createElement('msqrt', { key }, mathRow(node.children));
    if (node.sub && node.sup) return React.createElement('msubsup', { key }, mathRow(node.base), mathRow(node.sub), mathRow(node.sup));
    return React.createElement(node.sub ? 'msub' : 'msup', { key }, mathRow(node.base), mathRow((node.sub || node.sup)!));
  }));
}

export function PaperText({ text }: { text: string }) {
  try {
    return <span className="whitespace-pre-wrap">{splitPaperEquations(text).map((segment, key) => segment.kind === 'text'
      ? <React.Fragment key={key}>{segment.value}</React.Fragment>
      : <span key={key} className={`${segment.display ? 'flex my-2 justify-center' : 'inline-flex'} max-w-full overflow-x-auto overflow-y-hidden py-1 align-middle`}>
        {React.createElement('math', { display: segment.display ? 'block' : 'inline' }, mathRow(segment.nodes))}
      </span>)}</span>;
  } catch (error) {
    return <span data-paper-equation-error className="whitespace-pre-wrap"><span>{text}</span><span role="alert" className="block text-sm text-red-700">{error instanceof Error ? error.message : 'Equation preview unavailable.'}</span></span>;
  }
}
