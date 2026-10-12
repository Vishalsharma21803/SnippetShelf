import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Markdown } from '../src/components/Markdown';
import { CodeEditor, SyntaxCode, tokenize } from '../src/components/SyntaxCode';
import { seedSnippets, collections } from '../src/data/seedLibrary';
import { normalizeTags, validateSnippet } from '../src/lib/validation';

describe('safe rich content', () => {
  it('renders headings, lists, inline styles, quotes and fences', () => {
    const { container } = render(<Markdown text={'# Usage\n\n**Strong** and *emphasis* with `inline` and ~~old~~.\n\n- one\n- two\n\n3. three\n4. four\n\n> quoted\n\n```js\nconst n = 1;\n```\n\n---'} />);
    expect(screen.getByRole('heading', { name: 'Usage' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(container.querySelector('ol')).toHaveAttribute('start', '3');
    expect(container.querySelector('strong')).toHaveTextContent('Strong');
    expect(container.querySelector('em')).toHaveTextContent('emphasis');
    expect(container.querySelector('del')).toHaveTextContent('old');
    expect(container.querySelector('blockquote')).toHaveTextContent('quoted');
    expect(container.querySelector('pre')).toHaveTextContent('const n = 1;');
  });
  it('never inserts raw HTML or unsafe URLs into document', () => {
    const { container } = render(<Markdown text={'<img src=x onerror=alert(1)>\n\n[bad](javascript:alert) [data](data:text/html,evil) [external](https://example.com) [local](/help)'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'external' })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  });
  it('preserves every seeded code sample during tokenization', () => {
    for (const snippet of seedSnippets) expect(tokenize(snippet.code, snippet.language).map(token => token.text).join('')).toBe(snippet.code);
  });
  it('preserves multiline code and displays markup as text', () => {
    const code = '<script>bad()</script>\n\nconst unicode = "✓";\n';
    const { container } = render(<code><SyntaxCode code={code} language="HTML" lineNumbers /></code>);
    expect(container.textContent).toBe(code);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelectorAll('.line-number')).toHaveLength(4);
  });
  it('edits highlighted code through an accessible textarea', () => {
    const change = vi.fn();
    render(<CodeEditor value="let n = 0" language="JavaScript" onChange={change} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: 'let n = 1' } });
    expect(change).toHaveBeenCalledWith('let n = 1');
  });
  it('rejects excessive tags instead of silently deleting them', () => {
    const tags = normalizeTags(Array.from({ length: 9 }, (_, index) => `tag-${index}`));
    expect(tags).toHaveLength(9);
    expect(validateSnippet({ ...seedSnippets[0], tags }, collections).tags).toBe('Use up to 8 tags.');
  });
});
