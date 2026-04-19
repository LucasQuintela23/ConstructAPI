# ConstructAPI

**ConstructAPI** is a self-hosted open-source platform that generates dynamic REST APIs and data-entry forms from user-defined templates — no coding required.

## Features

- **Visual Template Builder** – Design data schemas with a drag-and-drop field editor (text, number, date, boolean, select, email, textarea)
- **Auto-generated REST API** – Every template instantly produces a full CRUD API (`GET`, `POST`, `PUT`, `DELETE`)
- **Auto-generated Forms** – Each template renders a data-entry form for manual record creation
- **Spreadsheet Import** – Bulk-ingest data by uploading Excel (`.xlsx`, `.xls`) or CSV files; column headers are mapped automatically to template fields (supports complex reports, RGF, STN accounting sheets)
- **Pagination & Search** – Browse records with server-side pagination and full-text search
- **Self-hosted** – Runs entirely on your infrastructure via Docker Compose; data never leaves your environment

---

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/LucasQuintela23/ConstructAPI.git
cd ConstructAPI

# 2. Start all services
docker compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:3001
```

---

## Local Development

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Backend

```bash
cd backend
npm install
npm run dev        # starts with nodemon on port 3001
```

Environment variables (`.env` or shell):

| Variable  | Default                         | Description             |
|-----------|---------------------------------|-------------------------|
| `PORT`    | `3001`                          | HTTP port               |
| `DB_PATH` | `./data/constructapi.db`        | SQLite database path    |

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3001`.

---

## API Reference

### Templates

| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/templates`        | List all templates       |
| POST   | `/api/templates`        | Create a new template    |
| GET    | `/api/templates/:id`    | Get a template by ID     |
| PUT    | `/api/templates/:id`    | Update a template        |
| DELETE | `/api/templates/:id`    | Delete a template        |

#### Template body example

```json
{
  "name": "Invoice",
  "description": "Invoice records",
  "fields": [
    { "name": "client_name", "label": "Client Name", "type": "text",   "required": true  },
    { "name": "amount",      "label": "Amount",      "type": "number", "required": true  },
    { "name": "due_date",    "label": "Due Date",    "type": "date",   "required": false },
    { "name": "status",      "label": "Status",      "type": "select", "required": false,
      "options": ["draft","sent","paid","overdue"] }
  ]
}
```

#### Supported field types

`text` · `number` · `date` · `boolean` · `select` · `email` · `textarea`

---

### Data (Dynamic CRUD)

Each template gets its own data endpoint:

| Method | Path                              | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | `/api/data/:templateId`           | List records (pagination + search) |
| POST   | `/api/data/:templateId`           | Create a record                    |
| GET    | `/api/data/:templateId/:id`       | Get a single record                |
| PUT    | `/api/data/:templateId/:id`       | Update a record                    |
| DELETE | `/api/data/:templateId/:id`       | Delete a record                    |

Query parameters for list:

| Param    | Default | Description                        |
|----------|---------|------------------------------------|
| `page`   | `1`     | Page number                        |
| `limit`  | `20`    | Records per page                   |
| `search` | `""`    | Full-text search on text fields    |

---

### Spreadsheet Upload

```
POST /api/upload/:templateId
Content-Type: multipart/form-data
```

Field: `file` — an `.xlsx`, `.xls`, or `.csv` file.  
Column headers are matched to template field **names** or **labels** (case-insensitive).

Response:

```json
{
  "imported": 42,
  "skipped": 2,
  "errors": [
    { "row": 5, "error": "Missing required field: client_name" }
  ]
}
```

---

## Project Structure

```
ConstructAPI/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express entry point
│   │   ├── database.js             # SQLite setup & helpers
│   │   ├── controllers/
│   │   │   ├── templates.js        # Template CRUD logic
│   │   │   ├── data.js             # Dynamic data CRUD logic
│   │   │   └── upload.js           # Spreadsheet ingestion
│   │   └── routes/
│   │       ├── templates.js
│   │       ├── data.js
│   │       └── upload.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js                  # Axios client
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Overview & stats
│   │   │   ├── Templates.jsx       # Template list
│   │   │   ├── TemplateBuilder.jsx # Visual builder
│   │   │   ├── DataView.jsx        # Data table + search
│   │   │   ├── FormView.jsx        # Data-entry form
│   │   │   └── UploadView.jsx      # Spreadsheet upload
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── FieldBuilder.jsx
│   │       ├── DataTable.jsx
│   │       └── FormRenderer.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Architecture

```
Browser  ──►  React (Vite/Nginx :3000)
                   │
                   │ /api/*
                   ▼
            Express API (:3001)
                   │
                   ▼
              SQLite DB
         (one table per template)
```

SQLite tables are created and dropped automatically:
- `templates` — stores template definitions (name, description, fields JSON)
- `data_{templateId}` — one table per template, columns derived from field definitions

All SQL identifiers are sanitised (alphanumeric + underscore only); column types are restricted to `TEXT`, `REAL`, `INTEGER`.

---

## Security

- UUID validation on all route parameters
- Field name sanitisation (`/^[a-zA-Z0-9_]+$/`)
- SQLite column type allowlist
- Rate limiting: 300 requests / minute / IP

---

## License

MIT
