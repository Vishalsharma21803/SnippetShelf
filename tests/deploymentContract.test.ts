import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

it("uses a relative Vite base for PR sub-path previews", () => {
  expect(read("vite.config.ts")).toMatch(/base:\s*["']\.\/["']/);
});

it("serves the preview image as a non-root nginx process with health and SPA fallback", () => {
  const dockerfile = read("Dockerfile");
  const nginx = read("nginx.conf");
  expect(dockerfile).toContain("nginxinc/nginx-unprivileged");
  expect(dockerfile).toMatch(/USER\s+101/);
  expect(dockerfile).toMatch(/EXPOSE\s+80/);
  expect(nginx).toContain("listen 80");
  expect(nginx).toContain("location = /healthz");
  expect(nginx).toContain("/pr-[0-9]+");
  expect(nginx).toContain("try_files $uri $uri/ /index.html");
  expect(nginx).toContain("pid /dev/null");
});

it("keeps the platform token out of the PR build and uses the current API contract", () => {
  const build = read(".github/workflows/preview.yml");
  const trusted = read(".github/workflows/preview-deploy.yml");
  expect(build).not.toContain("PREVIEW_PLATFORM_TOKEN");
  expect(build).toContain("npm ci");
  expect(build).toContain("npm test");
  expect(build).toContain("docker/build-push-action@v6");
  expect(build).toContain("steps.build.outputs.digest");
   expect(build).not.toContain("/visibility");
   expect(build).not.toContain("--method PATCH");
   expect(build).toContain("actions/upload-artifact@v4");
   expect(build.indexOf("steps.build.outputs.digest")).toBeLessThan(build.indexOf("actions/upload-artifact@v4"));
  expect(trusted).toContain("http://13.63.54.222");
  expect(trusted).toContain("POST");
  expect(trusted).toContain("/api/deployments");
  expect(trusted).toContain("/api/previews/");
  expect(trusted).toContain("/pr-${prNumber}/");
  expect(trusted).toContain("schedule:");
});
