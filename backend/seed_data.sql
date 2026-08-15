-- ============================================================
-- ToneTrade seed data - makes the site look populated for the
-- usability study, demo video, and screenshots.
--
-- Run with:  psql -U postgres -d tonetrade -f seed_data.sql
-- (password: postgres)
--
-- Idempotent-ish: uses fixed IDs in the 900+ range and deletes
-- its own rows first, so re-running it is safe. It does NOT
-- touch any listings/users you created yourself.
--
-- All seed users share the password: tonetrade123
-- (bcrypt hash below). You can log in as any of them.
-- ============================================================

BEGIN;

-- Clean up any previous run of this script (children first)
DELETE FROM passport_entries WHERE passport_id IN (SELECT id FROM instrument_passports WHERE listing_id BETWEEN 900 AND 999);
DELETE FROM instrument_passports WHERE listing_id BETWEEN 900 AND 999;
DELETE FROM listing_media WHERE listing_id BETWEEN 900 AND 999;
DELETE FROM listings WHERE id BETWEEN 900 AND 999;
DELETE FROM users WHERE id BETWEEN 900 AND 999;

-- ---------- Seed users (password for all: tonetrade123) ----------
INSERT INTO users (id, username, email, password_hash, location, bio, verified, created_at) VALUES
(901, 'gearhead_joe',   'joe@seed.tonetrade.uk',   '$2b$10$i625coVnwtLo4wIZHDpdXOdRhVoAGUOTEoXGLuJOvelbSiAN8O7H6', 'Newcastle upon Tyne', 'Gigging guitarist for 15 years. Only selling what I genuinely can''t keep.', true,  NOW() - INTERVAL '92 days'),
(902, 'sarahdrums',     'sarah@seed.tonetrade.uk', '$2b$10$i625coVnwtLo4wIZHDpdXOdRhVoAGUOTEoXGLuJOvelbSiAN8O7H6', 'Leeds',               'Drummer & drum tutor. Kit turnover is an occupational hazard.',              true,  NOW() - INTERVAL '85 days'),
(903, 'synth_sam',      'sam@seed.tonetrade.uk',   '$2b$10$i625coVnwtLo4wIZHDpdXOdRhVoAGUOTEoXGLuJOvelbSiAN8O7H6', 'Manchester',          'Bedroom producer thinning out the synth shelf.',                             false, NOW() - INTERVAL '60 days'),
(904, 'studio_beth',    'beth@seed.tonetrade.uk',  '$2b$10$i625coVnwtLo4wIZHDpdXOdRhVoAGUOTEoXGLuJOvelbSiAN8O7H6', 'Bristol',             'Small project studio. Upgrading gear, passing the old stuff on.',            false, NOW() - INTERVAL '45 days'),
(905, 'basement_bill',  'bill@seed.tonetrade.uk',  '$2b$10$i625coVnwtLo4wIZHDpdXOdRhVoAGUOTEoXGLuJOvelbSiAN8O7H6', 'Glasgow',             'Bass player. Collector. My partner says one of those has to stop.',          false, NOW() - INTERVAL '30 days');

-- ---------- Listings ----------
INSERT INTO listings (id, title, description, price, location, category, condition, status, seller_id, created_at) VALUES
(901, 'Fender Stratocaster MIM Sunburst 2016', 'Mexican-made Strat in classic sunburst. One owner from new, home use only. Recently set up with fresh 10s, action sits nice and low. Usual light pick swirl, no dings or buckle rash. Comes with padded gigbag.', 465.00, 'Newcastle upon Tyne', 'GUITAR', 'EXCELLENT', 'ACTIVE', 901, NOW() - INTERVAL '12 days'),
(902, 'Fender Telecaster Butterscotch Blonde', 'Butterscotch blonde Tele, maple neck. Gigged regularly but well cared for - honest playwear on the body edges, frets have loads of life left. Sounds exactly like a Tele should. Hard case included.', 540.00, 'Newcastle upon Tyne', 'GUITAR', 'GOOD', 'ACTIVE', 901, NOW() - INTERVAL '9 days'),
(903, 'Gibson Les Paul Studio Wine Red 2019', 'Les Paul Studio in wine red. Bought new in 2019, serviced last year (full setup + electronics clean). Small chip on the headstock edge, photographed honestly in the gallery. No other issues. Original hardcase.', 1150.00, 'Newcastle upon Tyne', 'GUITAR', 'GOOD', 'ACTIVE', 901, NOW() - INTERVAL '5 days'),
(904, 'Yamaha FG800 Acoustic', 'Solid-top dreadnought, the standard first "proper" acoustic for a reason. Bought for uni, barely played since second year. New strings fitted last month. No cracks, no lifting, action is comfortable.', 145.00, 'Leeds', 'GUITAR', 'EXCELLENT', 'ACTIVE', 902, NOW() - INTERVAL '11 days'),
(905, 'Fender Player Jazz Bass Tidepool Blue', 'Player-series Jazz Bass in tidepool blue. Smooth neck, punchy pickups, does everything from motown to punk. A couple of tiny lacquer marks near the jack, otherwise clean. Gigbag included.', 495.00, 'Glasgow', 'GUITAR', 'EXCELLENT', 'ACTIVE', 905, NOW() - INTERVAL '8 days'),
(906, 'Pearl Export 5-Piece Kit w/ Cymbals', 'Pearl Export in wine red, the workhorse kit. Includes hi-hats, crash and ride (budget brass, honest about that), all stands, kick pedal and stool. Heads are playable, batter heads on toms replaced this year. Collection only - it''s a drum kit.', 420.00, 'Leeds', 'DRUMS', 'GOOD', 'ACTIVE', 902, NOW() - INTERVAL '14 days'),
(907, 'Ludwig Supralite 14x6.5 Snare', 'Steel-shell Supralite. Bright, cutting, tunes up or down easily. Minor pitting on two lugs, shell is clean. Includes a decent padded case.', 165.00, 'Leeds', 'DRUMS', 'EXCELLENT', 'ACTIVE', 902, NOW() - INTERVAL '6 days'),
(908, 'Shure SM58 Vocal Mic', 'The SM58. It''s been dropped, it''s been gigged, it still works perfectly because it''s an SM58. Grille has a couple of dents (see photos), capsule is clean and tested this week. XLR cable thrown in.', 65.00, 'Bristol', 'MICROPHONE', 'GOOD', 'ACTIVE', 904, NOW() - INTERVAL '10 days'),
(909, 'Rode NT1-A Condenser + Shockmount', 'NT1-A large-diaphragm condenser, studio use only, never left the booth. Comes with shockmount, pop filter and original box. Dead quiet self-noise, ideal first studio mic.', 130.00, 'Bristol', 'MICROPHONE', 'MINT', 'ACTIVE', 904, NOW() - INTERVAL '7 days'),
(910, 'Korg Minilogue XD', 'Minilogue XD, four voices of analogue plus the digital multi-engine. Home studio use only, boxed with PSU. Zero issues, selling because I''ve gone full modular and something had to give.', 380.00, 'Manchester', 'SYNTHS', 'MINT', 'ACTIVE', 903, NOW() - INTERVAL '13 days'),
(911, 'Teenage Engineering OP-1 (original)', 'Original OP-1, the cult classic. All keys and encoders work perfectly, battery still holds a proper charge. Light corner wear, screen is flawless. Comes with the original case and cable. These don''t hang around.', 850.00, 'Manchester', 'SYNTHS', 'EXCELLENT', 'ACTIVE', 903, NOW() - INTERVAL '4 days'),
(912, 'Roland Juno-106 - Serviced', 'The classic 80s polysynth. All six voice chips healthy - professionally serviced in March (receipt in the gear history), new battery, sliders cleaned. Some cosmetic wear consistent with being 40 years old and better travelled than me.', 1350.00, 'Manchester', 'SYNTHS', 'GOOD', 'ACTIVE', 903, NOW() - INTERVAL '3 days'),
(913, 'Focusrite Scarlett 2i2 3rd Gen', '2i2 third gen, the default first interface. Perfect working order, light desk wear. Includes USB-C cable. Selling because the studio moved to something with more inputs.', 85.00, 'Bristol', 'AUDIO_EQUIPMENT', 'EXCELLENT', 'ACTIVE', 904, NOW() - INTERVAL '15 days'),
(914, 'Fender Blues Junior IV Tweed', 'Blues Junior IV in the lacquered tweed finish. Warm break-up at pub-gig volume, light enough to actually carry. Valves replaced last year. One scuff on the top handle area.', 430.00, 'Glasgow', 'AUDIO_EQUIPMENT', 'GOOD', 'ACTIVE', 905, NOW() - INTERVAL '9 days'),
(915, 'Boss DD-7 Digital Delay Pedal', 'DD-7 delay, the pedalboard staple. Velcro on the base, otherwise clean. All modes tested including the analogue emulation. Box long gone, pedal immortal.', 95.00, 'Glasgow', 'AUDIO_EQUIPMENT', 'GOOD', 'ACTIVE', 905, NOW() - INTERVAL '2 days'),
(916, 'Pioneer DDJ-400 DJ Controller', 'DDJ-400, the controller everyone learns on. Jogs tight, faders clean, no crackle. Rekordbox-ready. Selling since I upgraded to a 4-channel. Original box and cables.', 170.00, 'Manchester', 'AUDIO_EQUIPMENT', 'EXCELLENT', 'ACTIVE', 903, NOW() - INTERVAL '6 days'),
(917, 'Squier Classic Vibe 60s Stratocaster', 'Classic Vibe 60s Strat in olympic white. Punches way above its price - these get compared to Mexican Fenders for a reason. Fresh setup, no marks worth mentioning.', 230.00, 'Glasgow', 'GUITAR', 'EXCELLENT', 'SOLD', 905, NOW() - INTERVAL '20 days'),
(918, 'Zoom H4n Pro Recorder', 'H4n Pro handheld recorder. Used for band demos and one very windy field-recording phase. Works perfectly, includes 32GB SD card and windshield.', 100.00, 'Bristol', 'AUDIO_EQUIPMENT', 'GOOD', 'SOLD', 904, NOW() - INTERVAL '25 days');

-- ---------- Media (one hero image per listing) ----------
INSERT INTO listing_media (listing_id, media_type, url, label, uploaded_at) VALUES
(901, 'IMAGE', '/uploads/seed_strat_sunburst.png',    'Front',        NOW() - INTERVAL '12 days'),
(902, 'IMAGE', '/uploads/seed_tele_butterscotch.png', 'Front',        NOW() - INTERVAL '9 days'),
(903, 'IMAGE', '/uploads/seed_lespaul.png',           'Front',        NOW() - INTERVAL '5 days'),
(904, 'IMAGE', '/uploads/seed_acoustic.png',          'Front',        NOW() - INTERVAL '11 days'),
(905, 'IMAGE', '/uploads/seed_bass.png',              'Front',        NOW() - INTERVAL '8 days'),
(906, 'IMAGE', '/uploads/seed_drumkit.png',           'Full kit',     NOW() - INTERVAL '14 days'),
(907, 'IMAGE', '/uploads/seed_snare.png',             'Snare',        NOW() - INTERVAL '6 days'),
(908, 'IMAGE', '/uploads/seed_sm58.png',              'Mic',          NOW() - INTERVAL '10 days'),
(909, 'IMAGE', '/uploads/seed_condenser.png',         'In shockmount',NOW() - INTERVAL '7 days'),
(910, 'IMAGE', '/uploads/seed_synth.png',             'Top panel',    NOW() - INTERVAL '13 days'),
(911, 'IMAGE', '/uploads/seed_op1.png',               'Unit',         NOW() - INTERVAL '4 days'),
(912, 'IMAGE', '/uploads/seed_juno.png',              'Front panel',  NOW() - INTERVAL '3 days'),
(913, 'IMAGE', '/uploads/seed_interface.png',         'Front',        NOW() - INTERVAL '15 days'),
(914, 'IMAGE', '/uploads/seed_amp.png',               'Front',        NOW() - INTERVAL '9 days'),
(915, 'IMAGE', '/uploads/seed_pedal.png',             'Top',          NOW() - INTERVAL '2 days'),
(916, 'IMAGE', '/uploads/seed_dj.png',                'Top',          NOW() - INTERVAL '6 days'),
(917, 'IMAGE', '/uploads/seed_strat_olympic.png',     'Front',        NOW() - INTERVAL '20 days'),
(918, 'IMAGE', '/uploads/seed_interface.png',         'Unit',         NOW() - INTERVAL '25 days');

-- ---------- Gear history (instrument passports) on three listings ----------
INSERT INTO instrument_passports (id, listing_id, serial_number, year_manufactured, created_at) VALUES
(901, 903, 'GLP19-04412', 2019, NOW() - INTERVAL '5 days'),
(902, 912, 'JUNO-472115', 1984, NOW() - INTERVAL '3 days'),
(903, 901, 'MX16-118820', 2016, NOW() - INTERVAL '12 days');

INSERT INTO passport_entries (passport_id, entry_type, description, event_date, created_at) VALUES
(901, 'ORIGINAL_PURCHASE', 'Bought new from guitarguitar Newcastle.', '2019-06-15', NOW() - INTERVAL '5 days'),
(901, 'SERVICE', 'Full setup, fret polish and electronics clean at Sound Repairs NE.', '2025-08-02', NOW() - INTERVAL '5 days'),
(901, 'REPAIR', 'Small headstock chip filled and sealed - cosmetic only.', '2024-11-20', NOW() - INTERVAL '5 days'),
(902, 'OWNERSHIP_CHANGE', 'Second owner - bought from the original owner in Sheffield.', '2018-03-10', NOW() - INTERVAL '3 days'),
(902, 'SERVICE', 'Professional service: voice chips tested, sliders cleaned, new internal battery. Receipt available.', '2026-03-14', NOW() - INTERVAL '3 days'),
(903, 'ORIGINAL_PURCHASE', 'Bought new from PMT Newcastle, one owner since.', '2016-09-03', NOW() - INTERVAL '12 days'),
(903, 'SERVICE', 'Setup with 10s, truss rod adjustment, intonation.', '2026-06-30', NOW() - INTERVAL '12 days');

-- ---------- Fix sequences so future app-created rows don't collide ----------
SELECT setval(pg_get_serial_sequence('users','id'),                 GREATEST((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('listings','id'),              GREATEST((SELECT MAX(id) FROM listings), 1));
SELECT setval(pg_get_serial_sequence('listing_media','id'),         GREATEST((SELECT MAX(id) FROM listing_media), 1));
SELECT setval(pg_get_serial_sequence('instrument_passports','id'),  GREATEST((SELECT MAX(id) FROM instrument_passports), 1));
SELECT setval(pg_get_serial_sequence('passport_entries','id'),      GREATEST((SELECT MAX(id) FROM passport_entries), 1));

COMMIT;

-- Quick sanity check you can run after:
-- SELECT count(*) FROM listings WHERE id BETWEEN 900 AND 999;   -- expect 18
