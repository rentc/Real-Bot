# Migration Plan — From LINE Image Bucket Bot to WRC AI Sales Platform

**Date:** 2026-08-05

---

## 1. Migration Strategy

**Approach: Incremental Build Alongside**

The existing codebase is a ~200-line Firebase Cloud Functions bot. The target system requires:
- ~40+ PostgreSQL tables
- NestJS API server with 20+ modules
- Next.js admin web application
- Background workers with Redis/BullMQ
- AI extraction pipeline
- PDF generation engine

**We will NOT rewrite the existing bot from scratch.** Instead:

1. Keep the current Firebase function running and serving the LINE webhook.
2. Build the new platform alongside it in the same repository.
3. Port reusable LINE utilities to TypeScript.
4. Gradually transfer webhook handling from the old function to the new API server.
5. Decommission the Firebase function only after the new server is verified.

---

## 2. Repository Restructure

### Current structure
```
/
├── functions/          # Firebase Cloud Functions (existing bot)
├── docs/               # Architecture documents (new)
├── firebase.json       # Firebase config
└── ...
```

### Target structure
```
/
├── functions/          # PRESERVED: Legacy Firebase Cloud Functions
│   └── (existing files, no major changes)
│
├── apps/
│   ├── api/            # NEW: NestJS API server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── shared/
│   │   │   ├── workers/
│   │   │   └── config/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/            # NEW: Next.js admin web app
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/         # NEW: Shared TypeScript types and utilities
│       ├── src/
│       └── package.json
│
├── data/
│   └── seed/           # NEW: Sample cable price data (Excel + SQL)
│
├── docs/               # Architecture and migration documents
├── docker-compose.yml  # NEW: Local development environment
├── .env.example        # NEW: Root-level env template (no secrets)
├── package.json        # NEW: Workspace root (npm workspaces or turborepo)
├── firebase.json       # PRESERVED: Firebase config (legacy)
└── .firebaserc         # PRESERVED: Firebase project config
```

---

## 3. Phase Breakdown

### Phase 0 — Audit and Foundation ← CURRENT
**Duration:** 1 session
**Status:** In progress

| Task | Status | Notes |
|---|---|---|
| Audit repository | ✅ Done | See `docs/CURRENT_ARCHITECTURE.md` |
| Document current architecture | ✅ Done | See `docs/CURRENT_ARCHITECTURE.md` |
| Document target architecture | ✅ Done | See `docs/TARGET_ARCHITECTURE.md` |
| Create migration plan | ✅ Done | This document |
| Create assumptions document | ✅ Done | See `docs/ASSUMPTIONS.md` |
| Identify security issues | ✅ Done | `.env.example` contains real secrets |
| Identify reusable modules | ✅ Done | LINE utils (verify, reply, getContent, getProfile) |

**Immediate security fix needed:**
- Sanitize `functions/.env.example` (remove real LINE credentials)
- Rotate LINE Channel Secret and Access Token via LINE Developers Console

---

### Phase 1 — Foundation and LINE Identity
**Duration:** ~2–3 sessions
**Dependencies:** Phase 0 complete, user approval

| Task | Description |
|---|---|
| Initialize monorepo workspace | npm workspaces or turborepo at root |
| Create NestJS API project | `apps/api/` with Fastify adapter |
| Create Prisma schema | Core identity tables: tenants, users, line_users, line_groups, memberships, roles, permissions |
| Docker Compose | PostgreSQL 16, Redis 7, API server |
| Port LINE webhook handler | TypeScript, signature verification, deduplication |
| Implement user/group upsert | On webhook events (join, memberJoined, message) |
| Implement RBAC | Permission-based guards, role assignment API |
| Create Next.js admin shell | `apps/web/` with authentication, groups/users/roles pages |
| Silent response policy | Bot only responds to mentions, commands, or active sessions |
| Tests | Webhook verification, dedup, RBAC guards, role assignment |
| Environment validation | Fail-fast on missing required env vars |

**Deliverables:**
- Working LINE webhook on new API server
- Admin can view groups, assign user roles
- Bot ignores unrelated messages
- Legacy Firebase function still operational as fallback

---

### Phase 2 — Product, Price, and Stock Platform
**Duration:** ~2–3 sessions
**Dependencies:** Phase 1 complete

| Task | Description |
|---|---|
| Product database tables | products, product_aliases |
| Price database tables | price_books, price_versions, price_items |
| Stock database tables | warehouses, stock_levels |
| Import seed data | Parse attached Excel workbook, create seed SQL/script |
| Product CRUD API | With search by SKU, cable type, size, cores, brand |
| Product alias management | Map abbreviations, Thai/English variants, OCR errors |
| Price version management | Immutable history, effective dates, approval status |
| Stock view API | Warehouse-level balances, advisory only |
| Excel import/export | Upload workbook → preview → validate → import |
| Admin UI pages | Products, Prices, Stock |
| Tests | Price effective date logic, decimal arithmetic, import validation |

**Deliverables:**
- Full product/price/stock management in admin UI
- Sample cable data imported as seed
- Import/export Excel functionality

---

### Phase 3 — AI Request Extraction and Session Management
**Duration:** ~2–3 sessions
**Dependencies:** Phase 2 complete

| Task | Description |
|---|---|
| AI provider abstraction | Interface supporting Gemini and OpenAI |
| Intent classifier | Classify LINE messages into business intents |
| Structured extraction | JSON-schema output for quotation requests |
| Session management | Business sessions keyed by group + user + type |
| Text extraction | Natural language product descriptions → structured fields |
| Image/OCR extraction | Cable spec sheets, purchase orders → structured fields |
| Clarification flow | Ask focused questions for missing fields |
| Message storage policy | Store only relevant business messages |
| Attachment pipeline | Download, store securely, deduplicate by checksum |
| Tests | Intent classification, extraction accuracy, session lifecycle |

**Deliverables:**
- Bot can understand "ขอราคา NYY 4x6 จำนวน 100 เมตร" and extract structured data
- Business sessions track multi-message requests
- AI never invents prices or product codes

---

### Phase 4 — Quotation Engine
**Duration:** ~2–3 sessions
**Dependencies:** Phase 3 complete

| Task | Description |
|---|---|
| Deterministic product matching | 7-step matching order (SKU → alias → spec → AI-rank → human) |
| Customer database tables | customers, contacts, addresses, group links |
| Quotation database tables | quote_requests, quotations, quotation_versions, quotation_items |
| Price calculation engine | Backend decimal math: discount, VAT, subtotals, grand total |
| Calculation snapshot | Store all price IDs/versions used in each quotation |
| Draft quotation UI | Admin can view, edit, correct matched items |
| Rounding rules | Centralized, tested, configurable |
| Amount in Thai words | Convert grand total to Thai text |
| Tests | Decimal calculation accuracy, matching priority, snapshot integrity |

**Deliverables:**
- End-to-end: LINE message → extraction → matching → calculation → draft quotation
- All calculations are deterministic, auditable, and use decimal types

---

### Phase 5 — Approval Workflow and PDF
**Duration:** ~2–3 sessions
**Dependencies:** Phase 4 complete

| Task | Description |
|---|---|
| Approval database tables | approval_requests, approval_actions, documents |
| Approval policy engine | Configurable rules (always, above threshold, manual override) |
| Approval workflow | Submit → Notify → Approve/Reject/Return → Lock version |
| W.R.C. PDF template | HTML/CSS template matching the attached quotation image |
| PDF generation | Playwright server-side rendering, A4, multi-page support |
| Document numbering | Sequential, configurable format, unique per tenant |
| Secure approval links | Signed, single-use, time-limited, permission-checked |
| Send to buyer | Approved PDF sent via LINE (as file or Flex Message) |
| Notification routing | Configurable: group vs DM vs web dashboard |
| Tests | Approval state machine, PDF content, link security |

**Deliverables:**
- No commercial document reaches the buyer without approval
- PDF quotation matches W.R.C. format
- Complete audit trail for every approval action

---

### Phase 6 — Orders, Delivery, Payments, Receipts
**Duration:** ~2 sessions
**Dependencies:** Phase 5 complete

| Task | Description |
|---|---|
| Order lifecycle | PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED |
| Delivery events | Track shipment and delivery with dates |
| Order/delivery status answers | Bot answers from confirmed database values only |
| Payment evidence | Upload and link to order/quotation |
| Receipt workflow | Approval required before issuance |
| Admin UI pages | Orders, delivery tracking, payment review |
| Tests | Status queries, receipt dedup, audit trail |

---

### Phase 7 — Polish, Analytics, ERP Readiness
**Duration:** ~2 sessions
**Dependencies:** Phase 6 complete

| Task | Description |
|---|---|
| Dashboard metrics | Conversion rates, approval times, unmatched products |
| ERP adapter interface | Abstract sync points for product, price, stock, customer, order |
| Performance optimization | Query optimization, caching, connection pooling |
| Security hardening | Rate limiting, input sanitization, file scanning |
| OpenAPI documentation | Auto-generated from NestJS decorators |
| Deployment guide | Production deployment on Cloud Run / Railway / VPS |
| Decommission Firebase function | Remove legacy webhook, update LINE console |

---

## 4. Firebase Function Transition Plan

```
Phase 1:  Firebase function → thin proxy → new API server
          (Both run simultaneously, Firebase forwards to new server)

Phase 2:  Update LINE Developers Console webhook URL to new server
          Firebase function receives no more traffic

Phase 3:  Remove Firebase function deployment
          Clean up firebase.json, .firebaserc
          Keep Firebase project for GCS bucket if still used
```

---

## 5. Data Migration

| Current Data | Target | Migration Strategy |
|---|---|---|
| Firestore `images` collection | Not needed in new system | Archive or ignore. Image bucket feature is unrelated to sales platform. |
| Cloud Storage files | Retain or archive | Existing uploaded images can remain in the bucket. New platform uses private storage. |
| LINE group/user associations | New PostgreSQL tables | No existing data to migrate. New system captures from fresh webhook events. |

---

## 6. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| LINE webhook downtime during transition | Missed messages from buyers | Run both systems in parallel during Phase 1–2. Use Firebase function as proxy. |
| AI extraction inaccuracy for Thai cable descriptions | Wrong product matches, bad quotes | Multi-step matching with human confirmation. Never auto-send without approval. |
| Scope creep (ERP, analytics, multi-tenant) | Delayed delivery | Defer to Phase 7. Build clean interfaces now. |
| Firebase function decommission timing | Old code still receiving traffic | Only decommission after 2+ weeks of stable new server operation. |
| `.env.example` secret exposure | Compromised LINE bot | Rotate credentials immediately (Phase 0 action item). |
| Node.js 20 decommission (2026-10-30) | Firebase deploy fails | Legacy function is temporary. New platform uses Docker/Cloud Run. |
