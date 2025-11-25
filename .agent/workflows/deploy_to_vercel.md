---
description: Deploy the application to Vercel
---

# Deploy to Vercel

Follow these steps to deploy your application to Vercel.

## 1. Push to GitHub
Ensure your latest code is pushed to your GitHub repository.

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 2. Import Project in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your `mership` repository.

## 3. Configure Environment Variables
In the "Configure Project" screen, expand **"Environment Variables"** and add the following. 
**Copy these values from your local `.env.local` file.**

| Key | Description |
|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `WHOP_API_KEY` | Your Whop API Key |
| `WHOP_PLAN_ID_10` | Whop Plan ID for $10 |
| `WHOP_PLAN_ID_25` | Whop Plan ID for $25 |
| `WHOP_PLAN_ID_50` | Whop Plan ID for $50 |
| `WHOP_PLAN_ID_100` | Whop Plan ID for $100 |
| `NEXT_PUBLIC_APP_URL` | Set this to your Vercel URL (e.g. `https://mership.vercel.app`) once deployed. For the initial deploy, you can use `https://your-project-name.vercel.app` |

## 4. Deploy
Click **"Deploy"**. Vercel will build and deploy your application.

## 5. Post-Deployment Setup
1. Once deployed, copy your new domain (e.g., `https://mership.vercel.app`).
2. Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
3. Add your Vercel domain to **Site URL** and **Redirect URLs**.
4. Go to your **Whop Dashboard** and update any webhook URLs if necessary (e.g., `https://mership.vercel.app/api/whop/webhook`).
