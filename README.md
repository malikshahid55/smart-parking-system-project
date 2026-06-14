# Smart Parking System - Capstone Project

**Course**: Web Technologies (SP26)  
**Instructor**: BSCS 4th Semester (Sections  2M)  
**Student Name**: `[Muhammad Shahid]`  
**Roll Number**: `[F24BDOCS1M09006]`  

---

## 📌 Project Overview
The **Smart Parking System** is a responsive, single-page-style web application built to facilitate driver bookings and parking lot management. The system is designed with custom CSS (no Bootstrap or frameworks) featuring premium dark/light mode toggles, interactive metrics, full validation systems, and an administrative CRUD center backed by a mock JSON REST server.

---

## 🛠️ Technology Stack
*   **Structure/Markup**: Semantic HTML5 (accessible inputs, headers, panels)
*   **Styling**: Premium Custom CSS (variables, grids, layouts, dark theme)
*   **Scripting**: Plain ES6+ JavaScript (Fetch API, async/await, debouncing, input validations)
*   **Mock Backend**: JSON Server (runs REST endpoints at `http://localhost:3000/reservations`)

---

## 🌟 Core Features

### 1. User Dashboard (`index.html` & `app.js`)
*   **Live Bookings Feed**: Fetches data from `db.json` and renders interactive cards detailing name, vehicle plate, type, date, duration, fee, and phone number.
*   **Reserve Form**: Form with 6 input fields (Driver Name, License Plate, Vehicle Type, Contact Phone, Booking Date, and Duration).
*   **Inline Validations**:
    *   *Driver Name*: 3-50 letters and spaces only.
    *   *License Plate*: 3-15 alphanumeric characters and hyphens.
    *   *Vehicle Type*: Select input choice.
    *   *Contact Phone*: Valid phone format (e.g. `0300-1234567`).
    *   *Booking Date*: Today or future dates (minimum date constraint dynamic).
    *   *Duration*: 1 to 24 hours restriction.
*   **Dynamic Search & Filtering**:
    *   *Debounced Search Bar*: Search by driver name or license plate (300ms debounce buffer).
    *   *Type Filters*: Filter bookings by Regular Car, EV, or Motorcycle.
*   **Visual Indicators**: Features customized CSS loading spinner and elegant error banners.

### 2. Admin Center (`admin.html` & `admin.js`)
*   **Visual Distinction**: Obsidian-themed admin layout with purple/crimson accents to differentiate it from the user portal.
*   **Key Statistical Counters**:
    *   *Total Bookings*: Total entries in system.
    *   *Active Occupancy*: Total active reservations with percentage calculations.
    *   *Estimated Revenue*: Sum of active/completed booking fees (Duration × $5/hr rate).
*   **Admin Management Grid**: Table layout displaying details, actions, and status tags.
*   **Modal Form Custom Edits (Recommended Feature)**: Click edit to trigger an interactive form overlay. Save changes via `PUT` API request.
*   **Interactive Confirmation Deletions**: Click delete to prompt a secure dialog overlay confirming removal before initiating `DELETE` API requests.

### 3. Extra/Bonus Polish
*   **Persisted Theme Engine**: Toggle Dark/Light mode instantly; system stores option inside browser `localStorage` to persist across pages and reloads.
*   **Empty State Graphics**: Clean SVGs/emojis display if database queries return 0 results.

---

## 📂 Project Architecture
```text
smart-parking-system/
│
├── index.html     # User panel main dashboard structure
├── admin.html     # Admin statistics and CRUD controls
├── style.css      # Core theme, variables, and animations
├── app.js         # User dashboard interactive logic
├── admin.js       # Admin panel metric logic & API triggers
├── db.json        # JSON database holding reservation entries
└── README.md      # Installation guide and project spec sheet
```

---

## 🚀 Installation & Running Guide

### Step 1: Install Mock Server (JSON Server)
Make sure you have Node.js installed. Open your command terminal inside the project directory and install JSON server globally:
```bash
npm install -g json-server
```
*Or run it directly using `npx` (recommended for viva demonstration).*

### Step 2: Boot JSON Database
Start the watcher script to run on port 3000:
```bash
npx json-server --watch db.json --port 3000
```
Ensure you keep this terminal running. You should see:
```text
Resources:
http://localhost:3000/reservations
```

### Step 3: Run the Application
Open `index.html` or `admin.html` in your web browser (e.g., Chrome, Edge, Safari) directly, or run it through any local web server (like VS Code Live Server).
*   **User Portal**: Book, search, and filter.
*   **Admin Dashboard**: Modify details, toggle reservation states, delete records, and track live statistics.
