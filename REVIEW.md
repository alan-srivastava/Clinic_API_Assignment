# Code Review — Clinic Appointment API

---

## prisma/schema.prisma

**1. `consultationFee` was `Float` → changed to `Decimal(10,2)`**
Floats can't represent decimal values exactly — money fields drift (e.g. `99.99999999`). `Decimal` gives exact base-10 storage.

**2. `status` was a free-text `String` → changed to enum `AppointmentStatus`**
Nothing stopped storing `"BOOOKED"` or `"banana"`. The enum makes Postgres reject any invalid value at the database level.

**3. No unique constraint on `DoctorSchedule(doctorId, dayOfWeek)`**
A doctor could end up with two conflicting schedules for the same day. Added `@@unique([doctorId, dayOfWeek])`.

**4. No unique constraint on `Appointment(doctorId, date, tokenNumber)`**
Two patients could get the same token number for the same doctor on the same day — a real queue failure. Added the constraint and verified via raw SQL that Postgres rejects duplicates with a `P2002` error.

**5. No unique constraint on `Appointment(doctorId, date, timeSlot)`**
Nothing prevented double-booking the same doctor at the same time. Added `@@unique([doctorId, date, timeSlot])`.

**6. `Patient.phone` had no `@unique`**
Same patient could be registered multiple times with the same phone, splitting their appointment history across duplicate records. Added `@unique`.

**7. `tokenNumber` was nullable (`Int?`) → changed to `Int`**
Every appointment must have a token from creation. Nullable here was a sign the generation logic wasn't reliable — fixed both the field and the logic.

**8. No indexes beyond primary keys**
`Appointment` is constantly queried by `doctorId` and `date` — without an index these are full table scans. Added `@@index([doctorId, date])`.

**9. No `updatedAt` on `Appointment`**
No way to know when a status changed. Added `updatedAt DateTime @updatedAt` — Prisma manages it automatically.

---

## routes/doctor.routes.ts

**10. Slots endpoint never checked existing bookings**
The biggest user-facing bug. It generated all theoretical slots but never queried `Appointment`, so already-booked slots appeared available. Fixed by querying non-cancelled appointments for that doctor/date, building a `Set` of booked `timeSlot` values, and filtering them out. Cancelled slots are excluded from the booked set so they free back up.

**11. Invalid date string failed silently**
`?date=banana` produced an `Invalid Date` object. `.getDay()` on it returns `NaN`, so the endpoint silently returned "Doctor not available" instead of a 400. Added `isNaN(requestedDate.getTime())` check.

**12. No existence check for the doctor**
A nonexistent doctor ID returned a misleading success response with empty slots. Added a `findUnique` check — non-existent IDs now return 404.

---

## routes/appointment.routes.ts

**13. Token count was not scoped per doctor**
The count query had no `doctorId` filter, so tokens were shared across all doctors system-wide. Dr. A and Dr. B's patients would get interleaved token numbers from the same sequence. Fixed by adding `doctorId: data.doctorId` to the count query.

**14. Race condition in token generation**
Count-then-create is not atomic. Two simultaneous requests could both read `count = 5` and both try to create token #6. Fixed with two layers: the unique constraint at the DB level makes duplicates impossible, and the application retries on `P2002` up to 5 times with a fresh count.

**15. No input validation on booking**
`patientId`, `doctorId`, `date`, and `timeSlot` were passed straight to Prisma with no checks. Added Zod validation plus existence checks for both patient and doctor before creating anything.

**16. Status endpoint accepted any string — no state machine**
`PATCH /:id/status` would accept `"banana"` or allow `COMPLETED → BOOKED`. Implemented an explicit transition map:
- `BOOKED → COMPLETED ✅`
- `BOOKED → CANCELLED ✅`
- `COMPLETED → anything ❌`
- `CANCELLED → anything ❌`

Invalid status value → 400. Invalid transition → 409 Conflict (the request is valid, it just conflicts with current state).

**17. Status update returned 500 for missing appointments**
`prisma.appointment.update` throws when the record doesn't exist. The catch block returned 500. Added a `findUnique` check first — missing IDs now return 404.

**18. Date filter in list endpoint used exact equality**
`where.date = new Date(date)` almost never matched stored timestamps reliably due to time component differences. Changed to a day-range query (`dayStart`/`dayEnd`) — same pattern already used elsewhere in the file.

**19. Booking returned 200 instead of 201**
POST that creates a resource should return 201 Created. Changed to `res.status(201).json(appointment)`.

---

## routes/patient.routes.ts

**20. Search was case-sensitive**
`startsWith: "rahul"` returned nothing when the stored name was `"Rahul"`. Added `mode: 'insensitive'` to the Prisma query.

**21. GET /:id returned `null` with 200 instead of 404**
`findUnique` returns `null` for missing records. The route sent that straight to the client as a 200 OK. Added a null check returning 404 Not Found.

**22. No validation on patient creation**
Empty name, missing phone, or blank body went straight to Prisma. Added Zod validation — `name` and `phone` are required; invalid requests return 400.

**23. Duplicate phone returned 500 instead of 409**
Once `phone @unique` was added, a duplicate registration throws `P2002`. Added explicit handling for this code returning 409 Conflict with a clear message instead of a generic server error.

---

## Across all files

**Every catch block discarded the real error.** All three files had `catch (error) { res.status(500) }` with the error completely unused — impossible to debug in production. Added `console.error(error)` to every catch block.

**Seed data has inconsistent `gender` values** — `"Male"` for two patients and `"male"` for one. Illustrates why free-text fields for controlled values are fragile; a `Gender` enum would prevent this.

**No authentication anywhere.** Any caller can read or modify any record. Expected for a starter project, but the first thing needed before production use.
