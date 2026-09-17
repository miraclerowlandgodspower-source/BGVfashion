# BGV Fashion — Production Full-Stack Application

A modern, high-performance e-commerce platform built with **Next.js (App Router)**, **TypeScript**, **React**, **PostgreSQL** (configured for Railway / Drizzle ORM), and **Paystack** for secure payment processing.

---

## 🚀 Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local` (already created for you):
```bash
cp .env.example .env.local
```

### 2. Configure Your Database & Paystack Keys in `.env.local`

Open `.env.local` and set your credentials:

```env
# 1. DATABASE (Railway PostgreSQL)
# Get this from your Railway dashboard (Postgres -> Connect -> URL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@roundhouse.proxy.rlwy.net:PORT/railway"

# 2. PAYSTACK PAYMENT KEYS
# Get these from Paystack Dashboard -> Settings -> API Keys & Webhooks
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."

# 3. AUTHENTICATION (JWT)
JWT_SECRET="your_custom_secure_secret_string"

# 4. APP URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Custom Node.js Server (`server.js`)
You can also run using the custom `server.js`:
```bash
node server.js
```

### Production Build & Run
```bash
npm run build
npm run start
```

---

## 🗄️ Database & Schema (PostgreSQL + Drizzle ORM)

### Push Schema to PostgreSQL
When you connect your Railway PostgreSQL URL, push the database schema:
```bash
npx drizzle-kit push
```

### Seed Product Catalogue
You can seed the initial 8 BGV fashion products into PostgreSQL by visiting:
```
http://localhost:3000/api/seed
```
or it will auto-seed on first run.

---

## 🔌 API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register a new client account with bcrypt password hashing |
| `/api/auth/login` | `POST` | Sign in client and issue secure httpOnly JWT session cookie |
| `/api/auth/logout` | `POST` | Sign out and clear session cookie |
| `/api/auth/me` | `GET` | Get currently logged-in user profile |
| `/api/products` | `GET` | Filter, search (`?q=`), and sort catalogue |
| `/api/products/[id]` | `GET` | Single product details |
| `/api/cart` | `GET`, `POST`, `PATCH`, `DELETE` | Persistent shopping bag management |
| `/api/wishlist` | `GET`, `POST` | Toggle and fetch saved favourites |
| `/api/checkout/initialize` | `POST` | Verify inventory & create Paystack payment session |
| `/api/checkout/verify` | `GET` | Verify Paystack payment reference and update order to paid |
| `/api/webhooks/paystack` | `POST` | Webhook handler with HMAC SHA512 signature verification |
| `/api/orders` | `GET` | User order history |
| `/api/seed` | `GET` | 1-click database seeder |

---

## 📁 Project Architecture

```
bgvfashion/
├── server.js                      # Custom Node.js HTTP server entrypoint
├── .env.example                   # Template for environment variables
├── .env.local                     # Local secrets (Database, Paystack, Auth)
├── drizzle.config.ts              # Drizzle ORM PostgreSQL configuration
├── package.json
├── public/
│   └── images/                    # High-res photography (hero, men, women)
├── src/
│   ├── app/                       # Next.js App Router Pages & API Routes
│   │   ├── page.tsx               # Homepage
│   │   ├── shop/page.tsx          # Full catalogue with filters
│   │   ├── product/[id]/page.tsx  # Interactive product detail page
│   │   ├── cart/page.tsx          # Shopping bag
│   │   ├── wishlist/page.tsx      # Saved favourites
│   │   ├── checkout/page.tsx      # Secure checkout
│   │   ├── checkout/success/page.tsx # Order confirmation
│   │   ├── login/page.tsx         # Client sign in
│   │   ├── register/page.tsx      # Client registration
│   │   ├── account/page.tsx       # Account dashboard & order history
│   │   ├── about/page.tsx         # Brand story
│   │   ├── contact/page.tsx       # Concierge contact form
│   │   ├── help/page.tsx          # FAQs, shipping & return policies
│   │   ├── globals.css            # Core BGV design system
│   │   └── api/                   # Backend Route Handlers
│   ├── components/                # React UI Components
│   │   ├── Header.tsx             # Navbar with live badges & search
│   │   ├── Footer.tsx             # Clean brand footer
│   │   ├── ProductCard.tsx        # Product card with quadrant cropping
│   │   ├── RegionModal.tsx        # Country & Currency selector
│   │   ├── Toast.tsx              # Dynamic feedback notifications
│   │   └── Icons.tsx              # SVG icon system
│   ├── context/
│   │   └── StoreContext.tsx       # Global state (Auth, Cart, Wishlist, Currency)
│   ├── db/
│   │   ├── schema.ts              # Drizzle PostgreSQL schema
│   │   └── initial-products.ts    # Seed product catalogue
│   ├── lib/
│   │   ├── db.ts                  # PostgreSQL connection & query helpers
│   │   ├── auth.ts                # JWT & bcrypt authentication
│   │   ├── paystack.ts            # Paystack payment integration
│   │   └── money.ts               # Multi-currency formatting (NGN, USD, GBP, EUR)
│   └── types/
│       └── index.ts               # TypeScript data models
```
