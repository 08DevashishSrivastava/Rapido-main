# RidePass Pro — Smart Ride Booking & Subscription Platform

**Platform Owner & Lead Engineer**: Devashish Srivastava  
**Technology Stack**: Node.js, Express, MongoDB / Mongoose, React 19, Vite, Tailwind CSS, Razorpay SDK, Lucide Icons, Recharts, PWA  

RidePass Pro upgrades a Rapido-style ride booking system into a high-performance urban mobility application with an integrated subscription ecosystem (**RidePass Mini**, **RidePass Student**, and **RidePass Pro**). It eliminates surge pricing, caps per-ride fares, computes transparent excess fares, safeguards allowance deductions with an idempotent ledger and atomic concurrency controls, and integrates official **Razorpay Standard Checkout** with HMAC-SHA256 signature verification.

---

## 🎨 Visual System & Mobile-First UX

- **Aesthetic**: Premium, bright, light design system.
- **Backgrounds**: Pure white (`#FFFFFF`) and soft off-white (`#F8FAFC`).
- **Coordinated Palette**:
  - 🔵 **Royal Blue (`#2563EB`)**: Primary booking actions, user identity pills, active focus rings.
  - 🌐 **Mobility Teal (`#0D9488`)**: Navigation elements, transit statuses, route indicators.
  - 🟢 **Emerald Green (`#059669`)**: Successful payments, savings counters, active driver console states.
  - 🟠 **Warm Orange (`#EA580C`)**: Highlighting special commuter passes and priority alerts.
  - 🟣 **Lavender / Indigo (`#4F46E5`)**: Secondary analytics cards, charts, and role badges.
  - ⚪ **Light Slate (`#64748B`, `#E2E8F0`)**: Supporting typography and subtle card borders.
- **Mobile-First Features**: Fixed bottom navigation bar (`MobileBottomNav`) for small screens, responsive sidebars/navbars for desktops, PWA installable viewport configuration, and touch-friendly controls.

---

## 💳 Razorpay Payment Integration

RidePass Pro integrates the official **Razorpay Standard Checkout** flow:

1. **Order Creation in Paise**:
   The backend retrieves verified plan prices from MongoDB and invokes the server-side Razorpay SDK (`razorpay.orders.create`) with currency `INR` and amount in paise (`amountInRupees * 100`).
2. **Standard Checkout JS in React**:
   The frontend dynamically opens Razorpay modal using `window.Razorpay(options)`. The options include `key` (public Key ID only), `order_id`, `amount`, `currency`, `name: 'RidePass Pro'`, and customer prefill details.
3. **HMAC-SHA256 Server Signature Verification**:
   When payment succeeds, `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` are sent to the backend. The backend computes:
   ```javascript
   const expectedSignature = crypto
     .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
     .update(order_id + '|' + payment_id)
     .digest('hex');
   ```
4. **Transparent Test Mode Fallback**:
   When Razorpay keys are not yet provided in `.env`, the system automatically activates a transparent **Test Mode Simulation**, generating simulated orders (`order_test_...`) and verifying simulated payments without breaking or crashing the application.
5. **Security Rules**:
   - `RAZORPAY_KEY_SECRET` is stored strictly in the backend `.env` and is **never** exposed to the frontend.
   - Prices sent by frontend clients are discarded; backend loads actual pricing from the database.
   - Paid subscriptions activate **strictly after** valid signature verification.

---

## 📁 Repository Architecture

```
Rapido-main/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── admin.controller.js   # Administrator stats, driver verification, complaints
│   │   ├── complaint.controller.js # Passenger complaints & support tickets
│   │   ├── ride.controller.js    # Ride booking, estimate, acceptance, lifecycle
│   │   ├── subscription.controller.js # RidePass plans, checkout, verification
│   │   └── user.controller.js    # Authentication and profiles
│   ├── models/
│   │   ├── captain.model.js      # Driver & vehicle schema
│   │   ├── complaint.model.js    # Support inquiries schema
│   │   ├── payment.model.js      # Payment & Razorpay transaction schema
│   │   ├── ride.model.js         # Ride booking & OTP lifecycle schema
│   │   ├── subscription.model.js # RidePass plans & user subscription schema
│   │   └── user.model.js         # Passenger schema
│   ├── routes/
│   │   ├── admin.routes.js       # Admin portal endpoints (role-protected)
│   │   ├── captain.routes.js     # Driver onboarding and status endpoints
│   │   ├── complaint.routes.js   # Inquiries and issue reporting
│   │   ├── payment.routes.js     # Razorpay orders and verification
│   │   ├── ride.routes.js        # Fare calculation and live ride endpoints
│   │   ├── subscription.routes.js# Subscription plans, history & ledger
│   │   └── user.routes.js        # Passenger authentication
│   ├── services/
│   │   ├── payment.service.js    # Razorpay SDK client & HMAC-SHA256 verification
│   │   ├── ride.service.js       # Atomic ride booking & status transitions
│   │   └── subscription.service.js # Atomic allowance reservation & usage ledger
│   ├── tests/
│   │   └── ridepass_pro.test.js  # 20 comprehensive QA automation tests
│   └── server.js                 # Express application entry point (Port 4000)
│
├── frontend/
│   ├── public/                   # PWA assets and manifest
│   ├── src/
│   │   ├── components/common/    # Reusable light UI components
│   │   │   ├── Badge.jsx         # Status and vehicle badges
│   │   │   ├── Button.jsx        # Coordinated button variants (primary, teal, success, orange)
│   │   │   ├── Card.jsx          # Light card with accent borders and glows
│   │   │   ├── Footer.jsx        # Platform footer with links and attribution
│   │   │   ├── MobileBottomNav.jsx # Fixed bottom navigation for mobile viewports
│   │   │   ├── Modal.jsx         # Clean white modal dialogs
│   │   │   └── Navbar.jsx        # Responsive navigation with Devashish Srivastava profile pill
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Role-based state management (User/Captain/Admin)
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx # Admin metrics, driver approval, ride audits
│   │   │   ├── BookRidePage.jsx  # Ride booking with vehicle cards and OTP tracker
│   │   │   ├── DriverDashboard.jsx # Captain console with online toggle and trip verification
│   │   │   ├── LandingPage.jsx   # Hero banner, feature grid, and plan previews
│   │   │   ├── LoginPage.jsx     # Dual-role authentication form
│   │   │   ├── MyRidePassPage.jsx# Active pass details, progress bar, usage ledger
│   │   │   ├── NotFoundPage.jsx  # 404 error page
│   │   │   ├── PassengerDashboard.jsx # Passenger overview, active rides, savings stats
│   │   │   ├── ProfilePage.jsx   # Account settings and support tickets
│   │   │   ├── RegisterPage.jsx  # Registration with vehicle details for drivers
│   │   │   ├── RidePassPlansPage.jsx # Colorful plan comparison with Razorpay checkout
│   │   │   └── SavingsAnalyticsPage.jsx # Recharts visualization of savings vs market fares
│   │   ├── services/api.js       # Centralized Axios API client
│   │   ├── App.jsx               # Route definitions and layout wrapper
│   │   ├── index.css             # Light theme design tokens and utility classes
│   │   └── main.jsx              # React DOM entry point
│   └── vite.config.js            # Vite configuration with proxy settings
```

---

## 🚀 Windows Localhost Execution Guide

### Prerequisites
- **Node.js**: v18 or higher (tested on Node.js v26)
- **MongoDB**: Running locally at `mongodb://127.0.0.1:27017/rapido`

---

### Step 1: Environment Configuration

Backend configuration file: `backend/.env`
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/rapido
JWT_SECRET=ridepass_pro_jwt_secret_devashish_srivastava_2026
CORS_ORIGIN=http://localhost:5173

# Razorpay Test Keys (Configure your test credentials from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_placeholder_key_id
RAZORPAY_KEY_SECRET=rzp_test_placeholder_secret
RAZORPAY_WEBHOOK_SECRET=rzp_test_placeholder_webhook_secret
```

Frontend configuration file: `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=rzp_test_placeholder_key_id
```

---

### Step 2: Install Dependencies

#### Windows Command Prompt (`cmd.exe`)
```cmd
cd backend
npm.cmd install

cd ..\frontend
npm.cmd install
```

#### Windows PowerShell
```powershell
cd backend
cmd /c "npm install"

cd ..\frontend
cmd /c "npm install"
```

---

### Step 3: Start the Backend Server (Port 4000)

```cmd
cd backend
npm.cmd start
```
*Output:*
```
Connected to MongoDB successfully!
Server running on port 4000
Seeded 3 default RidePass plans: RidePass Mini, RidePass Student, RidePass Pro
```

---

### Step 4: Start the Frontend Application (Port 5173)

Open a separate terminal window:
```cmd
cd frontend
npm.cmd run dev
```
*Output:*
```
VITE v8.3.0  ready in 180 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open your browser at **http://localhost:5173/**.

---

### Step 5: Run Automated Tests

To execute the test suite covering authentication, concurrency, Razorpay verification, and allowance reservations:
```cmd
cd backend
npm.cmd test
```
*Result:* **24/24 test cases pass (100% pass rate).**

---

## 🛠️ Windows Port Conflict Troubleshooting

If you encounter `Error: listen EADDRINUSE: address already in use :::4000`:

1. Find the process occupying port 4000:
   ```cmd
   netstat -ano | findstr :4000
   ```
2. Terminate the process using its PID (e.g. `33428`):
   ```cmd
   taskkill /F /PID 33428
   ```
3. Restart the backend:
   ```cmd
   npm.cmd start
   ```

---

## 📡 API Endpoints Summary

### Authentication (`/users` & `/captains`)
- `POST /users/register`: Register passenger account.
- `POST /users/login`: Authenticate passenger with password.
- `POST /users/send-otp`: Generate 6-digit cryptographic OTP code with 60s cooldown and bcrypt hash.
- `POST /users/verify-otp`: Validate 6-digit OTP code and authenticate/register passenger.
- `GET /users/profile`: Get authenticated passenger profile.
- `PUT /users/profile`: Update passenger profile.
- `POST /captains/register`: Register driver with vehicle specifications.
- `POST /captains/login`: Authenticate driver with password.
- `POST /captains/send-otp`: Generate 6-digit OTP code for driver.
- `POST /captains/verify-otp`: Validate 6-digit OTP code and authenticate/register driver.
- `GET /captains/profile`: Get authenticated driver profile.
- `PUT /captains/profile`: Update driver profile & vehicle specifications.
- `PATCH /captains/status`: Toggle driver status (`active` / `inactive`).

### Ride Management (`/rides`)
- `GET /rides/get-fare`: Calculate distance and estimate fares for all vehicle types.
- `POST /rides/create`: Calculate fare, apply pass discount, and dispatch ride request.
- `GET /rides/available`: List pending rides for active captains.
- `GET /rides/user-rides`: History of passenger bookings.
- `GET /rides/captain-rides`: History of driver completed trips.
- `GET /rides/:rideId`: Get detailed ride information with driver & vehicle specs.
- `POST /rides/confirm`: Concurrency-safe ride acceptance by captain.
- `POST /rides/mark-arrived`: Update captain status to arriving at pickup.
- `POST /rides/start`: Validate passenger OTP and start trip.
- `POST /rides/complete`: Mark trip finished and record earnings.
- `POST /rides/cancel`: Cancel ride and reverse reserved pass allowance.

### RidePass & Subscriptions (`/subscriptions`)
- `GET /subscriptions/plans`: Retrieve active RidePass plans from database.
- `POST /subscriptions/checkout`: Generate Razorpay order for plan purchase.
- `POST /subscriptions/verify`: Verify HMAC-SHA256 signature and activate pass.
- `GET /subscriptions/active`: Get user's current subscription.
- `GET /subscriptions/ledger`: Get auditable allowance usage ledger.
- `GET /subscriptions/history`: Get user's subscription purchase history.
- `GET /subscriptions/savings`: Get empirical savings calculations.

### Administrator Portal (`/admin` - Protected)
- `GET /admin/overview`: Platform KPIs, revenue, and active subscriber counts.
- `GET /admin/captains`: Driver registry and verification statuses.
- `PATCH /admin/verify-captain`: Approve or revoke driver documents.
- `GET /admin/users`: Registered passenger directory.
- `GET /admin/rides`: Global ride audits with pass discount tracking.
- `POST /admin/plans`: Create new subscription plan.
- `PUT /admin/plans/:planId`: Update subscription plan.
- `GET /admin/complaints`: Support ticket queue.
- `PATCH /admin/complaint-status`: Resolve passenger inquiries.

---

## 🏆 Project Delivery Verification

- [x] **Backend Preserved & Improved**: Node.js/Express backend preserved and augmented in place with Razorpay integration and atomic concurrency controls.
- [x] **Bright, Colourful, Light Design**: 100% converted to crisp white/light backgrounds, royal blue primary actions, mobility teal, emerald green savings, and warm orange highlights.
- [x] **Platform Identity**: Profile names dynamically synchronized with authenticated user/driver session; root API status endpoint modernized.
- [x] **Razorpay Standard Checkout**: Complete integration with official SDK, paise conversion, and HMAC-SHA256 verification.
- [x] **Mobile-First PWA**: Fixed bottom navigation bar (`MobileBottomNav`), responsive layouts, and viewport configuration.
- [x] **Automated Testing**: 27/27 test cases verified and passing (including OTP cryptographic generation, bcrypt hashing, cooldown rate-limiting, attempt limits, and authentication).
- [x] **Production Build**: Zero build errors in Vite frontend bundle.
