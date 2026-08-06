# Assumptions and Known Limitations

**Date:** 2026-08-05

---

## 1. Business Assumptions

| # | Assumption | Impact if wrong |
|---|---|---|
| A1 | **Single tenant initially.** The platform serves one company (W.R.C. / Wannaratchart Engineering). Multi-tenant support is deferred but the schema includes `tenant_id` for future readiness. | If multi-tenant is needed immediately, additional isolation, onboarding, and billing logic is required. |
| A2 | **Thai language is primary.** The bot, PDF quotation, admin UI, and messages default to Thai. English is secondary. AI extraction must handle Thai and English mixed text. | If other languages are needed, translation infrastructure is required. |
| A3 | **THB (Thai Baht) is the primary currency.** All prices, quotations, and calculations are in THB. Multi-currency is a future feature. | If USD or other currencies are needed immediately, currency conversion logic is required. |
| A4 | **The attached Excel workbook is sample data only.** Product IDs, SKUs, prices, and stock levels are non-production test data. Real data will be imported separately. | If this is production data, we need to treat the import with production-grade validation. |
| A5 | **The W.R.C. quotation image is the primary PDF template reference.** We will replicate its visual structure, not a pixel-perfect copy. | If pixel-perfect reproduction is required, additional design work is needed. |
| A6 | **VAT rate is 7% by default** (Thailand standard), configurable per price item. | If VAT-exempt products or different rates are common, the configuration UI must be prominent. |
| A7 | **Quotation validity defaults to 3 days** as shown in the sample quotation. This is configurable. | No significant impact. |
| A8 | **Initial approval policy: all quotations require approval.** More granular rules (by amount, discount, customer tier) can be configured later. | If auto-approval is needed immediately for low-value quotes, that logic must be added. |
| A9 | **LINE Official Account already exists** and is configured with Messaging API (not just chat). The Channel Secret and Access Token are available. | If only a LINE@ chat account exists, migration to Messaging API is required first. |
| A10 | **One LINE Official Account per company.** The bot operates under a single LINE channel. Multiple channels per company is a future feature. | If multiple channels are needed, channel-level isolation must be added to the LINE module. |

---

## 2. Technical Assumptions

| # | Assumption | Impact if wrong |
|---|---|---|
| T1 | **PostgreSQL is acceptable as the primary database.** Firestore is replaced because the target system requires relational integrity, decimal math, foreign keys, and complex queries across 40+ tables. | If the owner requires staying on Firebase/Firestore, significant architecture changes are needed and some features (decimal math, transactions) become harder. |
| T2 | **Docker is available on the development machine** for local PostgreSQL, Redis, and service containers. | If Docker is not available, local native installs or a cloud-hosted dev database must be used. |
| T3 | **The AI provider (Gemini or OpenAI) API key will be provided by the owner.** We build the provider abstraction but do not include API keys. | If no AI key is available, the extraction module can be stubbed with manual entry only. |
| T4 | **Firebase Cloud Functions will be deprecated gradually.** The new platform runs on a separate server (Cloud Run, Railway, or VPS). Firebase is kept temporarily as a proxy during transition. | If Firebase must remain the only deployment target, the architecture is severely constrained (no PostgreSQL, no Redis, no workers). |
| T5 | **The existing Firebase project (`real-bot-6a793`) continues to be used** for Cloud Storage and potentially for the legacy webhook proxy during transition. | No significant impact. |
| T6 | **No existing production data needs migration.** The current Firestore `images` collection is unrelated to the sales platform. New data starts fresh. | If there is existing customer or quotation data elsewhere, import scripts are needed. |
| T7 | **The LINE Messaging API `userId` is stable and unique** per LINE Official Account channel. We use it as the identity key for LINE users. Display names are NOT used for identity. | This is documented LINE behavior. No impact expected. |
| T8 | **LINE group `groupId` is stable.** Once the bot joins a group, the `groupId` does not change unless the bot is removed and re-added. | This is documented LINE behavior. |
| T9 | **Playwright (headless Chromium) can run in the target deployment environment** for PDF generation. | If the deployment environment does not support Chromium (e.g., some serverless platforms), an alternative PDF renderer or external service is needed. |
| T10 | **Node.js 20 or 22 is the target runtime** for the new API server. The legacy Firebase function currently uses Node 20. | If a specific version is required, adjust Dockerfile accordingly. |

---

## 3. LINE Platform Assumptions

| # | Assumption | Impact if wrong |
|---|---|---|
| L1 | **The bot can read messages in group chats** where it is a member. LINE Messaging API provides message events for group chats. | This is standard LINE behavior. |
| L2 | **The bot cannot read messages sent before it was added** to a group. Only new messages after joining are received via webhook. | No retroactive data collection is possible. |
| L3 | **LINE reply tokens expire after ~30 seconds.** For async processing, we use push messages instead of reply messages when the reply window has closed. | If push messages are restricted (e.g., free plan limits), some replies may fail. |
| L4 | **LINE Messaging API has rate limits** (varies by plan). The bot should batch and throttle outgoing messages. | If rate limits are hit, message delivery is delayed but not lost (outbox pattern). |
| L5 | **LINE does not support @mentions in the same way as Slack/Teams.** The bot detects mentions via the `mention` object in message events (available in some contexts). Commands (`#quote`, `#price`) are the primary trigger mechanism. | If mentions are unreliable, commands become the only trigger method. |
| L6 | **Direct messages from the bot to individual users are possible** if the user has added the bot as a friend. This is used for approval notifications. | If the user hasn't friended the bot, DM delivery fails. Fallback to group notification or web dashboard. |

---

## 4. Security Assumptions

| # | Assumption | Impact if wrong |
|---|---|---|
| S1 | **LINE Channel Secret and Access Token in `.env.example` are real production credentials** that have been pushed to a public GitHub repository. They MUST be rotated immediately. | If not rotated, anyone with access to the git history can impersonate the bot. |
| S2 | **The Firebase service account key (`config.json`) is not tracked in git.** Verified by `git ls-files`. | If it was ever committed historically, the key should be rotated. |
| S3 | **The GitHub repository (`rentc/Real-Bot`) may be public.** Credential exposure is a concern. | Verify visibility. If public, rotate all exposed secrets immediately. |
| S4 | **Admin UI authentication is sufficient with email/password initially.** OAuth (Google, LINE Login) can be added later. | If SSO is required immediately, additional integration work is needed. |

---

## 5. Known Limitations (Phase 0)

| # | Limitation | Planned Resolution |
|---|---|---|
| K1 | No tests exist in the current codebase. | Tests are created in each phase. |
| K2 | No TypeScript. Entire codebase is JavaScript (CommonJS). | New code is TypeScript. Legacy JS is preserved until decommissioned. |
| K3 | No database migrations. Firestore is schema-less. | Prisma migrations introduced in Phase 1. |
| K4 | No admin UI. All management is via Firebase Console or command line. | Next.js admin app introduced in Phase 1. |
| K5 | No AI integration. The bot has no intelligence. | AI extraction module introduced in Phase 3. |
| K6 | No approval workflow. | Approval engine introduced in Phase 5. |
| K7 | No PDF generation capability. | PDF generator introduced in Phase 5. |
| K8 | No product/price/stock database. | Introduced in Phase 2 with sample seed data. |
| K9 | Firebase Cloud Functions 1st Gen is limited to 9-minute timeout, 2GB memory, no WebSocket, no persistent connections. | New platform runs on Cloud Run / Railway / VPS with no such limits. |
| K10 | Current bot responds to ALL image/video/audio/file messages in ALL groups. No silence policy. | Silent response policy is a Phase 1 deliverable. |

---

## 6. Decisions Needing Owner Approval

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | **Deployment platform for the new API server** | Cloud Run, Railway, VPS, Render | Cloud Run (GCP consistency) or Railway (simplicity). Owner to decide based on budget and ops preference. |
| D2 | **Rotate LINE credentials immediately?** | Rotate now (causes brief bot downtime) vs. rotate after new server is ready | **Rotate now.** The credentials are exposed on GitHub. Update `.env` and `functions/.env` after rotation. |
| D3 | **Keep legacy image-bucket feature?** | Keep (as separate function) vs. Remove | Remove. It's unrelated to the sales platform. Can be archived as a git tag. |
| D4 | **AI provider preference** | Gemini (Google) vs. OpenAI vs. Both | Build abstraction for both. Start with whichever API key is available. |
| D5 | **GitHub repository visibility** | Public vs. Private | **Private.** Contains business logic, credential history, and customer-facing code. |
| D6 | **Domain name for the new API server** | Custom domain vs. Platform-provided URL | Custom domain preferred for LINE webhook and admin UI. Can use platform URL initially. |
