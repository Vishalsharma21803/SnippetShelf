import { Fragment, type ReactNode } from "react";
import { SyntaxCode } from "./SyntaxCode";

function safeHref(value: string) {
  const url = value.trim();
  if (/^(https?:\/\/|mailto:)/i.test(url) || /^#[^\s]*$/.test(url) || /^\/(?!\/|\\)/.test(url)) return url;
  return undefined;
}

function inline(text: string, depth = 0): ReactNode {
  if (depth > 8) return text;
  const pattern = /(`+)([^`]+?)\1|\[([^\]]+)\]\(([^\s)]+)\)|(\*\*|__)(.+?)\5|(~~)(.+?)\7|(\*|_)([^\n]+?)\9|\\([\\`*_{}[\]()#+.!>-])/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    nodes.push(text.slice(cursor, index));
    let node: ReactNode;
    if (match[1]) node = <code>{match[2]}</code>;
    else if (match[3]) {
      const href = safeHref(match[4]);
      node = href ? <a href={href} target={/^https?:/i.test(href) ? "_blank" : undefined} rel="noopener noreferrer">{inline(match[3], depth + 1)}</a> : <span>{inline(match[3], depth + 1)}</span>;
    } else if (match[5]) node = <strong>{inline(match[6], depth + 1)}</strong>;
    else if (match[7]) node = <del>{inline(match[8], depth + 1)}</del>;
    else if (match[9]) node = <em>{inline(match[10], depth + 1)}</em>;
    else node = match[11];
    nodes.push(<Fragment key={index}>{node}</Fragment>);
    cursor = index + match[0].length;
  }
  nodes.push(text.slice(cursor));
  return nodes;
}

const blockStart = /^(?:\s*$| {0,3}(?:#{1,6}\s|`{3,}|~{3,}|>\s?|[-+*]\s+|\d+[.)]\s+|(?:\*\s*){3,}$|(?:-\s*){3,}$|(?:_\s*){3,}$))/;

// Supported Markdown is parsed to elements; raw HTML and unsafe URL schemes remain inert.
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const key = index;
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})([^\s]*)\s*$/);
    if (fence) {
      const body: string[] = [];
      index++;
      const closing = new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},}\\s*$`);
      while (index < lines.length && !closing.test(lines[index])) body.push(lines[index++]);
      if (index < lines.length) index++;
      blocks.push(<pre key={key}><code><SyntaxCode code={body.join("\n")} language={fence[2]} /></code></pre>);
      continue;
    }
    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const Tag = `h${heading[1].length}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      blocks.push(<Tag key={key}>{inline(heading[2])}</Tag>); index++; continue;
    }
    if (/^ {0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line)) { blocks.push(<hr key={key} />); index++; continue; }
    if (/^ {0,3}>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^ {0,3}>/.test(lines[index])) quote.push(lines[index++].replace(/^ {0,3}>\s?/, ""));
      blocks.push(<blockquote key={key}>{quote.map((part, i) => <p key={i}>{inline(part)}</p>)}</blockquote>); continue;
    }
    const list = line.match(/^ {0,3}([-+*]|\d+[.)])\s+(.+)$/);
    if (list) {
      const ordered = /^\d/.test(list[1]);
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^ {0,3}([-+*]|\d+[.)])\s+(.+)$/);
        if (!item || /^\d/.test(item[1]) !== ordered) break;
        items.push(<li key={index}>{inline(item[2])}</li>); index++;
      }
      blocks.push(ordered ? <ol key={key} start={parseInt(list[1], 10)}>{items}</ol> : <ul key={key}>{items}</ul>); continue;
    }
    const paragraph = [line];
    index++;
    while (index < lines.length && !blockStart.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={key}>{paragraph.map((part, i) => <Fragment key={i}>{i > 0 && (paragraph[i - 1].endsWith("  ") ? <br /> : "\n")}{inline(part.trimEnd())}</Fragment>)}</p>);
  }
  return <div className="markdown">{blocks}</div>;
}
