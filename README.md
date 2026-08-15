# ToneTrade

A peer-to-peer marketplace for buying and selling secondhand musical instruments in the UK. Built to solve a problem generic marketplaces (Gumtree, Facebook Marketplace) don't: buyers can't verify an instrument's condition, sound, or history from a couple of photos and a text description, and there's no trust signal specific to musical gear.

MSc Computer Science (conversion) dissertation project, Newcastle University.

## Why

Backed by an 8-respondent survey of musicians who buy/sell gear secondhand: the recurring pain points were trust in the seller, uncertainty about an instrument's playing condition, and no way to hear or see it before travelling to view it. ToneTrade's feature set is built directly against those three, not a generic "clone eBay" checklist.

## Key features

- **Audio/video/photo demos** — sellers can upload sound clips and video walkthroughs alongside photos, not just static images, so buyers can hear how an instrument actually plays before contacting the seller.
- **Gear History (instrument passport)** — a per-listing provenance timeline: repairs, modifications, ownership history, logged by the seller against the listing.
- **Community verification** — a user becomes "verified" once endorsed by two or more people they've actually messaged through the platform, not strangers vouching for strangers. Endorsement is gated on a real prior conversation existing between the two accounts.
- **Real-time messaging with price offers** — WebSocket chat (STOMP/SockJS) per listing, with inline buyer-only price offers and seller accept/decline. Accepting an offer marks the listing sold at the agreed price.
- **Buy Now + checkout** — a direct purchase path at the listed price, alongside offer negotiation. Deliberately no payment processing: this is scoped as peer-to-peer (arrange payment directly), not a payments platform.
- **Fair price indicator** — flags a listing as below/typical/above average against other listings in its category, plus a reference-price lookup for well-known instrument models. Deliberately not scraping live marketplace data for this (see Engineering notes below).
- **Saved listings, seller profiles, follow** — the usual marketplace utilities, built on top of the trust/verification core rather than being the main pitch.

## Tech stack

**Backend:** Java 17, Spring Boot 3.2.5, Spring Security (JWT, HS256), Spring WebSocket (STOMP over SockJS), PostgreSQL, Spring Data JPA/Hibernate

**Frontend:** React 19 + TypeScript (Create React App), React Router, native `fetch`/WebSocket client (`@stomp/stompjs`), no heavy UI framework

## Engineering notes

A few decisions worth knowing the reasoning behind, since "what's built" matters less than "why it was built that way":

- **WebSocket auth happens on the STOMP CONNECT frame, not the HTTP handshake.** SockJS's fallback transports don't reliably carry custom HTTP headers, so the JWT is read as a native STOMP header at CONNECT instead.
- **Spring Security rule ordering is deliberate.** `authorizeHttpRequests` is first-match-wins, so specific `authenticated()` rules (e.g. `GET /api/listings/saved`) are registered before the broader `permitAll()` rule they'd otherwise be shadowed by.
- **No payment processing, on purpose.** This is a peer-to-peer classifieds model (Gumtree-style), not an escrow/payments platform — that's a scope decision, not a missing feature.
- **No live price-scraping for the fair price indicator, on purpose.** Scraping Reverb/eBay/Facebook Marketplace for live pricing was considered and rejected: no clean API exists, it's a ToS risk, and it's unreliable at demo time. The indicator instead uses a category-average comparison plus a small curated reference-price table, with the trade-off documented rather than hidden.

## Getting started

**Prerequisites:** Node 18+, JDK 17, PostgreSQL, Maven

### Backend

```
cd backend
# create a PostgreSQL database and add backend/src/main/resources/application.properties
# (gitignored — not included in this repo, needs your own DB credentials)
mvn spring-boot:run
```

### Frontend

```
npm install
npm start
```

Runs on `http://localhost:3000`.

Optional seed data (5 users, 18 listings across all categories, sample media) is provided at `backend/seed_data.sql`:

```
psql -U postgres -d tonetrade -f backend/seed_data.sql
```

## Screenshots

<!-- Add screenshots here, e.g. ![Homepage](screenshots/homepage.png) -->

## Author

Lewis Robinson
