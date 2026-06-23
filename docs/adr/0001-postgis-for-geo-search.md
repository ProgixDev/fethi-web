# Use PostGIS for location and radius search

**Status:** accepted

MyStreet's feed and map are distance-driven: listings are searched within a radius
(default 500m) and sorted by distance, and saved searches persist a centre + radius.
We enable the **PostGIS** extension and store location as a `geography(Point,4326)`
column (generated from the plain `lat`/`lng` columns the mobile contract already
exposes) with a **GIST** index, querying via `ST_DWithin` / `ST_Distance`.

## Considered options

- **Plain `lat`/`lng` + haversine in SQL** — no spatial index, so the most common
  query (radius + distance sort) does a full scan or relies on a hand-rolled
  bounding-box prefilter that we'd remove once we adopted PostGIS anyway.
- **Defer geo entirely to a later SCR** — blocks the core map/feed feature.

## Consequences

- Keeping plain `lat`/`lng` alongside the generated geography column means the
  shipped mobile types (`lat`, `lng`, `distanceMeters`) stay valid; spatial search
  is an additive capability, not a contract change.
- Adds the PostGIS extension to the project (Supabase supports it first-class).
- Reversing later (dropping PostGIS) would mean rewriting every distance query and
  index — hence recording the choice here.
