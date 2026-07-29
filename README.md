# Velora

**Conversations, in real time.**

A full-stack real-time chat application built with React (Vite + Tailwind + Framer Motion) on the
frontend, and Node/Express + Socket.IO + MongoDB on the backend.

This README is written for someone setting this up for the first time — follow it top to bottom.

---

## 1. What's actually implemented

Being upfront about scope, since a spec this size always has trade-offs:

**Fully working:**
- Register / login / logout with JWT + bcrypt password hashing, protected API routes
- Real-time 1:1 and group messaging over Socket.IO (instant delivery, no polling)
- Typing indicators, online/offline presence with last-seen, read receipts
- Message replies, emoji reactions, delete-your-own-message, copy message
- Image and file uploads (local disk storage by default; Cloudinary as an optional swap — see §6)
- Group creation, adding/removing members, admin badge, leave group
- User search (by name/username/email) to start new chats
- Responsive layout (mobile back-navigation, full-width chat on small screens)
- Landing page, auth pages, dashboard — all connected to the real backend, no mock data
- 4 premium dark themes (Nebula Ember default, Sakura Dream, Ocean Pulse, Midnight Aurora) with an
  animated theme switcher, persisted per-browser via `localStorage`, spring-based animations,
  a custom typing indicator, staggered sidebar entrances, layout transitions

**Simplified / stubbed (documented, not faked):**
- **Forgot/reset password** works end-to-end but doesn't send a real email (no SMTP provider
  configured). The API returns the reset token directly in the response, and the UI shows it
  as a clickable link, so you can see the full flow without setting up an email service.
- **Light mode** is not implemented — the app ships with 4 dark themes (Settings → Appearance).
- **Notifications** are in-app/real-time only (no persisted Notification collection or push
  notifications) — new messages, presence changes, and reactions all arrive live over the socket.
- **Voice/video call icons** in the chat header are placeholders (as the original spec allowed).
- Message search and a dedicated "shared media" gallery view are not built.

Nothing above is a broken button — the simplified items are either absent or clearly labeled
in the UI as not available yet.

---

## 2. Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide icons, Socket.IO client, Axios
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB with Mongoose
- **Auth:** JWT + bcrypt
- **File storage:** Local disk by default, Cloudinary optional

---

## 3. Project structure

```
velora/
├── client/                # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # Sidebar, ChatWindow, MessageBubble, modals, etc.
│   │   ├── pages/         # Landing, Login, Register, Dashboard, etc.
│   │   ├── context/       # AuthContext, SocketContext
│   │   └── services/      # axios instance
│   └── package.json
├── server/                 # Express + Socket.IO backend
│   ├── src/
│   │   ├── config/         # db.js, cloudinary.js
│   │   ├── models/         # User, Conversation, Message
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/     # auth.js (JWT), upload.js (multer)
│   │   └── socket/         # socketHandler.js
│   └── package.json
├── .env.example
├── .gitignore
└── package.json             # root convenience scripts
```

---

## 4. Prerequisites

1. **Node.js** v18 or later — https://nodejs.org (the LTS installer is fine)
2. **A MongoDB connection string** — either a local MongoDB install, or a free MongoDB Atlas
   cluster (see §5 below)
3. (Optional) **A Cloudinary account** if you want cloud file storage instead of local disk
   (see §6)

Check your Node version:
```bash
node -v
```

---

## 5. MongoDB Atlas setup (free tier)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **Project**, then click **Build a Database** → choose the **free M0 cluster**.
3. Pick a cloud provider/region close to you and create the cluster (takes a couple of minutes).
4. Under **Database Access**, click **Add New Database User**. Create a username and password
   (use a strong, URL-safe password — avoid `@`, `/`, `:` characters, or URL-encode them).
5. Under **Network Access**, click **Add IP Address** → **Allow Access From Anywhere**
   (`0.0.0.0/0`) for local development. Lock this down for production.
6. Go back to **Database** → click **Connect** on your cluster → **Drivers** → copy the
   connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your database user's credentials, and add a
   database name before the `?`, e.g. `.../velora?retryWrites=true...`.
8. Paste the full string into `MONGO_URI` in your `.env` file (see §7).

---

## 6. Cloudinary setup (optional — local storage works out of the box)

By default, Velora stores uploaded images/files on the server's local disk under
`server/src/uploads/`, which works with zero extra setup. Switch to Cloudinary if you want
uploads to live in the cloud (e.g. for a real deployment where the server's disk isn't persistent).

1. Create a free account at https://cloudinary.com/users/register/free
2. On your Cloudinary dashboard, copy: **Cloud Name**, **API Key**, **API Secret**
3. In your `.env`, set:
   ```
   USE_CLOUDINARY=true
   CLOUDINARY_CLOUD_NAME=<your cloud name>
   CLOUDINARY_API_KEY=<your api key>
   CLOUDINARY_API_SECRET=<your api secret>
   ```
4. Restart the server. Uploads will now go to Cloudinary automatically
   (see `server/src/routes/uploadRoutes.js`).

---

## 7. Installation

### Step 1 — Get the code
Extract `velora.zip` and open the resulting `velora/` folder in VS Code (or your editor of choice).

### Step 2 — Configure environment variables
```bash
cp .env.example server/.env
```
Open `server/.env` and fill in:
- `MONGO_URI` — from §5
- `JWT_SECRET` — any long random string, e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `CLIENT_URL` — leave as `http://localhost:5173` for local dev
- Cloudinary vars — only if you set `USE_CLOUDINARY=true` (see §6)

### Step 3 — Install dependencies
From the project root:
```bash
npm install
npm run install:all
```
This installs the root `concurrently` package plus both `client/` and `server/` dependencies.

### Step 4 — Run the app
From the project root:
```bash
npm run dev
```
This starts both the backend (port 5000) and frontend (port 5173) together.

Or, in two separate terminals:
```bash
# Terminal 1
cd server
npm install
npm run dev
```
```bash
# Terminal 2
cd client
npm install
npm run dev
```

### Step 5 — Open the app
- Frontend: **http://localhost:5173**
- Backend health check: **http://localhost:5000/api/health**

Register a new account, open the app in a second browser (or incognito window) with a second
account, and start a conversation to see real-time delivery, typing indicators, and presence
working between the two.

---

## 8. Troubleshooting

**MongoDB connection errors**
- `MongoNetworkError` / timeout → check Network Access in Atlas allows your IP (or `0.0.0.0/0`).
- `Authentication failed` → check your database user's username/password in the connection
  string, and that any special characters are URL-encoded.

**CORS errors in the browser console**
- Make sure `CLIENT_URL` in `server/.env` exactly matches the URL you're opening the frontend
  at (`http://localhost:5173`, no trailing slash).

**Socket.IO won't connect / stuck on "Reconnecting"**
- Confirm the backend is actually running on port 5000 (`npm run server`).
- If you changed the backend port, update the Vite proxy in `client/vite.config.js`.

**Port already in use**
- macOS/Linux: `lsof -i :5000` then `kill -9 <PID>` (or use a different `PORT` in `.env`).
- Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`.

**"Missing environment variables" / server crashes on start**
- Double check `server/.env` exists (not just `.env.example`) and `MONGO_URI` / `JWT_SECRET` are set.

**npm install errors**
- Delete `node_modules` and `package-lock.json` in the affected folder (`client/` or `server/`)
  and re-run `npm install`.
- Make sure you're on Node 18+ (`node -v`).

**Cloudinary upload errors**
- Confirm `USE_CLOUDINARY=true` and all three Cloudinary env vars are set correctly.
- Check the file is under the 15MB limit and an allowed type (see `server/src/middleware/upload.js`).

**Authentication errors ("Not authorized")**
- Your JWT may have expired (default 7 days) — log out and back in.
- If you changed `JWT_SECRET` after users already had tokens, all existing tokens become invalid —
  that's expected.

---

## 9. Production build & deployment

Build the frontend:
```bash
cd client
npm run build
```
This outputs static files to `client/dist/`.

**Recommended deployment targets:**
- **Frontend:** Vercel or Netlify (serve `client/dist`, or use their Vite preset)
- **Backend:** Render or Railway (Node web service running `server/src/server.js`)
- **Database:** MongoDB Atlas (already cloud-hosted)
- **File storage:** Cloudinary (recommended for production — see §6; a server's local disk
  on most PaaS platforms is not persistent across deploys)

In production, set the same environment variables as `.env.example` on your hosting provider's
dashboard (never commit real values), and update `CLIENT_URL` on the backend to your deployed
frontend URL, and the API base URL used by the frontend (`client/src/services/api.js` currently
assumes a proxied `/api` path — for a separately hosted backend, point `baseURL` at your backend's
public URL instead).

---

## 10. Security notes

- Passwords are hashed with bcrypt (10 salt rounds) — never stored in plain text.
- JWTs are signed with `JWT_SECRET` and expire (`JWT_EXPIRES_IN`, default 7 days).
- All conversation/message routes check the requesting user is actually a member before
  returning data.
- File uploads are restricted by MIME type and capped at 15MB.
- No secrets are committed — `.env` is gitignored, only `.env.example` (with placeholders) ships.

---

## 11. Features checklist

| Feature | Status |
|---|---|
| Register / Login / Logout | ✅ |
| JWT auth + protected routes | ✅ |
| Forgot/reset password (token returned directly, no email) | ✅ (simplified) |
| Private 1:1 chat | ✅ |
| Group chat (create, add/remove members, leave, admin) | ✅ |
| Real-time messaging via Socket.IO | ✅ |
| Typing indicators | ✅ |
| Online/offline presence + last seen | ✅ |
| Read receipts | ✅ |
| Message replies, reactions, delete, copy | ✅ |
| Image upload + preview | ✅ |
| File upload + download | ✅ |
| User search | ✅ |
| Responsive / mobile layout | ✅ |
| 4 animated dark themes (Nebula Ember, Sakura Dream, Ocean Pulse, Midnight Aurora) | ✅ |
| Light mode | ❌ not built |
| In-app real-time notifications | ✅ |
| Persisted notification history | ❌ not built |
| Message search | ❌ not built |
| Shared media gallery | ❌ not built |
| Voice/video call | ❌ placeholder icons only |

---

Built as a complete, runnable full-stack project — not a mockup.
=======
# PRODIGY_FS_01
Task 1 - Full Stack Web Development Internship at Prodigy InfoTech
>>>>>>> 51edc9d37d2061654d3a3473e655f48d852b583d
