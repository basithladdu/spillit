# Spillit product readiness — 2026-09-05

Verdict: frontend reliability improved and local checks pass; NOT ready for a production release. No deployment or external service configuration was performed.

## Scope and evidence

The starting checkout was clean on `main`, at `bc63b06`, with origin `https://github.com/basithladdu/spillit.git`. Work stayed in this nested app. The active product is React/Vite with Supabase auth, memories, profiles and image storage, and Mapbox maps. The historical civic-reporting, Firebase functions and video-processor documents are not evidence that these memory flows are operational.

## Implemented

- Validated coordinate presence and geographic ranges consistently, including the equator, prime meridian and `(0, 0)`. Missing URL parameters stay missing.
- Added real manual latitude/longitude inputs to the posting form. The map's unavailable message now points to an actual fallback.
- Stabilized the photo/location callback, fixed the street/satellite toggle, bounded reverse geocoding, and ignored stale address responses. Invalid manual coordinates no longer leave a misleading marker.
- Removed the separate cached-user authentication source. Session failures clear the local user state, and logout failures are surfaced.
- Completed unavailable-client methods for profile and password flows so missing configuration produces an error rather than a missing-method crash.
- Made account linking truthful: guest posts are unlinked; signed-in people can explicitly save a memory to their account. Names are not displayed on memory pages. Public story/photo/location visibility is stated before posting.
- Prevented duplicate concurrent submission, used the returned database row for the immediate feed update, and closed the editor before the success summary. Summary layout now scrolls on small screens.
- Profile visits no longer create records automatically or invent zero statistics after failed reads. The retry state protects the editor from displaying failed loads as an empty profile.
- Made the desktop feed retry interactive; removed the unconditional live indicator and misleading zero count after failure; added an archive link to the map fallback.
- Reduced archive header/statistics overhead and empty image blocks. Search covers captions, types, places and IDs; pagination clamps when results shrink. Text-only detail pages are compact.
- Detail read failures are caught; votes require a returned row before the UI treats the write as saved. This is not atomic voting (see blockers).

## Verification performed

- `node --test scripts/product-regressions.test.js`: 2 tests passed. Covers valid/invalid/zero coordinates and absent-service profile/password methods.
- `npm.cmd run lint`: passed, zero warnings.
- `npm.cmd run build`: passed (`tsc --noEmit` and Vite), one production build. Existing warnings: outdated browser compatibility data and large chunks (Mapbox about 1.67 MB raw, main entry about 585 KB raw).
- Real rendered in-app browser: desktop 1280px, mobile 390x844 and 375x812. Chrome was not exposed by the bridge, so this is not real Chrome/device proof.
- Actual configured app: failed map/feed states, working desktop retry, open/close posting form, manual `(0,30)` accepted before the blank-story validation stopped submission. No real memory was published.
- Marked local fixtures: populated archive; Kurnool search returned 6/12 memories; exact ID search returned 1; pagination reached page 2/2; no-match and genuinely empty states; 375px detail; guest upvote redirected to login; forged legacy cached user could not open `/profile`. Measured document widths did not exceed the 390px archive and 375px detail viewports.
- No signup, password change, email, upload, vote, moderation or database write was performed against a real service. Successful persistence and recovery-email delivery are unverified.

Local fixture URL after starting Vite: `/scripts/product-fixture.html`. Add `?empty=1`, `?route=/profile&stale-user=1`, or `?route=/memory/qa-memory-0`. This harness is outside the production entry graph, is visibly labelled, substitutes local memory/session reads, and blocks auth/storage mutations. It is a testing aid, never production data.

## Release blockers and remaining gaps

1. The configured Supabase hostname currently fails DNS resolution. Actual memory reads fail. Supply a functioning project URL/key and verify tables, auth, image storage and realtime in an authorized test environment.
2. The configured Mapbox token exists, but the rendered app reaches its HTTP-401-specific fallback. Replace/repair token access and verify a real map, pin, drag and geocoding flow. No token was changed.
3. No Supabase schema, RLS policies or storage policies are versioned here. Frontend admin email gating is not database authorization. Verify owner-only profiles, permitted anonymous inserts, safe public columns, restricted image operations and server-enforced admin mutations before release.
4. Votes replace `upvotes`/`upvoted_by` from a client snapshot. Concurrent votes can overwrite each other; unrestricted update policies could allow tampering. Implement an atomic authenticated database operation and test denial/concurrency once the schema is available.
5. `useReports` is still a placeholder. There is no complete report/appeal/moderation workflow. Admin delete/status controls and persistence have not been tested against a real authorized account.
6. The profile avatar control remains disabled. Account-linked statistics exist, but a complete owner memory-management/history flow is absent. Public queries use `select('*')`; do not assume account or voter IDs are hidden by anonymous display labels.
7. Home loads 100 rows, operations 200 and rankings 50; archive reads are subject to backend result limits. These are not certified global totals. City counting still derives the last address segment, which can be a country rather than a city.
8. Canonical metadata still references `spillit.app`, while prior deployment notes refer to another hostname. Confirm the intended production origin before release. Social metadata is client-generated; crawler previews are not verified.
9. Historical backend/deployment docs include credential-like values and obsolete claims. Their validity is unknown; audit and rotate any real exposed credentials through the owner before a release. No secret values are repeated here.

## Product-pattern research

Inspected [Historypin](https://www.historypin.org/) in the real browser: the useful pattern is direct discovery of stories attached to places. Applied that emphasis to compact text-first memories and place search. No third-party visual or video was copied or downloaded; stock media would obscure the real user-memory boundary and add weight.

Session behavior was checked against [Supabase getSession documentation](https://supabase.com/docs/reference/javascript/auth-getsession) and the [Supabase changelog](https://supabase.com/changelog). Client session state remains UI state; authorization must be enforced by database policies.
