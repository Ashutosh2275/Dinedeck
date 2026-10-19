# Security Policy & Governance — DineDeck Ecosystem

## 1. Security Architecture & Threat Model

DineDeck operates a multi-tenant restaurant management and dining ecosystem across Customer, Partner, and Super Admin tiers.

### Fundamental Security Reality
No distributed mobile, desktop, or web client can be made completely impossible to reverse engineer or modify. Client-side obfuscation (R8/ProGuard) and anti-tampering signals are defense-in-depth measures. **The primary security boundary is the backend server.**

- All access decisions, tenant isolation boundaries, and granular IAM permissions are strictly enforced on backend endpoints.
- Client applications are never trusted for prices, discounts, taxes, order statuses, roles, or payment settlements.
- All monetary mutations execute inside atomic database transactions (`prisma.$transaction`) with `Decimal.js` precision.

---

## 2. Supported Versions

| Application / Component | Supported Release Line | Security Status |
| :--- | :--- | :--- |
| **Backend API Daemon** | `v1.x` (main branch) | Actively Supported |
| **Customer Android** | `v1.x` (Target SDK 34) | Actively Supported |
| **Partner Android** | `v1.x` (Target SDK 34) | Actively Supported |
| **Admin Android** | `v1.x` (Target SDK 34) | Actively Supported |
| **Partner & Admin Windows Desktop** | `v1.x` | Actively Supported |
| **Customer, Partner & Admin Web** | `v1.x` | Actively Supported |

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability, please follow our coordinated disclosure policy:

1. **Do not create a public GitHub issue.**
2. Send a detailed report directly to the authoritative repository owner: **`security@dinedeck.in`** or open a [Private Vulnerability Report](https://github.com/Ashutosh2275/Dinedeck/security/advisories/new) via GitHub Security Advisories.
3. Include detailed steps to reproduce, affected endpoints, proof-of-concept payloads, and risk assessment.
4. The security maintainers will respond within **24 hours** with an acknowledgment and mitigation timeline.

---

## 4. Repository Access & Release Controls

To prevent unauthorized tampering and supply chain attacks:

1. **Default Branch Protection:** Direct pushes to `main` must require pull requests, passing CI status checks, and approval from authorized maintainers defined in [CODEOWNERS](file:///d:/Dindeck/.github/CODEOWNERS).
2. **Least Privilege CI/CD:** GitHub Actions workflows run with explicit read-only token permissions (`permissions: contents: read`).
3. **Protected Signing Credentials:** Android upload keystores, Windows code-signing certificates, and production database credentials must never be committed to source code; they must be managed via GitHub Protected Secrets and injected as environment variables at build time.
4. **Release Provenance:** Only signed artifacts built from authorized, reviewed commits on the protected `main` branch qualify for production deployment.
