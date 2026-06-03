# API image — lightweight, no browser
FROM python:3.12-slim AS api
WORKDIR /app
RUN pip install --no-cache-dir \
    "fastapi>=0.111" \
    "uvicorn[standard]>=0.29" \
    "sqlalchemy>=2.0" \
    "psycopg2-binary>=2.9" \
    "celery[rabbitmq]>=5.4" \
    "pydantic-settings>=2.2" \
    "flower>=2.0"
COPY app/ app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Worker image — installs Playwright and Chromium from scratch
FROM python:3.12-slim AS worker
WORKDIR /app
RUN pip install --no-cache-dir \
    "sqlalchemy>=2.0" \
    "psycopg2-binary>=2.9" \
    "celery[rabbitmq]>=5.4" \
    "pydantic-settings>=2.2" \
    "playwright>=1.44"
# Install Chromium browser binary + all system dependencies
RUN playwright install chromium --with-deps
COPY app/ app/
CMD ["celery", "-A", "app.celery_app", "worker", "--loglevel=info", "--concurrency=2", "-Q", "scrape"]
