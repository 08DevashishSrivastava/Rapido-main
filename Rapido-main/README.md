# RidePass Pro — Smart Ride Booking & Subscription Platform

**Developer & Architect**: Devashish Srivastava  
**Technology Stack**: Node.js, Express 5, MongoDB / Mongoose, React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts

RidePass Pro is a high-performance urban mobility and subscription platform built upon an existing Rapido-style ride booking engine. It introduces an enterprise-grade commuter pass ecosystem (RidePass Mini, RidePass Student, RidePass Pro) that eliminates surge pricing, caps per-ride fares, automates excess fare billing, and safeguards allowance deductions with an idempotent ledger and atomic concurrency controls.

---

## 1. Quick Local Execution on Windows

### Start Backend (Port 4000)
```powershell
cd backend
npm.cmd start
```

### Start Frontend (Port 5173)
```powershell
cd frontend
npm.cmd run dev
```

### Run All 20 Automated Tests
```powershell
cd backend
npm.cmd test
```

Please refer to the top-level `README.md` in the workspace root for complete architectural notes and API reference.
