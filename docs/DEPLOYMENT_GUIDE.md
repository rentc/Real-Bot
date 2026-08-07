# WRC AI Sales Platform - Deployment Guide

This guide outlines the steps required to deploy the new API server, migrate traffic from the legacy Firebase Function, and ultimately decommission the old system.

## 1. Prerequisites
- Docker installed locally for containerization (optional, but recommended if migrating to Cloud Run).
- Firebase CLI installed (`npm install -g firebase-tools`).
- Access to the LINE Developers Console.
- Access to Google Cloud Console (Project: `real-bot-6a793`).

## 2. Deploying the New API Server
Currently, the new NestJS API is wrapped in a Firebase Cloud Function for backward compatibility. 

### Option A: Deploy via Firebase Functions (Current Setup)
1. Navigate to the API directory: `cd apps/api`
2. Build the NestJS app: `npm run build`
3. Deploy the specific function: `firebase deploy --only functions:api`
4. Verify the new endpoint URL (e.g., `https://asia-northeast1-real-bot-6a793.cloudfunctions.net/api`).

### Option B: Deploy to Cloud Run / Railway / VPS (Target Architecture)
*(This is recommended because Playwright PDF generation requires Chromium binaries which are heavy for standard Cloud Functions).*
1. Create a `Dockerfile` in `apps/api`.
2. Build and push the container image to Google Container Registry (GCR) or Artifact Registry.
3. Deploy the container to Cloud Run.
4. Note the public Cloud Run URL.

## 3. Transitioning LINE Webhook Traffic
1. Log in to the **LINE Developers Console**.
2. Select your Provider and the Messaging API Channel.
3. Under the **Messaging API** tab, find the **Webhook URL** setting.
4. Click **Edit** and paste the new API server URL (must be HTTPS).
   - Ensure you append the correct route path if necessary (e.g., `https://your-new-url.com/line/webhook`).
5. Click **Verify** to ensure the new server responds correctly with a `200 OK`.
6. Click **Update** to save.

*At this point, all new LINE messages will route to the new NestJS server.*

## 4. Decommissioning the Legacy Firebase Function
Once the new server has been running stably for at least 1-2 weeks:
1. In the `firebase.json` file at the root of the repository, remove the legacy `functions` codebase block.
2. Delete the old `functions` folder from the repository.
3. Run `firebase deploy --only functions` to remove the legacy function from Google Cloud.
4. (Optional) Review the Firestore `images` collection and archive data if no longer needed.
