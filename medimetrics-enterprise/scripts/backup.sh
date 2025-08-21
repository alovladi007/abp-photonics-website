#!/bin/bash
set -e

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup to $BACKUP_DIR..."

# Backup PostgreSQL
echo "📦 Backing up PostgreSQL..."
docker-compose exec -T postgres pg_dump -U postgres medimetrics | gzip > "$BACKUP_DIR/postgres.sql.gz"

# Backup MinIO data
echo "📦 Backing up MinIO..."
docker-compose exec minio mc mirror --overwrite minio/medimetrics-raw "$BACKUP_DIR/minio-raw"
docker-compose exec minio mc mirror --overwrite minio/medimetrics-derivatives "$BACKUP_DIR/minio-derivatives"
docker-compose exec minio mc mirror --overwrite minio/medimetrics-reports "$BACKUP_DIR/minio-reports"

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "2.0.0",
  "components": ["postgres", "minio"]
}
EOF

# Compress backup
echo "📦 Compressing backup..."
tar -czf "$BACKUP_DIR.tar.gz" -C backups "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

echo "✅ Backup complete: $BACKUP_DIR.tar.gz"