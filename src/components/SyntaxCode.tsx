import { Fragment, useMemo, useRef } from "react";

type Token = { text: string; kind?: string };
const keywords = new Set("async await break case catch class const continue debugger default delete do else enum export extends false finally for from function if implements import in instanceof interface let new null of private protected public return static super switch this throw true try type typeof undefined var void while with yield def elif except False None True lambda pass raise and or not is as assert del global nonlocal import print select from where join left right inner outer on group by order having limit insert into values update set delete create table alter drop distinct union all as null true false asc desc primary key references return echo fi then done esac elif function case export sudo git".split(" "));

// Deliberately small lexical renderer. Text always stays in React text nodes.
export function tokenize(code: string, language: string): Token[] {
  const hashComments = /^(python|shell|git)$/i.test(language);
  const sql = /^sql$/i.test(language);
  const markup = /^(html|react)$/i.test(language);
  const pattern = new RegExp([
    "<!--[^]*?(?:-->|$)",
    "/\\*[^]*?(?:\\*/|$)",
    ...(hashComments ? ["#[^\\n]*"] : []),
    ...(sql ? ["--[^\\n]*"] : []),
    ...(!hashComments && !sql ? ["//[^\\n]*"] : []),
    "\"(?:\\\\[^]|[^\"\\\\])*\"", "'(?:\\\\[^]|[^'\\\\])*'", "`(?:\\\\[^]|[^`\\\\])*`",
    ...(markup ? ["</?[A-Za-z][\\w:.-]*", "/?>"] : []),
    "\\b(?:0x[\\da-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b", "[A-Za-z_$][\\w$]*", "[{}()[\\];,.?:+*/%=!<>&|~-]",
  ].join("|"), "g");
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of code.matchAll(pattern)) {
    const text = match[0];
    const offset = match.index!;
    if (offset > cursor) tokens.push({ text: code.slice(cursor, offset) });
    let kind: string | undefined;
    if (/^(<!--|\/\*|\/\/)/.test(text) || (hashComments && text[0] === "#") || (sql && text.startsWith("--"))) kind = "comment";
    else if (/^["'`]/.test(text)) kind = "string";
    else if (/^\d/.test(text)) kind = "number";
    else if (keywords.has(text) || (sql && keywords.has(text.toLowerCase()))) kind = "keyword";
    else if (markup && /^<\/?\w/.test(text)) kind = "tag";
    else if (/^[A-Za-z_$]/.test(text) && /^\s*\(/.test(code.slice(offset + text.length))) kind = "function";
    else if (/^[{}()[\];,.?:+*/%=!<>&|~-]+$/.test(text)) kind = "punctuation";
    tokens.push({ text, kind });
    cursor = offset + text.length;
  }
  if (cursor < code.length) tokens.push({ text: code.slice(cursor) });
  return tokens;
}

export function SyntaxCode({ code, language, lineNumbers = false }: { code: string; language: string; lineNumbers?: boolean }) {
  const lines = useMemo(() => {
    const output: Token[][] = [[]];
    for (const token of tokenize(code, language)) {
      token.text.split("\n").forEach((text, index) => {
        if (index) output.push([]);
        if (text) output[output.length - 1].push({ ...token, text });
      });
    }
    return output;
  }, [code, language]);
  return <>{lines.map((line, index) => <Fragment key={index}>{lineNumbers && <span className="line-number" aria-hidden="true" data-line={index + 1} />}{line.map((token, tokenIndex) => token.kind ? <span key={tokenIndex} className={`syntax-${token.kind}`}>{token.text}</span> : <Fragment key={tokenIndex}>{token.text}</Fragment>)}{index < lines.length - 1 ? "\n" : ""}</Fragment>)}</>;
}

export function CodeEditor({ value, language, onChange, fontSize = 13 }: { value: string; language: string; onChange: (value: string) => void; fontSize?: number }) {
  const preview = useRef<HTMLPreElement>(null);
  return <div className="syntax-editor" style={{ fontSize }}>
    <pre ref={preview} aria-hidden="true"><code><SyntaxCode code={value + "\n"} language={language} /></code></pre>
    <textarea aria-label="Code" value={value} onChange={e => onChange(e.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" placeholder="Paste or type code here..." onScroll={e => {
      if (preview.current) { preview.current.scrollTop = e.currentTarget.scrollTop; preview.current.scrollLeft = e.currentTarget.scrollLeft; }
    }} />
  </div>;
}
