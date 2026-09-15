-- Seed States
INSERT INTO states (id, state_code, name) VALUES
(1, 'MH', 'Maharashtra'),
(2, 'DL', 'Delhi NCR'),
(3, 'KA', 'Karnataka')
ON CONFLICT (id) DO NOTHING;

-- Seed Constituencies
INSERT INTO constituencies (id, name, state_id, house_type) VALUES
(1, 'Mumbai South', 1, 'LOK_SABHA'),
(2, 'New Delhi', 2, 'LOK_SABHA'),
(3, 'Bengaluru Central', 3, 'LOK_SABHA')
ON CONFLICT (id) DO NOTHING;

-- Seed Users
INSERT INTO users (id, email, password_hash, full_name, role, phone_number) VALUES
('11111111-1111-1111-1111-111111111111', 'mp.mumbai@mplads.gov.in', '$2b$10$e7xX3x5...', 'Hon. Rajesh Sharma (MP)', 'MP', '+919820012345'),
('22222222-2222-2222-2222-222222222222', 'da.mumbai@mplads.gov.in', '$2b$10$e7xX3x5...', 'District Magistrate Mumbai', 'DISTRICT_AUTHORITY', '+919820054321'),
('33333333-3333-3333-3333-333333333333', 'pwd.agency@mplads.gov.in', '$2b$10$e7xX3x5...', 'Public Works Dept (PWD)', 'IMPLEMENTING_AGENCY', '+919820099999'),
('44444444-4444-4444-4444-444444444444', 'admin.nodal@mplads.gov.in', '$2b$10$e7xX3x5...', 'Central Nodal Authority', 'ADMIN', '+911123456789'),
('55555555-5555-5555-5555-555555555555', 'citizen.user@mplads.gov.in', '$2b$10$e7xX3x5...', 'Aarav Patel (Citizen)', 'CITIZEN', '+919820011111')
ON CONFLICT (id) DO NOTHING;

-- Seed MP Profiles
INSERT INTO mp_profiles (id, user_id, constituency_id, term_start, term_end, annual_entitlement, cumulative_recommended, cumulative_sanctioned, cumulative_spent) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, '2024-06-01', '2029-05-31', 50000000.00, 18500000.00, 12000000.00, 4500000.00)
ON CONFLICT (id) DO NOTHING;

-- Seed District Authority
INSERT INTO district_authorities (id, user_id, district_name, state_id, collector_name, office_address) VALUES
('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Mumbai City', 1, 'Dr. Sanjay Mukherjee', 'Collectorate Office, Old Custom House, Fort, Mumbai - 400001')
ON CONFLICT (id) DO NOTHING;

-- Seed Implementing Agency
INSERT INTO implementing_agencies (id, user_id, agency_name, agency_type, registration_no, district_id) VALUES
('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'PWD Division 1 Mumbai', 'GOVERNMENT_DEPT', 'REG-PWD-MH-2024-88', 'b2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Seed Sectors
INSERT INTO work_sectors (id, sector_name, description, is_priority) VALUES
(1, 'Drinking Water Facilities', 'Tubewells, RO plants, overhead tanks, water pipelines', TRUE),
(2, 'Sanitation & Public Toilets', 'Community toilet blocks, liquid waste management', TRUE),
(3, 'Education & School Buildings', 'Classrooms, computer labs, solar installations in schools', TRUE),
(4, 'Roads & Bridges', 'Concrete roads, culverts, foot overbridges', FALSE),
(5, 'Public Health Infrastructure', 'Primary health center upgrades, ambulances', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Work Recommendations
INSERT INTO work_recommendations (id, recommendation_no, mp_id, district_id, sector_id, title, description, estimated_cost, location_address, geo_location, status, recommended_date, sla_deadline) VALUES
('r1000000-0000-0000-0000-000000000001', 'REC-2026-MH01-001', 'a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 1, 'Solar RO Water Purifier Plant', 'Installation of high-capacity solar RO plant for clean drinking water in Colaba community school.', 2500000.00, 'Colaba Secondary School, Ward 1, Mumbai', ST_SetSRID(ST_MakePoint(72.8258, 18.9067), 4326), 'IN_PROGRESS', '2026-01-10', '2026-03-26'),
('r1000000-0000-0000-0000-000000000002', 'REC-2026-MH01-002', 'a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 3, 'Smart Classroom Computer Lab', 'Setting up 30 desktop computers with internet connectivity for municipal girls school.', 3500000.00, 'Girgaon Municipal School, Ward 4, Mumbai', ST_SetSRID(ST_MakePoint(72.8180, 18.9550), 4326), 'RECOMMENDED', '2026-02-15', '2026-05-01'),
('r1000000-0000-0000-0000-000000000003', 'REC-2026-MH01-003', 'a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 4, 'Concrete Road Resurfacing & Drainage', 'Construction of storm-water resilient cement road in Marine Lines ward.', 6500000.00, 'Chandanwadi Road, Marine Lines, Mumbai', ST_SetSRID(ST_MakePoint(72.8240, 18.9440), 4326), 'SANCTIONED', '2026-01-20', '2026-04-05')
ON CONFLICT (id) DO NOTHING;

-- Seed Administrative Sanction
INSERT INTO administrative_sanctions (id, recommendation_id, da_id, sanction_order_no, sanctioned_amount, sanction_date, remarks) VALUES
('s1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'AS-MUM-2026-089', 2500000.00, '2026-01-25', 'Approved after technical estimate verification.')
ON CONFLICT (id) DO NOTHING;

-- Seed Risk Score & SHAP Explainers
INSERT INTO ml_risk_scores (id, recommendation_id, risk_score, risk_level) VALUES
('m1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 18.50, 'LOW'),
('m1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000002', 76.40, 'HIGH')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shap_explainers (id, risk_score_id, feature_name, feature_value, shap_value, impact_description) VALUES
('e1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000002', 'SBERT Text Similarity Score', 0.9400, 35.20, '94% textual similarity to previously funded recommendation REC-2024-MH01-084.'),
('e1000000-0000-0000-0000-000000000002', 'm1000000-0000-0000-0000-000000000002', 'Estimated Cost Variance', 1.4500, 22.80, 'Cost estimated 45% above regional benchmark for smart classroom computer labs.')
ON CONFLICT (id) DO NOTHING;
