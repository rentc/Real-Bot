# Current Architecture — Repository Audit

**Audit date:** 2026-08-05
**Repository:** `https://github.com/rentc/Real-Bot.git`
**Branch:** `main` (5 commits)

---

## 1. Overview

The repository is a small LINE chatbot that saves images, videos, audio, and files sent in LINE group chats to Firebase Cloud Storage and records metadata in Firestore. It was originally forked from `thepnatee/line-bucket-image`.

**It is not a sales platform, quotation system, or AI application.** It is a single Firebase Cloud Function (~85 lines of business logic) that acts as a LINE webhook handler.

---

## 2. Repository Structure

```
.
├── .firebaserc                  # Firebase project alias (real-bot-6a793)
├── .gitignore                   # Root ignore (node_modules, .env, logs)
├── README.md                    # Thai-language setup instructions
├── firebase.json                # Firebase config: Functions, Firestore, Storage, Emulators
├── firestore.indexes.json       # Empty indexes
├── firestore.rules              # Deny-all rules (read/write: if false)
├── storage.rules                # Deny-all rules (read/write: if false)
└── functions/
    ├── .env                     # Live secrets (NOT tracked — good)
    ├── .env.example             # ⚠️ Contains REAL secrets (tracked — CRITICAL)
    ├── .gitignore               # Ignores node_modules, config.json, .env, *.log
    ├── .npmrc                   # legacy-peer-deps=true
    ├── config.json              # Firebase service account key (NOT tracked — good)
    ├── firebase.util.js         # Firebase Admin, Firestore, Cloud Storage helpers
    ├── index.js                 # Main webhook handler
    ├── line.util.js             # LINE API utilities (reply, getContent, verify)
    ├── message.js               # Thai message templates (welcome, memberJoined, text)
    ├── package.json             # Dependencies and scripts
    └── package-lock.json        # Lock file
```

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | 20 (upgraded from 18) |
| **Language** | JavaScript (CommonJS, no TypeScript) | ES2017+ |
| **Backend framework** | Firebase Cloud Functions (1st Gen) | `firebase-functions@^4.3.0` (resolved 4.9.0) |
| **Database** | Cloud Firestore | via `firebase-admin@^11.7.0` |
| **Object storage** | Google Cloud Storage | `@google-cloud/storage@^7.7.0` |
| **HTTP client** | axios | `^1.3.5` |
| **Date/time** | moment-timezone | `^0.5.43` |
| **LINE integration** | Custom (direct REST calls via axios) | LINE Messaging API v2 |
| **AI integration** | **None** | — |
| **Authentication** | **None** (no user auth, no admin UI) | — |
| **Frontend** | **None** | — |
| **ORM** | **None** (raw Firestore SDK) | — |
| **Test framework** | firebase-functions-test (devDep, no tests written) | `^3.1.0` |
| **Deployment** | Firebase CLI (`firebase deploy --only functions`) | — |
| **Region** | asia-northeast1 (Tokyo) | — |

---

## 4. Existing Functionality

### 4.1 Webhook Handler (`index.js`)

Single HTTP Cloud Function `webhook` in `asia-northeast1` region.

**Request flow:**
1. Rejects non-POST requests.
2. Verifies LINE webhook signature (`x-line-signature` header).
3. Iterates over `events` array.
4. **Group-only:** Ignores all events not from `source.type === "group"`.

**Supported events:**

| Event | Action |
|---|---|
| `join` | Bot added to group → sends Thai welcome message |
| `memberJoined` | New member joins → fetches profile → sends personalized greeting |
| `leave` | Bot removed → deletes all Firestore records for that groupId |
| `message` (image/audio/video/file) | Downloads content → uploads to Cloud Storage → saves record to Firestore → replies with public URL |

**Not supported:** text messages, mentions, stickers, location, follow/unfollow, postback, or any business logic.

### 4.2 LINE Utilities (`line.util.js`)

| Function | Purpose |
|---|---|
| `verifySignature()` | HMAC-SHA256 signature verification |
| `reply()` | Send reply message via LINE reply token |
| `getContent()` | Download message content (binary) |
| `getGroupMemberProfile()` | Fetch group member display name/profile |

### 4.3 Firebase Utilities (`firebase.util.js`)

| Function | Purpose |
|---|---|
| `insertImageGroup()` | Add record to `images` Firestore collection |
| `deleteGroup()` | Delete all records matching a groupId |
| `getImage()` | Query records by groupId (defined but not called) |
| `saveImageToStorage()` | Upload binary to Cloud Storage bucket, make public, return URL |
| `getExtension()` | Map message type to file extension |

**Init logic:** If `config.json` (service account key) exists locally, uses it for auth. Otherwise falls back to Application Default Credentials (for deployed environment).

### 4.4 Messages (`message.js`)

Three Thai-language message templates: `welcomeMessage`, `memberJoinedMessage`, `text`.

---

## 5. Firestore Data Model

Single collection:

```
images/
  ├── groupId: string
  ├── messageId: string
  ├── publicUrl: string
  └── date: string (YYYY-MM-DD, Asia/Bangkok)
```

No indexes. No compound queries. Deny-all security rules (only server SDK can access).

---

## 6. Reusable Modules

| Module | Reusable for target platform? | Notes |
|---|---|---|
| `verifySignature()` | ✅ Yes | Core LINE security. Well-implemented. |
| `reply()` | ✅ Yes | Will need expansion (push messages, flex messages). |
| `getContent()` | ✅ Yes | Binary content download. Useful for image/file extraction. |
| `getGroupMemberProfile()` | ✅ Yes | Profile retrieval for user identification. |
| `saveImageToStorage()` | ⚠️ Partial | File upload logic is reusable. Path structure and public URL pattern need redesign. |
| Firebase init pattern | ⚠️ Partial | Config.json local / ADC deployed pattern is fine for Cloud Functions. |
| Message templates | ❌ Replace | Thai "image bucket" messages are not relevant to sales bot. |
| Firestore `images` model | ❌ Replace | Too simple. No relation to sales/quotation data model. |
| Webhook handler structure | ⚠️ Partial | Event routing pattern is reusable but needs complete rewrite for intent classification, session management, and RBAC. |

---

## 7. Technical Debt

| Issue | Severity | Detail |
|---|---|---|
| No TypeScript | Medium | All files are JS with no type checking. Target platform requires typed, maintainable code. |
| No tests | High | `firebase-functions-test` is installed but zero test files exist. |
| No error handling on Storage upload | Medium | `file.save()` and `file.makePublic()` have no try/catch. |
| `deleteGroup()` cascading delete is dangerous | Medium | Deletes all images when bot leaves group, no confirmation or soft-delete. |
| `getImage()` defined but never called | Low | Dead code. |
| `makePublic()` on all uploaded files | Medium | Every uploaded file becomes publicly accessible. Not suitable for business documents. |
| No webhook deduplication | Medium | Same event could be processed twice if LINE retries. |
| No request body size limits | Low | Firebase Cloud Functions has built-in limits, but no application-level validation. |
| Synchronous processing | Medium | All processing (download, upload, Firestore write, LINE reply) happens in the HTTP handler. No queue. |
| Hardcoded region `asia-northeast1` | Low | Fine for Thailand/Japan deployment but should be configurable. |
| `moment-timezone` | Low | Deprecated library. Should migrate to `date-fns` or native `Intl`. |
| Node.js 20 deprecated | Medium | Firebase warns Node 20 will be decommissioned 2026-10-30. Must upgrade to 22. |

---

## 8. Security Issues

| Issue | Severity | Action Required |
|---|---|---|
| **`.env.example` contains REAL LINE Channel Secret and Access Token** | 🔴 CRITICAL | The file `functions/.env.example` is tracked in git and pushed to GitHub with real production credentials. These must be rotated immediately and the file must be sanitized. |
| **`config.json` contains a Firebase service account private key** | 🔴 CRITICAL | Not tracked in git (good), but exists on disk. Must never be committed. Already in `.gitignore`. Verify it hasn't been pushed historically. |
| Firestore deny-all rules | Low | Server SDK bypasses rules, but if a client app is ever added, no data is accessible. This is safe for server-only access. |
| Storage deny-all rules + `makePublic()` | Medium | Files are made public via IAM, bypassing Storage rules. Fine for public image sharing, not suitable for private business documents. |
| No rate limiting | Medium | LINE webhook itself is rate-limited by LINE, but the function is publicly accessible. |
| No input validation | Medium | No validation on message content, file types, or sizes beyond what LINE/Firebase enforce. |

---

## 9. Deployment Architecture

```
LINE Platform
    │
    ▼ (HTTPS POST webhook)
Firebase Cloud Functions (1st Gen)
    │ asia-northeast1
    ├── webhook HTTP function
    │     ├── Verify LINE signature
    │     ├── Process events synchronously
    │     ├── Download content from LINE API
    │     ├── Upload to Cloud Storage
    │     ├── Write to Firestore
    │     └── Reply via LINE API
    │
    ├── Cloud Firestore (images collection)
    └── Cloud Storage (public bucket)
```

**No frontend. No admin UI. No database migrations. No CI/CD pipeline.**

---

## 10. Environment Variables

| Variable | Purpose | Current State |
|---|---|---|
| `LINE_MESSAGING_API` | LINE API base URL | Static, could be hardcoded |
| `LINE_DATA_MESSAGING_API` | LINE data API base URL | Static, could be hardcoded |
| `LINE_CHANNEL_SECRET` | Webhook signature verification | ⚠️ Leaked in .env.example |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE API authentication | ⚠️ Leaked in .env.example |
| `BUCKET_NAME` | Cloud Storage bucket | `real-bot-6a793.firebasestorage.app` |

---

## 11. Summary Assessment

The existing repository is a **minimal proof-of-concept LINE bot** for collecting group images. It provides:

- ✅ A working LINE webhook with signature verification
- ✅ Firebase Cloud Functions deployment pipeline
- ✅ Cloud Storage and Firestore integration
- ✅ Basic LINE API utilities (reply, content download, profile)

It does **not** provide:

- ❌ User/role management
- ❌ Business session management
- ❌ Product/price/stock database
- ❌ AI/LLM integration
- ❌ Quotation calculation engine
- ❌ Approval workflow
- ❌ PDF generation
- ❌ Admin web UI
- ❌ Authentication/authorization
- ❌ Tests
- ❌ TypeScript
- ❌ Relational database
- ❌ API documentation
- ❌ Message queuing

**The codebase is viable as a starting point** for the LINE webhook integration layer. The LINE utilities (`verifySignature`, `reply`, `getContent`, `getGroupMemberProfile`) are well-written and directly reusable. The Firebase deployment infrastructure is in place and working.

**The codebase is not viable as the foundation** for the full platform. The target system requires a relational database (PostgreSQL), a web application framework, background workers, and ~40+ database tables. These require a new architecture built alongside the existing code, preserving what works.
