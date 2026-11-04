# The Human Rewilding Clinic

An interactive room study by Mere Cui, developed for Computational Design Practices Colloquium 2.

The Department of Environmental Variability follows one constructed room case through its environmental record, an authored Clinic classification, four operating comparisons, and a local permission review.

## Open locally

Serve this directory with a static server:

```sh
python3 -m http.server 4173
```

Open http://127.0.0.1:4173/ in a browser.

## What runs

- A shared three-dimensional room, section and dimensioned plan.
- A one-state thermal balance with heating, cooling and assumed ventilation.
- Weighted daily-cycle fitting and duration-weighted equipment activity.
- Existing operation, scheduled opening, a wider thermostat range, and both changes.
- Resident consent and separate opening and thermostat permissions that change the reviewed calculation.
- An eleven-entity relation diagram with thermal, evidence, permission and care dependencies.
- CSV import, eighty-one paired sensitivity comparisons, a printable case and a full case export.

The source record is generated. Only Room 001 has a thermal model. Neighbouring places are constructed context, not additional monitored rooms. The trial classification is authored for this artwork and has no validated clinical status. Thermal energy is not electrical consumption. No health benefit or independent field validation is claimed.

Imported files and review responses are processed in the browser. This static site has no application server or shared patient database. Three.js loads from jsDelivr.

## Checks

```sh
node --test tests/*.test.mjs
```

## Assets

Architecture was modelled for this study. Scanned plants, furniture, textures and environment lighting use CC0 assets from Poly Haven. See spatial/assets/sources.json for the source register.
