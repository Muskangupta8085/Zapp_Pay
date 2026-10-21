# Zapp Pay - Vercel Deployment Guide

This repository contains a full-stack platform:
- `backend/`: Node.js Express serverless API
- `admin/`: React + Vite SPA admin dashboard
- `frontend/`: Expo React Native mobile & web app

---

## 1. Deploy the Backend (`zapp-pay-backend`)

1. Go to [vercel.com/new](https://vercel.com/new) and import repository **`Sunny3255/Zapp_Pay`**.
2. Set the project details:
   - **Project Name**: `zapp-pay-backend`
   - **Framework Preset**: `Other`
   - **Root Directory**: Click **Edit** and select **`backend`**
3. Open **Environment Variables** and add the following:
   - `MONGODB_URI`: Your MongoDB Atlas URI (e.g. `mongodb+srv://<username>:<password>@cluster0.mongodb.net/zapp_pay?retryWrites=true&w=majority`)
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A strong random string
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `*` (or your Vercel Admin URL once deployed)
   - `PII_ENCRYPTION_KEY`: A 64-character hex key (32 bytes)
   - `WEBHOOK_SECRET`: A random 32-character string
4. Click **Deploy**.
5. Once deployment completes, note your backend URL:
   - Example: `https://zapp-pay-backend.vercel.app`
   - Verify health: `https://zapp-pay-backend.vercel.app/api/v1/health`

---

## 2. Deploy the Admin Dashboard (`zapp-pay-admin`)

1. Go to [vercel.com/new](https://vercel.com/new) and import repository **`Sunny3255/Zapp_Pay`** again.
2. Set the project details:
   - **Project Name**: `zapp-pay-admin`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select **`admin`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Open **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://zapp-pay-backend.vercel.app/api/v1` *(replace with your actual backend URL from Step 1)*
4. Click **Deploy**.
5. Once finished, visit your live admin dashboard!

---

## 3. Connect Mobile / Web Frontend

In `frontend/`:
- Set `EXPO_PUBLIC_API_URL` to `https://zapp-pay-backend.vercel.app/api/v1` in your `.env` file before building Android/iOS binaries or testing on device.
