# 🚀 Setup & Connection Guide

## Prerequisites
- Node.js v18+ installed
- npm v8+ installed
- VS Code installed

---

## Step 1: Open in VS Code

```bash
# Download the project and open the root folder
code 2301430100260
```

---

## Step 2: Setup Logging Middleware

```bash
cd logging-middleware
npm install
npm run build
```

This compiles the middleware to `dist/` — backend & frontend both import from here.

---

## Step 3: Setup Backend

### 3a. Install dependencies
```bash
cd ../notification_app_be
npm install
```

### 3b. Create your .env file
```bash
cp .env.example .env
```

Open `.env` and fill in:
```
PORT=5000
LOG_API_URL=https://your-logging-api-url.com/logs
ACCESS_TOKEN=your_bearer_token_here
```

> ⚠️ If you don't have a logging API yet, leave LOG_API_URL empty.
> The app will still work — logs will print to console only.

### 3c. Start backend
```bash
npm run dev
```

You should see:
```
✅ Server is running at http://localhost:5000
```

### 3d. Test backend is working
Open browser or Postman:
- GET http://localhost:5000/health → should return `{ "status": "ok" }`

---

## Step 4: Setup Frontend

### 4a. Install dependencies
```bash
cd ../notification_app_fe
npm install
```

### 4b. Create your .env file
```bash
cp .env.example .env
```

Open `.env` and fill in:
```
VITE_API_URL=http://localhost:5000
VITE_LOG_API_URL=https://your-logging-api-url.com/logs
VITE_ACCESS_TOKEN=your_bearer_token_here
```

> ⚠️ VITE_API_URL must point to your backend URL.
> If backend is running on port 5000 locally, use http://localhost:5000

### 4c. Start frontend
```bash
npm run dev
```

You should see:
```
  VITE v5.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

Open http://localhost:3000 in your browser.

---

## Step 5: Run Both Simultaneously

Open **two terminals** in VS Code (Ctrl+`):

**Terminal 1 (Backend):**
```bash
cd notification_app_be
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd notification_app_fe
npm run dev
```

---

## Step 6: Test APIs in Postman

Import these requests:

### Create Notification
```
POST http://localhost:5000/notifications
Content-Type: application/json

{
  "title": "Server Alert",
  "message": "CPU usage is high",
  "type": "system"
}
```

### Get All Notifications
```
GET http://localhost:5000/notifications
```

### Get by ID
```
GET http://localhost:5000/notifications/<id>
```
Replace `<id>` with an actual ID from the create response.

### Delete
```
DELETE http://localhost:5000/notifications/<id>
```

---

## Folder Structure Summary

```
2301430100260/
├── logging-middleware/        ← Reusable Log() function
│   ├── src/index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── notification_app_be/       ← Express REST API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/logger.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── notification_app_fe/       ← React + MUI frontend
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/logger.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── notification_system_design.md
└── .gitignore
```

---

## Common Issues & Fixes

### CORS Error in browser
The backend has CORS enabled for all origins by default.
If you still see CORS errors, check that VITE_API_URL in frontend .env matches exactly where backend is running.

### "Cannot connect to backend"
Make sure:
1. Backend is running (`npm run dev` in notification_app_be)
2. VITE_API_URL in frontend .env is `http://localhost:5000` (no trailing slash)
3. Restart frontend after changing .env

### TypeScript errors on build
Run `npm install` again in the affected folder.
For logging-middleware, run `npm run build` before using it.

### Port already in use
Change PORT in backend `.env` to another value like `5001`.
Then update `VITE_API_URL` in frontend `.env` to match.

---

## Git Setup (for submission)

```bash
cd 2301430100260
git init
git add .
git commit -m "Initial commit: notification management system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/2301430100260.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.
Repository name must be: `2301430100260`
