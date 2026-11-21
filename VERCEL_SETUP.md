# Vercel visitor counter setup

The counter uses a Vercel Function and a private Vercel Blob store. Each visitor gets a long-lived `HttpOnly` cookie (`ad_visitor`), so one person is counted once even when opening new tabs or restarting the browser. The statistics page shows the saved total when opened or refreshed; it does not subscribe to realtime updates.

1. Push this project to GitHub and import it into Vercel.
2. In the Vercel project, open **Storage**, create a **private Blob** store, and connect it to this project for Production and Preview.
3. Redeploy after connecting the store so the function receives the Blob credentials.
4. Open `/visitors.html`. The page should show the saved total after the deployment has recorded its first visit.

Vercel provides the Blob credentials to the server function. They are never exposed in browser JavaScript. Do not add a Blob token or any other secret to the repository.

New visit records are rate limited to at most 30 per IP per minute, which still allows several people on the same campus/office network to be counted. Visit markers are stored under `portfolio-visits/` and rate-limit markers under `portfolio-rate/` in the same private store.

The count is intended for a small portfolio and is approximate: the public endpoint can still be called by automated clients, and deleting cookies makes the browser count as a new visitor. Add stronger rate limiting or move to a counter database if the site grows substantially.