# LPM v2.1 — Asana-grade Projects + CRM module

Repo: ~/Projects/LocalProjectsManager
Decision (Syl, this session): **both** — Asana-style project management + a CRM
pipeline module, in one local-first app. No server, no account, no cloud.

## Goals
1. Project work feels like Asana: board view, statuses, assignees, comments,
   dependencies, My Tasks.
2. A CRM that actually closes deals: companies, contacts, deals, pipeline stages,
   weighted forecast, activity timeline.
3. Design polish to match: consistent tokens, page headers, chips, avatars,
   board/table surfaces, tighter density, better empty states.
4. Stay 100% local: localStorage + optional disk DB (`jrispace-pm.db`),
   JSON export/import keeps working.

## Data model (new)
- `Person`      id, name, email, color  — org roster for assignees/owners
- `Company`     id, name, domain, industry, notes, createdAt
- `Contact`     id, name, companyId, email, phone, role, tags[], ownerId, notes
- `Deal`        id, title, companyId, contactId, value, currency, stage,
                probability, expectedClose, ownerId, projectKey, notes, closedAt
- `DealStage`   lead → qualified → proposal → negotiation → won | lost
- `CrmActivity` id, type(call|email|meeting|note|stage), text, dealId,
                contactId, companyId, at, by

## Task model additions (backward compatible, all optional)
- `id`, `status: todo|doing|done`, `assigneeId`, `tags[]`,
  `comments: {id, text, at, by}[]`, `dependsOn: string[]` (task ids)

Everything is additive: existing projects keep loading (normaliser in
`lib/storage.ts` already tolerates missing fields).

## Storage
- `lib/crm.ts` — versioned keys `lpm.crm.*`, CRUD helpers, same disk mirror
  pattern as projects (`diskdb` gains a `crm` blob so backups include it).
- Settings export already dumps every `localStorage` key → CRM is covered.

## Screens
- **CRM** (`view: "crm"`): tabs Pipeline / Contacts / Companies / Activity
  - Pipeline: stage columns, deal cards (value, company, probability, close),
    per-column totals, weighted forecast header, HTML5 drag between stages,
    deal modal (create/edit), "Won"/"Lost" close actions.
  - Contacts: searchable table, company link, tags, owner, inline add/edit.
  - Companies: cards with deal count and open value.
  - Activity: unified timeline (stage moves, calls, notes…).
- **My Tasks** (`view: "mytasks"`): everything assigned to me across projects,
  grouped by overdue / today / upcoming / done.
- **Project detail**: List ⇄ Board toggle; board columns from task status;
  dependency lock badge.

## Design system
- Tokens: spacing, radii, elevation, surface/border/text ramps (dark + light).
- Components: `.page-head`, `.chip`, `.avatar`, `.table`, `.board`, `.kpi`.
- Density and hierarchy: 13px base, 20px page titles, quieter borders, hover
  elevation, focus rings, 44px touch targets on small screens.

## Order of work
1. Plan → 2. types + crm lib + disk mirror → 3. CRM UI → 4. Asana core
→ 5. design pass → 6. verify (typecheck, build, browser flows, ai-code-verify)
→ commit + push.

## Verification (definition of done)
- `npm run typecheck` 0, `npm run build` 0, `~/scripts/ai-code-verify.sh` PASS.
- Browser: create company → contact → deal, drag deal across stages, forecast
  updates; create task, set status/assignee, comment, dependency blocks; board
  and list agree; My Tasks lists assigned work; export JSON still parses.
- No regression: existing projects open, wizard popup scrollbar-free, PWA
  service worker still registers on the build.
