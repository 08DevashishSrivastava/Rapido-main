# RidePass Pro — Smart Ride Booking & Subscription Platform

**Developer & Architect**: Devashish Srivastava  
**Technology Stack**: Node.js, Express 5, MongoDB / Mongoose, React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts

RidePass Pro is a high-performance urban mobility and subscription platform built upon an existing Rapido-style ride booking engine. It introduces an enterprise-grade commuter pass ecosystem (RidePass Mini, RidePass Student, RidePass Pro) that eliminates surge pricing, caps per-ride fares, automates excess fare billing, and safeguards allowance deductions with an idempotent ledger and atomic concurrency controls.

---

## 1. Project Architecture

```
Rapido-main/
├── package.json                        # Root workspace scripts (start, dev, test)
├── README.md                           # Master documentation & run guide
└── Rapido-main/
    ├── backend/                        # Express API & MongoDB Backend
    │   ├── .env                        # Local runtime environment variables
    │   ├── .env.example                # Documented configuration template
    │   ├── app.js                      # Express application, CORS, error handling
    │   ├── server.js                   # HTTP server & MongoDB entry point (Port 4000)
    │   ├── db/
    │   │   └── db.js                   # Mongoose connection & lifecycle handlers
    │   ├── models/
    │   │   ├── user.model.js           # Passenger model with bcrypt & JWT
    │   │   ├── captain.model.js        # Driver model with vehicle & verification specs
    │   │   ├── blacklistToken.model.js # Expiring token blacklist for secure logout
    │   │   ├── ride.model.js           # Ride model with OTP, fare breakdown, states
    │   │   ├── subscriptionPlan.model.js # RidePass plans (Mini, Student, Pro)
    │   │   ├── userSubscription.model.js # User active subscriptions & allowances
    │   │   ├── subscriptionLedger.model.js # Cryptographic/idempotent debit & credit ledger
    │   │   ├── payment.model.js        # Transaction order & webhook verification
    │   │   └── complaint.model.js      # Support tickets & ride issue reporting
    │   ├── services/
    │   │   ├── user.service.js         # Passenger account management
    │   │   ├── captain.service.js      # Driver creation with optional GPS coords
    │   │   ├── ride.service.js         # Fare estimation, dispatch, OTP verification
    │   │   ├── subscription.service.js # RidePass eligibility, atomic reservation/reversal
    │   │   └── payment.service.js      # Test/demo payment processing & signature verification
    │   ├── controllers/
    │   │   ├── user.controller.js
    │   │   ├── captain.controller.js
    │   │   ├── ride.controller.js
    │   │   ├── subscription.controller.js
    │   │   ├── payment.controller.js
    │   │   ├── complaint.controller.js
    │   │   └── admin.controller.js
    │   ├── middlewares/
    │   │   └── auth.middleware.js      # authUser, authCaptain, authAdmin middlewares
    │   ├── routes/
    │   │   ├── user.routes.js          # /users
    │   │   ├── captain.routes.js       # /captains
    │   │   ├── ride.routes.js          # /rides
    │   │   ├── subscription.routes.js  # /subscriptions
    │   │   ├── payment.routes.js       # /payments
    │   │   ├── complaint.routes.js     # /complaints
    │   │   └── admin.routes.js         # /admin
    │   └── tests/
    │       └── ridepass_pro.test.js    # Comprehensive 20-scenario QA automation test suite
    └── frontend/                       # React 19 + Vite + Tailwind CSS v4 Dashboard
        ├── .env                        # VITE_API_BASE_URL=http://localhost:4000
        ├── .env.example
        ├── index.html                  # HTML entry point with Plus Jakarta Sans
        ├── vite.config.js              # Vite configuration
        ├── src/
        │   ├── main.jsx                # React DOM root
        │   ├── App.jsx                 # Client router with role-protected routes
        │   ├── index.css               # Tailwind CSS v4 theme & glassmorphism
        │   ├── context/
        │   │   └── AuthContext.jsx     # User/driver auth state, prominent display name
        │   ├── services/
        │   │   └── api.js              # Centralized Axios client with JWT interceptors
        │   ├── components/
        │   │   └── common/
        │   │       ├── Navbar.jsx      # Top navigation with Devashish Srivastava branding
        │   │       ├── Footer.jsx      # Bottom footer with status & policies
        │   │       ├── Card.jsx        # Glassmorphic container
        │   │       ├── Button.jsx      # Button variants (primary, success, danger)
        │   │       ├── Badge.jsx       # Status badges
        │   │       └── Modal.jsx       # Reusable overlay modal
        │   └── pages/
        │       ├── LandingPage.jsx     # Hero, plans preview, how it works, driver CTA
        │       ├── LoginPage.jsx       # Passenger & Driver tabbed login with error alerts
        │       ├── RegisterPage.jsx    # Passenger & Driver registration with vehicle specs
        │       ├── PassengerDashboard.jsx # Active pass progress, quick book, recent rides
        │       ├── BookRidePage.jsx    # Real-time fare estimation, RidePass discount, OTP tracker
        │       ├── DriverDashboard.jsx # Online toggle, ride queue, OTP trip start, earnings
        │       ├── RidePassPlansPage.jsx # Plan comparison, excess fare policy, checkout modal
        │       ├── MyRidePassPage.jsx  # Allowance meter, ledger audit log, renewal & cancel
        │       ├── SavingsAnalyticsPage.jsx # Recharts monthly chart, net savings metrics
        │       ├── AdminDashboard.jsx  # Driver approval, plan CRUD, ride inspection
        │       ├── ProfilePage.jsx     # Personal info, role badges, support ticket filing
        │       └── NotFoundPage.jsx    # 404 handler
```

---

## 2. Key Upgrades & Bugs Fixed in Existing Backend

1. **Captain Model Validation Failure Repaired**:
   - `models/captain.model.js` previously enforced `required: true` on `vehicle.latitude` and `vehicle.longitude`, causing Mongoose `ValidationError` on every driver registration because the registration form did not supply initial coordinates.
   - Fixed by making vehicle coordinates optional, providing safe Delhi NCR coordinates default (`28.6139, 77.2090`), and adding dedicated `/captains/location` and `/captains/status` endpoints for dynamic GPS and online/offline updates.

2. **Route Middleware Typo Fixed**:
   - `routes/captain.routes.js` referenced undefined `authMidddleware` (3 d's). Fixed to `authMiddleware`.

3. **Driver Auth Middleware Hang Fixed**:
   - In `middlewares/auth.middleware.js`, `authCaptain` omitted `return next()`, causing any authenticated captain request to hang until socket timeout. Added `next()`, validated token optional chaining, and added role-based `authAdmin`.

4. **Missing Model Import in Captain Controller**:
   - `captain.controller.js` referenced `blackListTokenModel` during logout without importing it. Imported model cleanly.

5. **Sensitive Password Leaks Eliminated**:
   - Driver registration and login controllers previously returned raw bcrypt password hashes to the client. Sanitized responses to delete the password field.

6. **RidePass Subscription Engine Implemented**:
   - Built configurable plans (`SubscriptionPlan`), user pass instances (`UserSubscription`), and an audit trail (`SubscriptionLedger`).
   - Implemented fare caps (e.g. ₹150 for Mini, ₹200 for Student, ₹300 for Pro). If standard fare is under the cap, ride is 100% free; if above the cap, passenger pays only the excess difference.
   - Implemented atomic allowance reservation (`findOneAndUpdate` with `{ remainingRides: { $gt: 0 } }`) to prevent concurrent double-spending.
   - Implemented automatic allowance restoration upon trip cancellation.

7. **Concurrency Safety in Ride Acceptance**:
   - Used atomic MongoDB document locks (`Ride.findOneAndUpdate({ _id: rideId, status: 'pending' }, { status: 'accepted', captain: captainId })`). When two drivers click "Accept" on the same request at the same millisecond, exactly one succeeds and the other receives a clear message that the ride was already taken.

8. **Driver Verification & Trip OTP**:
   - Drivers must be verified by administrators before going online.
   - A secure 4-digit OTP is generated upon ride booking, displayed exclusively to the passenger, and must be submitted by the driver to start the trip.

---

## 3. Verified Windows Localhost Execution Instructions

### Prerequisites
- Node.js v20+ (Verified on Node v26.11.1)
- MongoDB running locally on port 27017 (`mongodb://127.0.0.1:27017`)
- npm / npm.cmd

---

### Step 1: Clone / Navigate to Workspace
Open PowerShell or Command Prompt:

```powershell
cd c:\Users\devas\Downloads\Rapido-main
```

---

### Step 2: Environment Configuration

Backend configuration file `Rapido-main/backend/.env`:
```env
PORT=4000
NODE_ENV=development
DB_CONNECT=mongodb://127.0.0.1:27017/ridepass_pro
JWT_SECRET=ridepass_pro_default_jwt_secret
CORS_ORIGIN=http://localhost:5173
PAYMENT_PROVIDER=demo_gateway
PAYMENT_WEBHOOK_SECRET=demo_webhook_secret
```

Frontend configuration file `Rapido-main/frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:4000
```

---

### Step 3: Run the Automated Test Suite

Run the full QA test suite verifying all 20 required scenarios:

**In PowerShell:**
```powershell
npm.cmd test
```

**In Command Prompt:**
```cmd
npm test
```

*Expected output: 24 passed, 0 failed.*

---

### Step 4: Start the Backend Server (Port 4000)

**Option A — From Workspace Root:**
```powershell
npm.cmd run start:backend
```

**Option B — From Backend Directory:**
```powershell
cd Rapido-main\backend
node server.js
```

*Output:*
```
Connected to MongoDB successfully!
Server is running on port 4000
```

Verify backend health in browser or curl:
- `http://localhost:4000/` → Returns `{ "name": "RidePass Pro API", "status": "online", "version": "1.0.0" }`
- `http://localhost:4000/api/health` → Returns API health status
- `http://localhost:4000/subscriptions/plans` → Returns RidePass plans

---

### Step 5: Start the React Frontend (Port 5173)

Open a second terminal window:

**Option A — From Workspace Root:**
```powershell
npm.cmd run dev:frontend
```

**Option B — From Frontend Directory:**
```powershell
cd Rapido-main\frontend
npm.cmd run dev
```

*Output:*
```
  VITE v8.3.0  ready in 220 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open `http://localhost:5173/` in your browser.

---

## 4. API Endpoint Reference

### Authentication & Users (`/users`)
- `POST /users/register` — Register passenger (`fullname.firstname`, `fullname.lastname`, `email`, `password`)
- `POST /users/login` — Authenticate passenger with email & password, returns JWT
- `POST /users/send-otp` — Generate 6-digit cryptographic OTP code with 60s cooldown & bcrypt hash
- `POST /users/verify-otp` — Verify 6-digit OTP code, authenticate or auto-register passenger
- `GET /users/profile` — Get authenticated passenger profile (Requires Bearer token)
- `PUT /users/profile` — Update passenger name
- `POST /users/logout` — Blacklists JWT token for 24 hours

### Drivers / Captains (`/captains`)
- `POST /captains/register` — Register driver with vehicle specs (`color`, `plate`, `capacity`, `vehicleType`)
- `POST /captains/login` — Authenticate driver with email & password
- `POST /captains/send-otp` — Generate 6-digit OTP code for driver
- `POST /captains/verify-otp` — Verify 6-digit OTP code, authenticate or auto-register driver
- `GET /captains/profile` — Get driver profile & vehicle info
- `PUT /captains/profile` — Update driver profile & vehicle specs
- `POST /captains/status` — Toggle driver online/offline (`status: 'active' | 'inactive'`)
- `POST /captains/location` — Update driver GPS coordinates (`ltd`, `lng`)
- `POST /captains/logout` — Blacklists driver JWT token

### Rides (`/rides`)
- `GET /rides/get-fare?pickup=...&destination=...` — Estimates distance, duration, standard fares, and RidePass discounts
- `POST /rides/create` — Book ride (Applies active pass, reserves 1 ride atomically, generates OTP)
- `POST /rides/confirm` — Driver accepts ride (Atomic concurrency check prevents double-booking)
- `POST /rides/arrived` — Driver marks arrived at pickup
- `POST /rides/start-ride` — Driver enters passenger's 4-digit OTP to start trip
- `POST /rides/end-ride` — Driver completes trip, finalizes payment
- `POST /rides/cancel` — Cancels ride (Automatically restores 1 ride back to passenger's pass)
- `POST /rides/rate` — Passenger rates completed ride (1 to 5 stars + review)
- `GET /rides/user-rides` — Passenger trip history
- `GET /rides/captain-rides` — Driver trip history
- `GET /rides/available` — Live queue of pending requests matching driver vehicle
- `GET /rides/:rideId` — Get single ride details (with populated driver and vehicle information)

### RidePass Subscriptions (`/subscriptions`)
- `GET /subscriptions/plans` — List active subscription plans (Mini, Student, Pro)
- `GET /subscriptions/active` — Get logged-in passenger's active pass & remaining allowance
- `POST /subscriptions/checkout` — Initiate purchase (Creates pending pass & payment order)
- `POST /subscriptions/activate` — Confirm payment & activate pass (Credits allowance in ledger)
- `GET /subscriptions/history` — Past subscription purchases
- `GET /subscriptions/ledger` — Cryptographic usage ledger (credits, debits, reversals)
- `POST /subscriptions/cancel` — Cancel active pass
- `PATCH /subscriptions/renew` — Toggle auto-renewal preference
- `GET /subscriptions/savings` — Net savings analytics & monthly spend comparison

### Payments (`/payments`)
- `POST /payments/create-order` — Create payment transaction order
- `POST /payments/verify` — Verify payment signature and fulfill pass or ride
- `POST /payments/webhook` — Idempotent webhook receiver
- `GET /payments/history` — User transaction history

### Support & Complaints (`/complaints`)
- `POST /complaints` — Submit support ticket
- `GET /complaints` — List user's tickets

### Administrator Portal (`/admin`)
- `GET /admin/overview` — System KPIs (revenue, subscribers, drivers, rides, tickets)
- `GET /admin/captains` — Driver directory
- `POST /admin/verify-captain` — Approve/verify driver documents
- `GET /admin/users` — Passenger directory
- `GET /admin/rides` — Platform-wide ride audit
- `POST /admin/plans` — Create new subscription plan
- `PUT /admin/plans/:planId` — Update plan pricing or allowances
- `GET /admin/subscriptions` — All user subscriptions
- `GET /admin/ledger` — Platform allowance ledger
- `GET /admin/complaints` — Support tickets queue
- `POST /admin/resolve-complaint` — Mark support ticket resolved

---

## 5. QA Automation Test Results

The test suite in `Rapido-main/backend/tests/ridepass_pro.test.js` was executed directly against MongoDB:

```
▶ RidePass Pro Comprehensive QA Automation Test Suite
  ✔ 1. Passenger registration and login (127ms)
  ✔ 2. Driver registration and verification (60ms)
  ✔ 3. Ride creation and driver assignment (23ms)
  ✔ 4. Concurrent acceptance of the same ride strictly prevents race condition (10ms)
  ✔ 5. Invalid ride-state transitions are blocked (11ms)
  ✔ 6. Subscription plan retrieval returns active plans (4ms)
  ✔ 7. Subscription purchase and confirmed activation (16ms)
  ✔ 8. Payment failure leaves subscription pending and unactivated (11ms)
  ✔ 9. Expired subscription is detected and deactivated (7ms)
  ✔ 10. Exhausted ride allowance prevents pass discount (6ms)
  ✔ 11. Concurrent allowance reservation is atomic and prevents overdraft (9ms)
  ✔ 12. RidePass application calculates discount and excess accurately (8ms)
  ✔ 13. Cancellation automatically reverses allowance back to pass (107ms)
  ✔ 14. Duplicate payment webhook is handled idempotently (31ms)
  ✔ 15. Unauthorized subscription access is rejected (25ms)
  ✔ 16. Passenger access to another user records is isolated (19ms)
  ✔ 17. Driver access to another driver rides is isolated (30ms)
  ✔ 18. Non-admin users are rejected from admin endpoints (25ms)
  ✔ 19. Request validation returns structured errors array (206ms)
  ✔ 20. Existing features continue to work: token blacklisting & root endpoint (159ms)
  ✔ 21. Full ride booking lifecycle: estimation -> booking -> arrival -> OTP start -> completion -> rating (54ms)
  ✔ 22. Single ride lookup via getRideById populates driver and passenger (37ms)
  ✔ 23. Captain profile update persists vehicle and name modifications (6ms)
  ✔ 24. Support complaint creation and admin resolution (4ms)
  ✔ 25. OTP generation, bcrypt hashing, and cooldown rate limiting (75ms)
  ✔ 26. OTP verification attempt limits and single-use replay prevention (183ms)
  ✔ 27. User and Captain controller OTP authentication flow (330ms)
✔ All 27 tests passed (1267ms)
```

---

## 6. Troubleshooting Common Windows Errors

- **`Running scripts is disabled on this system`**:
  If PowerShell shows a `PSSecurityException` when invoking `npm`, use `npm.cmd` instead (e.g. `npm.cmd test`).
- **`DB_CONNECT is not set`**:
  Ensure `Rapido-main/backend/.env` exists and contains `DB_CONNECT=mongodb://127.0.0.1:27017/ridepass_pro`.
- **`Port 4000 already in use`**:
  Check if a previous node server is running in the background:
  `Get-Process -Name node | Stop-Process`
- **CORS Errors**:
  Ensure the frontend runs on port 5173 (`http://localhost:5173`), which is pre-configured in `backend/.env`.
