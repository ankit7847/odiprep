# Deploying OdiPrep (free)

| Part | Where | URL you get |
|---|---|---|
| API (`server/`) | Render (free web service) | `https://odiprep-api.onrender.com` |
| Website (`client/`) | Vercel (free) | `https://odiprep.vercel.app` |
| Database | MongoDB Atlas (already set up) | — |

Production deploys from the **`main`** branch. Merge `dev` → `main` when you want to go live.

## 1. MongoDB Atlas
- Network Access → allow `0.0.0.0/0` (Render's IPs change).
- Use a strong database password. Your `MONGO_URI` must end with `/odiprep?retryWrites=true&w=majority`.

## 2. API on Render
1. render.com → sign in with GitHub.
2. **New → Blueprint** → choose the `odiprep` repo → it reads `render.yaml`.
3. Fill the secret values it asks for:
   - `MONGO_URI` — same as your local `.env`
   - `CLIENT_URL` — put `https://odiprep.vercel.app` for now (fix it in step 4 if Vercel gives a different name)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — use a **strong** password
   - `JWT_SECRET` is generated automatically.
4. **Apply**. Wait for "Live", then open `https://<your-service>.onrender.com/api/health` → `{"success":true,...}`.

Free plan note: the API sleeps after 15 minutes without traffic. The first request after that takes ~30–50 seconds.

## 3. Website on Vercel
1. vercel.com → sign in with GitHub → **Add New → Project** → import `odiprep`.
2. **Root Directory:** `client` (Framework: Vite is detected).
3. **Environment Variable:** `VITE_API_URL` = `https://<your-service>.onrender.com/api`
4. **Deploy**. `vercel.json` makes page refreshes on routes like `/dashboard` work.

## 4. Connect them
- If the Vercel URL is different from what you put in `CLIENT_URL`, update `CLIENT_URL` on Render (Environment tab) → it redeploys.
- Several sites? Comma-separate: `https://odiprep.vercel.app,https://odiprep.in`

## 5. Data
Render and your laptop use the **same Atlas database**, so the exams, admin user and uploaded papers are already there. (Later, use a separate database name for development, e.g. `/odiprep-dev`.)

## Updating the live site
`feature/*` → PR into `dev` → test locally → PR `dev` → `main` → Render and Vercel redeploy automatically.
