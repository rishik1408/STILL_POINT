-- ============================================================
-- PIAMS: Sample Municipal Wards, Assets, Issues & Audit Logs
-- Realistic Mumbai Municipal Corporation (BMC) Data
-- ============================================================

-- 1. AUTHORITIES (4 Mumbai Municipal Wards with valid PostGIS polygons)
INSERT INTO public.authorities (id, department_name, ward_name, ward_polygon, contact_name, email, phone, portal_url) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Roads & Traffic Engineering Dept.',
  'Ward A (Colaba / Fort / Marine Drive)',
  ST_GeomFromText('POLYGON((72.8200 18.9050, 72.8450 18.9050, 72.8450 18.9350, 72.8200 18.9350, 72.8200 18.9050))', 4326),
  'Er. Suresh Patil (Executive Engineer)',
  'ward.a.roads@mcgm.gov.in',
  '+91-22-2201-1001',
  'https://portal.mcgm.gov.in/ward-a'
),
(
  'a2000000-0000-0000-0000-000000000002',
  'Pedestrian Infrastructure & Maintenance',
  'Ward K/East (Andheri East / MIDC)',
  ST_GeomFromText('POLYGON((72.8450 19.1050, 72.8800 19.1050, 72.8800 19.1350, 72.8450 19.1350, 72.8450 19.1050))', 4326),
  'Er. Priya Deshmukh (Assistant Engineer)',
  'ward.ke.footpath@mcgm.gov.in',
  '+91-22-2683-2002',
  'https://portal.mcgm.gov.in/ward-ke'
),
(
  'a3000000-0000-0000-0000-000000000003',
  'Public Transit & Bus Shelters Division',
  'Ward H/West (Bandra West / Khar)',
  ST_GeomFromText('POLYGON((72.8200 19.0500, 72.8500 19.0500, 72.8500 19.0750, 72.8200 19.0750, 72.8200 19.0500))', 4326),
  'Er. Rajesh Sharma (Sub-Divisional Officer)',
  'ward.hw.transit@mcgm.gov.in',
  '+91-22-2640-3003',
  'https://portal.mcgm.gov.in/ward-hw'
),
(
  'a4000000-0000-0000-0000-000000000004',
  'Stormwater Drains & Culverts Dept.',
  'Ward L (Kurla / Chunabhatti)',
  ST_GeomFromText('POLYGON((72.8600 19.0650, 72.8900 19.0650, 72.8900 19.0950, 72.8600 19.0950, 72.8600 19.0650))', 4326),
  'Er. Anjali Kulkarni (Chief Engineer SWD)',
  'ward.l.drainage@mcgm.gov.in',
  '+91-22-2522-4004',
  'https://portal.mcgm.gov.in/ward-l'
)
ON CONFLICT (id) DO NOTHING;

-- 2. ASSETS (8 Assets across roads, bus stops, footpaths, and overbridges)
INSERT INTO public.assets (id, name, asset_type, geom, authority_id, condition_score, status) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'Shahid Bhagat Singh Marg (Colaba Causeway Arterial)',
  'road',
  ST_SetSRID(ST_MakePoint(72.8330, 18.9220), 4326),
  'a1000000-0000-0000-0000-000000000001',
  42,
  'Needs Repair'
),
(
  'b2000000-0000-0000-0000-000000000002',
  'Regal Circle Pedestrian Skywalk & Overbridge',
  'overbridge',
  ST_SetSRID(ST_MakePoint(72.8320, 18.9270), 4326),
  'a1000000-0000-0000-0000-000000000001',
  78,
  'Active'
),
(
  'b3000000-0000-0000-0000-000000000003',
  'MIDC Central Road Footpath Corridor',
  'footpath',
  ST_SetSRID(ST_MakePoint(72.8620, 19.1180), 4326),
  'a2000000-0000-0000-0000-000000000002',
  31,
  'Critical'
),
(
  'b4000000-0000-0000-0000-000000000004',
  'Andheri East Railway Station Bus Shelter #4',
  'bus_stop',
  ST_SetSRID(ST_MakePoint(72.8510, 19.1190), 4326),
  'a2000000-0000-0000-0000-000000000002',
  64,
  'Needs Repair'
),
(
  'b5000000-0000-0000-0000-000000000005',
  'Carter Road Coastal Promenade Walkway',
  'footpath',
  ST_SetSRID(ST_MakePoint(72.8260, 19.0620), 4326),
  'a3000000-0000-0000-0000-000000000003',
  89,
  'Active'
),
(
  'b6000000-0000-0000-0000-000000000006',
  'Hill Road St. Peters Bus Stop Shelter',
  'bus_stop',
  ST_SetSRID(ST_MakePoint(72.8350, 19.0580), 4326),
  'a3000000-0000-0000-0000-000000000003',
  38,
  'Needs Repair'
),
(
  'b7000000-0000-0000-0000-000000000007',
  'Lal Bahadur Shastri (LBS) Marg Corridor',
  'road',
  ST_SetSRID(ST_MakePoint(72.8750, 19.0780), 4326),
  'a4000000-0000-0000-0000-000000000004',
  49,
  'Active'
),
(
  'b8000000-0000-0000-0000-000000000008',
  'Kurla Junction Pedestrian Overbridge North Wing',
  'overbridge',
  ST_SetSRID(ST_MakePoint(72.8790, 19.0710), 4326),
  'a4000000-0000-0000-0000-000000000004',
  35,
  'Needs Repair'
)
ON CONFLICT (id) DO NOTHING;

-- 3. ISSUES (Covering all 5 lifecycle states: Reported, In Progress, Repair Claimed, Escalated, Verified Closed)
INSERT INTO public.issues (id, asset_id, authority_id, category, severity, status, ai_raw_json, human_final_json, geom, sla_due_at, escalation_count, created_at) VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Pothole',
  4,
  'Reported',
  '{"defect_category": "Pothole", "severity": 4, "confidence": 0.94, "technical_summary": "Deep pothole measuring approximately 65cm diameter and 14cm depth on lane 2. Exposed sub-base aggregate visible. Severe hazard to two-wheeler riders."}',
  '{"defect_category": "Pothole", "severity": 4, "confidence": 0.94, "technical_summary": "Deep pothole measuring approximately 65cm diameter and 14cm depth on lane 2. Exposed sub-base aggregate visible. Severe hazard to two-wheeler riders.", "user_note": "Critical risk at night, zero illumination near landmark."}',
  ST_SetSRID(ST_MakePoint(72.8330, 18.9220), 4326),
  now() + interval '12 days',
  0,
  now() - interval '2 days'
),
(
  'c2000000-0000-0000-0000-000000000002',
  'b6000000-0000-0000-0000-000000000006',
  'a3000000-0000-0000-0000-000000000003',
  'Damaged Bus Shelter',
  3,
  'In Progress',
  '{"defect_category": "Damaged Bus Shelter", "severity": 3, "confidence": 0.89, "technical_summary": "Polycarbonate canopy cracked and dangling precariously from metal purlin. Steel bench bolts sheared. Pedestrian shelter compromised during rainfall."}',
  '{"defect_category": "Damaged Bus Shelter", "severity": 3, "confidence": 0.89, "technical_summary": "Canopy cracked and dangling. Bench detached.", "user_note": "Wind storm blew section off last Thursday."}',
  ST_SetSRID(ST_MakePoint(72.8350, 19.0580), 4326),
  now() + interval '21 days',
  0,
  now() - interval '9 days'
),
(
  'c3000000-0000-0000-0000-000000000003',
  'b3000000-0000-0000-0000-000000000003',
  'a2000000-0000-0000-0000-000000000002',
  'Broken Footpath Slab',
  3,
  'Repair Claimed',
  '{"defect_category": "Broken Footpath Slab", "severity": 3, "confidence": 0.92, "technical_summary": "Three adjacent tactile paver blocks shattered with exposed jagged edges and 5cm elevation differential. Wheelchair obstruction and trip hazard."}',
  '{"defect_category": "Broken Footpath Slab", "severity": 3, "confidence": 0.92, "technical_summary": "Three broken tactile pavers with 5cm trip hazard.", "user_note": "Multiple seniors have fallen here."}',
  ST_SetSRID(ST_MakePoint(72.8620, 19.1180), 4326),
  now() + interval '5 days',
  0,
  now() - interval '18 days'
),
(
  'c4000000-0000-0000-0000-000000000004',
  'b7000000-0000-0000-0000-000000000007',
  'a4000000-0000-0000-0000-000000000004',
  'Drainage Blockage',
  4,
  'Escalated',
  '{"defect_category": "Drainage Blockage", "severity": 4, "confidence": 0.91, "technical_summary": "Stormwater drop inlet 100% choked with non-biodegradable debris and silt. Road runoff stagnant, ponding across 3.5m carriage width. High monsoon flood risk."}',
  '{"defect_category": "Drainage Blockage", "severity": 4, "confidence": 0.91, "technical_summary": "Stormwater inlet choked. Severe road ponding.", "user_note": "No civic action taken despite multiple citizen complaints."}',
  ST_SetSRID(ST_MakePoint(72.8750, 19.0780), 4326),
  now() - interval '4 days',
  2,
  now() - interval '22 days'
),
(
  'c5000000-0000-0000-0000-000000000005',
  'b5000000-0000-0000-0000-000000000005',
  'a3000000-0000-0000-0000-000000000003',
  'Lighting Failure',
  2,
  'Verified Closed',
  '{"defect_category": "Lighting Failure", "severity": 2, "confidence": 0.96, "technical_summary": "Two consecutive octagonal LED post-top luminaires out of service between promenade markers 12 and 14. 45-meter dark corridor on pedestrian walkway."}',
  '{"defect_category": "Lighting Failure", "severity": 2, "confidence": 0.96, "technical_summary": "Two street lamps out on promenade.", "user_note": "Dark stretch unsafe at night."}',
  ST_SetSRID(ST_MakePoint(72.8260, 19.0620), 4326),
  now() + interval '30 days',
  0,
  now() - interval '32 days'
)
ON CONFLICT (id) DO NOTHING;

-- 4. MEDIA (Photos for before, progress, and after)
INSERT INTO public.media (id, issue_id, file_url, stage, captured_at, exif_geom) VALUES
('m1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80', 'before', now() - interval '2 days', ST_SetSRID(ST_MakePoint(72.8330, 18.9220), 4326)),
('m2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80', 'before', now() - interval '9 days', ST_SetSRID(ST_MakePoint(72.8350, 19.0580), 4326)),
('m3000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80', 'before', now() - interval '18 days', ST_SetSRID(ST_MakePoint(72.8620, 19.1180), 4326)),
('m3000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80', 'after', now() - interval '2 days', ST_SetSRID(ST_MakePoint(72.8620, 19.1180), 4326)),
('m4000000-0000-0000-0000-000000000005', 'c4000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80', 'before', now() - interval '22 days', ST_SetSRID(ST_MakePoint(72.8750, 19.0780), 4326)),
('m5000000-0000-0000-0000-000000000006', 'c5000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80', 'before', now() - interval '32 days', ST_SetSRID(ST_MakePoint(72.8260, 19.0620), 4326)),
('m5000000-0000-0000-0000-000000000007', 'c5000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80', 'after', now() - interval '20 days', ST_SetSRID(ST_MakePoint(72.8260, 19.0620), 4326))
ON CONFLICT (id) DO NOTHING;

-- 5. STATUS UPDATES (Audit Trail)
INSERT INTO public.status_updates (issue_id, prev_status, new_status, audit_verdict, audit_confidence, notes, created_at) VALUES
('c2000000-0000-0000-0000-000000000002', 'Reported', 'In Progress', null, null, 'Field crew dispatched by Transit Maintenance Wing. Replacement roof sheet fabrication underway.', now() - interval '4 days'),
('c3000000-0000-0000-0000-000000000003', 'Reported', 'In Progress', null, null, 'Footpath repair contractor assigned. Work order #WO-2026-089 issued.', now() - interval '14 days'),
('c3000000-0000-0000-0000-000000000003', 'In Progress', 'Repair Claimed', null, null, 'Contractor marked repair as complete. Pre-cast pavers laid and sealed. Awaiting citizen / AI audit verification.', now() - interval '2 days'),
('c4000000-0000-0000-0000-000000000004', 'Reported', 'Escalated', null, null, 'SLA exceeded 14 days without action. Automated escalation notice sent to Chief Engineer SWD.', now() - interval '4 days'),
('c5000000-0000-0000-0000-000000000005', 'Reported', 'In Progress', null, null, 'Street lighting technician assigned to inspect wiring & circuit breaker.', now() - interval '28 days'),
('c5000000-0000-0000-0000-000000000005', 'In Progress', 'Repair Claimed', null, null, 'New 90W LED drivers and luminaires installed.', now() - interval '21 days'),
('c5000000-0000-0000-0000-000000000005', 'Repair Claimed', 'Verified Closed', 'Resolved', 0.98, 'AI Auditor paired comparison verified: 100% illumination restored, lux levels within municipal code. Issue closed.', now() - interval '20 days');
