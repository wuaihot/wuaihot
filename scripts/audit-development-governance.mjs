import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const failures = [];

const requireTokens = (path, tokens) => {
  const content = read(path);
  for (const token of tokens) {
    if (!content.includes(token)) {
      failures.push(`${path}: missing required governance token: ${token}`);
    }
  }
};

requireTokens("AGENTS.md", [
  "## Continuous development governance",
  "Source of truth order",
  "record it without waiting for a reminder",
  "read the current Issue body",
  "Comments are temporary execution surfaces",
  "update Issue checkbox/evidence and Project workflow state",
  "does **not** authorize closing an Issue",
  "npm run audit:development-governance",
]);

requireTokens("docs/governance/continuous-development.md", [
  "# Continuous Development Governance",
  "## Source of truth",
  "## Intake and automatic bookkeeping",
  "## Resume and handoff",
  "## Comment-to-canonical promotion",
  "## Pull request contract",
  "## Verification and closeout",
  "## Harness",
]);

requireTokens(".github/pull_request_template.md", [
  "## 关联 Issue / 阶段计划",
  "Canonical Issue",
  "npm run build",
  "## 治理同步",
  "Issue checkbox / 验收证据",
  "Return-to-Trunk",
]);

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
if (
  scripts["audit:development-governance"] !==
  "node scripts/audit-development-governance.mjs"
) {
  failures.push(
    "package.json: audit:development-governance must run scripts/audit-development-governance.mjs",
  );
}
if (
  typeof scripts.prebuild !== "string" ||
  !scripts.prebuild.includes("npm run audit:development-governance")
) {
  failures.push(
    "package.json: prebuild must include npm run audit:development-governance",
  );
}

if (failures.length) {
  console.error("[development-governance] contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "[development-governance] AGENTS, stable governance doc, PR template and prebuild harness verified",
);
