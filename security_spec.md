# Security Spec: Figus Mundial 2026

## Current Architecture

Firebase was removed. The app now uses:

- Google OAuth directly for Drive/Sheets access.
- One Google Sheet per user as the trusted source of album data.
- `localStorage` as a local browser cache.
- Locally stored friend sheet IDs for exchange comparisons.

## Data Invariants

1. **Sheets Ownership**: The user's own album is written only through the Google OAuth token granted by that user.
2. **Trusted Source**: On manual sync and startup sync, Google Sheets is treated as the trusted state.
3. **Local Cache**: `localStorage` is a convenience cache only, not an authority.
4. **Friend Access**: Friend albums are readable only if the friend shared their Google Sheet with the current Google account.
5. **No Shared Backend**: There is no central user database, friendship table, or server-side profile store.

## Expected Failure Modes

- Missing `VITE_GOOGLE_CLIENT_ID`: the app cannot start OAuth.
- OAuth token expired: the app keeps local cache and asks the user to reconnect.
- Sheet deleted or inaccessible: the app asks the user to reconnect or recreate/find a sheet.
- Friend sheet not shared: comparison fails with a permission message.

## Security Notes

- Do not store long-lived refresh tokens in the browser.
- Do not treat friend sheet IDs as secret credentials.
- Do not assume local cache is tamper-proof.
- Google Sheet sharing controls are the access-control boundary for friend comparisons.
