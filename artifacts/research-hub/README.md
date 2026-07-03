# Research Hub (platform shell)

**Status:** Implemented in `@workspace/telehealth-survey` (v1.0.0). Physical artifact extraction deferred.

The hub shell lives at:

```
artifacts/telehealth-survey/src/platform/     # landing, system admin, health
artifacts/telehealth-survey/src/App.tsx       # composes hub + study routes
artifacts/telehealth-survey/src/studies/*/study-routes.tsx
```

When ready to split, extract `src/platform/` into this artifact and point `dev-local.ps1` at `@workspace/research-hub`.

See [docs/platform/conceptual-design.md](../../docs/platform/conceptual-design.md) and [CHANGELOG.md](../../CHANGELOG.md).
