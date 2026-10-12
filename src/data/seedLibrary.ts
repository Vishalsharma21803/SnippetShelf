import type { Snippet } from "../types";
import { collections } from "./collections";
import { javascriptSnippets } from "./snippets.javascript";
import { typescriptSnippets } from "./snippets.typescript";
import { reactSnippets } from "./snippets.react";
import { cssSnippets } from "./snippets.css";
import { htmlSnippets } from "./snippets.html";
import { pythonSnippets } from "./snippets.python";
import { sqlSnippets } from "./snippets.sql";
import { shellSnippets } from "./snippets.shell";
import { gitSnippets } from "./snippets.git";
import { jsonSnippets } from "./snippets.json";
export const seedSnippets: Snippet[] = [
  ...javascriptSnippets,
  ...typescriptSnippets,
  ...reactSnippets,
  ...cssSnippets,
  ...htmlSnippets,
  ...pythonSnippets,
  ...sqlSnippets,
  ...shellSnippets,
  ...gitSnippets,
  ...jsonSnippets,
];
export { collections };
