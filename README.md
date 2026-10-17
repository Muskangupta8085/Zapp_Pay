# Zapp Pay ⚡

> Next-Generation Decentralized Crypto & P2P Banking Ecosystem

Zapp Pay is a comprehensive financial technology platform featuring a cross-platform mobile app, a resilient Node.js / Express backend with MongoDB, and an institutional-grade React administration dashboard.

---

## 🏗 Architecture & Project Structure

```
Zapp pay app/
├── frontend/     # React Native & Expo Mobile Application (iOS / Android / Web)
├── backend/      # Node.js, Express, TypeScript, MongoDB API Server
├── admin/        # React, Vite, TypeScript Admin & Treasury Dashboard
└── README.md     # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **Java**: JDK 17 (for Android native builds)
- **Expo CLI** (optional for mobile dev): `npm install -g expo-cli`

---

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
* Backend starts at `http://localhost:5000/api/v1`

---

### 3. Frontend Setup (Mobile App)
```bash
cd frontend
npm install
npm start
```
- Press `a` to open Android emulator/device
- Press `w` to open web browser view (`http://localhost:8081`)

---

### 4. Admin Panel Setup
```bash
cd admin
npm install
npm run dev
```
* Admin panel starts at `http://localhost:5173`

---

## 📱 Mobile APK Build

To generate the standalone Android APK:
```bash
cd frontend/android
./gradlew assembleRelease
```
The resulting APK will be generated at `frontend/android/app/build/outputs/apk/release/app-release.apk`.

---

## 🔒 Security & Compliance
- Multi-signature treasury authorization
- Zero-leak authentication with JWT access & refresh tokens
- Real-time WebSockets trade confirmation
