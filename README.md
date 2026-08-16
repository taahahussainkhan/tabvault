# TabVault ⚡
### Ultra-Fast, Cross-Platform File & Universal Clipboard Hub
**Local Wi-Fi P2P (WebRTC DataChannels) $\rightarrow$ Cloud Relay Fallback (WebSockets + S3/R2 E2EE)**

---

## 🌟 Features

- **⚡ Hybrid Route-Adaptive Architecture**:
  - **Route A (Local Wi-Fi P2P)**: Direct WebRTC DataChannel connection over LAN host ICE candidates. Transfers at gigabit Wi-Fi speeds ($50\text{--}100\text{MB/s}+$) with **$0 cloud bandwidth**.
  - **Route B (Cloud Relay Fallback)**: Automatically engages when devices are on cellular 5G, behind firewalls, or remote. Instant WebSocket broadcast for clipboard & Presigned S3/R2 upload for large files.
- **🔐 Zero-Knowledge End-to-End Encryption (E2EE)**:
  - Hardware-accelerated client-side encryption using **Web Crypto API (`crypto.subtle`)**.
  - **AES-256-GCM** chunked encryption with deterministic nonces.
  - **ECDH (P-256)** key exchange and **HKDF-SHA256** session key derivation.
  - S3 and WebSocket relay servers only handle encrypted dumb pipes and cannot read any file or clipboard content.
- **📋 Universal Clipboard**:
  - Copy on Mac / Windows $\rightarrow$ instantly syncs to phone or browser with 1-tap copy.
- **📱 Web-First & PWA**:
  - Works on macOS, Windows, Linux, iOS, Android, and ChromeOS with zero installation.
  - Installable PWA with Web Share Target support.
- **☁️ AWS 12-Month Free Tier & MongoDB Atlas Ready**:
  - CloudFront CDN + S3 for frontend ($0.00).
  - EC2 `t3.micro`/`t4g.small` or container for Fastify signaling ($0.00).
  - 24-hour auto-expiring S3 lifecycle rule ($0.00).
  - MongoDB Atlas M0 free tier for vault pairing and metadata.

---

## 📦 Monorepo Structure

```
tabvault/
├── packages/
│   ├── core/      # @tabvault/core: Shared WebCrypto, WebRTC chunk streamer, wire protocols, Zod schemas
│   ├── server/    # @tabvault/server: Fastify + WebSockets + MongoDB + AWS S3 Presigned Relay
│   └── web/       # @tabvault/web: Vite + React 19 + PWA + Glassmorphic Design System
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Environment
```bash
# Start all packages (Core, Server, Web) in dev mode
npm run dev
```

---

## 📄 License
MIT License. Created by Taaha Hussain Khan.
