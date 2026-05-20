-- ================================================================
-- SmartStat AI — Demo seed data
-- ================================================================
-- One demo tenant ("Demo Hospital") with 1 building, 1 floor,
-- 6 POIs, and a minimal navigation graph for testing.
--
-- This is DEV-only data. Production should never run this.
-- ================================================================

-- ---------- Demo Tenant ----------
insert into public.tenants (id, slug, name, plan, branding, locale)
values (
  '11111111-1111-1111-1111-111111111111',
  'demo-hospital',
  'Demo Hospital',
  'starter',
  jsonb_build_object(
    'appDisplayName', 'Demo Hospital Wayfinder',
    'logoUrl', '',
    'primaryColor', '#0066CC',
    'secondaryColor', '#10B981',
    'supportEmail', 'support@demo-hospital.example'
  ),
  'en'
)
on conflict (id) do nothing;

-- ---------- Demo Building ----------
insert into public.buildings (id, tenant_id, name, address, latitude, longitude, floor_count)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Main Building',
  jsonb_build_object(
    'street', '100 Health Plaza',
    'city', 'Boston',
    'state', 'MA',
    'postalCode', '02115',
    'country', 'USA',
    'latitude', 42.3360,
    'longitude', -71.1059
  ),
  42.3360,
  -71.1059,
  1
)
on conflict (id) do nothing;

-- ---------- Demo Floor (Ground level, published) ----------
insert into public.floors (
  id, building_id, tenant_id, level, name,
  mesh_url, floorplan_2d_url, bbox, scan_status, scanned_at, published_at
)
values (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  0,
  'Ground Floor',
  null,
  null,
  array[0.0, 0.0, 60.0, 40.0]::double precision[], -- 60m x 40m floor
  'published',
  now(),
  now()
)
on conflict (id) do nothing;

-- ---------- Demo POIs ----------
-- 6 destinations spread across the floor
insert into public.pois (
  id, floor_id, tenant_id, name, display_name, search_keywords,
  category, position_x, position_y, position_z,
  accessibility, opening_hours, description, is_active
)
values
  ( 'a0000001-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Main Entrance', 'Main Entrance',
    array['entrance', 'lobby', 'reception', 'front door'],
    'entrance', 2.0, 20.0, 0.0,
    '{"wheelchairAccessible": true}'::jsonb,
    '[]'::jsonb,
    'Front entrance with information desk and security.',
    true ),
  ( 'a0000002-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Cardiology', 'Cardiology Department',
    array['cardiology', 'heart', 'cardiac', 'ECG', 'EKG'],
    'department', 15.0, 30.0, 0.0,
    '{"wheelchairAccessible": true}'::jsonb,
    '[{"dayOfWeek": 1, "openTime": "08:00", "closeTime": "18:00"},
      {"dayOfWeek": 2, "openTime": "08:00", "closeTime": "18:00"},
      {"dayOfWeek": 3, "openTime": "08:00", "closeTime": "18:00"},
      {"dayOfWeek": 4, "openTime": "08:00", "closeTime": "18:00"},
      {"dayOfWeek": 5, "openTime": "08:00", "closeTime": "16:00"}]'::jsonb,
    'Outpatient cardiology clinic.',
    true ),
  ( 'a0000003-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Pharmacy', 'Pharmacy',
    array['pharmacy', 'drugs', 'medication', 'prescription'],
    'pharmacy', 35.0, 10.0, 0.0,
    '{"wheelchairAccessible": true}'::jsonb,
    '[]'::jsonb,
    'In-house pharmacy.',
    true ),
  ( 'a0000004-0000-0000-0000-000000000004',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Emergency Room', 'Emergency Room',
    array['ER', 'emergency', 'urgent', 'trauma'],
    'emergency', 50.0, 35.0, 0.0,
    '{"wheelchairAccessible": true}'::jsonb,
    '[]'::jsonb,
    '24/7 emergency care.',
    true ),
  ( 'a0000005-0000-0000-0000-000000000005',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Restroom', 'Restroom (Ground Floor)',
    array['bathroom', 'toilet', 'restroom', 'WC'],
    'restroom', 25.0, 20.0, 0.0,
    '{"wheelchairAccessible": true}'::jsonb,
    '[]'::jsonb,
    null,
    true ),
  ( 'a0000006-0000-0000-0000-000000000006',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Elevator A', 'Elevator A',
    array['elevator', 'lift'],
    'elevator', 30.0, 20.0, 0.0,
    '{"wheelchairAccessible": true}'::jsonb,
    '[]'::jsonb,
    null,
    true )
on conflict (id) do nothing;

-- ---------- Demo navigation graph ----------
-- Waypoints along the main corridor (y=20) + POI nodes
insert into public.nav_nodes (id, floor_id, tenant_id, type, position_x, position_y, position_z, poi_id, qr_code)
values
  -- Corridor waypoints
  ('b0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'waypoint', 5.0, 20.0, 0.0, null, null),
  ('b0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'waypoint', 15.0, 20.0, 0.0, null, null),
  ('b0000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'waypoint', 25.0, 20.0, 0.0, null, null),
  ('b0000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'waypoint', 35.0, 20.0, 0.0, null, null),
  ('b0000005-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'waypoint', 45.0, 20.0, 0.0, null, null),

  -- POI nodes (one per POI)
  ('c0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'entrance', 2.0, 20.0, 0.0, 'a0000001-0000-0000-0000-000000000001', 'SS-DEMO-QR-001'),
  ('c0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'poi', 15.0, 30.0, 0.0, 'a0000002-0000-0000-0000-000000000002', null),
  ('c0000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'poi', 35.0, 10.0, 0.0, 'a0000003-0000-0000-0000-000000000003', null),
  ('c0000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'poi', 50.0, 35.0, 0.0, 'a0000004-0000-0000-0000-000000000004', null),
  ('c0000005-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'poi', 25.0, 20.0, 0.0, 'a0000005-0000-0000-0000-000000000005', 'SS-DEMO-QR-002'),
  ('c0000006-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'elevator', 30.0, 20.0, 0.0, 'a0000006-0000-0000-0000-000000000006', null)
on conflict (id) do nothing;

-- ---------- Demo navigation edges (bidirectional) ----------
-- Helper macro: each insert creates an edge. We add both directions explicitly so the
-- pathfinder doesn't need to assume bidirectionality.
insert into public.nav_edges (tenant_id, from_node_id, to_node_id, distance_meters, wheelchair_accessible)
values
  -- Entrance <-> waypoint 1
  ('11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 3.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 3.0, true),
  -- Corridor chain
  ('11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000002-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000003', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000003-0000-0000-0000-000000000003', 'b0000002-0000-0000-0000-000000000002', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000003-0000-0000-0000-000000000003', 'b0000004-0000-0000-0000-000000000004', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000004-0000-0000-0000-000000000004', 'b0000003-0000-0000-0000-000000000003', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'b0000005-0000-0000-0000-000000000005', 'b0000004-0000-0000-0000-000000000004', 10.0, true),
  -- Cardiology branch from waypoint 2
  ('11111111-1111-1111-1111-111111111111', 'b0000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'c0000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', 10.0, true),
  -- Pharmacy branch from waypoint 4
  ('11111111-1111-1111-1111-111111111111', 'b0000004-0000-0000-0000-000000000004', 'c0000003-0000-0000-0000-000000000003', 10.0, true),
  ('11111111-1111-1111-1111-111111111111', 'c0000003-0000-0000-0000-000000000003', 'b0000004-0000-0000-0000-000000000004', 10.0, true),
  -- ER branch from waypoint 5
  ('11111111-1111-1111-1111-111111111111', 'b0000005-0000-0000-0000-000000000005', 'c0000004-0000-0000-0000-000000000004', 16.0, true),
  ('11111111-1111-1111-1111-111111111111', 'c0000004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005', 16.0, true),
  -- Restroom co-located with waypoint 3
  ('11111111-1111-1111-1111-111111111111', 'b0000003-0000-0000-0000-000000000003', 'c0000005-0000-0000-0000-000000000005', 0.5, true),
  ('11111111-1111-1111-1111-111111111111', 'c0000005-0000-0000-0000-000000000005', 'b0000003-0000-0000-0000-000000000003', 0.5, true),
  -- Elevator near waypoint 3
  ('11111111-1111-1111-1111-111111111111', 'b0000003-0000-0000-0000-000000000003', 'c0000006-0000-0000-0000-000000000006', 5.0, true),
  ('11111111-1111-1111-1111-111111111111', 'c0000006-0000-0000-0000-000000000006', 'b0000003-0000-0000-0000-000000000003', 5.0, true)
on conflict (from_node_id, to_node_id) do nothing;
