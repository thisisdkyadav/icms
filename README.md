# In-House Conference Management System (ICMS)

A web-based system to manage academic conferences, workshops, and seminars.

**Team-L | CS 310 Software Engineering | Spring 2026**

---
## Table of Contents
- [Key Features](#key-features)
- [User Roles & Permissions](#user-roles--permissions)
- [System Workflow](#system-workflow)
- [Demo Video](#demo-video)
- [Project Structure](#project-structure)
- [Folder Explanation (For Beginners)](#folder-explanation-for-beginners)
- [Installation](#installation)
- [Guide to Add a New Feature](#guide-to-add-a-new-feature)
- [Contributors](#contributors)
---
##  Key Features

- Role-based access (Super Admin / Admin / Subadmin)
- Event creation and management
- CSV import of participants
- Automated receipt generation
- Email system (receipts, QR codes, certificates)
- QR code generation
- QR-based attendance marking
- Certificate generation and distribution
- Event-wise notification system
---

## User roles & permissions
### Super Admin
- Full system control  
- Can create and manage Admins and Subadmins

### Admin
- Can create and manage events  
- Can manage participants and attendance

### Subadmin
- Cannot create events  
- Can manage events and attendance assigned to them 
## System Workflow
### Event Creation
  - Admin creates an event with the necessary details.
### Participant Import
  - Upload a CSV file containing participants who have registered and paid.
### Receipt Generation
  - System generates and sends receipts via email.
### QR Code Distribution
  - Unique QR codes are generated and emailed to participants.
### Attendance Marking
  - Admin/Subadmin scans QR or marks attendance via the dashboard.
### Certificate Distribution
  - Certificates are automatically generated and emailed after attendance.
### 5. Notifications
  - Admins/Subadmins can send **event-specific notifications directly from the platform** to all participants via email (e.g., reminders, updates, schedule changes).
    
## DEMO Video
---
[![Watch the demo](https://img.youtube.com/vi/R4lSLZqimuE/0.jpg)](https://www.youtube.com/watch?v=R4lSLZqimuE)
## Project Structure

```
In-House-Conference-Management-System/
├── frontend/                    # React + Vite Frontend
│   ├── public/                  # Static assets (favicon, etc.)
│   ├── src/
│   │   ├── assets/              # Images, icons, fonts
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ...
│   │   ├── pages/               # Page components (one per route)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Participants.jsx
│   │   │   └── ...
│   │   ├── services/            # API call functions
│   │   │   └── api.js
│   │   ├── styles/              # CSS files
│   │   │   └── global.css
│   │   ├── utils/               # Helper functions
│   │   │   └── helpers.js
│   │   ├── App.jsx              # Main App component
│   │   ├── App.css
│   │   ├── main.jsx             # Entry point
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Express + MongoDB Backend
│   ├── config/                  # Configuration files
│   │   └── db.js                # Database connection
│   ├── controllers/             # Route handlers (business logic)
│   │   ├── adminController.js
│   │   ├── eventController.js
│   │   └── participantController.js
│   ├── middleware/              # Custom middleware
│   │   └── authMiddleware.js
│   ├── models/                  # MongoDB schemas
│   │   ├── Admin.js
│   │   ├── Event.js
│   │   └── Participant.js
│   ├── routes/                  # API route definitions
│   │   ├── adminRoutes.js
│   │   ├── eventRoutes.js
│   │   └── participantRoutes.js
│   ├── utils/                   # Helper functions
│   │   └── helpers.js
│   ├── server.js                # Main entry point
│   ├── .env.example             # Environment variables template
│   ├── .gitignore
│   └── package.json
│
└── README.md
```

---
## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn
---
###  Windows Setup

#### 1. Install Node.js
Download and install from: https://nodejs.org  

Verify:
```bash
node -v
npm -v
```

#### 2. Install MongoDB

- Go to https://www.mongodb.com/atlas
- Create a free cluster
- Create user & password
- Get connection string:
```bash
MONGODB_URI = "mongodb+srv://<user>:<password>@cluster.mongodb.net/icms"
```


#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Create .env file 
notepad .env            # Update the values
npm run dev             # Starts server on port 5000
```
#### Frontend Setup
```bash
cd frontend
npm install
npm install --save @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
npm run dev             # Starts dev server on port 5173
```
#### Note: 
If npm run dev fails → install nodemon:
```bash
npm install -g nodemon
```
----
### macOS Setup

#### 1. Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Node.js
```bash
brew install node
```
Verify:
```bash
node -v
npm -v
```

#### 3. Install MongoDB
(Same as Windows)

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Create .env file
nano .env               # Update the values
npm run dev             # Starts server on port 5000
```
#### Frontend Setup
```bash
cd frontend
npm install
npm install --save @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
npm run dev            # Starts dev server on port 5173
```


---
## Folder Explanation (For Beginners)

### Frontend Folders

| Folder | What goes here | Example |
|--------|---------------|---------|
| `components/` | Reusable UI pieces | Button, Card, Modal, Navbar |
| `pages/` | Full page views | Dashboard, Login, EventList |
| `services/` | API calls to backend | `fetchEvents()`, `loginAdmin()` |
| `utils/` | Helper functions | `formatDate()`, `validateEmail()` |
| `styles/` | CSS files | Component styles |
| `assets/` | Images, icons, fonts | Logo, icons |

### Backend Folders

| Folder | What goes here | Example |
|--------|---------------|---------|
| `models/` | Database schemas | Admin, Event, Participant |
| `routes/` | URL endpoints | `/api/events`, `/api/admin` |
| `controllers/` | Business logic | Create event, mark attendance |
| `middleware/` | Request interceptors | Auth check, logging |
| `config/` | App configuration | Database connection |
| `utils/` | Helper functions | Generate QR, send email |

---

## Guide to add a new feature

### Example: Adding a new "Reports" page

1. **Create the page component:**
   ```
   frontend/src/pages/Reports.jsx
   ```

2. **Add API service function (if needed):**
   ```
   frontend/src/services/api.js → add fetchReports()
   ```

3. **Add route in App.jsx:**
   ```jsx
   <Route path="/reports" element={<Reports />} />
   ```

4. **Backend: Create route, controller, model (if needed)**

---

## Contributors

- **Devesh Kumar** - 230001024
- **Kommireddy Jayanthi** - 230001041
- **Kota Sanjay** - 230001042
- **Nandini Kumari** - 230001056
- **Nelluri Pavithra** - 230001057
