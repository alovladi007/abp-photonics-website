#!/bin/bash
echo "Verifying MediMetrics Setup..."
ls -la scripts/ 2>/dev/null | head -5
ls -la apps/api/src/users/entities/ 2>/dev/null | head -3
ls -la apps/api/src/auth/ 2>/dev/null | head -3
echo "Setup verification complete"
