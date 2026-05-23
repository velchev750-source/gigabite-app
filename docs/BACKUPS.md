# Database Backups

Gigabite uses a GitHub Actions workflow to create automated PostgreSQL backups from the Neon database and upload them to a private Cloudflare R2 bucket.

## What the Backup Does

The workflow:

- runs `pg_dump` against `DATABASE_URL`;
- creates a plain SQL dump;
- compresses it with `gzip`;
- uploads the `.sql.gz` file to Cloudflare R2 using the S3-compatible API;
- supports both scheduled and manual execution.

## Schedule

The backup runs once per day at:

```text
02:30 UTC
```

The workflow is also available through `workflow_dispatch`, so it can be started manually from GitHub Actions.

## Required GitHub Secrets

Configure these repository secrets in GitHub:

```text
DATABASE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BACKUP_BUCKET_NAME
```

For this project, the backup bucket is:

```text
gigabite-backups
```

Do not commit real secret values to the repository.

## Backup Location

Backups are stored in the private R2 bucket under:

```text
backups/db/
```

File names use this format:

```text
backups/db/gigabite-db-YYYY-MM-DD-HH-mm-ss.sql.gz
```

Example:

```text
backups/db/gigabite-db-2026-05-23-02-30-00.sql.gz
```

## Manual Run Instructions

1. Open the GitHub repository.
2. Go to `Actions`.
3. Select `Backup PostgreSQL Database`.
4. Click `Run workflow`.
5. Choose the branch.
6. Click `Run workflow` again to confirm.

## Restore Note

Download the backup file from R2, then restore it with `psql`.

Example:

```bash
gunzip -c gigabite-db-YYYY-MM-DD-HH-mm-ss.sql.gz | psql "$DATABASE_URL"
```

For a clean restore, use an empty database or manually drop existing objects first. Always test restore steps on a non-production database before restoring production data.

