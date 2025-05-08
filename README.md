# Job Tracker App

A modern, interactive tool for tracking job applications — built with empathy, clarity, and purpose.

## 🔗 Demo

**Live App:** [https://main.d2zamzei6iyv8s.amplifyapp.com](https://main.d2zamzei6iyv8s.amplifyapp.com) *(Right-click → "Open in new tab")*


**Test Login:**  
Email: `demo@gmail.com`  
Password: `demo123123`

---

##  Motivation

Most job tracking tools act like glorified spreadsheets — static, cold, and passive. But job hunting is dynamic and emotional. It's a full-time job with highs, lows, and constant motion. I built this app to reflect that reality and to support others going through the same grind.

---

##  Why This App?

- **Drag-and-drop Kanban board** to mirror real-world progress
- **Custom tagging system** to adapt to your personal job hunt strategy
- **Detail modals** for notes, follow-ups, and interviews
- **Soft-delete system** to archive without losing historical context
- **Fully responsive** — works great on desktop and mobile

---

## 🛠 Tech Stack

- **Frontend:** React (Vite), TypeScript, Zustand, Tailwind CSS, **@dnd-kit**
- **Backend:** FastAPI, PostgreSQL, SQLAlchemy  
- **Auth:** JWT (HttpOnly cookie-based)  
- **Deployment:**  
  - Frontend: AWS Amplify  
  - Backend: Heroku  
- **Drag & Drop:** [@dnd-kit](https://dndkit.com) — accessible, performant drag-and-drop for React

---

##  Features

- JWT cookie-based user signup & login  
- Create, update, and soft/hard-delete job applications  
- Tag filtering system (supports both AND & OR logic via single/double click)  
- Drag-and-drop Kanban board with group select  
- Detail view modal with inline editing  
- Fully responsive UI for all screen sizes  
- Admin page (early version)  
- Staleness bar to show application age  
- Sortable application list  

---

##  Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/job-tracker-app.git
   cd job-tracker-app

2. **Frontend Setup**
    ```cd frontend
   npm install
   npm run dev
3. **Backend Setup**
   ```cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn main:app --reload
4. **Environment Variables**
   Set up your .env file for both frontend and backend. Backend requires DB URL, secret keys, etc.

##  Demo Flow
Login or sign up (use demo credentials above or create a new account)

Create a new application with company, role, and status

Drag it between columns to track your progress

Click a card to edit tags, notes, or update its stage

Use filters to quickly search by tag, role, or company

##  Roadmap
- [ ] Batch Update
- [ ] Expanded Admin Dashboard (currently has limited access)
- [ ] Analytics Dashboard: see conversion rates, stage duration
- [ ] Notifications / Reminders
- [ ] Team-based collaboration mode
- [ ] UI overhaul (polish and style refinements)
- [ ] Enhanced mobile experience

##  About Me
I'm Linhao Yuan, a full-stack software developer passionate about clean UX and expressive tools. I built this app during my own job hunt — turning the process into a product. If you’re hiring or have feedback, I’d love to connect.

