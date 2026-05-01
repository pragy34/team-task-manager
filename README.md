# TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, built with **React + FastAPI + PostgreSQL**.

---

## 🏗️ Architecture

```
team-task-manager/
├── backend/                    ← FastAPI REST API
│   ├── main.py                 ← App entry + CORS + exception handlers
│   ├── models.py               ← SQLAlchemy ORM models
│   ├── schemas.py              ← Pydantic request/response validators
│   ├── database.py             ← PostgreSQL session management
│   ├── routers/
│   │   ├── auth.py             ← /auth/* (register, login, me)
│   │   ├── users.py            ← /users/* (search)
│   │   ├── projects.py         ← /projects/* (CRUD + members)
│   │   ├── tasks.py            ← /projects/:id/tasks/* (CRUD)
│   │   └── dashboard.py        ← /dashboard/* (stats, my-tasks, overdue)
│   ├── services/
│   │   ├── auth_service.py     ← Auth business logic
│   │   ├── project_service.py  ← Project business logic
│   │   └── task_service.py     ← Task business logic
│   ├── dependencies/
│   │   └── auth_dependency.py  ← JWT auth + RBAC middleware
│   ├── core/
│   │   ├── config.py           ← Pydantic settings / .env loader
│   │   └── security.py         ← bcrypt + JWT utilities
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
├── frontend/                   ← React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx  ← Kanban board
│   │   │   └── MyTasks.jsx
│   │   ├── components/
│   │   │   ├── ui/index.jsx    ← Button, Input, Modal, Badge, Avatar…
│   │   │   ├── layout/         ← Sidebar, AppLayout, ProtectedRoute
│   │   │   └── TaskForm.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx ← Global auth state
│   │   ├── hooks/
│   │   │   └── useFetch.js     ← Generic data-fetching hooks
│   │   ├── api/
│   │   │   ├── client.js       ← Axios instance with interceptors
│   │   │   └── index.js        ← authAPI, projectsAPI, tasksAPI, dashboardAPI
│   │   └── utils/
│   │       └── helpers.js      ← formatDate, isOverdue, getInitials…
│   ├── Dockerfile
│   ├── nginx.conf
│   └── railway.toml
└── docker-compose.yml          ← Local dev (db + backend + frontend)
```

---

## 🚀 Features

- **JWT Authentication** — Secure register/login with bcrypt password hashing
- **Role-Based Access Control** — Project Owner (Admin) vs Member permissions
- **Project Management** — Create, edit, delete projects; invite members by email
- **Kanban Board** — Visual To Do / In Progress / Done columns per project
- **Task Management** — Full CRUD with title, description, status, priority, due date, assignee
- **Dashboard** — Stats cards, task status breakdown, assigned tasks, overdue alerts
- **My Tasks** — Grouped by status across all projects
- **Overdue Detection** — Automatic highlighting of past-due tasks
- **Global Error Handling** — Consistent error responses + axios interceptors

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT token |
| GET | `/api/v1/auth/me` | Current user info |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects` | List user's projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/{id}` | Get project details |
| PUT | `/api/v1/projects/{id}` | Update project (owner only) |
| DELETE | `/api/v1/projects/{id}` | Delete project (owner only) |
| POST | `/api/v1/projects/{id}/members` | Add member by email |
| DELETE | `/api/v1/projects/{id}/members/{uid}` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/{id}/tasks` | List tasks (filterable) |
| POST | `/api/v1/projects/{id}/tasks` | Create task |
| GET | `/api/v1/projects/{id}/tasks/{tid}` | Get task |
| PUT | `/api/v1/projects/{id}/tasks/{tid}` | Update task |
| DELETE | `/api/v1/projects/{id}/tasks/{tid}` | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/stats` | Aggregate statistics |
| GET | `/api/v1/dashboard/my-tasks` | Tasks assigned to me |
| GET | `/api/v1/dashboard/overdue-tasks` | All overdue tasks |

---

## 🔐 Role-Based Access Control

| Action | Member | Owner |
|--------|--------|-------|
| View project & tasks | ✅ | ✅ |
| Create/edit tasks | ✅ | ✅ |
| Delete own tasks | ✅ | ✅ |
| Delete any task | ❌ | ✅ |
| Add/remove members | ❌ | ✅ |
| Update project | ❌ | ✅ |
| Delete project | ❌ | ✅ |

---

## 🛠️ Local Development

### Prerequisites
- Docker & Docker Compose

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd team-task-manager

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start all services

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

### Without Docker (manual)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Set DATABASE_URL to your local Postgres
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env            # Set VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

---

## ☁️ Deployment on Railway

### Step 1 — Database
1. Go to [railway.app](https://railway.app) → New Project → **PostgreSQL**
2. Copy the `DATABASE_URL` from the Variables tab

### Step 2 — Backend Service
1. Add Service → **Deploy from GitHub repo** → select `backend/` folder (or root with Dockerfile path set)
2. Set environment variables:
   ```
   DATABASE_URL=<from step 1>
   JWT_SECRET=<generate a long random string>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```
3. Railway auto-detects `railway.toml` and uses the Dockerfile

### Step 3 — Frontend Service
1. Add another Service → GitHub repo → `frontend/` folder
2. Set environment variable:
   ```
   VITE_API_URL=https://<your-backend-railway-url>/api/v1
   ```
   > ⚠️ You must **rebuild** the frontend after setting `VITE_API_URL` since Vite bakes it in at build time.

### Step 4 — CORS (Production)
In `backend/main.py`, update `allow_origins`:
```python
allow_origins=["https://your-frontend-railway-url.up.railway.app"]
```

---

## 🗄️ Database Schema

```
users              projects            tasks
─────────────      ────────────────    ──────────────────────
id (PK)            id (PK)             id (PK)
name               name                title
email (unique)     description         description
hashed_password    owner_id (FK)       status (enum)
is_active          created_at          priority (enum)
created_at         updated_at          due_date
                                       project_id (FK)
project_members                        assignee_id (FK)
───────────────                        created_by (FK)
user_id (FK) PK                        created_at
project_id (FK) PK                     updated_at
role (enum)
```

---

## 🧪 Testing the API

Once running, visit `http://localhost:8000/docs` for the interactive Swagger UI.

**Quick test flow:**
1. `POST /api/v1/auth/register` — create an account
2. Copy the `access_token` from the response
3. Click **Authorize** in Swagger → paste the token
4. `POST /api/v1/projects` — create a project
5. `POST /api/v1/projects/{id}/tasks` — add tasks
6. `GET /api/v1/dashboard/stats` — view your stats

---

## 🛡️ Security Features

- Passwords hashed with **bcrypt** (passlib)
- JWTs signed with **HS256** — configurable expiry
- All routes require Bearer token except `/auth/register` and `/auth/login`
- SQL injection prevented by SQLAlchemy ORM parameterized queries
- CORS configured (restrict `allow_origins` in production)
- Environment secrets via `.env` (never committed)
