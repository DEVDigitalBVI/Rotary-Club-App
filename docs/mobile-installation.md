# Mobile installation

Open the profile menu → Install mobile app (`/install`). The application can be added to a home screen and launched standalone. The manifest provides standard and maskable icons plus shortcuts to events, the service record, and chat.

Deploy over HTTPS for phone installation. On iPhone/iPad, use Safari → Share → Add to Home Screen. Chrome/Edge can show a native Install button when the browser offers installation; otherwise use its install menu. In-app browsers may need the website opened in Safari or Chrome first.

The production build registers `/sw.js`. Development does not register a worker, avoiding stale development assets. Only `/offline.html` is cached. Member pages, chat, API responses and form submissions are never stored or queued by the worker. A connection is required for club activity. A worker update waits for the member to select Update, allowing them to finish their work.

Validation: 105 unit tests passed, including offline fallback and cache boundaries; lint, TypeScript and production build passed. Manifest, icons, worker and offline document returned HTTP 200 without authentication on a temporary local production server. Physical iPhone and Android installation still requires testing against the deployed HTTPS site. Push notifications are not part of this implementation.
