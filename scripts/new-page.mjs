// Creates a new documentation page in a package's Documentation~ folder.
//
//   node scripts/new-page.mjs <package dir> guides/setup        → Documentation~/guides/setup.md
//   node scripts/new-page.mjs <package dir> --component HeadComposer
//                                                              → Documentation~/components/HeadComposer.md
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { component: { type: "string" } } });
const [pkgDir, name] = positionals;
if (!pkgDir || !existsSync(join(pkgDir, "package.json")) || (!name && !values.component)) {
  console.error("Usage: new-page.mjs <package dir> <path/without/extension> | --component <ClassName>");
  process.exit(2);
}

const docs = join(resolve(pkgDir), "Documentation~");
const file = values.component ? join(docs, "components", `${values.component}.md`) : join(docs, `${name.replace(/\.mdx?$/, "")}.md`);
if (existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}

const words = (values.component ?? name.split("/").pop()).split(/[-_ ]/).map((w) => w[0].toUpperCase() + w.slice(1));
const content = values.component
  ? `<!-- Appended to the generated page of ${values.component} on docs.omilaxr.dev. No frontmatter needed. -->

## Usage

Describe how to set up ${values.component} and what to watch out for.
`
  : `---
title: ${words.join(" ")}
description: One sentence about what this page explains.
---

Write the guide here. Code blocks, tables and Starlight asides (:::note … :::) work.
`;

mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, content);
console.log(`Created ${file}`);
