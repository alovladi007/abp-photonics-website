#!/bin/bash

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
until curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    sleep 2
done

echo "Creating MinIO buckets..."

# Configure MinIO client
docker run --rm --network medimetrics-enterprise_medimetrics \
    -e MC_HOST_minio=http://medimetrics:medimetricssecret@minio:9000 \
    minio/mc mb minio/medimetrics-raw

docker run --rm --network medimetrics-enterprise_medimetrics \
    -e MC_HOST_minio=http://medimetrics:medimetricssecret@minio:9000 \
    minio/mc mb minio/medimetrics-derivatives

docker run --rm --network medimetrics-enterprise_medimetrics \
    -e MC_HOST_minio=http://medimetrics:medimetricssecret@minio:9000 \
    minio/mc mb minio/medimetrics-reports

echo "✓ MinIO buckets created successfully"