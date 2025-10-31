# React + TypeScript + Vite

## DOPE Cards — NFC-powered rewards with Web3 wallets

### What is this?

DOPE Cards is a mobile-first web app with native (Capacitor) builds that lets users tap an NFC “Dope Card” to instantly claim rewards and manage wallets. It uses Turnkey’s embedded wallets for secure auth and key management, supports deep links for referrals and claims, and provides a clean, minimal UX for demos and real-world pilots.

### Why it’s cool for judges

- **Frictionless onboarding**: One-tap auth via Turnkey; no seed phrases.
- **NFC claims**: Tap a physical card to redeem on-device using the phone’s NFC.
- **Multi-chain ready**: Surfaces EVM, Solana, and Movement addresses in Settings.
- **Deep links**: `dope.cards/refer/:code` and `dope.cards/claim/:id` work on web and native.
- **Production-minded**: Uses a backend JWT model and caches `user_me` for fast UX.

---

## Demo Flow (2 minutes)

1. Open the app. If logged out, tap “Continue” to sign in with Turnkey.
2. You land on the dashboard:
   - Open the live campaign
   - See “Payments” (coming soon)
   - Tap “Redeem Rewards” to scan an NFC card and claim
3. Try a deep link:
   - Referral: open `/refer/REFERRAL_CODE`
   - Claim: open `/claim/BASE64_AUTH_CODE`
4. Open Settings:
   - Copy wallet addresses (Movement/Solana/EVM)
   - Export wallet (Turnkey flow)
   - Delete account request and Logout

---

## Core Features

- Login via Turnkey embedded wallets (`@turnkey/react-wallet-kit`)
- Backend JWT hydration and persistence via Capacitor Preferences/localStorage
- Dashboard with Campaign, Payments (placeholder), and Redeem
- NFC scan and claim (Android/iOS) using `@exxili/capacitor-nfc`
- Deep link listener for referral and claim actions
- Settings page to copy addresses, export wallet, logout, delete request
- Responsive, mobile-first UI (Tailwind + shadcn-style primitives)

---

## Architecture Overview

- Frontend: React 19 + Vite, TypeScript, Tailwind (v4), React Router 7
- Native wrapper: Capacitor 7 (Android/iOS targets)
- Wallet/auth: Turnkey provider for login and embedded wallet management
- API layer: `src/api/dopeApi.ts` reads `VITE_DOPE_API_BASE` and adjusts for mobile (localhost→10.0.2.2 on Android)
- Local storage: Auth token and user cache via Capacitor Preferences + localStorage
- Server stub: `server/index.js` includes example auth exchange routes and protected endpoint placeholder

Key flows:

- Routing and auth gating: `src/RootRouter.tsx`
- Auth provider and JWT save callback: `src/providers.tsx`
- Dashboard UI: `src/landing.tsx` (+ components in `src/components`)
- NFC redeem: `src/components/RedeemCard.tsx`
- Deep links: `src/native/DeepLinkListener.tsx`
- Settings: `src/components/SettingsPage.tsx`

---

## Screens and Interactions

- Login (`NewAuthLanding`): minimal screen to kick off Turnkey login.
- Dashboard (`landing.tsx`):
  - CampaignCard: open campaign webview (hook available at `native/campaignWebview.ts`)
  - PaymentsCard: placeholder
  - RedeemCard: tap to start NFC scan and claim
- Settings (`SettingsPage`): copy addresses, export wallet, delete account, logout

---

## Environment variables

Create a `.env` (or `.env.local`) with the following as needed:

```
VITE_ORGANIZATION_ID=...                # Turnkey organization ID
VITE_AUTH_PROXY_CONFIG_ID=...           # Turnkey auth proxy config ID
VITE_PUBLIC_GOOGLE_CLIENT_ID=...        # Optional: Google OAuth client id
VITE_PUBLIC_APPLE_CLIENT_ID=...         # Optional: Apple Sign-in client id

# Backend base URLs (frontend)
VITE_DOPE_API_BASE=https://api.dope.cards
# Optional mobile override; otherwise localhost is auto-mapped to 10.0.2.2 on Android
VITE_DOPE_API_BASE_MOBILE=http://10.0.2.2:4000

# Server (dev only; for server/index.js)
APP_JWT_SECRET=dev-secret
PORT=4000
```

---

## Getting started (Web)

Prereqs: Node 18+, pnpm/npm, modern browser

```
pnpm install   # or npm install

# Run frontend
pnpm dev       # or npm run dev (Vite on http://localhost:5173)

# (Optional) Run the demo API stub in another terminal
pnpm api       # or npm run api (Express on http://localhost:4000)
```

Update `VITE_DOPE_API_BASE` to match the backend you are using. For the included server stub, set it to `http://localhost:4000` (web) and use `VITE_DOPE_API_BASE_MOBILE` for device builds if needed.

Build for production:

```
pnpm build     # or npm run build
pnpm preview   # or npm run preview
```

---

## Running on Mobile (Capacitor)

Prereqs: Xcode (iOS), Android Studio (Android), Java SDK, CocoaPods

1. Build the web assets

```
pnpm build
```

2. Sync Capacitor

```
npx cap sync
```

3. iOS

```
npx cap open ios   # opens Xcode
# Select a simulator or device and Run
```

4. Android

```
npx cap open android   # opens Android Studio
# Select an emulator or device and Run
```

Notes:

- On Android emulators, `localhost` is not accessible from the webview; `src/api/dopeApi.ts` auto-rewrites `localhost` to `10.0.2.2` when running natively.
- Ensure `VITE_DOPE_API_BASE_MOBILE` points to a reachable backend from the device.

---

## How NFC Claim works

1. User taps “Redeem Rewards”
2. App checks NFC support, starts scanning (Android shows a bottom sheet)
3. On read, payload is normalized to a string `authorization`
4. App loads the app JWT from Preferences/localStorage, calls `POST /claim` with `{ authorization }`
5. Displays success/error modal

Code reference: `src/components/RedeemCard.tsx`

---

## How Deep Links work

- App parses incoming URLs for:
  - `/refer/:code` → calls `POST /referral/redeem`
  - `/claim/:id` → calls `POST /claim` with `authorization`
- Works both for cold starts (browser) and `appUrlOpen` (native)

Code reference: `src/native/DeepLinkListener.tsx`

---

## Auth model

- Turnkey Embedded Wallets handle user login and key custody.
- On auth success, we save a session token (`app_jwt` concept) to Preferences/localStorage via `saveToken`.
- Router gates access based on token presence; landing screen caches `user_me` for snappy Settings UX.

Key files:

- `src/providers.tsx` — Turnkey provider config and auth callback
- `src/RootRouter.tsx` — route guards and JWT hydration
- `src/lib/authStorage.ts` — token and user cache utilities

---

## Included demo server (optional)

Location: `server/index.js`

- `POST /api/auth/exchange` — exchange a valid Turnkey session for an app JWT (stub)
- `POST /api/auth/evm-exchange` — sign-and-verify example for EVM address -> app JWT
- `POST /api/wallets/export` — placeholder protected route

Run it with:

```
pnpm api
```

This is a lightweight stub for demos; in production you would implement user upsert, wallet provisioning, and real claim/referral logic.

---

## Tech Stack

- React 19, TypeScript, Vite 7
- Tailwind CSS 4
- React Router 7
- Capacitor 7 (Android/iOS), `@exxili/capacitor-nfc`
- Turnkey SDKs (`@turnkey/react-wallet-kit`, `@turnkey/sdk-*`)
- viem (EVM utils), axios

---

## Limitations and Next Steps

- Payments card is a placeholder UI.
- Demo server routes are minimal; production backends should enforce policy and auditing.
- Real campaign webview and wallet provisioning hooks are provided but stubbed.

Roadmap ideas:

- Campaign engine with milestones and on-chain attestations
- Rich referral analytics and anti-fraud
- Native wallet export flows and key escrow policies

---

## Credits

Built with ❤️ for the hackathon.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
