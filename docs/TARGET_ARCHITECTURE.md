# Target Architecture — WRC AI Sales and Quotation Platform

**Date:** 2026-08-05

---

## 1. Architecture Overview

Transform the current single-function LINE image-bucket bot into a modular, multi-service platform with a web admin UI, relational database, AI extraction pipeline, and deterministic business engine.

```
                                    ┌─────────────────────────────────┐
                                    │         Admin Web App           │
                                    │   (Next.js / TypeScript)        │
                                    │                                 │
                                    │  Dashboard │ Products │ Prices  │
                                    │  Customers │ Quotes │ Approvals │
                                    │  Orders │ Users │ Groups │ Audit│
                                    └──────────────┬──────────────────┘
                                                   │ REST API
                                                   ▼
┌──────────┐    HTTPS POST     ┌───────────────────────────────────────────┐
│   LINE   │ ──────────────►   │           API Server (Node.js)            │
│ Platform │                   │                                           │
│          │ ◄──────────────   │  ┌─────────────┐  ┌──────────────────┐   │
│  Groups  │   Reply / Push    │  │ LINE Webhook │  │   REST API       │   │
│  Users   │                   │  │ Handler      │  │   Controllers    │   │
└──────────┘                   │  └──────┬──────┘  └────────┬─────────┘   │
                               │         │                  │             │
                               │         ▼                  ▼             │
                               │  ┌──────────────────────────────────┐   │
                               │  │         Service Layer             │   │
                               │  │                                   │   │
                               │  │  Intent Router │ Session Manager  │   │
                               │  │  Product Match │ Price Calculator │   │
                               │  │  Approval Engine │ PDF Generator  │   │
                               │  │  LINE Service  │ User/RBAC       │   │
                               │  └──────────┬────────────┬──────────┘   │
                               │             │            │              │
                               │             ▼            ▼              │
                               │  ┌──────────────┐ ┌────────────────┐   │
                               │  │  PostgreSQL   │ │  Redis + Queue │   │
                               │  │  (Primary DB) │ │  (BullMQ)      │   │
                               │  └──────────────┘ └────────────────┘   │
                               │             │                           │
                               │             ▼                           │
                               │  ┌──────────────────────────────────┐   │
                               │  │  Background Workers              │   │
                               │  │                                   │   │
                               │  │  AI Extraction │ OCR/Vision      │   │
                               │  │  PDF Generation │ LINE Send      │   │
                               │  │  Excel Import │ Notifications    │   │
                               │  └──────────────────────────────────┘   │
                               └───────────────────────────────────────────┘
                                                   │
                                                   ▼
                               ┌───────────────────────────────────────────┐
                               │          Object Storage (S3/GCS)          │
                               │  Attachments │ PDFs │ Logos │ Signatures  │
                               └───────────────────────────────────────────┘
```

---

## 2. Technology Stack Decision

### 2.1 What to keep from the existing repository

| Component | Keep / Replace | Rationale |
|---|---|---|
| Firebase Cloud Functions (1st Gen) | **Replace** | Cannot support PostgreSQL, Redis, background workers, web app serving, or WebSocket. Not suitable for a multi-service platform. |
| LINE webhook signature verification | **Keep** | `verifySignature()` logic is correct. Port to TypeScript. |
| LINE reply/push utilities | **Keep** | Port to TypeScript, add push message and Flex Message support. |
| LINE content download | **Keep** | Port to TypeScript. |
| LINE group member profile | **Keep** | Port to TypeScript. |
| Firestore (images collection) | **Replace** | Needs PostgreSQL for relational data (40+ tables, foreign keys, transactions, decimal math). |
| Cloud Storage (public bucket) | **Keep as option** | Retain GCS for file storage, but make private (signed URLs). Also support S3-compatible. |
| Firebase Emulators | **Replace** | Use Docker Compose for local development. |
| `moment-timezone` | **Replace** | Use `date-fns` or native `Intl.DateTimeFormat`. |
| firebase-admin SDK | **Replace** | No longer the primary database. May keep for GCS access or FCM if needed. |

### 2.2 Target stack

| Layer | Technology | Rationale |
|---|---|---|
| **Language** | TypeScript | Type safety, maintainability, shared types frontend/backend |
| **API Server** | NestJS (Fastify adapter) | Modular, injectable, built-in validation, guards, interceptors |
| **Web App** | Next.js 14+ (App Router) | SSR, API routes, React Server Components |
| **Database** | PostgreSQL 16 | Relational integrity, decimal types, transactions, JSON columns, full-text search |
| **ORM** | Prisma | Type-safe queries, migrations, seeding |
| **Queue** | Redis + BullMQ | Durable async processing for AI, PDF, LINE sends |
| **Object Storage** | GCS (existing bucket) or S3-compatible | Private files with signed URLs |
| **PDF Generation** | Playwright (headless Chromium) | Server-side HTML-to-PDF, accurate CSS rendering |
| **AI Provider** | Provider-neutral adapter (Gemini + OpenAI) | Structured JSON extraction, intent classification |
| **Authentication** | NextAuth.js or custom JWT | Admin UI authentication with RBAC |
| **Containerization** | Docker Compose | Local development: API, Web, PostgreSQL, Redis, Workers |
| **Deployment** | Cloud Run / Railway / VPS | Replaces Firebase Cloud Functions |

### 2.3 Migration path for LINE webhook

The existing Firebase Cloud Function webhook URL:
```
https://asia-northeast1-real-bot-6a793.cloudfunctions.net/webhook
```

Will be replaced by a new webhook endpoint on the API server:
```
https://<new-domain>/api/line/webhook
```

During migration, the old Firebase function can proxy to the new server, or the LINE Developers Console webhook URL can be updated directly.

---

## 3. Database Architecture

### 3.1 Core entity groups

```
┌─────────────────────────────────────────────────────────────┐
│ Identity & Access                                            │
│  tenants │ users │ line_users │ line_groups                  │
│  line_group_memberships │ roles │ permissions                │
│  role_permissions │ membership_roles                         │
├─────────────────────────────────────────────────────────────┤
│ Customer Management                                          │
│  customers │ customer_contacts │ customer_addresses          │
│  customer_group_links                                        │
├─────────────────────────────────────────────────────────────┤
│ Product, Price & Stock                                       │
│  products │ product_aliases │ price_books │ price_versions   │
│  price_items │ warehouses │ stock_levels                     │
├─────────────────────────────────────────────────────────────┤
│ Conversation & Extraction                                    │
│  conversation_sessions │ messages │ attachments              │
│  extractions │ webhook_events                                │
├─────────────────────────────────────────────────────────────┤
│ Quotation & Approval                                         │
│  quote_requests │ quote_request_items │ quotations           │
│  quotation_versions │ quotation_items                        │
│  approval_requests │ approval_actions │ documents            │
├─────────────────────────────────────────────────────────────┤
│ Order & Delivery                                             │
│  orders │ order_items │ delivery_events                      │
│  payment_evidence │ receipts                                 │
├─────────────────────────────────────────────────────────────┤
│ System                                                       │
│  outbox_messages │ audit_logs │ settings                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Key design decisions

- **Decimal types** for all monetary values (`DECIMAL(18,4)`)
- **Immutable versioning** for prices and quotations (never overwrite, create new version)
- **Soft-delete** with `deleted_at` timestamp where appropriate
- **Tenant/company isolation** via `tenant_id` foreign key on all business tables
- **Audit columns** (`created_at`, `updated_at`, `created_by`, `updated_by`) on every table
- **Webhook deduplication** via unique `webhook_event_id`

---

## 4. Service Architecture (Modular Monolith)

```
src/
├── modules/
│   ├── auth/              # JWT, session, guards
│   ├── line/              # Webhook handler, LINE API service
│   ├── users/             # User CRUD, LINE user linking
│   ├── groups/            # LINE group management
│   ├── rbac/              # Roles, permissions, membership roles
│   ├── customers/         # Customer master data
│   ├── products/          # Product CRUD, aliases, import/export
│   ├── prices/            # Price versions, approval, calculation
│   ├── stock/             # Warehouse stock levels
│   ├── sessions/          # Business session lifecycle
│   ├── extraction/        # AI provider adapter, structured extraction
│   ├── matching/          # Deterministic product matching
│   ├── quotations/        # Quotation CRUD, calculation engine
│   ├── approvals/         # Approval workflow engine
│   ├── documents/         # PDF generation, document management
│   ├── orders/            # Order lifecycle, delivery events
│   ├── payments/          # Payment evidence, receipt workflow
│   ├── notifications/     # LINE message delivery, outbox
│   └── audit/             # Audit log service
├── shared/
│   ├── database/          # Prisma client, migrations
│   ├── queue/             # BullMQ producers/consumers
│   ├── storage/           # Object storage abstraction
│   ├── ai/                # AI provider abstraction
│   └── utils/             # Date, money, validation helpers
├── workers/               # Background job processors
└── config/                # Environment, feature flags
```

---

## 5. LINE Integration Architecture

### 5.1 Webhook processing pipeline

```
LINE POST /api/line/webhook
    │
    ├── 1. Verify signature (reuse existing logic)
    ├── 2. Deduplicate by webhook event ID
    ├── 3. Return 200 OK immediately
    ├── 4. Queue event for async processing
    │
    ▼ (Worker)
    ├── 5. Identify group, sender, membership, role
    ├── 6. Check bot response policy (mention? command? active session? intent?)
    ├── 7. If irrelevant → discard (no storage, no reply)
    ├── 8. If relevant → download attachments → store securely
    ├── 9. Run AI extraction (if needed)
    ├── 10. Route to business service (quotation, order, delivery, etc.)
    └── 11. Enqueue reply via outbox
```

### 5.2 Bot response policy

The bot responds ONLY when:
- Explicitly mentioned (`@bot`)
- A command is used (`#quote`, `#price`, `#stock`, `#order`, `#delivery`, `#approve`)
- Sender has an active business session
- AI intent classifier detects high-confidence business intent
- A workflow notification is triggered (approval result, quotation sent, etc.)

---

## 6. AI Extraction Architecture

```
┌──────────────────┐
│  AI Provider      │
│  Abstraction      │
│                   │
│  ┌─────────────┐ │     ┌─────────────┐
│  │   Gemini    │ │ ◄──│  Extraction  │
│  │   Adapter   │ │     │  Service     │
│  └─────────────┘ │     │             │
│  ┌─────────────┐ │     │  - Intent   │
│  │   OpenAI    │ │     │  - Fields   │
│  │   Adapter   │ │     │  - Products │
│  └─────────────┘ │     │  - Missing  │
│                   │     └─────────────┘
└──────────────────┘
```

- Provider-neutral interface
- JSON-schema-constrained output
- AI extracts intent, descriptions, quantities
- AI never returns prices, stock, approval states, or document numbers
- Deterministic code validates and matches against database

---

## 7. Quotation Flow

```
Buyer message in LINE group
    │
    ├── AI extracts: intent, items, customer info
    ├── Deterministic matching: items → products
    ├── Missing info? → Ask clarification
    ├── All matched → Calculate prices (backend, decimal math)
    ├── Create DRAFT quotation
    │
    ├── Admin reviews in web UI
    ├── Submit for approval
    │
    ├── Approver reviews (web UI or secure link)
    ├── Approve / Reject / Return for correction
    │
    ├── On approval → Generate PDF (W.R.C. format)
    ├── Lock version → Store checksum
    └── Send to buyer via LINE
```

---

## 8. Deployment Architecture (Target)

### Local development
```
docker-compose.yml
├── api        (NestJS server, port 3000)
├── web        (Next.js admin, port 3001)
├── worker     (BullMQ consumers)
├── postgres   (PostgreSQL 16, port 5432)
├── redis      (Redis 7, port 6379)
└── minio      (S3-compatible storage, optional)
```

### Production
```
Cloud Run / Railway / VPS
├── API Server (container)
├── Web App (container or Vercel)
├── Worker (container)
├── Cloud SQL / Managed PostgreSQL
├── Memorystore / Managed Redis
└── GCS / S3 for object storage
```

### LINE Webhook URL transition
1. Phase 1: Keep Firebase function as a thin proxy → forwards to new API server
2. Phase 2: Update LINE Developers Console to point directly to new API server
3. Phase 3: Decommission Firebase function

---

## 9. Security Architecture

| Concern | Approach |
|---|---|
| LINE webhook auth | HMAC-SHA256 signature verification (existing, ported) |
| Admin UI auth | JWT-based authentication (email/password initially, OAuth later) |
| RBAC | Permission-based, checked server-side on every request |
| API auth | Bearer token with role/permission guards |
| Secrets | Environment variables only, `.env.example` with placeholders |
| File access | Private storage with time-limited signed URLs |
| Approval links | Signed, single-use, time-limited, permission-checked |
| Data at rest | Encrypted columns for sensitive PII (optional, configurable) |
| Audit | Append-only audit log, never overwrite approved records |
| Rate limiting | On public endpoints (webhook, auth) |
| CSRF | SameSite cookies + CSRF token for web app |
