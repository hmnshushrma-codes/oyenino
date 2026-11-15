# Plan: automatic deletion of old form submissions

Status: **plan only. Nothing here is built yet.** The backend repos (`api_oyenino`, `oyenino_admin`) are private and were read, not changed.

Note: this repo is public. This file names services and tables but contains no IDs, secrets or email addresses. Keep it that way.

## Why

The privacy policy (section 3) currently promises:

- personal data is kept while the mailing list is active,
- it is deleted **within 30 days** of a deletion request,
- the data is reviewed at least once a year.

Nothing deletes data automatically today. This plan adds a scheduled job that deletes submissions older than 24 months, and covers the other places personal data ends up. Once it runs reliably, the privacy policy can say "deleted 24 months after your last submission".

## Where personal data lives today

| Place | What is stored | How long today |
| --- | --- | --- |
| D1 `oyenino-forms-db`, table `submissions` (owned by the `oyenino-admin` Worker) | name, email, phone, IP, device info, ipapi.co location, full raw payload, `created_at` | Forever |
| KV `FORM_DATA` (in the `oyenino-forms` Worker) | Full copy of each submission (`data` and `meta`, including IP) | 90 days (automatic TTL) |
| Your inbox | One notification email per submission with name, email, phone, IP, device and location. The subject line includes the visitor's name | Forever |
| Resend | Logs and copies of the notification emails it sent | Depends on Resend's retention for your plan. Check the Resend dashboard |
| Google Analytics | No personal data, after the `visitor_name` fix on this branch. Email domains are still sent by three events, pending a decision | GA retention setting |

## Part 1: the scheduled Worker

### Where it runs

Add a `scheduled()` handler to the existing **`oyenino-admin`** Worker. It already owns the D1 binding, so no new Worker, binding or secret is needed.

`wrangler.toml` in `oyenino_admin`:

```toml
[triggers]
crons = ["30 21 * * 0"]   # every Sunday 21:30 UTC = Monday 03:00 IST
```

Weekly is enough. The policy only needs deletion to happen within days of the 24-month mark.

### The rule

Delete every row for a person whose **most recent** submission is older than 24 months. Someone who submitted a form 30 months ago and again last month is still active, so all their rows stay. Rows without an email are deleted by their own age.

`created_at` is stored as UTC text (`YYYY-MM-DD HH:MM:SS`), so SQLite date comparison works.

```sql
DELETE FROM submissions
WHERE id IN (
  SELECT id FROM submissions
  WHERE (email IS NULL AND created_at < datetime('now', '-24 months'))
     OR lower(trim(email)) IN (
          SELECT lower(trim(email)) FROM submissions
          WHERE email IS NOT NULL
          GROUP BY lower(trim(email))
          HAVING max(created_at) < datetime('now', '-24 months')
        )
  LIMIT 500
);
```

The handler runs this in a loop of up to 20 batches, stopping when a batch deletes 0 rows. That keeps each statement small and within D1 limits. If the 20-batch limit is reached, the next weekly run continues.

Optional index for speed, once the table is large:

```sql
CREATE INDEX IF NOT EXISTS idx_email_lower ON submissions(lower(trim(email)));
```

### Safety

- **Dry run first.** An environment variable `RETENTION_DRY_RUN = "true"` makes the job count the rows it would delete instead of deleting them. Run it dry for the first two weeks and compare the counts with what you expect.
- **Logs contain counts only**, for example `retention: deleted 12 rows (dry_run=false)`. No emails, names or IDs.
- **A run log table** (`retention_runs`: `run_at`, `rows_deleted`, `dry_run`, `error`) gives you a record of each run for the yearly review.
- **Failure alert.** If the job throws, send yourself a Resend email that says only "Retention job failed, see Worker logs". No personal data.
- **Take a D1 export** (`wrangler d1 export`) before the first real run, store it encrypted, and delete it after 30 days.

### Testing

1. Locally: `wrangler dev --test-scheduled`, then `curl "http://localhost:8787/__scheduled?cron=30+21+*+*+0"`.
2. Use a local D1 with fixtures:
   - one email whose only row is 25 months old (deleted),
   - one email with a 30-month-old row and a 1-month-old row (both kept),
   - a row with no email aged 25 months (deleted),
   - and the same with 23 months (kept).
3. Dry run in production for two weeks, then switch it off.

## Part 2: deletion on request (the 30-day promise)

Today a deletion request means finding the person by hand in four places. Proposed process:

1. **Admin dashboard:** add a "Delete everything for this email" action to `oyenino-admin`. It runs `DELETE FROM submissions WHERE lower(trim(email)) = ?` and writes a row to a `deletion_log` table with the date and row count only. Store a salted hash of the email, never the email itself.
2. **KV backups:** the smallest fix is to change the KV TTL in `oyenino-forms` from 90 days to **30 days** (`expirationTtl: 30 * 86400`). Backups then expire within the promised 30 days with no extra work. Scanning KV by email is not practical, because the keys are `form:timestamp`, not email.
3. **Inbox:** see Part 3.
4. **Resend:** check whether Resend lets you delete sent emails or set a short retention, and note the answer here.
5. **Reply** to the person once it is done, within 30 days of the request.

Until step 2 is done, the 90-day KV backups do not fit the "deleted within 30 days" promise. **Change the TTL before publishing the new privacy policy**, or delete matching KV entries by hand for each request.

## Part 3: notification emails in your inbox

The notification emails are full copies of each lead. Even with D1 deleted on time, they would keep everything forever.

**Recommended: stop putting personal data in the notification email.** Change `formatEmail()` and `emailSubject()` in `oyenino-forms` to send only:

- the form name,
- the submission time,
- a link to the admin dashboard.

For example, "New lead on starter_pack_gate. View it in the admin dashboard." Then D1 is the only full copy, the cron job covers it, and deletion requests touch one place.

**For emails already in your inbox,** or if you want to keep full emails:

1. Make a Gmail filter on the subject `[oyenino.com]` that applies a label, for example `oyenino-leads`.
2. For a deletion request, search `label:oyenino-leads "their@email"`, delete the matches, then empty the Trash. Gmail keeps Trash for up to 30 days, so emptying it matters for the 30-day promise.
3. For the yearly review, search `label:oyenino-leads older_than:2y` and delete.
4. Optional automation: a Google Apps Script with a weekly time-driven trigger that moves `label:oyenino-leads older_than:24m` threads to Trash. This runs in your Google account, not in Cloudflare.

## What needs your OK before building

1. Adding `scheduled()` and the two log tables to `oyenino-admin`.
2. Changing the KV TTL to 30 days in `oyenino-forms`.
3. Removing personal data from the notification emails.
4. Whether the 24-month rule should also delete leads who opted in to marketing and are still on the list. "While the list is active" suggests you might keep them. If so, the rule needs a `marketing_consent` column, because today it only sits inside `raw_data`.
