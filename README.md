# Google Maps Leads Web

A full-stack platform for scraping business leads from Google Maps. Create scraping jobs through a web interface, track progress in real time, and export results as CSV or JSON.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  React SPA  │────▶│  FastAPI    │────▶│   RabbitMQ      │
│  (nginx)    │     │  REST API   │     │   (job queue)   │
└─────────────┘     └──────┬──────┘     └────────┬────────┘
                           │                      │
                    ┌──────▼──────┐     ┌─────────▼────────┐
                    │ PostgreSQL  │◀────│  Celery Worker   │
                    │  (storage)  │     │  (Playwright)    │
                    └─────────────┘     └──────────────────┘
```

| Service    | URL                          | Description                     |
|------------|------------------------------|---------------------------------|
| Frontend   | http://localhost              | React dashboard                 |
| API        | http://localhost:8000        | FastAPI REST API + Swagger docs |
| RabbitMQ   | http://localhost:15672       | Queue management (guest/guest)  |
| Flower     | http://localhost:5555        | Celery worker monitoring        |

## Requirements

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) v2.20+

## Quick Start

**1. Clone the repository**

```bash
git clone https://github.com/a-kul/google-maps-leads-web.git
cd google-maps-leads-web
```

**2. Create the environment file**

```bash
cp .env.example .env
```

The default `.env` works out of the box for local use. Edit it if you need custom credentials:

```env
DATABASE_URL=postgresql://leads:leads@db:5432/leads
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//
```

**3. Build and start all services**

```bash
docker compose up --build
```

First build takes a few minutes — the worker image downloads Chromium (~300 MB).

**4. Open the dashboard**

```
http://localhost
```

## Usage

### Creating a scrape job

1. Go to **Jobs** → click **+ New Job**
2. Enter a search query, e.g. `dentists in Austin TX`
3. Optionally enable **geo-location bias** and provide latitude, longitude, and radius (in meters)
4. Set max results and click **Start Scraping**

The job is instantly placed in the RabbitMQ queue and picked up by a Celery worker.

### Monitoring progress

The job detail page auto-refreshes every 3 seconds while the job is running. You can see:

- Live progress bar (leads found / max results)
- Leads appearing in the table as they are scraped
- Job duration and timestamps

### Exporting data

On the job detail page, click **CSV** or **JSON** to download all leads for that job.

The API also supports direct export:

```bash
# CSV
curl http://localhost:8000/api/v1/jobs/<job_id>/leads/export?format=csv -o leads.csv

# JSON
curl http://localhost:8000/api/v1/jobs/<job_id>/leads/export?format=json -o leads.json
```

### Cancelling a job

Click **Cancel** on the job list or job detail page. The worker stops after the current place finishes loading.

## API Reference

Interactive docs available at **http://localhost:8000/docs**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/jobs/` | Create a new scrape job |
| `GET` | `/api/v1/jobs/` | List all jobs |
| `GET` | `/api/v1/jobs/{id}` | Get job details |
| `POST` | `/api/v1/jobs/{id}/cancel` | Cancel a running job |
| `DELETE` | `/api/v1/jobs/{id}` | Delete job and its leads |
| `GET` | `/api/v1/jobs/{id}/leads` | Get leads for a job |
| `GET` | `/api/v1/jobs/{id}/leads/export` | Export leads (CSV or JSON) |
| `GET` | `/api/v1/leads` | Browse all leads across all jobs |
| `GET` | `/api/v1/stats/` | Dashboard statistics |

**Create job request body:**

```json
{
  "query": "restaurants in New York",
  "lat": null,
  "lng": null,
  "radius": null,
  "max_results": 50,
  "scrolls": 20,
  "timeout_seconds": 30,
  "delay_seconds": 0.4
}
```

## Project Structure

```
.
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   └── app/
│       ├── main.py          # FastAPI application
│       ├── config.py        # Settings (reads .env)
│       ├── database.py      # SQLAlchemy engine + session
│       ├── models.py        # Job and Lead ORM models
│       ├── schemas.py       # Pydantic request/response schemas
│       ├── scraper.py       # Playwright-based Google Maps scraper
│       ├── celery_app.py    # Celery + RabbitMQ configuration
│       ├── worker.py        # Celery task: run_scrape_job
│       └── routers/
│           ├── jobs.py      # Job CRUD endpoints
│           ├── leads.py     # Leads endpoints + export
│           └── stats.py     # Dashboard stats
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── types.ts
        ├── components/
        │   ├── CreateJobModal.tsx
        │   └── StatusBadge.tsx
        └── pages/
            ├── Dashboard.tsx
            ├── Jobs.tsx
            ├── JobDetail.tsx
            └── Leads.tsx
```

## Useful Commands

```bash
# Start in background
docker compose up -d

# Stop all services
docker compose down

# View worker logs (scraping activity)
docker compose logs -f worker

# Scale to 4 parallel workers
docker compose up -d --scale worker=4

# Rebuild after code changes
docker compose up --build

# Remove all data (volumes)
docker compose down -v
```

## Scaling Workers

To run multiple workers in parallel (useful for large scraping jobs):

```bash
docker compose up -d --scale worker=4
```

Each worker handles one job at a time with 2 concurrent browser processes.

## Notes

- Google Maps enforces rate limits. Use `delay_seconds >= 0.4` to avoid being blocked.
- The scraper runs a real Chromium browser in headless mode — each worker uses ~300 MB RAM.
- Scraped data is public information visible on Google Maps pages.
