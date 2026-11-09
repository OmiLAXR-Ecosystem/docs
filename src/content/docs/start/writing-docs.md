---
title: Writing package docs
description: Where the documentation of a package lives and how it gets onto docs.omilaxr.dev.
sidebar:
  order: 2
---

The documentation of a package lives in the package repo, next to its code. This site collects it from every package on each build. You never edit generated pages in the docs repo.

## What is generated

For every public component, the site generates a page from the source code:

| On the page | Comes from |
| --- | --- |
| Description | `/// <summary>` of the class, then the `[Description]` attribute |
| Add Component path | `[AddComponentMenu("OmiLAXR / …")]` |
| Kind and base classes | the base class chain (listener, filter, composer, …) |
| Events | public `TrackingBehaviourEvent` fields with `[Gesture]` and `[Action]` |
| Inspector fields | public and `[SerializeField]` fields, described by `[Tooltip]` or `/// <summary>` |
| Requires | an `#if` around the whole file, such as `XAPI_REGISTRY_EXISTS` |

So most of the work is good XML comments in the code. `make docs-check` in a package lists the components that still lack a `<summary>`.

The changelog page is `CHANGELOG.md`. The package overview is generated from `package.json` unless you write `Documentation~/index.md`.

## What you write

Put Markdown files into `Documentation~/` in the package. Unity ignores folders that end in `~`, so they need no `.meta` files.

```
OmiLAXR.xAPI/Documentation~/
  index.md                    overview page of the package (optional)
  guides/
    registry-setup.md         one sidebar group per folder
  components/
    BasicAuthEndpoint.md      appended to the generated page of that class
```

A page starts with frontmatter:

```markdown
---
title: Set up the xAPI registry
description: How XAPI_REGISTRY_EXISTS is set and what it enables.
sidebar:
  order: 2
---
```

Without frontmatter, the first `# heading` becomes the title. Images go next to the page and are referenced relatively.

## Make targets in a package

Each package has a small `Makefile` that forwards to this docs repo. The docs repo must be checked out next to the package (or pass `DOCS=<path>`).

| Command | What it does |
| --- | --- |
| `make docs` | Builds the docs from the repos on your disk and starts the dev server |
| `make docs-check` | Lists components of this package without a `<summary>` |
| `make docs-page NAME=guides/setup` | Creates `Documentation~/guides/setup.md` |
| `make docs-component NAME=HeadComposer` | Creates `Documentation~/components/HeadComposer.md` |
| `make docs-publish` | Rebuilds docs.omilaxr.dev now (needs the GitHub CLI) |

## When the site updates

The site is built from the `main` branch of every package. A push to `main` of a package triggers a rebuild. The site is also rebuilt every night.
