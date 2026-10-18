# DineDeck — Next-Generation In-Dining Operating System

[![Docker](https://img.shields.io/badge/Docker-PostgreSQL_16_%7C_Redis_7-blue?logo=docker&logoColor=white)](docker-compose.yml)
[![Fastify](https://img.shields.io/badge/Backend-Fastify_%2B_TypeScript-000000?logo=fastify&logoColor=white)](backend/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma_PostgreSQL-2D3748?logo=prisma&logoColor=white)](backend/prisma/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite_%2B_Tailwind-61DAFB?logo=react&logoColor=black)](customer-web/)
[![Android](https://img.shields.io/badge/Mobile-Kotlin_%2B_Jetpack_Compose-3DDC84?logo=android&logoColor=white)](app/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

> **DineDeck** is an enterprise-grade, omnichannel restaurant operating system and in-dining automation platform. Built for high-volume restaurants, multi-branch food chains, and platform aggregators, DineDeck unifies contactless table QR ordering, real-time Kitchen Display Systems (KDS), POS terminals, merchant governance, and multi-tenant administrative controls into a cohesive real-time ecosystem.

---

## 🏛️ System Architecture

DineDeck is engineered around an event-driven, decoupled micro-monorepo architecture powered by **Fastify**, **PostgreSQL 16**, **Redis 7 Pub/Sub**, and **WebSockets**.

```
                           ┌───────────────────────────────────────────────┐
                           │            DINEDECK CUSTOMER APPS             │
                           │  - Customer Web (Mobile PWA & Desktop)        │
                           │  - Native Android Customer App (Compose)      │
                           └──────────────────────┬────────────────────────┘
                                                  │ (REST / WebSockets)
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             DINEDECK BACKEND ENGINE (FASTIFY)                            │
│  - Realtime WebSocket Gateway       - Order & KOT Orchestration   - Dynamic Pricing & Tax│
│  - IAM & Granular RBAC Engine       - Kitchen Station Dispatcher   - Settlement Engine    │
└───────────────────────────┬───────────────────────────────┬──────────────────────────────┘
                            │                               │
                            ▼                               ▼
                 ┌────────────────────┐          ┌────────────────────┐
                 │   PostgreSQL 16    │          │      Redis 7       │
                 │ Relational Data &  │          │ Realtime Pub/Sub & │
                 │ Transaction Store  │          │ State Caching      │
                 └────────────────────┘          └────────────────────┘
                            ▲                               ▲
                            │                               │
┌───────────────────────────┴───────────────────────────────┴──────────────────────────────┐
│                            OPERATIONS & GOVERNANCE TERMINALS                             │
│  - Restaurant Partner Web (POS / Live KDS / Waiter Call Console / Staff Manager)         │
│  - Super Admin Control Center Web (Global Onboarding / Audits / Financial Settlements)   │
│  - Native Android Partner App & Admin Governance App                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```text
Dindeck/
├── backend/                  # Fastify + TypeScript + Prisma ORM + WebSockets
│   ├── prisma/               # PostgreSQL schema definitions and seed data
│   ├── src/                  # Modules: IAM, Orders, KDS, Menu, Billing, Settlements
│   ├── Dockerfile            # Optimized Alpine multi-stage production container
│   └── .env.example          # Clean environment template
│
├── customer-web/             # Customer In-Dining Experience (React 18 + Vite + Tailwind)
│   ├── src/components/       # 2-in-1 discovery grid, customizer, live cart, QR scanner
│   └── src/services/         # Realtime API integration & 90-min table validity state
│
├── partner-web/              # Restaurant Staff & Merchant Portal (React 18 + Vite)
│   ├── src/pages/            # Live KDS screen, POS orders, floor management, menu editor
│   └── src/services/         # Audio-visual kitchen notifications & waiter call streams
│
├── admin-web/                # Super Admin Platform Control Center (React 18 + Vite)
│   └── src/pages/            # Merchant KYC, platform commission, audit logs, killswitch
│
├── app/                      # Native Android Customer Application (Kotlin + Jetpack Compose)
├── partner-app/              # Native Android Restaurant Operations Application
├── admin-app/                # Native Android Platform Governance Application
│
├── desktop-partner/          # Windows Desktop POS & KDS Terminal (Electron 34 + Native Thermal Print)
│   ├── main.js               # Window lifecycle, hardware IPC, silent thermal printer integration
│   ├── preload.js            # Secure IPC bridge (`window.dinedeckDesktop`)
│   └── dist-installer/       # Production NSIS installer (`DineDeck-Partner-Setup-1.0.0.exe`)
│
├── desktop-admin/            # Windows Desktop Super Admin Control Center (Electron 34)
│   ├── main.js               # Multi-tenant governance window lifecycle & security policies
│   ├── preload.js            # Secure IPC bridge (`window.dinedeckDesktop`)
│   └── dist-installer/       # Production NSIS installer (`DineDeck-SuperAdmin-Setup-1.0.0.exe`)
│
├── docker-compose.yml        # Production Docker orchestration (Postgres 16, Redis 7, Backend)
├── docs/                     # Architectural reports and platform governance verification
└── scripts/                  # Development automation and multi-service launchers
```

---

## ⚡ Core Capabilities

### 1. In-Dining Smart QR & Seamless Discovery
- **Dual-Mode Browsing**: Diners can explore menus from home with 1-click Google Maps directions, or scan their physical table QR inside the venue.
- **Smart 90-Minute Table Validity**: Eliminates phantom table assignments with strict cryptographic session validation.
- **Interactive Dish Customizer**: Allows choosing portion sizes, spice levels, add-ons, and cooking notes with dynamic subtotal recalculation.

### 2. Real-Time Kitchen Display System (KDS) & Multi-Station Routing
- Instant order ticket (KOT) routing to specialized stations: *Tandoor, Curry, Chinese/Continental, Bakery & Bar*.
- Live order status pipeline: `PLACED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `SERVED`.
- Audio-visual alert triggers upon new order placement or waiter assistance requests.

### 3. Commercial Windows Desktop Applications
- **DineDeck Partner POS & KDS**: Dedicated Windows desktop application for restaurant front desks and kitchen display stations.
- **DineDeck Control Center**: Dedicated Windows desktop application for platform super administrators with tenant governance and financial auditing.
- **Native Hardware Thermal Printing**: Silent ESC/POS 80mm/58mm thermal receipt printing via Electron IPC (`window.dinedeckDesktop.printReceipt()`), with automatic printer discovery and fallback.
- **Standalone NSIS Installers**: Professional Windows `.exe` installers with desktop shortcuts, start menu entries, and uninstaller.

### 4. Enterprise IAM & Multi-Tenant Scoping
- Role-based permissions across 5 built-in roles: `SUPER_ADMIN`, `RESTAURANT_OWNER`, `MANAGER`, `CHEF`, `WAITER`.
- Granular permission overrides allowing platform admins or owners to grant or revoke specific operational permissions per branch.

### 5. Billing, Settlements & Compliance
- Automated GST breakdown, service charges, and platform commission calculations.
- Batch settlement reconciliations with payout reference tracking.
- Emergency platform controls: instant maintenance mode and payment killswitch triggers.

---

## 🚀 Getting Started

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (v20+) or native PostgreSQL 16+ & Redis 7+
- [Node.js](https://nodejs.org/) (v20 LTS recommended)
- [Android Studio Jellyfish or higher](https://developer.android.com/studio) (for Android native apps)

### 1. Clone the Repository
```bash
git clone https://github.com/Ashutosh2275/Dinedeck.git
cd Dinedeck
```

### 2. Launch Backend & Infrastructure with Docker
The repository includes a ready-to-run Docker Compose configuration (`compose.yaml` and `docker-compose.yml`) orchestrating PostgreSQL 16, Redis 7, and the Fastify backend:

```bash
# Copy root environment variables
cp .env.example .env

# Launch stack with Docker Compose
docker compose up -d --build
```

Verify running containers:
```bash
docker compose ps
```

| Service | Container Name | Host Port | Internal Port | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `dinedeck-backend` | `8080` | `8080` | `Up (healthy)` |
| **PostgreSQL 16** | `dinedeck-postgres` | `5432` | `5432` | `Up (healthy)` |
| **Redis 7** | `dinedeck-redis` | `6379` | `6379` | `Up (healthy)` |

*Note: Default configuration routes external ports directly to standard service ports.*

### 3. Master One-Command Development Stack
To launch all services (Backend API, Customer Web, Partner Web, Super Admin Web) with automatic dependency and port checks:

```bash
# Windows Batch Launcher
START_DINEDECK.bat

# Or PowerShell Direct Engine
powershell -ExecutionPolicy Bypass -File scripts/dev-start.ps1
```

To stop all services cleanly:
```bash
STOP_DINEDECK.bat
# Or
powershell -ExecutionPolicy Bypass -File scripts/dev-stop.ps1
```

### 4. Run Windows Desktop Applications
To launch the commercial Windows desktop suite:

```bash
# Run one-click desktop launcher
START_DINEDECK_DESKTOP.bat
```

Or build and run individual desktop applications from source:

```bash
# DineDeck Partner POS & KDS (Desktop)
cd desktop-partner
npm install
npm start            # Run in development mode
npm run dist:win     # Build NSIS installer (.exe)

# DineDeck Control Center Super Admin (Desktop)
cd desktop-admin
npm install
npm start            # Run in development mode
npm run dist:win     # Build NSIS installer (.exe)
```

The production Windows installers are output to:
- `desktop-partner/dist-installer/DineDeck-Partner-Setup-1.0.0.exe`
- `desktop-admin/dist-installer/DineDeck-SuperAdmin-Setup-1.0.0.exe`

### 4. Run Web Interfaces (Development Mode)
Each frontend application is located in its respective directory:

```bash
# Customer In-Dining Web App (Port 5173)
cd customer-web && npm install && npm run dev

# Restaurant Partner & KDS Portal (Port 5174)
cd partner-web && npm install && npm run dev

# Super Admin Governance Portal (Port 5175)
cd admin-web && npm install && npm run dev
```

Alternatively, use the provided one-click launcher scripts in the root directory:
- `START_DINEDECK_DESKTOP.bat` (Windows Desktop POS + Admin)
- `START_DINEDECK_WEB.bat` (All 3 Web Apps)
- `START_CUSTOMER_APP.bat` (Customer Web + Android)
- `START_PARTNER_APP.bat` (Partner Web + Android)
- `START_SUPERADMIN_APP.bat` (Admin Web + Android)

---

## 🛣️ Roadmap & Upcoming Developments

- [x] **Windows Native Desktop Applications**:
  - High-performance Super Admin Command Center for desktop management.
  - Commercial Restaurant POS & KDS terminal with hardware thermal printing.
- [x] **Hardware Peripheral Integration**:
  - Direct silent thermal receipt printing over Windows Spooler / USB / Network.
- [ ] **Automated Inventory & Recipe Costing**:
  - Raw ingredient depletion tracking tied directly to kitchen KOT dispatch.
- [ ] **Unified Multi-Gateway Payment Reconciliation**:
  - Dynamic QR UPI payment confirmation with instant webhook verification.

---

## 🔒 Security & Best Practices

- **Zero Credentials Committed**: All private keys, database passwords, and secrets are strictly excluded from source control via `.gitignore`.
- **Environment Templates**: Refer to [`backend/.env.example`](backend/.env.example) to configure environment variables for local or production deployments.
- **Audit Logging**: Every platform mutation, table state change, and financial settlement records actor metadata and IP timestamps.

---

## 📄 License

This repository and all associated modules are proprietary and confidential. Unauthorized copying, reverse engineering, or distribution is strictly prohibited.
