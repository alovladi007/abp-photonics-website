#!/bin/bash

# Initialize MinIO buckets for MediMetrics

echo "Waiting for MinIO to be ready..."
sleep 10

# Configure MinIO client
docker exec medimetrics-minio mc alias set minio http://localhost:9000 medimetrics medimetricssecret

# Create buckets
docker exec medimetrics-minio mc mb minio/medimetrics-raw
docker exec medimetrics-minio mc mb minio/medimetrics-derivatives
docker exec medimetrics-minio mc mb minio/medimetrics-reports
docker exec medimetrics-minio mc mb minio/medimetrics-models
docker exec medimetrics-minio mc mb minio/medimetrics-backups

# Set bucket policies
docker exec medimetrics-minio mc policy set download minio/medimetrics-reports

echo "MinIO buckets created successfully!"