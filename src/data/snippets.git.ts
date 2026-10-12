import { seed } from "./makeSnippet";
export const gitSnippets = [
  seed("git-branch", {
    title: "Start a feature branch",
    description: "Create a branch from current work and switch to it.",
    language: "Git",
    collectionId: "delivery",
    tags: ["branching", "workflow"],
    isFavorite: true,
    explanation:
      "Use a descriptive branch name that maps to one piece of work.",
    code: `git switch -c feat/short-description`,
  }),
  seed("git-log", {
    title: "Readable compact log",
    description: "Review recent history with graph and branches.",
    language: "Git",
    collectionId: "delivery",
    tags: ["history", "debugging"],
    isFavorite: false,
    explanation: "A compact log makes collaboration context visible quickly.",
    code: `git log --oneline --graph --decorate --all -20`,
  }),
  seed("git-reflog", {
    title: "Recover a moved branch",
    description: "Find prior HEAD positions before restoring known work.",
    language: "Git",
    collectionId: "delivery",
    tags: ["recovery", "history"],
    isFavorite: true,
    explanation:
      "Reflog is local history; act carefully and verify before reset.",
    code: `git reflog\ngit branch recovery/old-head HEAD@{2}`,
  }),
  seed("git-clean-preview", {
    title: "Preview untracked cleanup",
    description: "See what a clean command would remove before running it.",
    language: "Git",
    collectionId: "delivery",
    tags: ["cleanup", "safety"],
    isFavorite: false,
    explanation:
      "Always preview destructive cleanup in unfamiliar repositories.",
    code: `git clean -nd`,
  }),
  seed("git-stash", {
    title: "Stash selected work",
    description: "Save current changes with a message for later.",
    language: "Git",
    collectionId: "delivery",
    tags: ["workflow", "stash"],
    isFavorite: false,
    explanation: "Prefer a temporary branch for long-lived work.",
    code: `git stash push -m "wip: focused change"`,
  }),
  seed("git-show-file", {
    title: "Inspect a file from history",
    description: "Read a prior version without changing the worktree.",
    language: "Git",
    collectionId: "delivery",
    tags: ["history", "review"],
    isFavorite: false,
    explanation:
      "Use this before cherry-picking or restoring individual files.",
    code: `git show HEAD~1:src/example.ts`,
  }),
];
