# Taiwan + Singapore trip playbook

Live page: https://lmeng1214.github.io/trip-playbook/

- `index.html` is the whole app. It loads `./data.json` (no-store), keeps the last good copy on the phone for offline use, and needs no other files.
- `data.json` is the redacted plan: no confirmation codes, PINs or booking numbers. Booked stops say "Has confirmation" and link to the booking Doc in Drive when there is one.
- `data.json` is rewritten by the Apps Script `publishData()` (every 10 minutes, only when the sheet changed). Do not edit it by hand.
- Pages deploys from the `main` branch root. There is no Actions workflow.
