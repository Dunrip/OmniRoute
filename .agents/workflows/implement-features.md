---
description: Analyze open feature request issues, implement viable ones on dedicated branches, and respond to authors
---

# /implement-features — Feature Request Harvest, Research & Implementation Workflow

## Overview

A **5-phase** workflow that systematically harvests feature requests from GitHub issues, creates structured idea files, researches solutions across the internet and Git repositories, presents a consolidated report for user approval, then generates detailed implementation plans and executes them.

**Output directories:**

- `_ideia/` — One markdown file per feature idea (persistent knowledge base)
- `_tasks/features-vX.Y.Z/` — Implementation plan files (per-release)

> **BRANCH RULE**: All implementation work MUST happen on the current `release/vX.Y.Z` branch. Never create separate `feat/` branches. If no release branch exists yet, create one first using `/generate-release` Phase 1 steps 1–5.

---

## Phase 1 — Harvest: Collect & Catalog Feature Ideas

### 1.1 Identify the Repository

// turbo

- Run: `git -C <project_root> remote get-url origin` to extract owner/repo.

### 1.2 Ensure Release Branch Exists

// turbo

Before doing any work, ensure you are on the current release branch:

```bash
# Check current branch
git branch --show-current

# If on main, determine next version and create the release branch
VERSION=$(node -p "require('./package.json').version")
NEXT=$(node -p "const [a,b,c]=('$VERSION').split('.').map(Number); c>=9?a+'.'+(b+1)+'.0':a+'.'+b+'.'+(c+1)")
git checkout -b release/v$NEXT
npm version patch --no-git-tag-version
npm install
```

If already on a `release/vX.Y.Z` branch, continue working there.

### 1.3 Fetch ALL Open Feature Requests

// turbo-all

**⚠️ CRITICAL**: The JSON output of `gh issue list` can be truncated by the tool, silently hiding issues. You MUST use the two-step approach below.

**Step 1 — Get Issue numbers only** (small output, never truncated):

```bash
# Fetch issues with feature/enhancement labels
gh issue list --repo <owner>/<repo> --state open --labels "enhancement" --limit 500 --json number --jq '.[].number'

# Also check for [Feature] in title (common pattern when no labels are set)
gh issue list --repo <owner>/<repo> --state open --limit 500 --json number,title --jq '.[] | select(.title | test("\\[Feature\\]|\\[feature\\]|feature request"; "i")) | .number'
```

- Merge both lists, deduplicate. Count and confirm the total.

**Step 2 — Fetch full metadata for each Issue** (one call per issue):

```bash
gh issue view <NUMBER> --repo <owner>/<repo> --json number,title,labels,body,comments,createdAt,author,assignees
```

- Read the **entire body** — including description, use cases, screenshots, mockups, and any embedded images.
- Read **ALL comments** — community discussion, agreements, restrictions, owner responses, and linked PRs.
- **Images**: If the body or comments contain image URLs (`![...](...)` or `https://...png/jpg/gif`), note them — they may contain UI mockups, wireframes, or architecture diagrams that are essential to understanding the request.
- You may batch these into parallel calls (up to 4 at a time).
- Sort by oldest first (FIFO).

### 1.4 Create or Update Idea Files

For each feature request, create a structured idea file in `<project_root>/_ideia/`:

**Filename convention**: `<NUMBER>-<kebab-case-short-title>.md`
Example: `1046-native-playground.md`, `1041-smart-auto-combos.md`

#### 1.4a — If the idea file does NOT exist yet, create it:

```markdown
# Feature: <Title from Issue>

> GitHub Issue: #<NUMBER> — opened by @<author> on <date>
> Status: 📋 Cataloged | Priority: TBD

## 📝 Original Request

<Paste the FULL issue body here, preserving all formatting, images, and code blocks>

## 💬 Community Discussion

<Summarize ALL comments chronologically, noting who said what and any decisions or objections raised>

### Participants
- @<author> — Original requester
- @<commenter1> — <brief role/opinion>
- ...

### Key Points
- <bullet list of the most important discussion points>
- <agreements reached>
- <objections raised>

## 🎯 Refined Feature Description

<YOUR interpretation and enrichment of the feature request. Expand on what was asked, fill in logical gaps, provide concrete examples of how it would work. This section should be MORE detailed and clearer than the original request.>

### What it solves
- <problem 1>
- <problem 2>

### How it should work (high level)
1. <step 1>
2. <step 2>
3. ...

### Affected areas
- <list of codebase areas, modules, files likely affected>

## 📎 Attachments & References

- <any image URLs, mockup links, or external references from the issue>

## 🔗 Related Ideas

- <links to related _ideia/ files if any overlap found>
```

#### 1.4b — If the idea file ALREADY exists, update it:

- Append new comments from the issue to the **Community Discussion** section.
- Update the **Refined Feature Description** if new information changes the understanding.
- Add any new **Related Ideas** cross-references found.
- **Do NOT overwrite** existing content — append and enrich it.

### 1.5 Cross-Reference & Deduplication

After processing all issues:

- Scan all `_ideia/*.md` files for overlapping features.
- If two features are substantially the same, add `🔗 Related Ideas` cross-references to both.
- If one is a strict subset of another, note it in the smaller file: `> ℹ️ This feature is a subset of #<OTHER_NUMBER>. Consider implementing together.`

---

## Phase 2 — Research: Find Solutions & Build Requirements

For each cataloged idea that is **viable** (aligns with the project's goals):

### 2.1 Viability Pre-Check

Before investing in research, quickly assess:

- [ ] Does this feature align with the project's goals and architecture?
- [ ] Is it technically feasible with the current codebase?
- [ ] Does it duplicate existing functionality?
- [ ] Would it introduce breaking changes or security risks?
- [ ] Is there enough detail to understand what's needed?

**Verdict options:**

| Verdict | When | Action |
|---------|------|--------|
| ✅ **VIABLE** | Good idea, enough context | Proceed to Research |
| ❓ **NEEDS DETAIL** | Good idea, insufficient spec | Skip research, ask author |
| ⏭️ **DEFER** | Good idea, too complex for this cycle | Catalog only, skip research |
| ❌ **NOT FIT** | Doesn't fit the project | Explain why, close issue |

### 2.2 Internet Research (for VIABLE features)

For each viable feature, perform systematic research:

**Step 1 — Web search for similar implementations:**

```
search_web("how to implement <feature description> in <tech stack>")
search_web("<feature keyword> implementation nextjs typescript 2025 2026")
search_web("<feature keyword> open source library npm")
```

**Step 2 — Find reference Git repositories:**

```
search_web("site:github.com <feature keyword> <tech stack> stars:>100")
search_web("github <feature keyword> implementation recently updated 2026")
```

- Find **up to 10 relevant repositories**, sorted by most recently updated.
- For each repository:
  - Note the repo URL, star count, last commit date
  - Read its README and relevant source files via `read_url_content`
  - Extract the architectural approach, patterns used, and key code snippets

**Step 3 — Read API docs and standards:**

If the feature involves an external API, protocol, or standard:
- Find and read the official documentation
- Note version requirements, authentication patterns, rate limits

### 2.3 Create Requirements File

For each researched feature, create a requirements file in `_ideia/`:

**Filename**: `<NUMBER>-<kebab-case-short-title>.requirements.md`

```markdown
# Requirements: <Feature Title>

> Feature Idea: [#<NUMBER>](./<NUMBER>-<kebab-case-short-title>.md)
> Research Date: <YYYY-MM-DD>
> Verdict: ✅ VIABLE / ❓ NEEDS DETAIL / ⏭️ DEFER

## 🔍 Research Summary

<Brief summary of what was found during research>

## 📚 Reference Implementations

| # | Repository | Stars | Last Updated | Approach | Relevance |
|---|-----------|-------|-------------|----------|-----------|
| 1 | [repo/name](url) | ⭐ N | YYYY-MM-DD | <brief> | High/Med/Low |
| 2 | ... | | | | |
| ... | | | | | |

### Key Patterns Found
- <pattern 1 with code snippet or link>
- <pattern 2>
- ...

## 📐 Proposed Solution Architecture

### Approach
<Describe the chosen approach based on research findings>

### New Files
| File | Purpose |
|------|---------|
| `path/to/new/file.ts` | <description> |
| ... | |

### Modified Files
| File | Changes |
|------|---------|
| `path/to/existing/file.ts` | <what changes> |
| ... | |

### Database Changes
- <migrations needed, if any>

### API Changes
- <new endpoints, if any>
- <modified endpoints, if any>

### UI Changes
- <new pages/components, if any>
- <modified pages/components, if any>

## ⚙️ Implementation Effort

- **Estimated complexity**: Low / Medium / High / Very High
- **Estimated files changed**: ~N
- **Dependencies needed**: <new npm packages, if any>
- **Breaking changes**: Yes/No — <details>
- **i18n impact**: <number of new translation keys>
- **Test coverage needed**: <brief description>

## ⚠️ Open Questions

- <question 1 — what the agent couldn't resolve and needs the user or author to clarify>
- <question 2>

## 🔗 External References

- <documentation URLs>
- <API references>
- <relevant blog posts or technical articles>
```

---

## Phase 3 — Report: Present Findings to User

### 3.1 🛑 MANDATORY STOP — Present Consolidated Report

After completing Phase 1 and Phase 2, **STOP and present the following report** in the chat. Do NOT proceed to implementation.

Present a structured report containing:

#### 3.1a — Feature Summary Table

| # | Issue | Title | Verdict | Idea File | Requirements | Effort |
|---|-------|-------|---------|-----------|-------------|--------|
| 1 | #N | Title | ✅ VIABLE | `_ideia/N-title.md` | `_ideia/N-title.requirements.md` | Medium |
| 2 | #N | Title | ❓ NEEDS DETAIL | `_ideia/N-title.md` | — | — |
| 3 | #N | Title | ⏭️ DEFERRED | `_ideia/N-title.md` | — | High |
| 4 | #N | Title | ❌ NOT FIT | — | — | — |

#### 3.1b — Viable Features Detail

For each VIABLE feature, provide a brief paragraph:
- What was found during research
- The proposed approach
- Key risks or unknowns
- Which reference repositories were most useful

#### 3.1c — Issues Requiring Author Feedback

For features marked ❓ NEEDS DETAIL, list:
- What specific information is missing
- What examples or repository references would help
- The exact comment that will be posted on the issue

#### 3.1d — Features Not Suitable

For features marked ❌ NOT FIT, briefly explain why.

#### 3.1e — Ask for User Confirmation

End the report with:

> **Ready to proceed?**
> - Reply **"sim"** or **"yes"** to generate full implementation plans for all VIABLE features.
> - Reply with specific issue numbers to select only certain features.
> - Reply **"não"** or **"no"** to stop here.

### 3.2 Post Comments on GitHub

After presenting the report (but before user confirmation):

**For ❓ NEEDS DETAIL issues** — Post a comment asking for specifics:

```markdown
Hi @<author>! Thanks for the feature request — it's an interesting idea and we'd love to explore it further.

To move forward with implementation, we need a few more details:

1. <specific question 1>
2. <specific question 2>
3. <specific question 3>

If you know of any open-source projects or repositories that implement something similar, please share links — it would help us design the best solution. 🙏
```

**For ❌ NOT FIT issues** — Post a polite explanatory comment and close.

---

## Phase 4 — Plan: Generate Implementation Plans (after user says "yes")

> **⚠️ Do NOT enter this phase without explicit user approval from Phase 3.**

### 4.1 Create Task Directory

```bash
mkdir -p <project_root>/_tasks/features-vX.Y.Z/
```

### 4.2 Generate One Implementation Plan Per Feature

For each VIABLE feature approved by the user, create:

**Filename**: `_tasks/features-vX.Y.Z/<NUMBER>-<kebab-case-title>.plan.md`

```markdown
# Implementation Plan: <Feature Title>

> Issue: #<NUMBER>
> Idea: [_ideia/<NUMBER>-title.md](../../_ideia/<NUMBER>-title.md)
> Requirements: [_ideia/<NUMBER>-title.requirements.md](../../_ideia/<NUMBER>-title.requirements.md)
> Branch: `release/vX.Y.Z`

## Overview

<Brief description of what will be built>

## Pre-Implementation Checklist

- [ ] Read all related source files listed below
- [ ] Confirm no conflicts with in-flight PRs
- [ ] Verify database migration numbering

## Implementation Steps

### Step 1: <Title>

**Files:**
- `path/to/file.ts` — <what to change>

**Details:**
<Detailed description of the change, including code patterns to follow, function signatures, etc.>

### Step 2: <Title>
...

### Step N: Tests

**New test files:**
- `tests/unit/<test-file>.test.mjs` — <what to test>

**Test cases:**
- [ ] <test case 1>
- [ ] <test case 2>
- ...

### Step N+1: i18n

**Translation keys to add:**
- `<namespace>.<key>` — "<English value>"
- ...

### Step N+2: Documentation

- [ ] Update CHANGELOG.md
- [ ] Update relevant docs/ files

## Verification Plan

1. Run `npm run build` — must pass
2. Run `npm test` — all tests must pass
3. Run `npm run lint` — no new errors
4. <Manual verification steps>

## Commit Plan

```
feat: <description> (#<NUMBER>)
```
```

### 4.3 Present Plans for Final Approval

Present a summary of all generated plans:

> **Implementation plans generated:**
>
> | # | Feature | Plan File | Steps | Effort |
> |---|---------|-----------|-------|--------|
> | 1 | <title> | `_tasks/features-vX.Y.Z/N-title.plan.md` | N steps | Medium |
> | ... | | | | |
>
> Reply **"sim"** or **"yes"** to begin implementation of all features.
> Reply with specific issue numbers to implement only certain ones.

---

## Phase 5 — Execute: Implement the Plans (after user says "yes")

> **⚠️ Do NOT enter this phase without explicit user approval from Phase 4.**

### 5.1 Implement Each Feature

For each approved plan, execute it step by step:

1. **Follow the plan** — implement exactly as specified in the `.plan.md` file
2. **Build** — Run `npm run build` after each feature to verify compilation
3. **Test** — Run `npm test` to ensure no regressions
4. **Commit** — Commit with: `feat: <description> (#<NUMBER>)`
5. **Update the plan** — Mark completed steps with `[x]` in the plan file
6. **Continue** — Move to the next feature (do NOT switch branches)

### 5.2 Respond to Authors

For each implemented feature, post a comment on the GitHub issue:

```markdown
## ✅ Feature Implemented!

Hi @<author>! We've analyzed your request and implemented it.

**Branch:** `release/vX.Y.Z` (upcoming release)

### What was implemented:

- <bullet list of what was done>

### How to try it:

```bash
git fetch origin
git checkout release/vX.Y.Z
npm install && npm run dev
```

### Next steps:

1. **Test it** — Please verify it works as you expected
2. **Want to improve it?** — Feel free to open a follow-up PR targeting `release/vX.Y.Z`
3. **Not quite right?** — Let us know in this issue what needs to change

This will be included in the next release. Looking forward to your feedback! 🚀
```

### 5.3 Finalize & Push

After implementing all approved features:

1. **Update CHANGELOG.md** on the release branch with all new feature entries
2. Push the release branch: `git push origin release/vX.Y.Z`
3. Run `/generate-release` workflow Phase 1 steps 7–10 (tests → commit → push → open PR to main → wait for user)

### 5.4 Final Summary Report

Present a final summary report to the user:

| Issue | Title | Verdict | Action | Commit |
|-------|-------|---------|--------|--------|
| #N | Title | ✅ Implemented | Committed on release/vX.Y.Z | `abc1234` |
| #N | Title | ❓ Needs Detail | Comment posted asking for specifics | — |
| #N | Title | ⏭️ Deferred | Cataloged in `_ideia/` for future cycle | — |
| #N | Title | ❌ Not Fit | Closed with explanation | — |

Include:
- Total features harvested
- Total ideas cataloged in `_ideia/`
- Total features implemented
- Total features deferred
- Total issues needing author response
- Test results (pass/fail count)
