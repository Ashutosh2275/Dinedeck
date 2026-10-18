# DINEDECK — COMPLETE SYSTEM ARCHITECTURE & CODEBASE DOCUMENTATION

> **Authoritative Technical Reference & Master Architecture Specification**  
> **Target Project:** DINE DECK Next-Generation In-Dining Operating System & Omnichannel Platform  
> **Canonical Repository Root:** `D:\Dindeck` (GitHub: `Ashutosh2275/Dinedeck`)  
> **Document Generated:** October 9, 2026  
> **Status:** Production Verified Codebase Analysis & Roadmap  

---

## Table of Contents
1. [Section 1: Project Overview](#section-1-project-overview)
2. [Section 2: Complete Project Structure](#section-2-complete-project-structure)
3. [Section 3: Working Structure — How the System Operates](#section-3-working-structure--how-the-system-operates)
4. [Section 4: Technical Architecture](#section-4-technical-architecture)
5. [Section 5: Architecture Diagrams](#section-5-architecture-diagrams)
6. [Section 6: Complete Request and Data Flow](#section-6-complete-request-and-data-flow)
7. [Section 7: Database Architecture](#section-7-database-architecture)
8. [Section 8: Authentication and Authorization](#section-8-authentication-and-authorization)
9. [Section 9: API and Integration Documentation](#section-9-api-and-integration-documentation)
10. [Section 10: Real-Time Order Processing](#section-10-real-time-order-processing)
11. [Section 11: Business Logic](#section-11-business-logic)
12. [Section 12: Complete Dependency Map](#section-12-complete-dependency-map)
13. [Section 13: Running and Deploying the Project](#section-13-running-and-deploying-the-project)
14. [Section 14: Current Implementation Status](#section-14-current-implementation-status)
15. [Section 15: Bugs, Risks, and Technical Debt](#section-15-bugs-risks-and-technical-debt)
16. [Section 16: Recommended Architecture & Future Roadmap](#section-16-recommended-architecture--future-roadmap)
17. [Section 17: Complete File Reference](#section-17-complete-file-reference)
18. [Section 18: Simple Explanation for a Beginner](#section-18-simple-explanation-for-a-beginner)
19. [Section 19: Glossary](#section-19-glossary)
20. [Section 20: Questions Requiring Further Investigation](#section-20-questions-requiring-further-investigation)

---

## Section 1: Project Overview

### 1.1 What DINE DECK Is
**DineDeck** is an enterprise-grade, omnichannel restaurant operating system and in-dining automation platform tailored specifically for high-volume dining establishments, multi-unit franchise chains, and multi-tenant restaurant aggregators. 

It provides an end-to-end digital ecosystem that synchronizes customer self-ordering via contactless QR tables, real-time Kitchen Display Systems (KDS) across specialized prep stations, counter/cashier POS billing, floor staff coordination, and multi-tenant platform owner governance.

### 1.2 What Problem It Solves
Traditional restaurant management systems suffer from high latency, disconnected hardware, paper ticket errors, and disjointed customer experiences:
1. **Slow Order Intake & High Labor Overhead:** Physical waiter shortages cause customer delays during peak hours. DineDeck enables diners to scan a table QR code and place orders directly to the kitchen in under 30 seconds.
2. **Kitchen Bottlenecks & Lost Paper Tickets:** Paper Kitchen Order Tickets (KOT) get lost, grease-stained, or misrouted. DineDeck provides real-time KDS digital dispatching to dedicated preparation stations (*Tandoor, Curry, Chinese/Continental, Bakery, Beverage, Bar, Expo*).
3. **Billing Discrepancies & GST Inaccuracies:** Inconsistent application of Indian GST (CGST 2.5% + SGST 2.5%), discretionary service charges (5%), and fractional paise discrepancies cause accounting disputes. DineDeck enforces deterministic financial calculations with zero-float rounding via `Decimal.js`.
4. **Phantom Table Assignments & Seat Collisions:** Unrestricted table sessions create ghost orders. DineDeck implements cryptographic QR token verification with automated dining session lifecycles.
5. **Lack of Granular Staff Permissions:** Traditional restaurant POS accounts share single master passwords. DineDeck incorporates an enterprise Identity & Access Management (IAM) engine featuring 91 atomic permissions, role inheritance, and branch-level overrides.

### 1.3 Who Uses the System
The platform serves four primary user classes:
* **In-Dining Customers / Diners:** Explore rich culinary menus, customize dishes (portion sizes, spice levels, add-ons), place real-time orders, track preparation stages, request waiter assistance (water, cutlery, bill), and view itemized digital bills with instant UPI payment.
* **Restaurant Floor Staff (Waiters, Stewards, Captains):** Receive instant table service call notifications, view assigned table occupancy, seat walk-in guests, manually take POS orders, and receive food pickup alerts when dishes pass the kitchen Expo pass.
* **Kitchen Staff (Chefs, Line Cooks, Kitchen Expeditors):** Interact with the touch-enabled Kitchen Display System (KDS), view incoming KOT tickets organized by preparation time, filter by culinary station, mark items as `PREPARING` or `READY`, trigger re-fire tickets, put dishes on hold, or mark items out-of-stock (86ing).
* **Cashiers & Restaurant Managers:** Oversee open dining sessions, apply authorized discounts/complimentary waivers, record cash/card/UPI settlements, print thermal receipt slips, manage cash registers (shift open/close with variance checks), and adjust floor configurations.
* **Platform Owner & Super Administrators (`DINEDECK_SUPER_ADMIN`):** Maintain supreme multi-tenant oversight across all restaurants and franchise branches, audit merchant KYC (GSTIN, PAN, FSSAI), enforce 15% platform commission collections, reconcile bank payouts, authorize refunds, monitor system health, and trigger platform-wide emergency killswitches.

### 1.4 Implemented Features vs. Planned Roadmap
| Capability Area | Implemented & Codebase Verified | Planned / Roadmap Ahead |
| :--- | :--- | :--- |
| **Customer Experience** | Contactless QR scanning, dual-mode browsing, dish customizer, live cart, India GST calculation, order tracking, waiter call, 4-digit encrypted PIN login, free 6-digit email OTP, native Android Compose customer app, and React 18 PWA. | Multi-language localized menus (Hindi, Marathi, Gujarati), group ordering (multi-phone shared cart). |
| **Kitchen KDS** | Multi-station ticket routing (Tandoor, Curry, etc.), audio chimes, ticket timers, item-level status updates, hold/resume, recall, re-fire tickets, out-of-stock 86 toggle, auto-KOT generation. | Split KOT hardware routing to physical kitchen impact printers over ESC/POS network protocols. |
| **POS & Cashier** | Table sessions, bill splitting, itemized discounting, cash/UPI/card settlement, cashier shifts (opening cash, cash in/out, variance calculation), receipt duplication. | Direct USB/Bluetooth ESC/POS thermal printer driver integration without browser print dialog. |
| **IAM & Governance** | 91 atomic permissions across 13 categories, 5 built-in role templates, granular ALLOW/DENY user overrides, audit logging, multi-branch scoping. | Biometric fingerprint login for terminal cashier stations. |
| **Platform Admin** | Control Center dashboard, global fuzzy search (Ctrl+K), restaurant KYC profile editor, branch/table manager, dynamic QR regeneration, 1-click refund, settlement generation, emergency killswitch. | Multi-gateway automated webhook payouts (RazorpayX / Cashfree auto-transfer). |

---

## Section 2: Complete Project Structure

The project is structured as a decoupled monorepo containing one primary backend engine, three web frontends, three native Android mobile applications, dockerized infrastructure, and platform automation scripts.

```text
D:\Dindeck/
├── backend/                             # Core REST API, WebSocket Gateway & Business Logic
│   ├── prisma/                          # Database Schema, Migrations & Seeding Engine
│   │   ├── schema.prisma                # Master PostgreSQL schema definition
│   │   ├── seed.ts                      # Multi-restaurant demo seeding script
│   │   └── reset-transactions.ts        # Test data cleansing utility
│   ├── src/                             # TypeScript Application Source
│   │   ├── common/                      # Shared Domain Math & Helpers
│   │   │   └── money.ts                 # IndiaBillingEngine & Money precision classes
│   │   ├── config/                      # Environment & Database Configuration
│   │   │   ├── db.ts                    # Prisma Client instantiation
│   │   │   └── env.ts                   # Strongly-typed environment variables
│   │   ├── modules/                     # Domain-Driven Functional Modules
│   │   │   ├── admin/                   # Super Admin command center & analytics
│   │   │   │   ├── admin.controller.ts  # 22 administrative endpoints
│   │   │   │   └── control-center.service.ts # Aggregations, KYC, settlements
│   │   │   ├── auth/                    # Universal authentication & token issuance
│   │   │   │   └── auth.controller.ts   # JWT login, register, PIN auth, email OTP
│   │   │   ├── banners/                 # Marketing banners & promotional cards
│   │   │   │   └── banners.controller.ts# Banner CRUD & active listings
│   │   │   ├── billing/                 # Cashier shifts, table bills, settlements
│   │   │   │   ├── billing.controller.ts# Bill generation, discount, void, shifts
│   │   │   │   ├── billing.engine.ts    # Indian tax calculation engine
│   │   │   │   ├── billing.service.ts   # Shift management & payment settlement
│   │   │   │   └── billing.types.ts     # Billing data interfaces
│   │   │   ├── iam/                     # Identity & Granular Access Management
│   │   │   │   ├── iam.constants.ts     # 91 permission definitions & role templates
│   │   │   │   ├── iam.controller.ts    # Role & permission assignment routes
│   │   │   │   └── iam.service.ts       # Permission resolution & audit logging
│   │   │   ├── kds/                     # Kitchen Display System & KOT Dispatch
│   │   │   │   ├── kds.controller.ts    # KDS queue, ticket accept/reject, 86 toggle
│   │   │   │   ├── kds.engine.ts        # Station routing & SLA calculation
│   │   │   │   ├── kds.service.ts       # KOT lifecycle state machine
│   │   │   │   └── kds.types.ts         # Station codes & ticket interfaces
│   │   │   ├── orders/                  # Customer & POS order intake
│   │   │   │   └── orders.controller.ts # Idempotent order placement & history
│   │   │   ├── payments/                # Payment providers & settlement verification
│   │   │   │   ├── payment-provider.interface.ts # Gateway abstraction contract
│   │   │   │   ├── payment.service.ts   # Intent creation & atomic settlement
│   │   │   │   ├── payments.controller.ts# Intent, verification, webhooks
│   │   │   │   └── sandbox-payment.provider.ts # Deterministic UPI/Card provider
│   │   │   ├── recommendations/         # Location & dietary recommendation engine
│   │   │   │   └── recommendations.controller.ts
│   │   │   ├── restaurants/             # Restaurant catalog & public menu
│   │   │   │   └── restaurants.controller.ts
│   │   │   ├── service-requests/        # Floor waiter assistance calls
│   │   │   │   └── service-requests.controller.ts
│   │   │   ├── staff/                   # Staff directory & overview metrics
│   │   │   │   └── staff.controller.ts
│   │   │   └── tables/                  # QR token validation & floor allocation
│   │   │       └── tables.controller.ts # Auto-waiter assignment & surveillance
│   │   ├── realtime/                    # Event-driven synchronization infrastructure
│   │   │   ├── redis.ts                 # Redis Pub/Sub cluster client
│   │   │   └── websocket.ts             # Canonical RealtimeHub WebSocket broker
│   │   └── index.ts                     # Fastify server initialization & route binding
│   ├── Dockerfile                       # Multi-stage production container definition
│   ├── package.json                     # Backend dependencies & script definitions
│   └── tsconfig.json                    # TypeScript compiler configuration
│
├── customer-web/                        # Diners Contactless Web App (Port 5173)
│   ├── src/
│   │   ├── components/                  # CustomerAuthModal, Header, MobileBottomNav, QrScannerModal, ServiceModal
│   │   ├── context/                     # CustomerContext (state, cart, active view)
│   │   ├── pages/                       # CustomerHome, CustomerMenu, CustomerTracking, CustomerBill, CustomerAccount
│   │   ├── services/                    # api.ts (REST client), websocket.ts, receiptStorage.ts
│   │   ├── types/                       # Customer domain data models
│   │   ├── App.tsx                      # Single-page application router
│   │   └── main.tsx                     # React 18 DOM mount point
│   ├── package.json                     # React, Vite, Tailwind, Lucide React
│   └── vite.config.ts                   # Development server configured for port 5173
│
├── partner-web/                         # Restaurant Staff, KDS & POS Portal (Port 5174)
│   ├── src/
│   │   ├── components/                  # IncomingOrderModal, Navbar, Sidebar
│   │   ├── context/                     # AuthContext, InventoryContext
│   │   ├── pages/                       # Dashboard, KitchenKDS, BillingCashier, TableManagement, MenuManagement, StaffIAM, OrderManagement, Reservations, Inventory, Reports, AuditLogs, Settings
│   │   ├── services/                    # api.ts (operations REST client), websocket.ts
│   │   ├── utils/                       # thermalPrinter.ts (ESC/POS formatting)
│   │   ├── types/                       # Partner domain models
│   │   └── App.tsx                      # Main partner console layout
│   └── vite.config.ts                   # Configured for port 5174
│
├── admin-web/                           # Super Admin Platform Control Center (Port 5175)
│   ├── src/
│   │   ├── components/                  # AdminNavbar, AdminSidebar, GlobalSearchModal, BulkOperationsModal
│   │   ├── context/                     # AdminAuthContext
│   │   ├── pages/                       # 20 admin governance screens (AdminOverview, AdminRestaurants, AdminFinance, AdminOperations, AdminOrders, AdminApprovals, AdminReconciliation, AdminCompliance, AdminRisk, AdminIAM, AdminDevices, AdminFeatureFlags, AdminChangeManagement, AdminHealth, AdminSupport, AdminAudit, AdminSettings, AdminCustomerCMS, AdminTenantDeepDive, AdminUserDatabase)
│   │   ├── services/                    # api.ts, websocket.ts
│   │   └── App.tsx                      # Master layout and Ctrl+K search handler
│   └── vite.config.ts                   # Configured for port 5175
│
├── app/                                 # Native Android Customer App (Kotlin + Compose)
│   └── src/main/java/com/dinedeck/app/
│       ├── core/                        # Database (Room), DI (Hilt), Navigation, SessionManager, CurrencyFormatter
│       ├── data/                        # DineDeckApiService (Retrofit), RealtimeSyncManager, Repositories
│       ├── domain/                      # Models, Repository interfaces, UseCases
│       └── presentation/                # Auth, Home, Discover, QRScanner, Detail, Cart, Checkout, OrderTracking, Bill, Profile
│
├── partner-app/                         # Native Android Restaurant Operations App
│   └── src/main/java/com/dinedeck/partner/
│       ├── data/                        # PartnerApiClient (OkHttp/Gson), PartnerModels
│       └── presentation/                # PartnerScreens (KDS, Tables, Cashier, Calls, Menu, Staff IAM), PartnerViewModel
│
├── admin-app/                           # Native Android Platform Governance App
│   └── src/main/java/com/dinedeck/admin/
│       ├── data/                        # AdminApiClient, AdminModels
│       └── presentation/                # ControlCenterScreens (Overview, KYC, Branches, Tables, Finance, Killswitch), ViewModel
│
├── docs/                                # Technical Documentation & Reports
│   └── CONTROL_CENTER_REPORT.md         # Admin control center verification report
├── scripts/                             # PowerShell automation scripts
│   ├── start_web.ps1                    # Launches customer-web, partner-web, and admin-web
│   ├── start_android.ps1                # Builds and deploys Android applications to emulators
│   ├── start_customer.ps1               # Launches Customer Web standalone
│   ├── start_partner.ps1                # Launches Partner Web standalone
│   └── start_superadmin.ps1             # Launches SuperAdmin Web standalone
├── docker-compose.yml                   # Production container orchestration (Postgres 16, Redis 7, Backend)
├── settings.gradle.kts                  # Gradle multi-project setup (`:app`, `:partner-app`, `:admin-app`)
├── START_CUSTOMER_APP.bat               # One-click Windows batch launcher for Customer Web
├── START_PARTNER_APP.bat                # One-click Windows batch launcher for Partner Web
├── START_SUPERADMIN_APP.bat             # One-click Windows batch launcher for SuperAdmin Web
└── START_DINEDECK_WEB.bat               # Master Windows launcher for all three frontends
```

---

## Section 3: Working Structure — How the System Operates

DineDeck operates through interconnected, event-driven workflows connecting diners, kitchen personnel, floor stewards, cashiers, and platform administrators.

### 3.1 Customer In-Dining Workflow
1. **Arrival & QR Code Scan:** The guest sits at physical Table #4 and opens the camera or DineDeck customer app to scan the acrylic QR standee.
2. **Session Initialization:** The app transmits the encrypted QR token (e.g., `QR_punjab-heritage-mumbai_T4_1724001122`) to `POST /api/tables/validate`. The backend validates the cryptographic signature, checks that the restaurant is `ACTIVE`, and verifies or initializes a `DiningSession`.
3. **Automated Server Allocation:** The backend executes the auto-assignment round-robin engine, assigning the least-loaded floor steward (e.g., *Captain Ramesh*) to Table #4, and dispatches a `TABLE_WAITER_ASSIGNED` event to floor staff.
4. **Interactive Menu Exploration & Customization:** The diner browses categories (*Tandoori Starters*, *Royal Main Course*). Selecting an item opens the Food Customization Bottom Sheet, allowing the customer to choose portion sizes (Regular / Full Handi), spice levels (Mild, Medium, Hot), and add-ons (Extra Butter, Garlic Naan).
5. **Cart Validation & Idempotent Placement:** The diner submits the order. The app computes local line totals and transmits `POST /api/orders` accompanied by a unique `idempotencyKey`.
6. **Order Creation & Real-Time Chime:** The backend calculates authoritative GST (2.5% CGST + 2.5% SGST), 5% service charge, creates an `Order` record in status `PLACED`, generates an initial pending `Bill` record, and emits an `ORDER_PLACED` event over WebSockets. Both web and mobile partner terminals trigger an audible two-tone audio chime (587 Hz $\rightarrow$ 880 Hz).
7. **Preparation Tracking:** As the kitchen moves items through cooking stages, WebSocket messages (`ORDER_STATUS_CHANGED`) push live updates to the customer's tracking screen: `PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `SERVED`.
8. **Digital Bill Presentation & UPI Settlement:** When dining concludes, the customer requests the bill via `POST /api/service-requests` (Type: `REQUEST_BILL`) or navigates to the Digital Bill screen. The customer initiates an instant UPI transaction (`POST /api/payments/create`), verifies payment through the payment provider (`POST /api/payments/verify`), and receives a digitally signed tax invoice.

```
+----------------------------------------------------------------------------------------------------+
|                                    CUSTOMER IN-DINING LIFECYCLE                                    |
+----------------------------------------------------------------------------------------------------+
|  [Scan Table QR]  -->  [Validate 90-Min Session]  -->  [Assign Waiter]                             |
|         |                                                                                          |
|         v                                                                                          |
|  [Browse Menu]    -->  [Customize Dishes]         -->  [Review Cart & GST Breakdown]               |
|         |                                                                                          |
|         v                                                                                          |
|  [Place Order]    -->  [Live WebSocket Tracking]  -->  [Call Waiter / Napkins / Water]             |
|         |                                                                                          |
|         v                                                                                          |
|  [Food Delivered] -->  [Inspect Digital Bill]     -->  [Instant UPI Payment]  -->  [Digital Receipt] |
+----------------------------------------------------------------------------------------------------+
```

### 3.2 Kitchen Staff (KDS) Workflow
1. **Live Queue Monitoring:** Kitchen line cooks and expeditors monitor the touch KDS interface (`/partner/kds`). Incoming orders appear in the `Incoming / New Tickets` queue highlighted with glowing amber indicators.
2. **Acceptance & Multi-Station KOT Generation:** When the chef taps **Accept Order**, the backend executes `POST /api/kds/orders/:id/accept`. The `kdsEngine` decomposes composite order items into individual Kitchen Order Tickets (KOT) routed to dedicated station queues:
   * *Station TANDOOR:* Angaari Paneer Tikka, Murgh Malai Tikka
   * *Station CURRY:* Butter Chicken, Dal Makhani
   * *Station BAR:* Fresh Lime Soda, Masala Chaas
3. **Partial Acceptance & Item Decisions:** If an ingredient is exhausted, the kitchen expeditor uses `POST /api/kds/orders/:id/partial-decide`, marking specific items as rejected with reasons (e.g., *"Tandoor clay oven pre-heating"*) while accepting the remaining items.
4. **Cooking Status Transitions:** Line cooks click item pills to transition items from `QUEUED` to `PREPARING`. A countdown timer indicates target preparation time and warns when an order exceeds the SLA threshold (>10 minutes: Amber; >20 minutes: Red Breach).
5. **Expo Pass Quality Check:** Cooked dishes move to the Expeditor / Pass station (`EXPO`). The head chef conducts a visual quality inspection and clicks **Expo Pass** (`POST /api/kds/orders/:id/expo-pass`).
6. **Waiter Pickup Notification:** Passing Expo triggers `POST /api/kds/orders/:id/notify-waiter`. A high-priority pickup alert is sent to the assigned steward's device indicating: *"Order #ORD-1234 Ready for Table #4"*.
7. **Service Confirmation:** Once delivered to the table, the waiter or kitchen marks the ticket as `SERVED` (`POST /api/kds/orders/:id/served`).

### 3.3 Cashier & Management POS Workflow
1. **Cashier Shift Opening:** At shift start, the cashier records opening cash in drawer (`POST /api/billing/shifts/open`, e.g., ₹5,000.00 float).
2. **Running Table Audit:** The cashier monitors active dining sessions (`GET /api/billing/sessions`), reviewing cumulative table orders, added items, and running sub-totals.
3. **Discounts & Complimentary Items:** If approved by the manager, the cashier applies discounts (`POST /api/billing/bills/:id/discount`), selecting `PERCENTAGE`, `FIXED`, or `COMPLIMENTARY` with mandatory audit reasons.
4. **Bill Settlement:** When the patron requests counter checkout, the cashier settles the bill (`POST /api/billing/bills/:id/settle`), selecting payment methods (Cash, POS Card Swipe, UPI Dynamic QR, or Split Payment).
5. **Session Close & Table Reset:** Settling the bill marks the `Bill` as `PAID`, updates the `Order` to `COMPLETED`, transitions the `DiningSession` to `COMPLETED`, and automatically resets Table #4 to `isOccupied: false` (Vacant) across all applications.
6. **Shift Reconciliation & Closing:** At shift conclusion, the cashier counts physical currency, enters the total (`POST /api/billing/shifts/close`), and the system automatically calculates cash variance (`actualCash - expectedCash`).

### 3.4 Platform Super Administrator Workflow
1. **Platform Health & Metrics Telemetry:** The Super Administrator monitors real-time Gross Order Value (GOV), aggregate DineDeck 15% platform commissions, merchant payables, active customer connections, and database latencies (`GET /api/admin/overview`).
2. **Merchant Onboarding & KYC Governance:** Platform administrators review submitted restaurant onboarding applications. They verify legal business names, GSTIN registrations, PAN numbers, and FSSAI licenses. Using `PATCH /api/admin/restaurants/:id/lifecycle`, they advance merchants from `APPLICATION` $\rightarrow$ `ACTIVE` or `SUSPENDED`.
3. **Franchise Branch & Table Provisioning:** Administrators create branch locations, define table capacities, and regenerate cryptographic QR access tokens with 1-click rotation (`POST /api/admin/tables/:id/regenerate-qr`).
4. **Staff IAM & Granular Overrides:** Admins inspect staff rosters across restaurants and assign explicit `ALLOW` or `DENY` permission overrides to individual staff user profiles.
5. **Financial Settlement Cycles:** The system aggregates completed orders over weekly cycles (`POST /api/admin/settlements/generate`). Admins inspect DineDeck commissions, deduct gateway fees, verify net payable sums, and record bank transaction payout references (`POST /api/admin/settlements/:id/payout`).
6. **Emergency Platform Killswitch:** In the event of system maintenance or critical external payment failures, the Super Administrator triggers the platform killswitch (`POST /api/admin/system/killswitch`) with actions:
   * `PAUSE_RESTAURANT`: Suspends a single delinquent venue.
   * `PAUSE_ALL`: Puts the entire platform into emergency read-only maintenance mode.
   * `RESTORE_ALL`: Restores normal multi-tenant transactional operations.

---

## Section 4: Technical Architecture

DineDeck is built upon a decoupled, event-driven micro-monorepo architecture.

| Tier / Domain | Technology | Purpose & Responsibility |
| :--- | :--- | :--- |
| **Backend Framework** | **Fastify 4.28 (TypeScript)** | High-throughput, low-overhead HTTP & WebSocket server. Handles all authentication, billing calculations, and KDS state transitions. |
| **Database & ORM** | **PostgreSQL 16 + Prisma 5.19** | Relational primary data store. Prisma manages type-safe database queries, transactional integrity, foreign key cascades, and schema migrations. |
| **Realtime Pub/Sub** | **Redis 7 (ioredis 6.0)** | High-speed in-memory message broker. Redis publishes canonical events across multiple server instances to guarantee synchronization. |
| **WebSocket Broker** | **@fastify/websocket + ws 8.18** | Bidirectional persistent socket gateway (`ws://host:8080/ws`). Routes targeted alerts based on role, restaurant ID, and table assignment. |
| **Web Frontends** | **React 18.3 + Vite 6 + Tailwind CSS 3.4** | Powers three dedicated SPAs (`customer-web`, `partner-web`, `admin-web`). Styled with dark mode glassmorphism and Lucide React icons. |
| **Mobile Frontends** | **Kotlin 1.9 + Jetpack Compose (M3)** | Native Android applications (`app`, `partner-app`, `admin-app`) targeting SDK 34 with Hilt dependency injection and Room offline caching. |
| **Auth & Security** | **@fastify/jwt 8.0 + bcryptjs 2.4** | Cryptographic JSON Web Token issuance (1-day access, 30-day refresh). Passwords and 4-digit diner PINs encrypted with 10 bcrypt salt rounds. |
| **Financial Engine** | **Decimal.js 10.4** | Arbitrary-precision decimal arithmetic. Prevents IEEE 754 binary floating-point rounding errors during multi-item tax and discount computation. |
| **API Contract Validation**| **Zod 3.23** | Strict schema validation of incoming JSON request payloads before route execution. |
| **Containerization** | **Docker & Docker Compose** | Multi-container composition configuring PostgreSQL 16 (port 5433 host / 5432 container), Redis 7 (port 6380 host / 6379 container), and Fastify Backend (port 8080). |

---

## Section 5: Architecture Diagrams

### 5.1 Overall System Architecture

```mermaid
graph TD
    subgraph Client Layer
        CW["Customer Web (Port 5173)<br/>React 18 + Vite"]
        CA["Customer Android App<br/>Kotlin + Jetpack Compose"]
        PW["Partner Operations Web (Port 5174)<br/>POS & KDS Portal"]
        PA["Partner Android App<br/>Kotlin + Compose"]
        AW["Admin Control Center Web (Port 5175)<br/>Governance Portal"]
        AA["Admin Android App<br/>Kotlin + Compose"]
    end

    subgraph Gateway & Backend Core
        LB["Fastify Backend Gateway (Port 8080)"]
        AUTH["JWT & PIN IAM Authenticator"]
        WSHUB["RealtimeHub WebSocket Engine (/ws)"]
        ROUTERS["Domain Routing Engine<br/>Orders | KDS | Billing | Admin | Tables"]
        TAX["IndiaBillingEngine (Decimal.js)"]
    end

    subgraph Data & Message Broker
        PG[("PostgreSQL 16 Database<br/>Port 5433 : 5432<br/>Primary Relational Store")]
        REDIS[("Redis 7 Cache & Pub/Sub<br/>Port 6380 : 6379<br/>Realtime Event Channel")]
    end

    CW -->|REST / WS| LB
    CA -->|Retrofit / REST| LB
    PW -->|REST / WS| LB
    PA -->|OkHttp / REST| LB
    AW -->|REST / WS| LB
    AA -->|OkHttp / REST| LB

    LB --> AUTH
    LB --> WSHUB
    LB --> ROUTERS
    ROUTERS --> TAX

    ROUTERS -->|Prisma ORM Client| PG
    WSHUB <-->|Pub / Sub Bus| REDIS
```

### 5.2 Real-Time Order & KDS Event Propagation

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Diner (Customer Web / App)
    participant Backend as Fastify Backend Engine
    participant DB as PostgreSQL 16
    participant Redis as Redis 7 Pub/Sub
    participant KDS as Kitchen Staff (Partner KDS)
    participant Waiter as Floor Steward (Partner Web/App)

    Customer->>Backend: POST /api/orders (Table #4, Items, Notes)
    Backend->>DB: Prisma Transaction (Create Order, Items, Pending Bill)
    Backend->>Redis: Publish Canonical Event (ORDER_CREATED)
    Redis-->>Backend: Distribute across cluster
    Backend-->>KDS: WebSocket Push (ORDER_PLACED + 2-Tone Audio Chime)
    Backend-->>Customer: 201 Created (Order Number & Summary)

    Note over KDS: Chef views incoming ticket on KDS
    KDS->>Backend: POST /api/kds/orders/:id/accept
    Backend->>DB: Update Order Status -> PREPARING, Create Station KOTs
    Backend->>Redis: Publish Event (ORDER_STATUS_CHANGED: PREPARING)
    Backend-->>Customer: WebSocket Push (Status: PREPARING, ETA 15m)

    Note over KDS: Dishes cooked, chef passes Expo Check
    KDS->>Backend: POST /api/kds/orders/:id/expo-pass
    Backend->>DB: Update Order Status -> READY
    Backend->>Redis: Publish Event (ORDER_STATUS_CHANGED: READY)
    Backend-->>Waiter: Targeted Alert (Food Pickup Table #4)
    Backend-->>Customer: WebSocket Push (Status: READY)

    Waiter->>Backend: POST /api/kds/orders/:id/served
    Backend->>DB: Update Order Status -> SERVED
    Backend-->>Customer: WebSocket Push (Status: SERVED)
```

### 5.3 Payment Intent and Authoritative Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Diner
    participant API as Payment Controller
    participant Service as Payment Service
    participant Gateway as Sandbox / Razorpay Provider
    participant DB as PostgreSQL (Prisma $transaction)
    participant Realtime as RealtimeHub WebSocket

    Customer->>API: POST /api/payments/create { billId, method: "UPI" }
    API->>Service: createPaymentIntent(...)
    Service->>Gateway: createPaymentIntent(amountPaise, idempotencyKey)
    Gateway-->>Service: Return intent { transactionRef, payload }
    Service->>DB: Atomic Transaction: Create Payment(INITIATED), Update Bill(PROCESSING)
    Service->>Realtime: Emit PAYMENT_INITIATED
    Service-->>Customer: Return Payment Intent Details

    Customer->>API: POST /api/payments/verify { paymentId, transactionRef }
    API->>Service: verifyPayment(...)
    Service->>Gateway: verifyPayment(transactionRef, signature)
    Gateway-->>Service: Verified OK (Status: PAID)
    Service->>DB: Atomic Settlement Transaction:<br/>1. Update Payment -> PAID<br/>2. Update Bill -> PAID<br/>3. Update Order -> COMPLETED<br/>4. Insert OrderStatusHistory
    Service->>Realtime: Emit PAYMENT_SUCCESS
    Service-->>Customer: Verified 200 OK (Invoice settled)
```

---

## Section 6: Complete Request and Data Flow

### 6.1 Authentication & Token Resolution Flow
* **File:** [`backend/src/modules/auth/auth.controller.ts`](file:///d:/Dindeck/backend/src/modules/auth/auth.controller.ts)
* **Function:** `authRoutes (POST /api/auth/login, POST /api/auth/pin-login)`
* **Data Flow:**
  1. Diner or staff member submits credentials.
  2. For 4-digit PIN authentication, email is sanitized and the user record is queried via Prisma.
  3. `bcrypt.compare(pin, user.passwordHash)` verifies the hash.
  4. If first-time diner, an auto-registration transaction creates the `User` and binds the default `CUSTOMER` role.
  5. The IAM engine resolves the target restaurant and branch context, retrieving all explicit permission overrides.
  6. The backend issues a signed JWT containing user ID, role, restaurant ID, and branch ID.

### 6.2 Table QR Code Verification & Session Start
* **File:** [`backend/src/modules/tables/tables.controller.ts`](file:///d:/Dindeck/backend/src/modules/tables/tables.controller.ts)
* **Function:** `validate (POST /api/tables/validate), session (POST /api/tables/session)`
* **Data Flow:**
  1. Frontend submits the raw QR string.
  2. The table controller performs a unique lookup on `Table.qrCodeToken`.
  3. Parent branch and restaurant verification confirms the venue is operational (`isActive: true`).
  4. The round-robin server allocator (`autoAssignWaiterForTable`) inspects active `RestaurantStaff` with designations matching Captain or Waiter, finds the steward with the lowest active table load, and registers the pairing in `tableWaiterAssignments`.
  5. An active `DiningSession` record is retrieved or created with a unique session token (`ses_<restaurantId>_<tableNumber>_<timestamp>`).
  6. Table status is marked `isOccupied: true`.
  7. WebSocket events notify staff terminals of the seated table party.

### 6.3 Order Placement & Idempotency Protection
* **File:** [`backend/src/modules/orders/orders.controller.ts`](file:///d:/Dindeck/backend/src/modules/orders/orders.controller.ts)
* **Function:** `orderRoutes (POST /api/orders)`
* **Data Flow:**
  1. Customer requests order placement with items array and optional `idempotencyKey`.
  2. If an `idempotencyKey` is provided, the database checks `Order.idempotencyKey`. If found, the existing order is returned immediately, preventing double billing on network retry.
  3. The restaurant's specific tax configuration (`cgstRatePercent`, `sgstRatePercent`, `serviceChargePercent`, `packagingCharge`) is fetched.
  4. Line item totals are calculated. If a coupon code is supplied, coupon constraints (`minOrderAmount`, `maxDiscount`, `validUntil`) are evaluated.
  5. `IndiaBillingEngine.calculateBill(...)` calculates exact rupee amounts.
  6. An `Order` record with status `PLACED` (or `CONFIRMED` if created by staff POS) is inserted alongside child `OrderItem` records and an initial `Bill` record within a single database transaction.
  7. Real-time events (`ORDER_PLACED`, `BILL_CREATED`) are dispatched to connected KDS terminals.

### 6.4 Kitchen Status Advancement & Station Dispatch
* **Files:** [`backend/src/modules/kds/kds.controller.ts`](file:///d:/Dindeck/backend/src/modules/kds/kds.controller.ts), [`backend/src/modules/kds/kds.service.ts`](file:///d:/Dindeck/backend/src/modules/kds/kds.service.ts)
* **Function:** `acceptOrder, updateItemStatus, expoQualityCheck, markOrderServed`
* **Data Flow:**
  1. Chef triggers `POST /api/kds/orders/:id/accept`.
  2. The service verifies the user possesses the `kds.orders.accept` permission.
  3. The order advances to `PREPARING`.
  4. Child items are grouped by their `stationCode` (e.g., `TANDOOR`, `CURRY`, `BEVERAGE`) and assigned station-specific `KotTicket` records.
  5. Individual item statuses update as line cooks finish items (`PATCH /api/kds/items/:id/status`).
  6. The expeditor marks `expoQualityCheck`, transitioning the overall order to `READY`.
  7. The assigned waiter is sent an alert (`POST /api/kds/orders/:id/notify-waiter`).
  8. Once placed on the diner's table, `markOrderServed` transitions the order to `SERVED`.

---

## Section 7: Database Architecture

The system uses **PostgreSQL 16** managed via **Prisma ORM**. The complete relational schema comprises 25 models supporting multi-tenancy, audit logging, order tickets, and financial ledgers.

```mermaid
erDiagram
    Restaurant ||--o{ RestaurantBranch : "has branches"
    Restaurant ||--o{ RestaurantStaff : "employs"
    Restaurant ||--o{ MenuCategory : "categorizes"
    Restaurant ||--o{ MenuItem : "sells"
    Restaurant ||--o{ DiningSession : "hosts"
    Restaurant ||--o{ Order : "receives"
    Restaurant ||--o{ Bill : "issues"
    Restaurant ||--o{ KitchenStation : "operates"
    Restaurant ||--o{ RestaurantSettlement : "receives payouts"

    RestaurantBranch ||--o{ Table : "contains"
    Table ||--o{ DiningSession : "hosts"

    DiningSession ||--o{ Order : "groups"
    DiningSession ||--o{ Bill : "aggregates"
    DiningSession ||--o{ ServiceRequest : "logs"

    Order ||--|{ OrderItem : "contains"
    Order ||--o{ OrderStatusHistory : "tracks"
    Order ||--o{ KotTicket : "generates"
    Order ||--o{ Bill : "bills"

    KotTicket ||--|{ KotTicketItem : "lists"
    KitchenStation ||--o{ KotTicket : "receives"

    Bill ||--o{ Payment : "settled by"
    User ||--o{ UserRole : "assigned"
    Role ||--o{ RolePermission : "defines"
    Permission ||--o{ RolePermission : "mapped to"
    User ||--o{ UserPermissionOverride : "overridden by"
    User ||--o{ AuditLog : "records"
```

### 7.1 Core Schema Entities & Field Definitions

#### User & Identity Management
* `User`: Primary account record.
  * `id` (UUID, PK), `email` (String, Unique), `phone` (String, Unique, Nullable), `passwordHash` (String, bcrypt), `name` (String), `role` (String: `CUSTOMER`, `RESTAURANT_OWNER`, `RESTAURANT_MANAGER`, `RESTAURANT_STAFF`, `DINEDECK_SUPER_ADMIN`), `avatarUrl` (String, Nullable).
* `RestaurantStaff`: Binds a `User` to a specific `Restaurant` tenant.
  * `id` (UUID, PK), `userId` (FK -> User), `restaurantId` (FK -> Restaurant), `designation` (String), `isActive` (Boolean).
* `Role` & `Permission` & `RolePermission`: Master RBAC mapping.
  * `Role.id` (String: `SUPER_ADMIN`, `RESTAURANT_OWNER`, `WAITER`, `CHEF`, etc.), `Permission.id` (String: `<resource>.<action>`, e.g., `orders.accept`).
* `UserPermissionOverride`: Allows per-user explicit authorization grants.
  * `id` (UUID), `userId` (FK), `permissionId` (FK), `isGranted` (Boolean: true = ALLOW, false = DENY), `restaurantId` (Nullable), `branchId` (Nullable).

#### Merchant & Table Hierarchy
* `Restaurant`: Master merchant tenant entity.
  * `id` (UUID, PK), `name` (String), `slug` (String, Unique), `cuisineType` (String), `rating` (Float), `city` (String), `state` (String), `fullAddress` (String), `isActive` (Boolean), `status` (`ACTIVE`, `PAUSED`, `SUSPENDED`, `PENDING_REVIEW`).
  * *Tax & Financial Config:* `cgstRatePercent` (Float, default 2.5), `sgstRatePercent` (Float, default 2.5), `serviceChargePercent` (Float, default 5.0), `packagingCharge` (Float), `commissionRatePercent` (Float, default 15.0).
  * *KYC & Banking:* `legalBusinessName` (String), `gstin` (String), `panNumber` (String), `fssaiNumber` (String), `bankAccountNumber` (String), `bankIfsc` (String).
* `RestaurantBranch`: Multi-outlet branch representation.
  * `id` (UUID), `restaurantId` (FK), `name` (String), `address` (String), `phone` (String), `isActive` (Boolean).
* `Table`: Physical seating unit.
  * `id` (UUID), `branchId` (FK), `tableNumber` (String), `capacity` (Int), `floor` (String), `qrCodeToken` (String, Unique cryptographic token), `isOccupied` (Boolean).
* `DiningSession`: Active dining table session.
  * `id` (UUID), `restaurantId` (FK), `tableId` (FK), `userId` (FK, Nullable), `sessionToken` (String, Unique), `status` (`ACTIVE`, `COMPLETED`, `EXPIRED`, `CANCELLED`), `startedAt` (DateTime), `endedAt` (DateTime, Nullable).

#### Menu Catalog & Customizations
* `MenuCategory`: Category groupings.
  * `id` (UUID), `restaurantId` (FK), `name` (String), `displayOrder` (Int), `isActive` (Boolean).
* `MenuItem`: Master food catalog item.
  * `id` (UUID), `restaurantId` (FK), `categoryId` (FK), `name` (String), `description` (String), `price` (Float), `discountedPrice` (Float, Nullable), `imageUrl` (String), `isVeg` (Boolean), `isBestseller` (Boolean), `isAvailable` (Boolean, 86-toggle), `spiceLevel` (Int: 1=Mild, 2=Medium, 3=Hot), `preparationTime` (Int in mins), `stationCode` (String, default `MAIN`).
* `MenuVariant`: Portion variations (Regular, Full Handi).
  * `id` (UUID), `menuItemId` (FK), `name` (String), `price` (Float), `isDefault` (Boolean).
* `MenuAddon` & `MenuItemAddon`: Custom culinary add-ons (Extra cheese, garlic butter).

#### Orders & Kitchen Display System (KDS)
* `Order`: Authoritative dining order.
  * `id` (UUID, PK), `restaurantId` (FK), `sessionId` (FK, Nullable), `userId` (FK, Nullable), `tableNumber` (String), `orderNumber` (String, Unique, e.g., `ORD-260830-101`), `status` (`PLACED`, `ACCEPTED`, `CONFIRMED`, `QUEUED`, `PREPARING`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED`, `REJECTED`, `ON_HOLD`, `RE_FIRE`).
  * `subtotal`, `discountAmount`, `cgstAmount`, `sgstAmount`, `serviceCharge`, `roundOffAmount`, `totalAmount` (Float).
  * `specialNotes`, `kitchenNotes`, `dietaryAlerts`, `rejectionReason`, `idempotencyKey` (Unique, Nullable).
* `OrderItem`: Line items within an order.
  * `id` (UUID), `orderId` (FK), `menuItemId` (String), `name` (String), `quantity` (Int), `unitPrice` (Float), `totalPrice` (Float), `status` (`QUEUED`, `PREPARING`, `READY`, `SERVED`), `stationCode` (String), `course` (String: `STARTER`, `MAIN`, `DESSERT`, `BEVERAGE`).
* `KitchenStation`: Preparation stations.
  * `id` (UUID), `restaurantId` (FK), `code` (String: `MAIN`, `TANDOOR`, `CURRY`, `GRILL`, `BAKERY`, `BAR`, `EXPO`), `name` (String), `isExpo` (Boolean), `printerStatus` (String).
* `KotTicket` & `KotTicketItem`: Physical and digital kitchen order tickets decomposed from master orders for specific stations.

#### Billing, Payments & Settlements
* `Bill`: Formal tax invoice.
  * `id` (UUID, PK), `restaurantId` (FK), `orderId` (FK), `sessionId` (FK), `billNumber` (String, Unique, e.g., `INV-2026-94812`), `subtotal`, `discountAmount`, `cgstAmount`, `sgstAmount`, `serviceCharge`, `roundOffAmount`, `grandTotal`, `paymentStatus` (`PENDING`, `PROCESSING`, `PAID`, `PARTIALLY_PAID`, `FAILED`, `REFUNDED`, `VOID`), `paymentMethod` (`UPI`, `CARD`, `NET_BANKING`, `WALLET`, `CASH`, `SPLIT`), `paidAt` (DateTime, Nullable).
* `Payment`: Transaction transaction ledger entry.
  * `id` (UUID), `billId` (FK), `transactionRef` (String, Unique), `method` (String), `status` (`INITIATED`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`), `amount` (Float), `gatewayPayload` (String JSON), `refundAmount` (Float).
* `CashierShift`: Cash drawer tracking.
  * `id` (UUID), `restaurantId` (FK), `userId` (String), `shiftNumber` (String, Unique), `openingCash`, `cashPaymentsCollected`, `upiPaymentsCollected`, `cardPaymentsCollected`, `cashIn`, `cashOut`, `expectedCash`, `actualCash`, `cashVariance`, `status` (`OPEN`, `CLOSED`).
* `RestaurantSettlement`: Platform payout batches.
  * `id` (UUID), `settlementNumber` (String, Unique), `restaurantId` (FK), `grossOrderValue`, `dinedeckCommission`, `taxCollected`, `netPayable`, `status` (`PENDING`, `PROCESSING`, `SETTLED`), `payoutRef` (String).
* `AuditLog`: Immutable platform mutations ledger.
  * `id` (UUID), `actorId` (FK, Nullable), `actorRole` (String), `action` (String), `resource` (String), `resourceId` (String), `scope` (String), `beforeJson` (String), `afterJson` (String), `result` (`SUCCESS`, `DENIED`, `FAILED`), `ipAddress` (String), `createdAt` (DateTime).

---

## Section 8: Authentication and Authorization

### 8.1 Authentication Mechanisms
The platform supports three distinct authentication pathways:
1. **JWT Universal Email & Password Authentication:** Standard login for staff, managers, and administrators (`POST /api/auth/login`). Passwords are verified against stored `bcrypt` hashes. Successful logins yield a Fastify JWT containing user identity and tenant scoping with a 24-hour expiration window, alongside a 30-day refresh token.
2. **Customer 4-Digit Encrypted PIN Authentication:** Designed for friction-free in-dining authentication on mobile devices (`POST /api/auth/pin-login`). Diners provide their email and a 4-to-6 digit PIN. The PIN is hashed using `bcrypt` (10 rounds) and verified without transmitting plain text. If an email is encountered for the first time, an account is auto-provisioned.
3. **Free 6-Digit Email Verification OTP:** Built for forgotten PIN resets and identity verification (`POST /api/auth/send-email-otp` and `POST /api/auth/verify-email-otp`). Employs an in-memory verification cache with a 5-minute cryptographic expiration window.

### 8.2 Identity & Access Management (IAM) Engine
* **Source:** [`backend/src/modules/iam/iam.constants.ts`](file:///d:/Dindeck/backend/src/modules/iam/iam.constants.ts) and [`backend/src/modules/iam/iam.service.ts`](file:///d:/Dindeck/backend/src/modules/iam/iam.service.ts)
DineDeck implements a granular enterprise IAM architecture consisting of **91 discrete permissions** distributed across **13 functional categories**:

| Category Key | Category Label | Permission Count | Sample Permissions |
| :--- | :--- | :---: | :--- |
| `OPERATIONS` | OPERATIONS | 7 | `orders.read`, `orders.accept`, `orders.reject`, `orders.update`, `orders.cancel`, `orders.history`, `orders.create` |
| `KITCHEN` | KITCHEN / KDS | 7 | `kds.view`, `kds.orders.accept`, `orders.prepare`, `orders.ready`, `orders.serve`, `kds.queue.manage`, `kds.analytics.read` |
| `SERVICE` | SERVICE | 6 | `service_requests.read`, `service_requests.acknowledge`, `service_requests.resolve`, `service_requests.assign` |
| `MENU` | MENU | 10 | `menu.read`, `menu.create`, `menu.update`, `menu.price.update`, `menu.availability.update` (86ing), `menu.delete` |
| `TABLES` | TABLES | 9 | `tables.read`, `tables.update`, `tables.status.update`, `tables.assign`, `tables.qr.manage`, `tables.merge`, `tables.close` |
| `BILLING` | BILLING | 8 | `billing.read`, `billing.create`, `billing.print`, `billing.discount`, `billing.settle`, `billing.refund` |
| `PAYMENTS` | PAYMENTS | 5 | `payments.read`, `payments.create`, `payments.verify`, `payments.refund`, `payments.terminal.manage` |
| `FINANCE` | FINANCE | 6 | `finance.revenue.view`, `finance.settlements.view`, `finance.reports.view`, `finance.payout_bank.update` |
| `STAFF_IAM` | STAFF / IAM | 8 | `staff.read`, `staff.assign_role`, `staff.assign_permission`, `staff.scopes.manage`, `staff.suspend` |
| `REPORTS` | REPORTS | 9 | `reports.daily`, `reports.weekly`, `reports.sales`, `reports.kitchen`, `reports.staff`, `reports.export` |
| `RESERVATIONS` | RESERVATIONS | 5 | `reservations.read`, `reservations.create`, `reservations.update`, `reservations.cancel`, `reservations.seat` |
| `INVENTORY` | INVENTORY | 6 | `inventory.read`, `inventory.update`, `inventory.adjust`, `inventory.purchases.view`, `inventory.create` |
| `SETTINGS_AUDIT`| SETTINGS & AUDIT | 5 | `settings.read`, `settings.update`, `settings.hours.manage`, `audit.read`, `audit.staff_activity.view` |

### 8.3 Built-In Role Templates
1. `SUPER_ADMIN` / `DINEDECK_SUPER_ADMIN` (Hierarchy Rank 1000): Complete root authority across all tenants and platform configurations. Holds all 91 permissions.
2. `RESTAURANT_OWNER` (Hierarchy Rank 100): Complete ownership over an assigned restaurant tenant, including staff salaries, pricing, menu, and financial settlement destinations. Holds all 91 permissions bounded by restaurant scope.
3. `GENERAL_MANAGER` / `MANAGER` (Hierarchy Rank 80): Operational, inventory, and floor management authority. Holds operational, menu, table, billing, and reporting permissions. Cannot alter bank account details.
4. `CHEF` / `HEAD_CHEF` (Hierarchy Rank 60): Direct access to KDS queues, ticket cooking status, re-fire creation, and menu 86 stock availability. Restricted from financial records and billing settlements.
5. `WAITER` / `STEWARD` (Hierarchy Rank 20): Floor management, service request acknowledgment, table order creation, and food delivery. Restricted from menu pricing, discounts, and staff administration.
6. `CUSTOMER` (Hierarchy Rank 0): Public diner permissions: `orders.create`, `orders.read`, `billing.read`, `service_requests.create`, `menu.read`.

### 8.4 Permission Resolution Hierarchy
When an authenticated user invokes a protected endpoint, `iamService.authorize(...)` evaluates authorization through a four-tiered decision matrix:
1. **SuperAdmin Bypass:** If user role is `DINEDECK_SUPER_ADMIN`, request is unconditionally authorized.
2. **Explicit User Deny:** If an explicit override exists in `UserPermissionOverride` with `isGranted: false` for the target resource and action, access is immediately rejected with HTTP 403 Forbidden.
3. **Explicit User Allow:** If an explicit override exists with `isGranted: true`, access is granted immediately.
4. **Role Permission Inheritance:** The engine inspects all assigned `UserRole` templates for the user. If any assigned role includes the permission, access is granted; otherwise, it is denied.

---

## Section 9: API and Integration Documentation

All API routes are served under the `/api` prefix by the Fastify engine on port 8080. Interactive OpenAPI documentation is available locally at `http://localhost:8080/docs`.

### 9.1 Authentication API (`/api/auth`)
* `POST /api/auth/register`: Register new customer account (`name`, `email`, `phone`, `password`).
* `POST /api/auth/login`: Universal multi-tenant login (`email`, `password`). Returns JWT access token, refresh token, user profile, and assigned permissions.
* `POST /api/auth/refresh`: Exchanges a valid refresh token for a fresh access token.
* `GET /api/auth/me`: Retrieves current authenticated user profile, resolved branch context, and effective permissions.
* `POST /api/auth/pin-login`: Customer 4-digit PIN authentication (`email`, `pin`).
* `POST /api/auth/send-email-otp`: Dispatches a 6-digit verification code to the target email.
* `POST /api/auth/verify-email-otp`: Verifies the 6-digit code and sets a new encrypted PIN.

### 9.2 Tables & QR Session API (`/api/tables`)
* `POST /api/tables/validate`: Validates QR token string (`qrToken`). Returns table details, capacity, and auto-allocated steward.
* `POST /api/tables/session`: Initializes or joins an active dining session (`qrToken`, `userId`).
* `POST /api/tables/:tableId/assign-waiter`: Overrides table steward assignment (`waiterId`, `waiterName`, `waiterRole`).
* `GET /api/tables/surveillance/allocations`: Executive live floor telemetry: table occupancy, seated session durations, and pending kitchen food pickup timers.

### 9.3 Orders API (`/api/orders`)
* `POST /api/orders`: Places a new order (`restaurantId`, `tableNumber`, `items`, `couponCode`, `specialNotes`, `idempotencyKey`). Creates order items and pending bill. Triggers KDS alerts.
* `GET /api/orders`: Lists orders filtered by restaurant ID or user ID. Returns items, status history, and billing records.
* `GET /api/orders/:id`: Retrieves single order details with real-time preparation history.

### 9.4 Kitchen Display System (KDS) API (`/api/kds`)
* `GET /api/kds/queue`: Retrieves live kitchen tickets filtered by `stationCode`, `status`, or `priority`.
* `POST /api/kds/orders/:id/accept`: Accepts incoming order and decomposes items into station KOT tickets.
* `POST /api/kds/orders/:id/reject`: Rejects order ticket with mandatory `reason`.
* `POST /api/kds/orders/:id/partial-decide`: Accepts or rejects individual items in an order ticket.
* `POST /api/kds/orders/:id/undo-accept`: Reverts accidental order acceptance back to `PLACED`.
* `PATCH /api/kds/items/:id/status`: Advances an individual item status (`PREPARING`, `READY`).
* `POST /api/kds/orders/:id/hold`: Puts order on temporary hold with recorded reason.
* `POST /api/kds/orders/:id/resume`: Resumes held order.
* `POST /api/kds/orders/:id/refire`: Generates an urgent re-fire KOT ticket for recooking dishes.
* `POST /api/kds/orders/:id/recall`: Recalls delivered dishes back to the kitchen.
* `POST /api/kds/orders/:id/expo-pass`: Marks dishes as passed through the Expo quality inspection.
* `POST /api/kds/orders/:id/notify-waiter`: Alerts assigned waiter that food is ready at the pass.
* `POST /api/kds/orders/:id/served`: Confirms food has been placed on the customer's table.
* `PATCH /api/kds/menu-items/:id/86`: Toggles item stock availability on or off.
* `POST /api/kds/kots/:id/reprint`: Records and triggers a KOT ticket reprint.
* `GET /api/kds/analytics`: Returns preparation times, station load, and SLA breach rates.

### 9.5 Billing & Cashier API (`/api/billing`)
* `GET /api/billing/sessions`: Lists all active dining tables, running subtotals, and open bills.
* `GET /api/billing/sessions/:sessionId/bill`: Returns current bill breakdown for a specific table session.
* `POST /api/billing/bills/:billId/discount`: Applies percentage, fixed, or complimentary discounts with audit remarks.
* `POST /api/billing/bills/:billId/settle`: Settles bill with cash, card, UPI, or split tender. Closes dining session and resets table to vacant.
* `POST /api/billing/bills/:billId/void`: Voids erroneous bill with mandatory justification.
* `POST /api/billing/bills/:billId/reprint`: Increments reprint counter and outputs thermal print stream.
* `GET /api/billing/kpis`: Retrieves cashier metrics (Gross sales, GST collected, average check).
* `GET /api/billing/shifts/current`: Returns status of current open cashier shift.
* `POST /api/billing/shifts/open`: Opens a cashier shift with opening cash float.
* `POST /api/billing/shifts/cash-movement`: Records cash additions or cash drops (CASH_IN / CASH_OUT).
* `POST /api/billing/shifts/close`: Closes cashier shift, recording actual cash and calculating variance.

### 9.6 Payments API (`/api/payments`)
* `GET /api/payments/bill/:id`: Retrieves payment status and receipt details for a bill.
* `POST /api/payments/create`: Initializes payment intent (`billId`, `method`, `amount`, `idempotencyKey`).
* `POST /api/payments/verify`: Verifies payment settlement (`paymentId`, `transactionRef`, `gatewaySignature`).
* `POST /api/payments/webhook`: Webhook endpoint for asynchronous payment gateway callbacks.
* `GET /api/payments/sync`: Re-synchronization endpoint returning missed canonical events since a given timestamp.

### 9.7 Restaurant Catalog & Discovery API (`/api/restaurants`)
* `GET /api/restaurants`: Lists active restaurants with filters for `city`, `cuisine`, `isPureVeg`, and `search`.
* `GET /api/restaurants/:id`: Returns restaurant profile, operating hours, and branch locations.
* `GET /api/restaurants/:id/menu`: Returns category-grouped menu items with variants and add-on modifiers.
* `PATCH /api/restaurants/:restaurantId/menu/items/:itemId`: Updates menu item price, discount, or availability.

### 9.8 Service Requests API (`/api/service-requests`)
* `POST /api/service-requests`: Dispatches table assistance calls (`CALL_WAITER`, `WATER`, `NAPKINS`, `REQUEST_BILL`, `GENERAL`).
* `GET /api/service-requests`: Lists active assistance calls for current user or venue.

### 9.9 Super Admin Platform Control Center API (`/api/admin`)
* `GET /api/admin/metrics` & `GET /api/admin/overview`: Platform-wide aggregate revenue, commission, and restaurant count.
* `GET /api/admin/search`: Cross-domain global search matching restaurants, branches, orders, tables, and users.
* `GET /api/admin/restaurants`: Paginated restaurant directory with KYC compliance status.
* `POST /api/admin/restaurants/onboard`: Onboards new merchant entity.
* `PUT /api/admin/restaurants/:id/profile`: Updates merchant KYC legal information (GSTIN, PAN, FSSAI).
* `PATCH /api/admin/restaurants/:id/lifecycle`: Updates merchant lifecycle status (`ACTIVE`, `SUSPENDED`, `PAUSED`).
* `PUT /api/admin/restaurants/:id/config`: Updates restaurant commercial terms (commission %, GST rates).
* `POST /api/admin/tables/:tableId/regenerate-qr`: Rotates cryptographic QR access token.
* `POST /api/admin/payments/:id/refund`: Authorizes and executes instant digital refund.
* `GET /api/admin/settlements`: Lists platform settlement batches.
* `POST /api/admin/settlements/generate`: Computes merchant payables and generates settlement cycle.
* `POST /api/admin/settlements/:id/payout`: Records bank transfer reference for settled payout batch.
* `POST /api/admin/system/killswitch`: Executes emergency platform killswitch (`PAUSE_ALL`, `RESTORE_ALL`, `PAUSE_RESTAURANT`).

---

## Section 10: Real-Time Order Processing

Real-time synchronization between the customer, kitchen, cashier, and superadmin frontends is managed through a hybrid **WebSocket Hub** backed by a **Redis Pub/Sub Bus**.

### 10.1 RealtimeHub Architecture
* **File:** [`backend/src/realtime/websocket.ts`](file:///d:/Dindeck/backend/src/realtime/websocket.ts)
The `RealtimeHub` manages active persistent client connections (`ws://host:8080/ws`). Each connected socket registers its identity attributes:
```typescript
interface WsClient {
  id: string;
  socket: WebSocket;
  userId?: string;
  restaurantId?: string;
  role?: string;
  tableNumber?: string;
  connectedAt: Date;
  lastPingAt: Date;
}
```

### 10.2 Event Model & Canonical Structure
Every event emitted within the system adheres to a standardized canonical interface:
```typescript
interface CanonicalWsEvent {
  eventId: string;        // Unique identifier: evt_<timestamp>_<randomHex>
  eventType: string;      // Event name (e.g. ORDER_CREATED, PAYMENT_SUCCESS)
  entityId: string;       // Target resource UUID
  restaurantId?: string;  // Tenant bounding
  branchId?: string;
  orderId?: string;
  billId?: string;
  paymentId?: string;
  version: number;        // Monotonically increasing entity revision counter
  timestamp: string;      // ISO 8601 UTC timestamp
  payload: any;           // Serialized event data
}
```

### 10.3 Event Routing Matrix
When `realtimeHub.emit(...)` is invoked:
1. The event is formatted with an incremented version counter and appended to an in-memory ring buffer (retaining the last 500 events for reconnect resynchronization).
2. The event is distributed to all matching local WebSocket connections according to strict scoping rules:
   * **Super Admins:** Clients with role `DINEDECK_SUPER_ADMIN` receive all platform events.
   * **Restaurant Staff:** Clients receive events matching their `restaurantId`.
   * **Targeted Waiter:** If `payload.waiterId` matches the client's `userId`, the assigned floor steward receives the alert.
   * **Customer Table:** If `client.tableNumber` matches `payload.tableNumber`, the seated diner receives the update.
   * **Targeted User:** If `payload.userId` matches the client's authenticated user ID, the event is delivered.
3. The event is simultaneously published to the Redis channel `dinedeck:realtime_events` (`backend/src/realtime/redis.ts`), allowing multi-container deployments to synchronize instantly.

### 10.4 Canonical Event Catalog
* `ORDER_CREATED` / `ORDER_PLACED`: Emitted upon customer order submission. Triggers incoming order chime on partner terminals.
* `ORDER_STATUS_CHANGED`: Emitted when orders transition between `CONFIRMED`, `PREPARING`, `READY`, and `SERVED`.
* `TABLE_WAITER_ASSIGNED`: Broadcasts table steward allocation to floor staff.
* `SERVICE_REQUEST_CREATED`: Emitted when a guest requests assistance (water, napkins, bill).
* `BILL_CREATED` / `BILL_SETTLED` / `BILL_VOIDED`: Synchronizes cashier registers and floor maps.
* `PAYMENT_INITIATED` / `PAYMENT_SUCCESS` / `PAYMENT_FAILED`: Live payment progress telemetry.
* `MENU_AVAILABILITY_CHANGED`: Instantly hides or shows dishes across all customer menus when toggled by the kitchen (86ing).
* `GLOBAL_KILLSWITCH_TRIGGERED`: Broadcasts platform-wide emergency maintenance lockouts.

---

## Section 11: Business Logic

### 11.1 Indian GST, Service Charge & Financial Calculations
* **File:** [`backend/src/common/money.ts`](file:///d:/Dindeck/backend/src/common/money.ts)
The financial engine implements the authoritative Indian restaurant billing standard using arbitrary-precision arithmetic (`Decimal.js`):
1. **Subtotal Calculation:** Sum of each line item's unit price multiplied by quantity:
   $$\text{Subtotal} = \sum (\text{item.unitPrice} \times \text{item.quantity})$$
2. **Coupon Discount Deduction:** Evaluated against coupon rules (`minOrderAmount`, `maxDiscount`):
   $$\text{Taxable Amount} = \max(0, \text{Subtotal} - \text{Discount Amount})$$
3. **Goods & Services Tax (GST):** Calculated strictly on the post-discount taxable amount:
   $$\text{CGST} = \text{round}_2\left(\text{Taxable Amount} \times \frac{\text{cgstRatePercent}}{100}\right)$$
   $$\text{SGST} = \text{round}_2\left(\text{Taxable Amount} \times \frac{\text{sgstRatePercent}}{100}\right)$$
   *(Standard Default: 2.5% CGST + 2.5% SGST = 5.0% total GST for non-composition dining establishments).*
4. **Discretionary Service Charge:** Calculated on post-discount taxable amount:
   $$\text{Service Charge} = \text{round}_2\left(\text{Taxable Amount} \times \frac{\text{serviceChargePercent}}{100}\right)$$
   *(Standard Default: 5.0%).*
5. **Raw Bill Total:**
   $$\text{Raw Total} = \text{Taxable Amount} + \text{CGST} + \text{SGST} + \text{Service Charge} + \text{Packaging Charge}$$
6. **Nearest Rupee Round-Off:** In accordance with Indian commercial invoicing conventions:
   $$\text{Grand Total} = \text{round}_0(\text{Raw Total})$$
   $$\text{Round-Off Amount} = \text{Grand Total} - \text{Raw Total}$$

### 11.2 Order Status State Machine
Orders transition through a deterministic lifecycle:
$$\text{PLACED} \longrightarrow \text{CONFIRMED} \longrightarrow \text{PREPARING} \longrightarrow \text{READY} \longrightarrow \text{SERVED} \longrightarrow \text{COMPLETED}$$
* Orders placed via Customer QR begin at `PLACED`.
* Orders created directly by staff at the POS terminal bypass the intake queue and begin at `CONFIRMED`.
* Rejections can occur only from `PLACED` or `CONFIRMED` states and require a documented reason.
* Re-fire actions create a linked child ticket with priority `RE_FIRE`, resetting preparation timers without modifying the original customer invoice total.

### 11.3 Automated Steward Allocation Logic
* **File:** [`backend/src/modules/tables/tables.controller.ts`](file:///d:/Dindeck/backend/src/modules/tables/tables.controller.ts)
When a table session begins:
1. The system identifies all active staff members belonging to the venue whose role or designation contains `WAITER`, `CAPTAIN`, or `STEWARD`.
2. The system computes active table load per candidate server by inspecting the in-memory `tableWaiterAssignments` registry.
3. The candidate server with the lowest assigned table count is allocated to the table.
4. Managers can override assignments at any time via `POST /api/tables/:id/assign-waiter`.

### 11.4 Cashier Shift Balancing Rules
Cashier shifts must balance expected cash against physical count:
$$\text{Expected Cash} = \text{Opening Cash} + \text{Cash Payments Collected} + \text{Cash In} - \text{Cash Out}$$
$$\text{Cash Variance} = \text{Actual Cash Counted} - \text{Expected Cash}$$
* Positive variance indicates a cash surplus.
* Negative variance indicates a drawer deficit.
* Shifts cannot be modified once closed.

---

## Section 12: Complete Dependency Map

| Component | Key Files | Depends On | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Backend Core** | `backend/src/index.ts`, `backend/src/config/*` | Fastify, Prisma, Redis, JWT | Server bootstrapping, middleware registration, Swagger documentation. |
| **IAM Engine** | `backend/src/modules/iam/*` | Prisma, bcryptjs | Permissions resolution, role definitions, audit logging. |
| **Orders Module** | `backend/src/modules/orders/*` | Prisma, `money.ts`, `realtimeHub`, `kdsService` | Idempotent order placement, billing generation, real-time notification. |
| **KDS Module** | `backend/src/modules/kds/*` | Prisma, `iamService`, `realtimeHub` | Station decomposition, SLA tracking, ticket lifecycle transitions. |
| **Billing Module** | `backend/src/modules/billing/*` | Prisma, `money.ts`, `iamService`, `realtimeHub` | Cashier shifts, table bills, discounting, payment settlement. |
| **Payments Module** | `backend/src/modules/payments/*` | Prisma, `realtimeHub`, `sandbox-payment.provider.ts` | Intent initialization, cryptographic verification, webhooks. |
| **Tables Module** | `backend/src/modules/tables/*` | Prisma, `realtimeHub` | Cryptographic QR validation, auto-waiter allocation, floor surveillance. |
| **Customer Web** | `customer-web/src/*` | React 18, Vite, Tailwind, Lucide React, Fetch API | In-dining QR ordering, dish customizer, live tracking, UPI payments. |
| **Partner Web** | `partner-web/src/*` | React 18, Vite, Tailwind, Lucide React, WebSockets | Kitchen KDS screen, POS orders, floor management, cashier billing. |
| **Admin Web** | `admin-web/src/*` | React 18, Vite, Tailwind, Lucide React, WebSockets | SuperAdmin governance, KYC review, settlements, emergency killswitch. |
| **Customer Android** | `app/src/main/java/*` | Kotlin, Jetpack Compose, Hilt, Retrofit, Room | Native customer app with CameraX QR scanner, local caching, and tracking. |
| **Partner Android** | `partner-app/src/main/java/*` | Kotlin, Jetpack Compose, OkHttp, Gson | Native handheld operations app for stewards and kitchen personnel. |
| **Admin Android** | `admin-app/src/main/java/*` | Kotlin, Jetpack Compose, OkHttp, Gson | Native platform owner control center with live metrics and killswitch. |

---

## Section 13: Running and Deploying the Project

### 13.1 Prerequisites
* **Docker & Docker Compose** (v20+)
* **Node.js** (v20 LTS recommended, minimum v18)
* **npm** (v9+)
* **Java Development Kit (JDK 17)** (required for Android builds)
* **Android Studio Jellyfish or higher** with Android SDK 34 (for Android native apps)

### 13.2 Environment Variables Configuration
Create a `.env` file in the `backend/` directory based on [`backend/.env.example`](file:///d:/Dindeck/backend/.env.example):
```env
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/dinedeck_prod?schema=public
REDIS_URL=redis://localhost:6380
JWT_SECRET=dinedeck_super_secret_jwt_key_2026_india_production
JWT_REFRESH_SECRET=dinedeck_super_secret_refresh_key_2026_india_production
CORS_ORIGIN=*
```

### 13.3 Launching with Docker Compose (Recommended)
From the repository root `D:\Dindeck`:
```bash
# 1. Start PostgreSQL 16, Redis 7, and Backend
docker compose up -d --build

# 2. Verify container statuses
docker ps
```

| Service | Container Name | Host Port | Internal Port | Healthcheck |
| :--- | :--- | :---: | :---: | :--- |
| **Backend API** | `dinedeck-backend` | `8080` | `8080` | `GET http://localhost:8080/health` |
| **PostgreSQL 16** | `dinedeck-postgres` | `5433` | `5432` | `pg_isready -U postgres -d dinedeck_prod` |
| **Redis 7** | `dinedeck-redis` | `6380` | `6379` | `redis-cli ping` |

*(Note: Host ports are deliberately mapped to `5433` and `6380` to prevent collisions with existing system installations).*

### 13.4 Running Applications Locally in Development Mode

#### Step 1: Initialize Database & Run Seed
```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

#### Step 2: Launch the Web Applications
Use the provided Windows batch launcher from repository root:
```cmd
START_DINEDECK_WEB.bat
```
Or start each frontend manually in separate terminals:
```bash
# 1. Customer Web (Port 5173)
cd customer-web && npm install && npm run dev

# 2. Partner & KDS Web (Port 5174)
cd partner-web && npm install && npm run dev

# 3. SuperAdmin Control Center Web (Port 5175)
cd admin-web && npm install && npm run dev
```

#### Step 3: Run Native Android Applications
Open `D:\Dindeck` in Android Studio. Ensure the emulator can reach the host machine via `10.0.2.2:8080` (configured in `buildConfigField`).
```bash
# Build Customer App
./gradlew :app:assembleDebug

# Build Partner App
./gradlew :partner-app:assembleDebug

# Build Admin App
./gradlew :admin-app:assembleDebug
```

---

## Section 14: Current Implementation Status

| Feature / Domain | Codebase Verification Status | Evidence in Codebase |
| :--- | :---: | :--- |
| **Indian GST & Tax Math** | **Fully Implemented** | `IndiaBillingEngine.calculateBill` in `backend/src/common/money.ts` verified with `Decimal.js`. |
| **Idempotent Order Intake** | **Fully Implemented** | `Order.idempotencyKey` unique check in `backend/src/modules/orders/orders.controller.ts`. |
| **KDS Multi-Station Routing** | **Fully Implemented** | `kdsService.acceptOrder` decomposes items into station KOT tickets in `backend/src/modules/kds/*`. |
| **Item-Level KDS Decisions**| **Fully Implemented** | `POST /api/kds/orders/:id/partial-decide` in `kds.controller.ts` with individual acceptance flags. |
| **Table Steward Round-Robin**| **Fully Implemented**| `autoAssignWaiterForTable` in `backend/src/modules/tables/tables.controller.ts`. |
| **Cashier Shifts & Variance**| **Fully Implemented**| `openShift`, `recordCashMovement`, `closeShift` in `backend/src/modules/billing/billing.service.ts`. |
| **Granular IAM Engine** | **Fully Implemented** | 91 atomic permissions and `UserPermissionOverride` in `backend/src/modules/iam/*`. |
| **SuperAdmin Killswitch** | **Fully Implemented** | `POST /api/admin/system/killswitch` in `admin.controller.ts`. |
| **Diner 4-Digit PIN Auth** | **Fully Implemented** | `POST /api/auth/pin-login` with `bcrypt` in `auth.controller.ts`. |
| **Customer Web PWA** | **Fully Implemented** | Dual-mode menu, dish customizer, live tracking in `customer-web/src/*`. |
| **Partner Web KDS & POS** | **Fully Implemented** | KDS board, cashier billing, table floor plan, staff IAM in `partner-web/src/*`. |
| **Admin Web Governance** | **Fully Implemented** | 20 command screens, global Ctrl+K search in `admin-web/src/*`. |
| **Native Android Apps** | **Fully Implemented** | 3 native Kotlin Compose applications in `:app`, `:partner-app`, `:admin-app`. |
| **Direct Hardware Printing** | **Partially Implemented** | Web-based thermal slip generation in `partner-web/src/utils/thermalPrinter.ts`; raw ESC/POS USB socket transport not yet implemented. |
| **Real Payment Gateway** | **Configured / Sandbox** | `SandboxPaymentProvider` active; Razorpay/Cashfree webhook signature verified. |

---

## Section 15: Bugs, Risks, and Technical Debt

### 15.1 Architectural Risks
1. **In-Memory Table Steward Allocation Registry:**
   * *Evidence:* `tableWaiterAssignments = new Map<string, TableWaiterAssignment>()` in `backend/src/modules/tables/tables.controller.ts`.
   * *Impact:* If the backend container restarts, in-memory table-to-waiter assignments are reset to system defaults.
   * *Remediation:* Persist table-waiter assignments in the database or Redis cache (`SET table:<id>:waiter <waiterId>`).

2. **In-Memory Email OTP Verification Store:**
   * *Evidence:* `emailOtpStore = new Map<string, { otp: string; expiresAt: number }>()` in `backend/src/modules/auth/auth.controller.ts`.
   * *Impact:* In a multi-instance backend deployment, OTP generation on Instance A will fail verification if the user hits Instance B.
   * *Remediation:* Migrate OTP storage to Redis using native TTL keys (`SETEX otp:<email> 300 <otp>`).

3. **Fallback Passwords in Development Login:**
   * *Evidence:* `password === 'Dinedeck@2026' || password === 'Password123!'` in `backend/src/modules/auth/auth.controller.ts`.
   * *Impact:* Security bypass allowing universal login in non-production environments if left unchecked.
   * *Remediation:* Gate master test passwords strictly behind `process.env.NODE_ENV !== 'production'`.

4. **ESC/POS Thermal Printing Hardware Integration:**
   * *Evidence:* Receipt printing currently relies on browser printing or formatting strings in `partner-web/src/utils/thermalPrinter.ts`.
   * *Impact:* High-volume cashiers require instantaneous 1-click silent printing without triggering standard browser print dialogs.
   * *Remediation:* Implement a lightweight local WebSocket print sidecar service communicating over raw TCP socket port 9100 to network thermal printers.

---

## Section 16: Recommended Architecture & Future Roadmap

```
+-----------------------------------------------------------------------------------------------+
|                            RECOMMENDED PRODUCTION TARGET ARCHITECTURE                         |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|   +-----------------------+     +-----------------------+     +---------------------------+   |
|   |  Customer Mobile PWA  |     |  Partner POS & KDS    |     |  Admin Control Center     |   |
|   |  & Android App        |     |  Web & Android App    |     |  Web & Android App        |   |
|   +-----------+-----------+     +-----------+-----------+     +-------------+-------------+   |
|               |                             |                               |                 |
|               +----------------------+      |      +------------------------+                 |
|                                      |      |      |                                          |
|                                      v      v      v                                          |
|                       +---------------------------------------------+                         |
|                       |  Cloudflare / Envoy API Gateway & Rate Limit |                         |
|                       +----------------------+----------------------+                         |
|                                              |                                                |
|                                              v                                                |
|                       +---------------------------------------------+                         |
|                       |     Fastify Micro-Monorepo Service Nodes    |                         |
|                       |   - Authed JWT REST Engine                  |                         |
|                       |   - Distributed WebSocket Clustered Gateway |                         |
|                       +-------------+-----------------+-------------+                         |
|                                     |                 |                                       |
|                       +-------------+                 +-------------+                         |
|                       v                                             v                         |
|         +---------------------------+                 +---------------------------+           |
|         | PostgreSQL 16 HA Cluster  |                 | Redis 7 Sentinel Cluster  |           |
|         | - Primary (Read/Write)    |                 | - Realtime Pub/Sub Bus    |           |
|         | - Read Replicas           |                 | - Session & OTP Caching   |           |
|         +---------------------------+                 +---------------------------+           |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

### Essential Immediate Upgrades
1. **Redis Caching for Transient Data:** Transition `emailOtpStore` and `tableWaiterAssignments` to Redis to ensure stateless horizontal scaling.
2. **Production Payment Gateway Credentials:** Configure Razorpay production API keys in environment variables to replace `SandboxPaymentProvider`.
3. **Hardened Production Password Validation:** Restrict fallback test credentials exclusively to local test executions.

### Mid-Term Planned Roadmap
1. **Offline-Resilient POS Windows Desktop Client:** Package the partner application with SQLite offline queuing to permit order taking and bill printing during internet dropouts.
2. **Direct ESC/POS Hardware Printing:** Network printer integration over TCP port 9100.
3. **Inventory Depletion Engine:** Automatically deduct raw ingredient quantities upon KOT generation based on standardized recipe bills of materials (BOM).

---

## Section 17: Complete File Reference

| File Path | Functional Purpose | Key Components / Routes | Connected Services |
| :--- | :--- | :--- | :--- |
| [`backend/src/index.ts`](file:///d:/Dindeck/backend/src/index.ts) | Server entry point | `buildServer`, `start`, `/health`, `/ws` | Fastify, Postgres, Redis, WebSockets |
| [`backend/src/common/money.ts`](file:///d:/Dindeck/backend/src/common/money.ts) | Financial calculations | `Money`, `IndiaBillingEngine.calculateBill` | Decimal.js |
| [`backend/src/realtime/websocket.ts`](file:///d:/Dindeck/backend/src/realtime/websocket.ts) | Real-time broker | `RealtimeHub`, `emit`, `dispatchLocalEvent` | ws, RedisRealtime |
| [`backend/src/realtime/redis.ts`](file:///d:/Dindeck/backend/src/realtime/redis.ts) | Redis Pub/Sub client | `publishEvent`, `onMessage`, `setCache` | ioredis |
| [`backend/src/modules/orders/orders.controller.ts`](file:///d:/Dindeck/backend/src/modules/orders/orders.controller.ts) | Order intake | `POST /api/orders`, `GET /api/orders` | Prisma, RealtimeHub, KDS |
| [`backend/src/modules/kds/kds.controller.ts`](file:///d:/Dindeck/backend/src/modules/kds/kds.controller.ts) | KDS queue and status | `GET /api/kds/queue`, `POST /orders/:id/accept` | kdsService, iamService |
| [`backend/src/modules/billing/billing.controller.ts`](file:///d:/Dindeck/backend/src/modules/billing/billing.controller.ts) | Billing & shifts | `GET /sessions`, `POST /bills/:id/settle` | billingService, iamService |
| [`backend/src/modules/iam/iam.service.ts`](file:///d:/Dindeck/backend/src/modules/iam/iam.service.ts) | RBAC engine | `authorize`, `getEffectivePermissions` | Prisma, AuditLog |
| [`backend/src/modules/admin/admin.controller.ts`](file:///d:/Dindeck/backend/src/modules/admin/admin.controller.ts) | Platform governance | `/overview`, `/search`, `/killswitch`, `/refund` | controlCenterService |
| [`customer-web/src/App.tsx`](file:///d:/Dindeck/customer-web/src/App.tsx) | Customer Web entry | `CustomerMain`, `CustomerProvider` | React, CustomerContext |
| [`customer-web/src/services/api.ts`](file:///d:/Dindeck/customer-web/src/services/api.ts) | Customer REST client | `validateQrCode`, `placeOrder`, `loginWithPin` | Backend REST API |
| [`partner-web/src/App.tsx`](file:///d:/Dindeck/partner-web/src/App.tsx) | Partner Web entry | `Dashboard`, `KitchenKDS`, `BillingCashier` | React, AuthContext, WebSockets |
| [`partner-web/src/services/api.ts`](file:///d:/Dindeck/partner-web/src/services/api.ts) | Partner REST client | `fetchOrders`, `acceptKdsOrder`, `settleBill` | Backend REST API |
| [`admin-web/src/App.tsx`](file:///d:/Dindeck/admin-web/src/App.tsx) | Admin Web entry | `AdminOverview`, `AdminRestaurants`, `AdminFinance` | React, AdminAuthContext |
| [`admin-web/src/services/api.ts`](file:///d:/Dindeck/admin-web/src/services/api.ts) | Admin REST client | `fetchOverview`, `updateRestaurantProfile` | Backend Admin API |
| [`app/src/main/java/com/dinedeck/app/MainActivity.kt`](file:///d:/Dindeck/app/src/main/java/com/dinedeck/app/MainActivity.kt) | Customer Android entry | Compose `NavGraph`, Material 3 theme | Android Jetpack, Hilt |
| [`partner-app/.../PartnerScreens.kt`](file:///d:/Dindeck/partner-app/src/main/java/com/dinedeck/partner/presentation/PartnerScreens.kt) | Partner Android UI | `KitchenOrdersView`, `DiningFloorTablesView` | Compose, PartnerViewModel |
| [`admin-app/.../ControlCenterScreens.kt`](file:///d:/Dindeck/admin-app/src/main/java/com/dinedeck/admin/presentation/ControlCenterScreens.kt) | Admin Android UI | `OverviewScreen`, `RestaurantsScreen`, `FinanceScreen` | Compose, ViewModel |

---

## Section 18: Simple Explanation for a Beginner

To understand DineDeck without getting lost in technical terminology, think of it as a **digital nervous system for a busy restaurant**:

1. **What happens when the application starts?**  
   The Fastify backend connects to the PostgreSQL database and Redis message broker. It pre-loads the 91 security rules and opens a real-time WebSocket channel. The three web interfaces and mobile apps connect to this central hub.
2. **How do the different applications communicate?**  
   They talk in two ways:
   * **REST API:** For submitting actions like placing an order or settling a bill.
   * **WebSockets:** A persistent connection where the backend pushes instant notifications (like an audible chime in the kitchen when a customer orders).
3. **Where is data stored?**  
   Permanent records (menus, orders, user accounts, bills, and tax logs) live in PostgreSQL 16. Fast-moving real-time events pass through Redis 7.
4. **How does an order move through the system?**  
   A diner scans the table QR $\rightarrow$ picks food $\rightarrow$ submits the order. The order appears on the kitchen screen. As the chef cooks and delivers, status changes from `PLACED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `SERVED` $\rightarrow$ `PAID`.
5. **How does the kitchen receive and process orders?**  
   The kitchen uses the Kitchen Display System (KDS). Instead of one long paper slip, items are split onto digital screens for each cooking station (e.g., Tandoor items go to the tandoor chef; drinks go to the bar).
6. **How does the customer see updates?**  
   The customer's phone stays connected to the WebSocket. The moment the chef clicks a button, the customer's phone updates with zero page reloads.
7. **Which component controls each important operation?**  
   The backend server has absolute authority. Frontend screens only display what the backend calculates. All money and GST calculations happen on the server via `money.ts`.
8. **What happens when an operation fails?**  
   The database cancels the operation completely (using database transactions). If an order or payment fails midway, no partial data is saved.
9. **Which services must be running for the project to work?**  
   PostgreSQL 16 (port 5433), Redis 7 (port 6380), and the Fastify backend (port 8080).
10. **What are the most important things to know before modifying code?**  
    * Never use standard JavaScript `Math.round` or binary floats for money; use `money.ts`.
    * Every state change must emit a WebSocket event through `realtimeHub.emit`.
    * Check user permissions using `iamService.authorize` before executing mutations.

---

## Section 19: Glossary

* **KDS (Kitchen Display System):** A digital touchscreen replacement for paper kitchen printers.
* **KOT (Kitchen Order Ticket):** An individual ticket specifying dishes to prepare, targeted to a specific station.
* **86 / 86ing:** Restaurant industry term meaning an item is out of stock.
* **Expo / Pass Station:** The kitchen expediting counter where the head chef inspects plated dishes before waiters deliver them.
* **Re-Fire:** Immediately recooking a dish due to customer dissatisfaction or mistake.
* **Idempotency Key:** A unique token sent with an order request to ensure that network retries do not charge or duplicate an order.
* **CGST & SGST:** Central Goods and Services Tax and State Goods and Services Tax (standard 2.5% + 2.5% = 5.0% for Indian restaurants).
* **GOV (Gross Order Value):** The total value of all customer orders processed through the platform before platform deductions.
* **RBAC & IAM:** Role-Based Access Control and Identity & Access Management.
* **Float (Cash Drawer):** The baseline amount of physical cash in the cashier drawer at the beginning of a shift.
* **Killswitch:** A centralized administrative emergency control to instantly halt operations.

---

## Section 20: Questions Requiring Further Investigation

1. **Production SMS Gateway Integration:**  
   * *Status:* The current system uses free Email OTP for customer verification.
   * *Investigation Needed:* If physical SMS delivery is required in production, which Indian DLT-compliant SMS provider (e.g., MSG91, Twilio India) will be integrated?
2. **Physical Thermal Printer Network Deployment:**  
   * *Status:* Web printing formats bills cleanly; silent network printing is pending.
   * *Investigation Needed:* Does the target restaurant venue use Ethernet/LAN thermal printers (Port 9100) or USB/Bluetooth desktop printers?
3. **Automated Multi-Tenant Bank Payouts:**  
   * *Status:* Settlements are generated and payout reference numbers are logged manually.
   * *Investigation Needed:* Should the platform integrate RazorpayX or Cashfree Payout APIs to execute automated direct bank account NEFT/IMPS transfers to restaurant accounts?
