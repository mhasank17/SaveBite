# SaveBite — Hyperlocal Food Deals & Meal Rescue Platform

SaveBite connects local restaurants, cafes, and bakeries with customers seeking quality meals at unbeatable prices in Indian Rupees (₹ / INR), rescuing surplus food and fostering sustainable neighborhood dining.

UI/UX is faithfully implemented using the **Google Stitch** design system tokens (surface containers, Indian Rupee emerald/amber palette, Plus Jakarta Sans display typography, and Inter body typography).

---

## 📁 Monorepo Architecture

SaveBite is organized as an npm workspaces monorepo:

```
Project/
├── package.json                 # Monorepo root scripts & workspace configuration
├── .gitignore
├── .env.example                 # Root environment configuration template
├── client/                      # React 18 + Vite + TypeScript Frontend
│   ├── index.html               # Stitch fonts: Plus Jakarta Sans & Inter
│   ├── package.json
│   ├── tailwind.config.js       # Stitch tokens (surface containers, INR palette)
│   ├── vite.config.ts           # Vite build & proxy settings
│   ├── .env.example             # Frontend Firebase client config template
│   └── src/
│       ├── assets/              # SaveBite SVG brand assets
│       ├── components/          # Reusable Stitch UI components
│       │   ├── common/          # Badge, Button, Modal, QrCodeView, Toast, UrgencyMeter
│       │   ├── customer/        # CheckoutModal, DigitalPassModal, PickupPassModal
│       │   └── partner/         # CreateDealModal, VerifyOtpModal
│       ├── layouts/             # CustomerLayout, PartnerLayout, AdminLayout
│       ├── pages/
│       │   ├── customer/        # ExplorePage, DashboardPage, DealDetailPage, OrdersPage
│       │   ├── partner/         # PartnerDashboard, Listings, Orders, Earnings, Settings
│       │   └── admin/           # Overview, Vendors & KYC, Listings, Disputes, Payouts
│       ├── services/            # api.ts, partnerApi.ts, adminApi.ts
│       ├── types/               # TypeScript data models & enums
│       ├── utils/               # formatINR, calculateSavings, formatPickupWindow
│       ├── App.tsx              # Portal router (Customer / Partner / Admin)
│       └── main.tsx
└── server/                      # Node.js + Express + TypeScript Backend
    ├── package.json
    ├── tsconfig.json
    ├── .env.example             # Server credentials template
    ├── prisma/
    │   ├── schema.prisma        # Supabase PostgreSQL schema definition
    │   └── seed.ts              # Idempotent development test database seed
    ├── tests/
    │   ├── order.test.ts        # Phase 4: Ordering, inventory locks & Razorpay
    │   ├── partner.test.ts      # Phase 5: Partner portal & portions management
    │   ├── verification.test.ts # Phase 6: OTP/QR pickup verification & security gates
    │   └── admin.test.ts        # Phase 7: SuperAdmin governance & audit logging
    └── src/
        ├── config/              # Prisma DB, Firebase Admin, Razorpay, Env
        ├── controllers/         # order, listing, partner, admin controllers
        ├── middlewares/         # verifyAuth (JWT), requireRole, errorMiddleware
        ├── routes/              # Express API v1 route groups
        ├── services/            # orderService, inventoryService, partnerService, adminService
        ├── types/               # Zod validation schemas and order types
        ├── app.ts               # Express application setup
        └── server.ts            # HTTP server listener
```

---

## 🌟 The Three Portals

### 1. Customer Food Discovery & Rescue Portal
* **Hyperlocal Discovery**: Explore surplus meal packs and food deals filtered by distance (1 km to 10 km) and food category.
* **Price Transparency**: All prices displayed in ₹ INR with original price, deal price, and savings badge.
* **Instant Checkout**: In-app portion reservation, fulfillment mode selection (Self-Pickup or Eco Courier), and integer-paise Razorpay sandbox checkout.
* **Digital Pickup Pass**: Dynamic SVG QR code token and 4-digit counter OTP displayed immediately on confirmation and stored in "My Orders".
* **Redemption Feedback**: Transitions automatically to "Meal Collected & Verified" once validated by the partner.

### 2. Restaurant Partner Portal
* **Live Store Dashboard**: Daily meals rescued, revenue metrics, and pending counter collections.
* **Deal & Portion Management**: Publish surplus food bundles or pause active listings in real time.
* **Store Availability Toggle**: Emergency pause/resume order intake with immediate customer-side sync.
* **Counter Verification Modal**: Dual-mode customer pass verification — manual 4-digit OTP entry or simulated/camera QR scanning.
* **Financial Ledger**: Weekly settlement summary, 15% platform commission deduction, and net 85% payout schedule.

### 3. SuperAdmin Governance Portal
* **Command Center**: Platform GMV, commission collected, meals rescued, CO₂e prevented, and live system health.
* **Vendor KYC Compliance**: Review FSSAI food hygiene licenses, approve/reject merchants, and toggle store operating freeze.
* **Listings Moderation**: Platform-wide monitoring of deal prices and dietary labels with 1-click delist/pause capability.
* **Customer Disputes & Refunds**: Investigation queue for late store closures or quality complaints with automated refund authorization.
* **Batch Settlement Engine**: Weekly partner payout batch dispatch with cryptographic bank UTR reference generation.
* **Audit Trail**: Every sensitive governance action is immutably recorded in `system_audit_logs`.

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **PostgreSQL / Supabase**: Optional for local testing (an automated in-memory store activates if the database is offline), required for full persistence.

### 2. Install Monorepo Dependencies
From the project root:
```bash
npm install
```
This automatically installs all dependencies across `client/`, `server/`, and root workspaces.

### 3. Environment Variables Configuration

Copy the example configuration files:
```bash
# In server/
cp server/.env.example server/.env

# In client/
cp client/.env.example client/.env
```

#### Environment Variables Reference:
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend API port | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `DATABASE_URL` | Supabase / PostgreSQL connection string | `postgresql://postgres:...` |
| `FIREBASE_PROJECT_ID` | Firebase Admin project ID | `your-firebase-project-id` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account email | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key | `-----BEGIN PRIVATE KEY-----...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_placeholderKey` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `yourRazorpaySecret` |

> [!NOTE]
> **Zero-Config Sandbox Mode**: If Firebase Admin credentials or live Razorpay keys are omitted, the application automatically runs in development test mode using built-in simulated test tokens (`Bearer test-partner-baker`, `Bearer cust-sarah`, `Bearer test-admin-super`) and integer-paise test signatures.

### 4. Database Setup & Seeding

Generate the Prisma Client:
```bash
npm run prisma:generate --workspace=server
```

Seed initial development data (sample partner outlets, categories, surplus deals, and mock customer accounts):
```bash
npm run prisma:seed --workspace=server
```

### 5. Running the Application

Start both client and server development processes:
```bash
# Start frontend (Vite dev server on port 5173)
npm run dev:client

# Start backend (Express API on port 5000)
npm run dev:server
```

* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🧪 Automated Testing Suite

SaveBite includes 47 automated tests run via the Node.js native test runner:

```bash
# Run the entire backend test suite
npm run test:server

# Or run individual phase test suites directly:
npm run test:verify --workspace=server   # Phase 6: QR/OTP Counter Pickup & Security Gates
npm run test:partner --workspace=server  # Phase 5: Partner Portal & Portions Management
npm run test:admin --workspace=server    # Phase 7: SuperAdmin Governance & Audit Trail
```

### Test Coverage Highlights:
* **Order & Inventory Concurrency** (`order.test.ts`): Server-side integer-paise calculations, inventory locking mutex, Razorpay signature verification, production demo-data exclusion.
* **Partner Portal** (`partner.test.ts`): Store status toggle, portion updates, deal creation, partner earnings breakdown.
* **QR/OTP Verification** (`verification.test.ts`): 4-digit counter OTP validation, QR secret token validation, invalid OTP rejection (400), expired window rejection (400), duplicate verification prevention (409), unauthorized cross-tenant rejection (403), customer role restriction (403).
* **SuperAdmin Governance** (`admin.test.ts`): Role-based access control, FSSAI KYC approval/rejection, store freezing, listing moderation, dispute refunds, batch payout settlement, and immutable audit logging.

---

## 🏗️ Production Compilation

Verify compilation across both packages:

```bash
# Compile backend TypeScript
npm run build:server

# Build optimized frontend bundle
npm run build:client
```

---

## 🔐 Security & Production Safeguards

1. **Zero-Trust Pickup Verification**: Redemption validation occurs strictly on the backend. No frontend client can mark an order completed without a valid OTP or QR secret token.
2. **Strict Tenant Isolation**: Partner stores cannot verify passes belonging to other restaurants (returns `403 Forbidden`).
3. **Production Mode Guardrails**: When `NODE_ENV=production`, demo listings and unapproved partner restaurants are strictly omitted from active customer discovery endpoints.
4. **Integer Arithmetic**: All monetary transactions are computed in integer paise (1 INR = 100 paise) to eliminate floating-point precision errors.
5. **HMAC-SHA256 Signature Verification**: Razorpay payment signatures are validated using timing-safe comparisons (`crypto.timingSafeEqual`) to prevent timing attack vulnerabilities.
