# Deployment Guide (GitHub + MongoDB Atlas + Render + Vercel)

## 1) Push code to GitHub

From project root:

```bash
git init
git add .
git commit -m "Prepare deployment setup"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If this repository already exists, just commit and push your latest changes.

## 2) Create MongoDB Atlas database

1. Create a project in Atlas.
2. Create a cluster (free tier is fine).
3. Create a database user with username/password.
4. Go to Network Access:
- During setup, allow `0.0.0.0/0` (for quick testing).
- Later, restrict to known IP ranges for better security.
5. Copy the connection string and replace placeholders:

```text
mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database>?retryWrites=true&w=majority
```

You will use this as `MONGODB_URI` in Render.

## 3) Deploy backend to Render

This repo includes [render.yaml](render.yaml), so Render can auto-detect service settings.

1. In Render, choose New + Blueprint.
2. Connect your GitHub repo.
3. Render will read [render.yaml](render.yaml) and create service `tibbar-book-store-api`.
4. In Render environment variables, set real values for:
- `MONGODB_URI`
- `CLIENT_URLS`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID` (if using Google login)
- `VNP_RETURN_URL`, `VNP_TMN_CODE`, `VNP_HASH_SECRET` (if using VNPay)
- Optional email variables if sending emails
5. Deploy and open:
- `https://<your-render-domain>/health`

Expected result: health endpoint returns success JSON.

## 4) Deploy frontend to Vercel

1. In Vercel, import your GitHub repo.
2. Set Root Directory to `frontend`.
3. Build settings:
- Build command: `npm run build`
- Output directory: `dist`
4. Add environment variables in Vercel:
- `VITE_API_URL=https://<your-render-domain>/api`
- `VITE_GOOGLE_CLIENT_ID=<same-google-client-id>` (if needed)
5. Deploy.

This repo includes [frontend/vercel.json](frontend/vercel.json) to rewrite SPA routes to `index.html`.

## 5) Final cross-service wiring

After Vercel deployment:

1. Copy frontend domain, for example:
- `https://<your-project>.vercel.app`
2. Update `CLIENT_URLS` in Render to include it (comma-separated if multiple):

```text
https://<your-project>.vercel.app,https://<preview-domain-if-needed>.vercel.app
```

3. In Google OAuth console (if used), add:
- Authorized JavaScript origins: Vercel domain
- Authorized redirect URIs: based on your app flow
4. If VNPay is enabled, set `VNP_RETURN_URL` to:

```text
https://<your-project>.vercel.app/checkout/payment-return
```

Redeploy Render if variables changed.

## 6) Verify production flows

1. Open frontend URL from Vercel.
2. Test register/login.
3. Confirm cookies/session work (cross-site requires secure HTTPS, already configured).
4. Test books list/detail with images.
5. Test cart/order/payment and admin paths.

## Troubleshooting

- CORS error:
  - Check Render `CLIENT_URLS` includes exact Vercel origin.
- Login succeeds but session not kept:
  - Ensure backend is HTTPS and `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`.
- Frontend cannot reach API:
  - Check `VITE_API_URL` in Vercel uses Render URL with `/api` suffix.
- Atlas connection failed:
  - Verify DB user/password, network access, and URI database name.
