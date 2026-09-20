# Netlify Deployment Guide for SamasyaSetu

SamasyaSetu has been fully configured for seamless deployment on **Netlify** with both static Single-Page Application (SPA) frontend hosting and Netlify Serverless API Functions.

---

## What Has Been Configured

1. **`netlify.toml`**: Configures the build command (`npm --prefix client run build`), publish directory (`client/dist`), Netlify Functions folder (`netlify/functions`), and URL rewrites.
2. **`client/public/_redirects`**: Ensures clean React Router SPA routing on deep links without 404 errors.
3. **`netlify/functions/api.js`**: Serverless Express function handler powered by `serverless-http`.
4. **`client/src/utils/api.js`**: Dynamically connects to local relative `/api` or external `VITE_API_URL`.

---

## Option 1: 1-Click Deployment via GitHub (Recommended)

1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of SamasyaSetu"
   git remote add origin https://github.com/YOUR_USERNAME/samasyasetu.git
   git push -u origin main
   ```
2. Go to [app.netlify.com](https://app.netlify.com/) and click **"Add new site" > "Import an existing project"**.
3. Select your GitHub repository.
4. Netlify will automatically detect settings from [`netlify.toml`](file:///d:/jansetu/netlify.toml):
   - **Build Command**: `npm --prefix client run build`
   - **Publish Directory**: `client/dist`
   - **Functions Directory**: `netlify/functions`
5. Click **Deploy site**.

---

## Option 2: Instant Deployment via Netlify CLI

You can deploy directly from your terminal:

```bash
# 1. Build the production client
npm --prefix client run build

# 2. Deploy using Netlify CLI (one-time login)
npx netlify deploy --prod
```

When prompted:
- **Publish directory**: `client/dist`
- **Functions directory**: `netlify/functions`

---

## Environment Variables on Netlify (Optional)

In your Netlify Site Dashboard under **Site configuration > Environment variables**, you can set:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | Auto-generated default |
| `DATABASE_URL` | PostgreSQL connection string (Supabase / Neon / ElephantSQL) | Built-in SQLite |
| `OPENAI_API_KEY` | OpenAI API key for translation & embeddings | Built-in NLP Engine |
| `VITE_API_URL` | Optional custom backend URL if hosting backend separately | Relative `/.netlify/functions/api` |

---

## Verification

After deploying, your site URL (e.g. `https://samasyasetu.netlify.app`) will have:
- Public Impact Wall at `/` and `/impact-wall`
- Full authentication at `/login` and `/register` with 1-Click Demo Logins
- API health check at `/api/health`
