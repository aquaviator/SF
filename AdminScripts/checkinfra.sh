#!/usr/bin/env bash

# grab your current project ID & number
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")

echo "=== Cloud SQL Instance Status ==="
gcloud sql instances describe shiftflo-db \
  --project="$PROJECT_ID" \
  --format="table(name, state, region, databaseVersion)"

echo -e "\n=== SQL Users ==="
gcloud sql users list \
  --instance=shiftflo-db \
  --project="$PROJECT_ID" \
  --format="table(name, host)"

echo -e "\n=== Secrets in Secret Manager ==="
gcloud secrets list \
  --project="$PROJECT_ID" \
  --filter="name~'(DATABASE_URL|DB_PASSWORD)'" \
  --format="table(name, replication.automatic)"

echo -e "\n=== IAM Binding on DATABASE_URL for Cloud Build SA ==="
gcloud secrets get-iam-policy DATABASE_URL \
  --project="$PROJECT_ID" \
  --flatten="bindings[]" \
  --format="table(bindings.role, bindings.members)" \
  --filter="bindings.members:serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo -e "\n=== Enabled GCP Services ==="
gcloud services list \
  --project="$PROJECT_ID" \
  --enabled \
  --filter="config.name:(cloudbuild.googleapis.com run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com)" \
  --format="table(config.name)"
