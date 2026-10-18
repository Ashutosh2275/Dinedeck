# DineDeck — Commercial Windows Desktop Applications Guide

This document describes the architecture, deployment, hardware thermal printing integration, and operation of the commercial Windows Desktop applications for **DineDeck**.

---

## 1. Overview & Platform Architecture

DineDeck provides native, commercial-grade Windows desktop applications that achieve **100% feature parity** with the existing Web and Android operations suite while reusing the centralized backend, database, and real-time synchronization infrastructure:

- **DineDeck Partner POS & KDS** (`desktop-partner/`):
  - Front-of-house Cashier POS & Table Management
  - Back-of-house Kitchen Display System (KDS) with station routing (Tandoor, Curry, Chinese/Continental, Bakery, Bar)
  - Native ESC/POS 80mm/58mm silent thermal receipt & KOT printing
  - Shift management, steward notifications, and bill settlement
- **DineDeck Control Center** (`desktop-admin/`):
  - Multi-tenant restaurant and franchise governance & onboarding
  - Platform IAM, user roles, and granular branch permission overrides
  - Financial auditing, commission reports, batch settlement payouts
  - Emergency maintenance mode & platform payment killswitch

```
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
│                           WINDOWS COMMERCIAL DESKTOP SUITE                               │
│  ┌─────────────────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   DineDeck Partner POS & KDS (Desktop)  │  │   DineDeck Control Center (Desktop)    │ │
│  │   - Electron 34 + React 18 + Tailwind   │  │   - Electron 34 + React 18 + Tailwind  │ │
│  │   - Native Hardware Thermal Print IPC   │  │   - Multi-tenant Platform Governance   │ │
│  │   - KDS Station Filtering & Audio Alerts│  │   - Financial Batch Settlement Engine  │ │
│  └─────────────────────────────────────────┘  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Production Windows Installers

Standardized, standalone NSIS `.exe` installers have been compiled and generated for Windows (x64):

| Application | Installer Location | Default Install Directory | Binary Executable |
| :--- | :--- | :--- | :--- |
| **DineDeck Partner POS & KDS** | `desktop-partner/dist-installer/DineDeck-Partner-Setup-1.0.0.exe` | `C:\DineDeckPartner\` | `DineDeck Partner POS & KDS.exe` |
| **DineDeck Control Center** | `desktop-admin/dist-installer/DineDeck-SuperAdmin-Setup-1.0.0.exe` | `C:\DineDeckAdmin\` | `DineDeck Control Center.exe` |

### Installation Features:
- Silent or interactive graphical installation wizard.
- Automatically creates Desktop shortcuts and Start Menu entries.
- Includes a clean uninstaller:
  - `C:\DineDeckPartner\Uninstall DineDeck Partner POS & KDS.exe`
  - `C:\DineDeckAdmin\Uninstall DineDeck Control Center.exe`

---

## 3. Quick Start & Launcher Options

### Option A: One-Click Launcher (Recommended)
Double-click or run from PowerShell:
```cmd
START_DINEDECK_DESKTOP.bat
```
This launcher:
1. Verifies that the Fastify backend is listening on port `8080` (starts it if inactive).
2. Verifies local PostgreSQL and Redis connections.
3. Automatically launches both installed desktop applications (`C:\DineDeckPartner` & `C:\DineDeckAdmin`).

### Option B: Running from Source / Development Mode
To run either desktop application directly in development mode:

```bash
# Partner POS & KDS
cd desktop-partner
npm install
npm start

# Super Admin Control Center
cd desktop-admin
npm install
npm start
```

### Option C: Recompiling the Installers
To rebuild the production web bundles and re-package the NSIS installers:

```bash
# 1. Build Web Distributions
cd partner-web && npm run build && cd ..
cd admin-web && npm run build && cd ..

# 2. Package Windows Installers
cd desktop-partner && npm run dist:win && cd ..
cd desktop-admin && npm run dist:win && cd ..
```

---

## 4. Hardware Thermal Printer Integration

The desktop suite integrates native ESC/POS thermal printing through Electron's main process printing APIs, eliminating browser print dialogs in high-speed restaurant cashier environments:

### Architecture:
1. **Preload Bridge** (`preload.js`):
   Exposes secure IPC wrappers via context isolation:
   ```javascript
   window.dinedeckDesktop = {
     isDesktop: true,
     getPrinters: () => ipcRenderer.invoke('printer:get-printers'),
     printReceipt: (htmlContent, options) => ipcRenderer.invoke('printer:print-receipt', { htmlContent, options })
   };
   ```
2. **Thermal Print Engine** (`partner-web/src/utils/thermalPrinter.ts`):
   Detects `window.dinedeckDesktop` and routes directly to silent thermal printing:
   ```typescript
   if (window.dinedeckDesktop?.printReceipt) {
     return await window.dinedeckDesktop.printReceipt(html, {
       silent: true,
       deviceName: selectedPrinterName
     });
   }
   ```
3. **Background Print Spooler** (`desktop-partner/main.js`):
   Spawns an offscreen renderer window, renders the raw receipt HTML, queries the Windows Print Spooler, and dispatches the job silently with zero operator intervention.

---

## 5. End-to-End Workflow Verification

The entire operational lifecycle was verified with live backend transactions across the desktop applications:

```
[CUSTOMER ORDER CREATED]
       │
       ▼
[KDS ACCEPT] ───────► Decomposes items into Station KOTs; State: PREPARING
       │
       ▼
[EXPO PASS] ────────► Kitchen expeditor aggregates tickets; State: READY
       │
       ▼
[MARK SERVED] ──────► Waiter delivers food to table; State: SERVED
       │
       ▼
[BILL SETTLED] ─────► Cashier collects payment; State: PAID (Triggers Silent Thermal Receipt)
       │
       ▼
[ADMIN SETTLEMENT] ─► Super Admin batch aggregates revenue, commissions, and payout ledger
```

### Verified Test Credentials:
- **Super Admin**: `admin@dinedeck.in` / `Admin@123`
- **Partner Owner (Punjab Grill)**: `owner.punjab@dinedeck.in` / `Partner@123`
- **Customer QR Session**: Table 1 (`T1-PUNJAB`), Session valid for 90 minutes
