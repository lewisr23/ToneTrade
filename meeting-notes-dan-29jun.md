# Supervisor Meeting — Dan Nesbitt
29 June 2026, 1:30pm

---

## What's built

**Frontend (React/TypeScript)**
- Navbar, ListingCard, ListingDetail, CreateListing with validation
- React Router wired up

**Backend (Spring Boot)**
- Entities: User, Listing, ListingMedia, InstrumentPassport, PassportEntry
- Auth endpoints: register + login (JWT not yet issued on login)
- Listings endpoints: GET all (with search/category filter), GET by ID, POST, DELETE
- BCrypt password hashing, input validation, CORS config

**Differentiators in the data model**
- InstrumentPassport — history log per instrument (serial number, manufacture year, entry log of ownership/repairs/mods)
- ListingMedia — audio/video demo files per listing
- Verified seller flag on User

---

## What's not done yet

- JWT not issued on login — endpoints currently unprotected (acknowledged TODO)
- Figma wireframes — not started
- ER diagram — not started
- MoSCoW requirements list — not started
- UML diagrams — not started (Dan flagged as required)
- AI integration — not started (Dan flagged as required)

---

## Questions for Dan

1. UML — does he want class/sequence diagrams before or after backend is further along?
2. AI integration — what's the minimum that satisfies the requirement? Recommendation engine, or something more specific?
3. Survey — 8 responses, thematic analysis written up. Is that sufficient or does he want more data collected?

---

## Submission deadlines

- Dissertation: 10 August 2026
- Demo video: 13 August 2026
