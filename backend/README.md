# ZapCoin Backend Service

Modern, scalable Node.js + Express + TypeScript backend for the ZapCoin platform, powered by MongoDB and Mongoose.

---

## 📁 Architecture & Folder Structure

```text
backend/
├── src/
│   ├── config/              # Configuration (DB connection, env variables, constants)
│   │   ├── db.ts            # Mongoose MongoDB connection
│   │   ├── env.ts           # Environment variables loader
│   │   └── constants.ts     # System roles, transaction statuses, kyc statuses
│   ├── controllers/         # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── wallet.controller.ts
│   │   ├── transaction.controller.ts
│   │   ├── kyc.controller.ts
│   │   ├── market.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts       # JWT token verification
│   │   ├── role.middleware.ts       # Role-based access control (RBAC)
│   │   ├── validate.middleware.ts   # Zod request schema validation
│   │   └── error.middleware.ts      # Global error and 404 handler
│   ├── models/              # Mongoose schemas & data models
│   │   ├── user.model.ts
│   │   ├── wallet.model.ts
│   │   ├── transaction.model.ts
│   │   ├── kyc.model.ts
│   │   ├── token.model.ts
│   │   └── index.ts
│   ├── routes/              # Express API route declarations
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── wallet.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── kyc.routes.ts
│   │   ├── market.routes.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts         # Main router aggregation (/api/v1)
│   ├── services/            # Business logic and DB transactions
│   │   ├── auth.service.ts
│   │   ├── wallet.service.ts
│   │   └── transaction.service.ts
│   ├── types/               # TypeScript interfaces & type definitions
│   │   └── index.ts
│   ├── utils/               # Reusable utilities & helpers
│   │   ├── apiError.ts      # Custom ApiError class
│   │   ├── apiResponse.ts   # Standardized JSON response wrapper
│   │   └── logger.ts        # Console logging helper
│   ├── validations/         # Zod validation schemas
│   │   ├── auth.validation.ts
│   │   ├── wallet.validation.ts
│   │   └── kyc.validation.ts
│   ├── app.ts               # Express application initialization
│   └── server.ts            # Application entrypoint & HTTP server
├── .env.example             # Example environment variables
├── .env                     # Local environment variables
├── .gitignore               # Git ignored directories and files
├── package.json             # NPM dependencies & scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Documentation
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` if not already present:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/zapcoin
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:8081,http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints Overview (Base URL: `/api/v1`)

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Health** | `GET` | `/health` | Server status and uptime | No |
| **Auth** | `POST` | `/auth/register` | Register new user & creates wallet | No |
| **Auth** | `POST` | `/auth/login` | Login user & issue JWT | No |
| **Auth** | `GET` | `/auth/me` | Fetch authenticated user profile | Yes |
| **User** | `PATCH` | `/user/profile` | Update profile details | Yes |
| **Wallet** | `GET` | `/wallet/overview` | Balances and wallet details | Yes |
| **Wallet** | `GET` | `/wallet/receive-address` | Wallet deposit/receive address | Yes |
| **Wallet** | `POST` | `/wallet/send` | Transfer coins with atomic transaction | Yes |
| **Transactions** | `GET` | `/transactions` | User's recent transaction history | Yes |
| **KYC** | `POST` | `/kyc/submit` | Submit identity verification document | Yes |
| **KYC** | `GET` | `/kyc/status` | Check KYC status | Yes |
| **Market** | `GET` | `/market/prices` | Crypto market prices | No |
| **Market** | `GET` | `/market/chart/:symbol` | Price historical chart points | No |
| **Admin** | `GET` | `/admin/overview` | Admin dashboard analytics | Admin only |
| **Admin** | `GET` | `/admin/users` | List all registered users | Admin only |
| **Admin** | `GET` | `/admin/kyc` | List KYC verification requests | Admin only |
| **Admin** | `PATCH` | `/admin/kyc/:id/review` | Approve or reject KYC submission | Admin only |
| **Admin** | `GET` | `/admin/transactions` | Global transaction ledger | Admin only |
