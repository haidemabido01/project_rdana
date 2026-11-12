# RDANA FastAPI Backend

Authentication and session API for the RDANA web application.

## Stack

- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy 2 with SQLite by default
- PyJWT bearer tokens
- bcrypt password hashing

## Setup

```powershell
cd rdana-web-app\backend
uv sync --extra dev
Copy-Item .env.example .env
```

Generate a real JWT secret and place it in `.env`:

```powershell
uv run python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## Run

```powershell
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API: http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/health

The SQLite database and seeded accounts are created automatically on startup.

## Frontend

From `rdana-web-app`:

```powershell
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000`. For a separate deployment, set
`VITE_API_URL` before building the frontend:

```powershell
$env:VITE_API_URL="https://your-rdana-api.example.com"
npm run build
```

## Demo accounts

Passwords are bcrypt-hashed in the database. Set `RDANA_DEMO_MODE=false` to
disable the demo credentials endpoint in production.

| Role | Username | Password |
| --- | --- | --- |
| Super Admin | `crissalen.danao` | `superadmin123` |
| MDRRMO Admin | `roberto.dizon` | `admin123` |
| DepEd | `elena.ramos` | `deped123` |
| MHO | `grace.lim` | `mho123` |
| OMAG | `ramon.valderama` | `omag123` |
| MSWDO | `teresa.villanueva` | `mswdo123` |
| MASSO | `carlos.mendoza` | `masso123` |
| MEO | `arthur.salazar` | `meo123` |
| MPDO | `diana.cruz` | `mpdo123` |

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Verify username/password, return JWT and profile |
| GET | `/api/auth/me` | Return the authenticated user |
| POST | `/api/auth/logout` | Confirm sign-out for the current token |
| GET | `/api/auth/demo-accounts` | Demo credentials when `RDANA_DEMO_MODE=true` |
| GET | `/api/health` | Service health |

## Tests

```powershell
uv run pytest
```

## Notes

The backend currently owns authentication and user profiles. Assessments,
reports, archives, and audit-log records are still stored in the browser
(Dexie/localStorage) and can be migrated to SQLAlchemy models in the next step.
