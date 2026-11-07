# Vercel visitor counter setup

The counter uses a Vercel Function and a private Vercel Blob store. The main portfolio records one private marker per browser tab session. The statistics page lists those saved markers when opened or refreshed; it does not subscribe to realtime updates.

1. Push this project to GitHub and import it into Vercel.
2. In the Vercel project, open **Storage**, create a **private Blob** store, and connect it to this project for Production and Preview.
3. Redeploy after connecting the store so the function receives the Blob credentials.
4. Open `/visitors.html`. The page should show the saved total after the deployment has recorded its first visit.

Vercel provides the Blob credentials to the server function. They are never exposed in browser JavaScript. Do not add a Blob token or any other secret to the repository.

The count is intended for a small portfolio and is approximate: the public endpoint can be called by automated clients, and each statistics-page load lists saved visit markers. Add rate limiting or move to a counter database if the site grows substantially.