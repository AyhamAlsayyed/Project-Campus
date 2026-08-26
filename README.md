# Project Campus

Project Campus is a campus-focused social platform that connects university students through posts, communities, friends, real-time-style chat, and event/notification updates. Users sign up and verify their identity with an academic email, then join their university's communities, follow friends, and interact with a social feed built around campus life.

**Stack:** Django REST Framework (JWT auth) + PostgreSQL on the backend, React (Tailwind CSS) on the frontend.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Documentation](#documentation)
- [Contributors](#contributors)

---

## Features

- **Authentication** — Academic email verification (send/verify code), signup, JWT-based login/session
- **Feed & Posts** — Create posts, like, save, report, and block content
- **Comments** — Threaded comments on posts
- **Communities** — Browse, join, and request to join university/interest communities
- **Friends** — Send, accept, and decline friend requests; friends list; recently contacted
- **Chat** — Conversations and direct messaging
- **Notifications** — Notifications with read/delete actions
- **Profiles** — Editable profile with bio, profile/banner images, and status (online/away/DND/offline)

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5, Django REST Framework, Simple JWT |
| Database | PostgreSQL |
| Frontend | React 19, React Router, Tailwind CSS |
| Auth | JWT (access/refresh) via `djangorestframework-simplejwt` |
| Other | django-cors-headers, Pillow (image uploads) |

## Project Structure

```
Project-Campus/
├── backend/
│   ├── api/
│   │   ├── views/
│   │   │   ├── auth/           # login, signup, email verification
│   │   │   ├── user/           # profile, friends, recently contacted
│   │   │   ├── posts/          # feed, create, like/save/report/block
│   │   │   ├── comment/        # comments
│   │   │   ├── communities/    # browse/join communities
│   │   │   ├── conversation/   # chat
│   │   │   └── notification/   # notifications
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── migrations/
│   ├── backend/                # Django project settings
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── pages/               # LandingPage, HomePage, ProfilePage, ChatsPage, CommunityPage, etc.
│   │   ├── components/          # Reusable UI components
│   │   └── i18n/
│   └── public/
├── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn
- PostgreSQL

### Backend Setup

```bash
# from the project root
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cd backend
cp .env.example .env            # create and fill in your own .env (see below)
python manage.py migrate
python manage.py createsuperuser   # optional
python manage.py runserver
```

The API will be available at `http://localhost:8000/`.

### Frontend Setup

```bash
cd frontend
yarn install
yarn start
```

The app will be available at `http://localhost:3000/`.

## Environment Variables

Create a `.env` file inside `backend/` with:

```
DJANGO_SECRET_KEY=your-secret-key
db_name=your-db-name
db_user=your-db-user
db_password=your-db-password
```

> Never commit your real `.env` file — only commit a `.env.example` with placeholder values.

## API Overview

Base URL: `/api/`

| Endpoint | Description |
|---|---|
| `POST /auth/send_code/` | Send academic email verification code |
| `POST /auth/verify_code/` | Verify email code |
| `POST /auth/signup/` | Create account |
| `POST /auth/login/` | Log in, receive JWT |
| `GET /auth/me/` | Current authenticated user |
| `GET /posts/feed/` | Get feed posts |
| `POST /posts/create/` | Create a post |
| `POST /posts/<id>/like/` | Like/unlike a post |
| `GET /communities/` | List communities |
| `POST /communities/<id>/join/` | Join a community |
| `POST /friends/request/` | Send a friend request |
| `GET /chats/` | List conversations |
| `GET /notifications/` | List notifications |

*(See `backend/api/urls.py` for the full route list.)*

## Documentation

Full project documentation (requirements, ERD/database design, and UI/UX design references) lives in [`/docs`](./docs):

- `docs/report.pdf` — full project report (system design, key screens, and key data tables)
- `docs/database-schema.xlsx` — full database schema (referenced/excerpted in the report)
- `docs/design/` — link or export of the complete Figma UI/UX file (all screens); the report itself includes only the primary/representative screens

## Contributors

- [Ayham Al Sayed](https://github.com/AyhamAlsayyed)
- [Ibrahem Al Sharif](https://github.com/ibrahemkhalsharif-cmd)
- [Laith Abu Arrah](https://github.com/ITsLieTH)
