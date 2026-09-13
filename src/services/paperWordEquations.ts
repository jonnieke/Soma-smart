import { Math as WordMath, MathRun, MathFraction, MathRadical, MathSuperScript, MathSubScript, MathSubSuperScript, TextRun, type MathComponent, type ParagraphChild } from 'docx';
import { splitPaperEquations, type EquationNode } from './paperEquationContent';

function components(nodes: EquationNode[]): MathComponent[] {
  return nodes.map(node => {
    if (node.kind === 'text') return new MathRun(node.value);
    if (node.kind === 'fraction') return new MathFraction({ numerator: components(node.numerator), denominator: components(node.denominator) });
    if (node.kind === 'root') return new MathRadical({ children: components(node.children), degree: node.degree ? components(node.degree) : undefined });
    const children = components(node.base);
    if (node.sub && node.sup) return new MathSubSuperScript({ children, subScript: components(node.sub), superScript: components(node.sup) });
    if (node.sub) return new MathSubScript({ children, subScript: components(node.sub) });
    return new MathSuperScript({ children, superScript: components(node.sup!) });
  });
}

export function wordEquationRuns(text: string, bold = false): ParagraphChild[] {
  return splitPaperEquations(text).flatMap<ParagraphChild>(segment => {
    if (segment.kind === 'text') return segment.value.split(/\r?\n/).map((line, index) => new TextRun({ text: line, bold, ...(index ? { break: 1 } : {}) }));
    const equation = new WordMath({ children: components(segment.nodes) });
    return segment.display ? [new TextRun({ break: 1 }), equation, new TextRun({ break: 1 })] : [equation];
  });
}
