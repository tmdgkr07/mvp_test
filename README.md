# mvp_platform

`mvp_platform` is the monorepo that groups the dashboard app and widget runtime into one workspace.

## Apps

- `apps/dashboard-web`: auth, service hub, admin, analytics, creator-facing management
- `apps/public-api`: widget-facing public APIs and payment return pages
- `apps/widget-cdn`: hosted `widget.js` runtime and versioned widget assets

## Packages

- `packages/shared`: shared runtime constants and helpers

## Commands

```bash
npm install
npm run typecheck
npm run build
npm run dev:dashboard
npm run dev:api
npm run dev:widget
```
