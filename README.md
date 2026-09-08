# 🏏 Hostel Cricket Auction Live Web Application

A complete, real-time web application built for a college hostel cricket auction event with 6 franchise teams.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java**: JDK 21 or JDK 23
- **Maven**: 3.9+
- **Node.js**: v18+ / v20+ / v22+
- **MySQL**: MySQL Server 8.0+ running on port `3306`

---

## 🛠️ Step 1: Start the Spring Boot Backend

Open PowerShell / Terminal in the project root:

```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-23"
$env:Path = "C:\Program Files\Java\jdk-23\bin;" + $env:Path
mvn spring-boot:run
```

The backend server will start on: **`http://localhost:8081`**
- WebSocket broker active at: `ws://localhost:8081/ws-auction` (proxied via Vite at `/ws-auction`)
- Auto-seeds: 1 Admin, 6 Captains, 6 Teams (₹1000 purse each), Round 1, and 24 players.

---

## 💻 Step 2: Start the React Frontend

Open a second PowerShell / Terminal window:

```powershell
cd frontend
npm run dev
```

The frontend will run at: **`http://localhost:5173`**

---

## 🔑 Predefined Event Credentials

The system has exactly 7 accounts pre-configured with 1-click quick login buttons on the login screen:

| Role | Username | Password | Assigned Franchise | Initial Purse |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Control Center | Controls All |
| **Captain 1** | `captain1` | `Captain@101` | **Team Tigers** | ₹1,000 |
| **Captain 2** | `captain2` | `Captain@102` | **Team Lions** | ₹1,000 |
| **Captain 3** | `captain3` | `Captain@103` | **Team Warriors** | ₹1,000 |
| **Captain 4** | `captain4` | `Captain@104` | **Team Kings** | ₹1,000 |
| **Captain 5** | `captain5` | `Captain@105` | **Team Strikers** | ₹1,000 |
| **Captain 6** | `captain6` | `Captain@106` | **Team Challengers** | ₹1,000 |

---

## 🖥️ Application Screens & URLs

1. **Login Portal**: `http://localhost:5173/login`
2. **Admin Command Center**: `http://localhost:5173/admin`
   - **Auction Control Stage**: `http://localhost:5173/admin/auction`
   - **Player Management & CSV Import**: `http://localhost:5173/admin/players`
   - **Teams & Squad Rosters**: `http://localhost:5173/admin/teams`
   - **Auction History & Audit Logs**: `http://localhost:5173/admin/history`
   - **Financial Analytics**: `http://localhost:5173/admin/analytics`
3. **Captain Panel**: `http://localhost:5173/captain`
   - Live Bidding Console (dynamic buttons: +₹10, +₹20, +₹50, +₹100)
   - Real-time purse balance tracker with insufficient purse protection
   - My Squad Roster: `http://localhost:5173/captain/squad`
   - **Download Official Squad PDF**
4. **Live Projector / LED Screen**: `http://localhost:5173/live`
   - Stadium-grade 1080p full-screen broadcast layout (no admin controls)
   - Massive player photo, name, role, base price, and real-time highest bid
   - 10-second countdown timer
   - Fullscreen animated celebration on "SOLD!" with confetti
   - Live ticker of all 6 franchise purses

---

## ⚙️ Core Auction Business Rules Implemented

1. **Initial Budget**: Every franchise begins with exactly **₹1,000** purse.
2. **Non-Deduction Rule during Bidding**: Team purse is **never deducted on temporary bids**. It is strictly deducted only when Admin confirms **SOLD**.
3. **Purse Validation**: Captain cannot bid an amount greater than their remaining purse.
4. **Bid Increments**: Every new bid must be strictly higher than the current bid.
5. **Bid Timer Reset**: Any valid higher bid immediately resets the server countdown timer to 10s.
6. **Permanent Sold Status**: Once a player is SOLD, they are assigned to that team and can **never appear in any future round**.
7. **Round Progression**:
   - **Round 1**: All AVAILABLE players.
   - **Round 2**: Only UNSOLD players.
   - **Round 3**: Remaining UNSOLD players.
8. **Emergency Undo**: "UNDO LAST SALE" atomically refunds the winning team's purse, removes the player from the squad, and reopens the player.
9. **Backend PDF Generation**:
   - `GET /api/pdf/team/{teamId}` generates a printable, styled PDF squad roster.
   - `GET /api/pdf/auction-report` generates a comprehensive tournament report.
10. **CSV Import**: Admin can upload CSV participant exports from Google Forms/Sheets. Validates required fields and automatically skips duplicate roll numbers.

---

## 🧪 Testing

To re-run the automated integration test suite verifying all 12 core business rules:

```powershell
cd backend
mvn test
```
