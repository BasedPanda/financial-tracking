# Dockerfile.ml
# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Download pre-trained models
RUN python -c "from src.models import download_models; download_models()"

# Expose port
EXPOSE 8000

# Set environment variables
ENV MODEL_PATH=/app/models
ENV PYTHONUNBUFFERED=1

# Start the FastAPI server
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]