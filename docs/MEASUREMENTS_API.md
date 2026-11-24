# Measurements API — Seller's Client & Measurement Book

Lets a seller (fashion designer) keep a client book and record outfit measurements against a per-garment, per-gender template — so the form only ever asks for the fields a given outfit actually needs.

- **Base URL:** `http://localhost:3900/api/v1/measurements`
- **Auth:** every route requires `Authorization: Bearer <token>` for a logged-in **SELLER**.
- **Response envelope:**
  ```json
  { "status": true | false, "message": "...", "data": { ... } | [ ... ] | null }
  ```
- **Validation errors** are `422` with a per-field map.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/templates` | Every dropdown: genders, garments + their fields per gender, units, fits, occasions |
| GET | `/stats` | Dashboard numbers: clients, measurements, this month, due-soon, overdue, by-garment |
| GET | `/clients?search=&gender=` | List your client book |
| POST | `/clients` | Add a client |
| GET | `/clients/:id` | One client + their full measurement history |
| PATCH | `/clients/:id` | Edit a client |
| DELETE | `/clients/:id` | Remove a client |
| GET | `/?search=&gender=&garmentType=&clientId=` | List measurements |
| POST | `/` | Record a measurement |
| GET | `/:id` | One measurement |
| PATCH | `/:id` | Edit a measurement |
| DELETE | `/:id` | Delete a measurement |

---

## GET `/templates`

Drives every dropdown in the "New measurement" flow — the frontend should never hardcode garments, fields, units, or occasions, since adding a new one here needs no migration.

**200**
```json
{
  "status": true,
  "message": "Measurement templates fetched successfully",
  "data": {
    "genders": [
      { "value": "FEMALE", "label": "Female" },
      { "value": "MALE", "label": "Male" }
    ],
    "units": [
      { "value": "INCH", "label": "Inches" },
      { "value": "CM", "label": "Centimetres" }
    ],
    "fits": [
      { "value": "SLIM", "label": "Slim fit" },
      { "value": "REGULAR", "label": "Regular fit" },
      { "value": "LOOSE", "label": "Loose fit" }
    ],
    "occasions": [
      "Wedding", "Owambe / Party", "Traditional ceremony", "Church / Mosque",
      "Office / Work", "Casual", "Birthday", "Graduation", "Other"
    ],
    "garments": {
      "FEMALE": [
        { "value": "GOWN", "label": "Gown / Dress", "fields": ["bust", "underBust", "shoulder", "bustPoint", "shoulderToBustPoint", "shoulderToUnderBust", "sleeveLength", "roundSleeve", "armhole", "shoulderToWaist", "waist", "hip", "gownLength"] },
        { "value": "BLOUSE", "label": "Blouse / Top", "fields": ["neck", "bust", "underBust", "shoulder", "bustPoint", "shoulderToBustPoint", "shoulderToUnderBust", "sleeveLength", "roundSleeve", "armhole", "waist", "blouseLength"] },
        { "value": "SKIRT", "label": "Skirt", "fields": ["waist", "hip", "skirtLength"] },
        { "value": "SKIRT_AND_BLOUSE", "label": "Skirt & Blouse", "fields": ["bust", "underBust", "shoulder", "bustPoint", "shoulderToBustPoint", "shoulderToUnderBust", "sleeveLength", "roundSleeve", "armhole", "waist", "hip", "blouseLength", "skirtLength"] },
        { "value": "IRO_AND_BUBA", "label": "Iro & Buba", "fields": ["bust", "shoulder", "sleeveLength", "roundSleeve", "blouseLength", "waist", "hip", "skirtLength"] },
        { "value": "TROUSERS", "label": "Trousers", "fields": ["waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength"] },
        { "value": "JUMPSUIT", "label": "Jumpsuit", "fields": ["bust", "shoulder", "sleeveLength", "roundSleeve", "waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength", "fullLength"] },
        { "value": "KAFTAN", "label": "Kaftan / Bubu", "fields": ["bust", "shoulder", "sleeveLength", "roundSleeve", "hip", "fullLength"] },
        { "value": "FULL_BODY", "label": "Full body (everything)", "fields": ["...all 22 female fields above, de-duplicated..."] }
      ],
      "MALE": [
        { "value": "SHIRT", "label": "Shirt", "fields": ["neck", "chest", "stomach", "shoulder", "sleeveLength", "roundSleeve", "wrist", "topLength", "shortSleeve"] },
        { "value": "SENATOR", "label": "Senator / Kaftan", "fields": ["neck", "chest", "stomach", "shoulder", "sleeveLength", "roundSleeve", "wrist", "topLength", "waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength"] },
        { "value": "AGBADA", "label": "Agbada", "fields": ["neck", "chest", "stomach", "shoulder", "sleeveLength", "roundSleeve", "wrist", "topLength", "agbadaLength", "waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength", "capSize"] },
        { "value": "BUBA_AND_SOKOTO", "label": "Buba & Sokoto", "fields": ["neck", "chest", "stomach", "shoulder", "sleeveLength", "roundSleeve", "wrist", "topLength", "waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength", "capSize"] },
        { "value": "SUIT", "label": "Suit / Blazer", "fields": ["neck", "chest", "stomach", "shoulder", "sleeveLength", "roundSleeve", "wrist", "jacketLength", "waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength"] },
        { "value": "TROUSERS", "label": "Trousers", "fields": ["waist", "hip", "thigh", "knee", "ankle", "crotch", "trouserLength"] },
        { "value": "FULL_BODY", "label": "Full body (everything)", "fields": ["...all 19 male fields above, de-duplicated..."] }
      ]
    },
    "fields": {
      "bust": { "key": "bust", "label": "Bust", "group": "UPPER_BODY", "hint": "Round the fullest part of the bust" },
      "waist": { "key": "waist", "label": "Waist", "group": "LOWER_BODY", "hint": "Round the natural waist" },
      "...": "one entry per field key used above — label + hint text + which group it belongs to"
    },
    "groups": [
      { "value": "UPPER_BODY", "label": "Upper body" },
      { "value": "ARMS", "label": "Arms" },
      { "value": "LOWER_BODY", "label": "Lower body" },
      { "value": "LENGTHS", "label": "Lengths" }
    ]
  }
}
```

**Field-count reference** (verified against the actual templates — use this to sanity-check the frontend's "X measurements" badges):

| Female garment | Fields | Male garment | Fields |
|---|---|---|---|
| Gown / Dress | 13 | Shirt | 9 |
| Blouse / Top | 12 | Senator / Kaftan | 15 |
| Skirt | 3 | Agbada | 17 |
| Skirt & Blouse | 13 | Buba & Sokoto | 16 |
| Iro & Buba | 8 | Suit / Blazer | 15 |
| Trousers | 7 | Trousers | 7 |
| Jumpsuit | 12 | Full body (everything) | 19 |
| Kaftan / Bubu | 6 | | |
| Full body (everything) | 22 | | |

---

## GET `/stats`

Numbers for the top of the measurements dashboard.

**200**
```json
{
  "status": true,
  "message": "Measurement stats fetched successfully",
  "data": {
    "totalClients": 1,
    "totalMeasurements": 1,
    "thisMonth": 1,
    "overdueLast30Days": 0,
    "dueSoon": [
      { "id": "...", "garmentType": "GOWN", "dueDate": "2026-12-20T00:00:00.000Z", "client": { "id": "...", "name": "Adaeze Okafor", "phone": "...", "gender": "FEMALE" } }
    ],
    "byGarment": [ { "garmentType": "GOWN", "count": 1 } ]
  }
}
```
`dueSoon` is up to 6 full measurement records due within the next 7 days (newest-due first) — use `dueSoon.length` for a count badge, or render the list directly as "due this week" items. `overdueLast30Days` is a count, not a list.

---

## Clients

### GET `/clients?search=&gender=`
Both query params optional. `search` matches name or phone (contains, case-insensitive).

**200**
```json
{
  "status": true,
  "message": "Clients fetched successfully",
  "data": [
    {
      "id": "5c547983-a6f2-40c2-a1e5-b069221f62c8",
      "name": "Adaeze Okafor",
      "phone": "0803 123 4567",
      "gender": "FEMALE",
      "notes": null,
      "createdAt": "...",
      "updatedAt": "...",
      "measurementCount": 3,
      "lastMeasuredAt": "2026-11-24T11:11:34.523Z",
      "lastGarmentType": "GOWN"
    }
  ]
}
```
Sorted by most-recently-measured first (`updatedAt desc` — adding a new measurement for a client bumps them to the top).

### POST `/clients`
```json
{ "name": "Adaeze Okafor", "phone": "0803 123 4567", "gender": "FEMALE", "notes": "Prefers loose fits" }
```
| Field | Rules |
|---|---|
| `name` | required, 2–100 chars |
| `phone` | optional |
| `gender` | required, `MALE` or `FEMALE` |
| `notes` | optional, max 1000 chars |

**201** — the created client (same shape as a list row, minus the computed `measurementCount`/`lastMeasuredAt`/`lastGarmentType` fields).

### GET `/clients/:id`
The client record plus their complete measurement history, newest first.
```json
{
  "status": true,
  "message": "Client fetched successfully",
  "data": {
    "id": "5c547983-...", "name": "Adaeze Okafor", "phone": "0803 123 4567", "gender": "FEMALE", "notes": null,
    "createdAt": "...", "updatedAt": "...",
    "measurements": [
      { "id": "7b6c90b7-...", "garmentType": "GOWN", "unit": "INCH", "fit": "REGULAR", "values": { "bust": 36, "waist": 28, "hip": 40, "gownLength": 58 }, "occasion": "Wedding", "dueDate": "...", "notes": "...", "createdAt": "...", "updatedAt": "..." }
    ]
  }
}
```
**404** `{ "message": "Client not found" }` if it doesn't exist or belongs to another seller.

### PATCH `/clients/:id`
All fields from the create payload, optional. **400** `"Can't change gender for a client who already has measurements"` if you try to flip `gender` on a client who already has recorded measurements — the saved field values wouldn't match a different gender's template.

### DELETE `/clients/:id`
**200** `{ "message": "Client deleted successfully", "data": null }`. Deletes all of that client's measurements too.

---

## Measurements

### GET `/?search=&gender=&garmentType=&clientId=`
All query params optional and combinable. `search`/`gender` filter by the client; `garmentType`/`clientId` filter the measurement itself.

**200**
```json
{
  "status": true,
  "message": "Measurements fetched successfully",
  "data": [
    {
      "id": "7b6c90b7-...", "sellerId": "...", "clientId": "5c547983-...",
      "garmentType": "GOWN", "unit": "INCH", "fit": "REGULAR",
      "values": { "bust": 36, "waist": 28, "hip": 40, "gownLength": 58 },
      "occasion": "Wedding", "dueDate": "2026-12-20T00:00:00.000Z", "notes": "Satin fabric, zipper back",
      "createdAt": "...", "updatedAt": "...",
      "client": { "id": "5c547983-...", "name": "Adaeze Okafor", "phone": "0803 123 4567", "gender": "FEMALE" }
    }
  ]
}
```

### POST `/` — record a measurement

Either attach to an **existing client**:
```json
{
  "clientId": "5c547983-a6f2-40c2-a1e5-b069221f62c8",
  "garmentType": "GOWN",
  "unit": "INCH",
  "fit": "REGULAR",
  "values": { "bust": 36, "waist": 28, "hip": 40, "gownLength": 58 },
  "occasion": "Wedding",
  "dueDate": "2026-12-20",
  "notes": "Satin fabric, zipper back"
}
```

...or create the client **inline**, in the same call, by sending `client` instead of `clientId`:
```json
{
  "client": { "name": "Adaeze Okafor", "phone": "0803 123 4567", "gender": "FEMALE" },
  "garmentType": "GOWN",
  "values": { "bust": 36, "waist": 28, "hip": 40, "gownLength": 58 }
}
```
Exactly one of `clientId` / `client` must be present — sending both, or neither, is a `422`.

| Field | Rules |
|---|---|
| `clientId` / `client` | exactly one required (see above) |
| `garmentType` | required — one of that gender's `garments[].value` from `/templates` |
| `unit` | optional, `INCH` (default) or `CM` |
| `fit` | optional, `SLIM` / `REGULAR` (default) / `LOOSE` |
| `values` | required object, `{ fieldKey: number }` — every number > 0 and ≤ 500; at least one field |
| `occasion` | optional, max 60 chars (free text — the `/templates` list is suggestions, not enforced) |
| `dueDate` | optional date |
| `notes` | optional, max 1000 chars |

**`values` is checked against the garment's own field list for that client's gender** — this is the key integrity rule: sending a field that doesn't belong to the chosen garment (e.g. `wrist`, a male shirt field, against a female client's `TROUSERS` measurement) is rejected, not silently dropped:
```json
{ "status": false, "message": "Unknown measurement for Trousers: wrist" }
```
An unrecognized `garmentType` for that gender:
```json
{ "status": false, "message": "That outfit type isn't available for this client" }
```

**201**
```json
{
  "status": true,
  "message": "Measurement saved successfully",
  "data": {
    "id": "7b6c90b7-cd29-45f0-8cd9-0ad7af1d64a6",
    "sellerId": "8ae2f8be-...", "clientId": "5c547983-...",
    "garmentType": "GOWN", "unit": "INCH", "fit": "REGULAR",
    "values": { "bust": 36, "waist": 28, "hip": 40, "gownLength": 58 },
    "occasion": "Wedding", "dueDate": "2026-12-20T00:00:00.000Z", "notes": "Satin fabric, zipper back",
    "createdAt": "2026-11-24T11:11:34.523Z", "updatedAt": "2026-11-24T11:11:34.523Z",
    "client": { "id": "5c547983-...", "name": "Adaeze Okafor", "phone": "0803 123 4567", "gender": "FEMALE" }
  }
}
```

### GET `/:id`
Single measurement, same shape as one row above. **404** `{ "message": "Measurement not found" }` if it doesn't exist or belongs to another seller.

### PATCH `/:id` — edit a measurement
All fields from create are optional — send only what changed:
```json
{
  "values": { "bust": 37, "waist": 29, "hip": 41, "gownLength": 58 },
  "notes": "Let out the waist by 1 inch after fitting"
}
```
If `values` and/or `garmentType` is included, the field-whitelist check runs again against the (possibly new) garment type.

**200**
```json
{
  "status": true,
  "message": "Measurement updated successfully",
  "data": { "...": "full measurement shape, with updatedAt bumped" }
}
```

### DELETE `/:id`
**200** `{ "message": "Measurement deleted successfully", "data": null }`. A subsequent `GET /:id` returns `404`.

---

## Notes for the frontend

- Always fetch `/templates` fresh rather than hardcoding garment/field lists — adding a new outfit type is a backend-only change (no migration), and the frontend will pick it up automatically.
- The gender lock on an existing client (`PATCH /clients/:id`) means the "change gender" option in a client's edit screen should only be enabled while `measurementCount === 0`.
- `values` is a free-form JSON map, not fixed columns — so the UI only needs to render whatever `fields` array the chosen garment returns from `/templates`, nothing more.
