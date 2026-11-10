# The Human Rewilding Clinic

An interactive Clinic and room study by Mere Cui, developed for Computational Design Practices Colloquium 2.

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

## Clinic architectural study

The Clinic adds a 15.6 by 10.8 metre spatial proposal with consultation, environmental trial, and operations spaces. The ground-floor drawing and model use the same geometry register. Three-dimensional parts include a clear sliding leaf with 1.10 m travel, louvers between zero and seventy-five degrees, and a removable mesh cassette. These are movable architectural mechanisms; the Clinic room has no thermal, airflow, filtration, microbial or health simulation.

The current architectural iteration uses a shallow tailored canopy, fine aluminium edges, pleated membranes, a honed ivory floor and a three-part padded body platform. Exterior, cutaway and interior viewpoints share the same model. The Clinic uses a neutral reflection environment; the patient home retains its original lighting. Save view exports a clean PNG of the model from the current camera.

The courtyard, surrounding streets and Room 001 now share a silver, ivory and green material family, layered openings and visible service details. These architectural changes do not alter the registered room dimensions, opening area or thermal parameters. Clinic furniture faces its actual work surface; device stands and feet are measured against the model's floor and desk surfaces. A real aperture separates the patient display from the surrounding membrane.

The patient gives consent, begins the rehearsal, and may pause or end it. A physical pause control remains a patient action even when the viewer is using the staff perspective. Staff can revise the artwork's classification thresholds with a reason and a visible version history, but cannot restart a paused patient trial. The perspective switch is a demonstration, not authentication. The public case window shows only Room 001. The Clinic rehearsal is held in page memory and clears on reload; ending it locks apparatus changes and rule revisions. Export is explicit. The existing home permission review retains its separate browser-local storage.

The patient-home thermal calculations remain unchanged. Clinic monitors replay the source home record, not the Clinic's environmental conditions or a selected future scenario.

## Checks

```sh
node --test tests/*.test.mjs
```

## Assets

Architecture was modelled for this study. Scanned plants, furniture, textures and environment lighting use CC0 assets from Poly Haven. See spatial/assets/sources.json for the source register.
