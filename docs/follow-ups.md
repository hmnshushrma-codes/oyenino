# Follow-ups

Open items found while building the Home Server Starter Pack. None of these are fixed yet. Items in `form-utils.js` need the owner's OK first (see `guide.md`, "Changing form-utils.js"), and each fix needs a check in `scripts/check-starter-pack.js` or a browser test.

## Bugs in form-utils.js (affect every gated page)

### 1. The first tap on Unlock can be lost

- **What happens:** a visitor types their email and taps the Unlock button straight away. Leaving the email field runs the email check again (the `blur` handler dispatches `input`). That sets the email to "not yet valid" while the MX lookup runs and disables the button for about 600 ms. The tap lands on a disabled button and does nothing. The button text briefly reads "Enter a valid email first".
- **Seen on:** `starter-pack.html`, `sql-cheat-sheet.html`, `veyra/index.html` and `booking-prompt.html`, in local browser tests on 16 November 2026.
- **Likely fix:** in the `blur` handler, skip the re-check if the email has not changed since the last successful check, or keep the button enabled while a check for an already-verified domain runs (the result is cached in `mxCache`).
- **Risk if left:** visitors from a reel may think the form is broken after the first tap.

### 2. Bare 10-digit Indian phone numbers get the wrong country code

- **What happens:** `formatPhoneDisplay("98765 43210")` returns `+9876543210` instead of `+91 98765 43210`. The number is treated as international because it has no `+91`, `91` or `0` prefix. The same wrong value is shown in the field after `blur` and saved as `phone_formatted` in the dashboard.
- **Seen on:** every page that uses `phoneId`. `starter-pack.html` works around it by adding `+91` before the form is sent.
- **Likely fix:** in `formatPhoneDisplay`, treat a bare 10-digit number starting with 6 to 9 as Indian (`+91`) before the international rule.
- **Also check:** existing rows in the admin dashboard where `phone_formatted` looks like `+[6-9]XXXXXXXXX` (10 digits after `+`). These are probably Indian numbers saved wrongly.

## Waiting for a decision

3. **Email domains in GA.** Three events send the email domain: `email_mx_verified`/`email_mx_failed`, `email_typo_fixed` and `email_server_rejected`. They are listed as exceptions in the check. Decide whether to keep them or remove them.
4. **Skipping device details and the ipapi.co lookup.** `form-utils.js` always collects device details and sends the visitor's IP to ipapi.co. Proposed change: two options, `collectDevice: false` and `collectLocation: false`, with existing pages unchanged. The backend already records the IP from Cloudflare.

## Backend (private repos, plan in docs/retention-cron-plan.md)

5. Scheduled deletion of submissions older than 24 months (`oyenino-admin`).
6. A "delete everything for this email" action in the admin dashboard, for deletion requests.
7. Optional: cut the KV backup lifetime from 90 to 30 days. The privacy policy now says backups expire within 90 days, so this is no longer required, but it shortens how long deleted data survives.
8. Remove personal data from the notification emails, and clean up the ones already in the inbox.

## Content

9. Confirm the brand line in `content/starter-pack/start-here.md`. It is currently a placeholder, "Made by Oui Nino (@oye.nino, oyenino.com).", while the rest of the site says "Oye Nino". After changing it, run `node scripts/build-starter-pack-content.mjs` and `node scripts/check-starter-pack.js`.
