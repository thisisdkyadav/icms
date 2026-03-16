# In-House Conference Management System (ICMS)

A web-based system to manage academic conferences, workshops, and seminars.

**Team-L | CS 310 Software Engineering | Spring 2026**

---

## 📁 Project Structure

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

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Create .env file and update values
npm run dev             # Starts server on port 5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm install --save @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
npm run dev             # Starts dev server on port 5173
```

---

## 📂 Folder Explanation (For Beginners)

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

## 🔧 How to Add a New Feature

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

## 👥 Team Members

- **Devesh Kumar** - 230001024
- **Kommireddy Jayanthi** - 230001041
- **Kota Sanjay** - 230001042
- **Nandini Kumari** - 230001056
- **Nelluri Pavithra** - 230001057

---

## 📝 Key Features (from SRS)

- ✅ Super admin / Admin management
- ✅ Event creation and management
- ✅ CSV import of participants
- ✅ QR code generation and email
- ✅ QR-based attendance marking
- ✅ Certificate generation and distribution
- ✅ Notification system
