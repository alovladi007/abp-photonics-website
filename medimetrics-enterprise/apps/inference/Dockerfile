FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Copy project files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# Copy application code
COPY src ./src

# Create non-root user
RUN useradd -m -u 1001 inference && \
    chown -R inference:inference /app

USER inference

EXPOSE 9200

CMD ["uvicorn", "src.server.main:app", "--host", "0.0.0.0", "--port", "9200"]