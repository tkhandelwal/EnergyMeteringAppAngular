-- Clear existing data
DELETE FROM MeteringData;
DELETE FROM EquipmentClassifications;
DELETE FROM ActionPlans;
DELETE FROM Targets;
DELETE FROM Baselines;
DELETE FROM EnPIs;
DELETE FROM EnPIDefinitions;
DELETE FROM Equipment;
DELETE FROM Classifications;

DROP TABLE IF EXISTS DateRange;
DROP TABLE IF EXISTS DateRange2022;
DROP TABLE IF EXISTS DateRange2023;
DROP TABLE IF EXISTS DateRange2024;
DROP TABLE IF EXISTS HourlyRange;
DROP TABLE IF EXISTS HourlyRange2024;
DROP TABLE IF EXISTS TimeSlots;
DROP TABLE IF EXISTS DateRange2025;

-- Create expanded classifications
INSERT INTO Classifications (Id, Name, Type, Category, Color, EnergyType, MeasurementUnit, Level, ParentId)
VALUES
    (1, 'Main Campus', 'Organization', 'Location', '#3498db', 'Electricity', 'kWh', 'Organization', NULL),
    (2, 'Building A', 'Facility', 'Location', '#2ecc71', 'Electricity', 'kWh', 'Facility', 1),
    (3, 'Building B', 'Facility', 'Location', '#e74c3c', 'Electricity', 'kWh', 'Facility', 1),
    (4, 'Data Center', 'Facility', 'Location', '#9b59b6', 'Electricity', 'kWh', 'Facility', 1),
    (5, 'Manufacturing', 'Facility', 'Location', '#f1c40f', 'Electricity', 'kWh', 'Facility', 1),
    (6, 'Office Floor 1', 'Unit', 'Location', '#1abc9c', 'Electricity', 'kWh', 'Unit', 2),
    (7, 'Office Floor 2', 'Unit', 'Location', '#34495e', 'Electricity', 'kWh', 'Unit', 2),
    (8, 'Lab Area', 'Unit', 'Function', '#7f8c8d', 'Electricity', 'kWh', 'Unit', 3),
    (9, 'Server Room A', 'Unit', 'Function', '#d35400', 'Electricity', 'kWh', 'Unit', 4),
    (10, 'Production Line A', 'Unit', 'Function', '#c0392b', 'Electricity', 'kWh', 'Unit', 5),
    (11, 'Production Line B', 'Unit', 'Function', '#16a085', 'Electricity', 'kWh', 'Unit', 5),
    (12, 'HVAC Systems', 'Equipment', 'Function', '#8e44ad', 'Electricity', 'kWh', 'Equipment', 1),
    (13, 'Lighting Systems', 'Equipment', 'Function', '#2980b9', 'Electricity', 'kWh', 'Equipment', 1),
    (14, 'IT Equipment', 'Equipment', 'Equipment Type', '#27ae60', 'Electricity', 'kWh', 'Equipment', 1),
    (15, 'Manufacturing Equipment', 'Equipment', 'Equipment Type', '#f39c12', 'Electricity', 'kWh', 'Equipment', 1);

-- Create equipment (50 items)
INSERT INTO Equipment (Id, Name, Description, Location, InstallDate, Status, CreatedAt)
VALUES
    -- HVAC Equipment (10)
    (1, 'HVAC-001', 'HVAC equipment #1', 'Building A', '2020-01-01', 'Active', '2023-01-01'),
    (2, 'HVAC-002', 'HVAC equipment #2', 'Building B', '2020-01-02', 'Active', '2023-01-01'),
    (3, 'HVAC-003', 'HVAC equipment #3', 'Building A', '2020-01-03', 'Active', '2023-01-01'),
    (4, 'HVAC-004', 'HVAC equipment #4', 'Building B', '2020-01-04', 'Active', '2023-01-01'),
    (5, 'HVAC-005', 'HVAC equipment #5', 'Building A', '2020-01-05', 'Active', '2023-01-01'),
    (6, 'HVAC-006', 'HVAC equipment #6', 'Building A', '2020-01-06', 'Active', '2023-01-01'),
    (7, 'HVAC-007', 'HVAC equipment #7', 'Building B', '2020-01-07', 'Active', '2023-01-01'),
    (8, 'HVAC-008', 'HVAC equipment #8', 'Data Center', '2020-01-08', 'Active', '2023-01-01'),
    (9, 'HVAC-009', 'HVAC equipment #9', 'Manufacturing', '2020-01-09', 'Maintenance', '2023-01-01'),
    (10, 'HVAC-010', 'HVAC equipment #10', 'Manufacturing', '2020-01-10', 'Active', '2023-01-01'),
    
    -- Lighting Equipment (10)
    (11, 'Light-001', 'Lighting equipment #1', 'Building A', '2020-02-01', 'Active', '2023-01-01'),
    (12, 'Light-002', 'Lighting equipment #2', 'Building B', '2020-02-02', 'Active', '2023-01-01'),
    (13, 'Light-003', 'Lighting equipment #3', 'Building A', '2020-02-03', 'Active', '2023-01-01'),
    (14, 'Light-004', 'Lighting equipment #4', 'Building B', '2020-02-04', 'Maintenance', '2023-01-01'),
    (15, 'Light-005', 'Lighting equipment #5', 'Building A', '2020-02-05', 'Active', '2023-01-01'),
    (16, 'Light-006', 'Lighting equipment #6', 'Data Center', '2020-02-06', 'Active', '2023-01-01'),
    (17, 'Light-007', 'Lighting equipment #7', 'Manufacturing', '2020-02-07', 'Active', '2023-01-01'),
    (18, 'Light-008', 'Lighting equipment #8', 'Building A', '2020-02-08', 'Active', '2023-01-01'),
    (19, 'Light-009', 'Lighting equipment #9', 'Building B', '2020-02-09', 'Active', '2023-01-01'),
    (20, 'Light-010', 'Lighting equipment #10', 'Manufacturing', '2020-02-10', 'Active', '2023-01-01'),
    
    -- IT Equipment (10)
    (21, 'Server-001', 'Server #1', 'Data Center', '2021-01-01', 'Active', '2023-01-01'),
    (22, 'Server-002', 'Server #2', 'Data Center', '2021-01-02', 'Active', '2023-01-01'),
    (23, 'Switch-001', 'Network Switch #1', 'Data Center', '2021-01-03', 'Active', '2023-01-01'),
    (24, 'UPS-001', 'UPS #1', 'Data Center', '2021-01-04', 'Active', '2023-01-01'),
    (25, 'Cooling-001', 'Server Room Cooling #1', 'Data Center', '2021-01-05', 'Active', '2023-01-01'),
    (26, 'Server-003', 'Server #3', 'Data Center', '2021-01-06', 'Active', '2023-01-01'),
    (27, 'Server-004', 'Server #4', 'Data Center', '2021-01-07', 'Active', '2023-01-01'),
    (28, 'Switch-002', 'Network Switch #2', 'Building A', '2021-01-08', 'Active', '2023-01-01'),
    (29, 'UPS-002', 'UPS #2', 'Building B', '2021-01-09', 'Active', '2023-01-01'),
    (30, 'PC-001', 'Desktop Computer #1', 'Building A', '2021-01-10', 'Active', '2023-01-01'),
    
    -- Manufacturing Equipment (10)
    (31, 'Machine-001', 'Production Machine #1', 'Manufacturing', '2022-03-01', 'Active', '2023-01-01'),
    (32, 'Machine-002', 'Production Machine #2', 'Manufacturing', '2022-03-02', 'Active', '2023-01-01'),
    (33, 'Machine-003', 'Production Machine #3', 'Manufacturing', '2022-03-03', 'Active', '2023-01-01'),
    (34, 'Machine-004', 'Production Machine #4', 'Manufacturing', '2022-03-04', 'Maintenance', '2023-01-01'),
    (35, 'Machine-005', 'Production Machine #5', 'Manufacturing', '2022-03-05', 'Active', '2023-01-01'),
    (36, 'Robot-001', 'Assembly Robot #1', 'Manufacturing', '2022-03-06', 'Active', '2023-01-01'),
    (37, 'Robot-002', 'Assembly Robot #2', 'Manufacturing', '2022-03-07', 'Active', '2023-01-01'),
    (38, 'Conveyor-001', 'Conveyor Belt #1', 'Manufacturing', '2022-03-08', 'Active', '2023-01-01'),
    (39, 'Conveyor-002', 'Conveyor Belt #2', 'Manufacturing', '2022-03-09', 'Active', '2023-01-01'),
    (40, 'Press-001', 'Hydraulic Press #1', 'Manufacturing', '2022-03-10', 'Active', '2023-01-01'),
    
    -- General Equipment (10)
    (41, 'Elevator-001', 'Elevator #1', 'Building A', '2019-05-01', 'Active', '2023-01-01'),
    (42, 'Elevator-002', 'Elevator #2', 'Building B', '2019-05-02', 'Active', '2023-01-01'),
    (43, 'WaterHeater-001', 'Water Heater #1', 'Building A', '2019-05-03', 'Active', '2023-01-01'),
    (44, 'WaterHeater-002', 'Water Heater #2', 'Building B', '2019-05-04', 'Active', '2023-01-01'),
    (45, 'SecuritySystem-001', 'Security System', 'Main Campus', '2019-05-05', 'Active', '2023-01-01'),
    (46, 'FireAlarm-001', 'Fire Alarm System', 'Main Campus', '2019-05-06', 'Active', '2023-01-01'),
    (47, 'Refrigerator-001', 'Industrial Refrigerator', 'Building A', '2019-05-07', 'Active', '2023-01-01'),
    (48, 'Refrigerator-002', 'Industrial Refrigerator', 'Building B', '2019-05-08', 'Active', '2023-01-01'),
    (49, 'Generator-001', 'Backup Generator', 'Main Campus', '2019-05-09', 'Maintenance', '2023-01-01'),
    (50, 'AirCompressor-001', 'Air Compressor', 'Manufacturing', '2019-05-10', 'Active', '2023-01-01');

-- Associate equipment with classifications (primary)
INSERT INTO EquipmentClassifications (EquipmentId, ClassificationId)
VALUES
    -- HVAC to HVAC Systems
    (1, 12), (2, 12), (3, 12), (4, 12), (5, 12), 
    (6, 12), (7, 12), (8, 12), (9, 12), (10, 12),
    
    -- Lighting to Lighting Systems
    (11, 13), (12, 13), (13, 13), (14, 13), (15, 13), 
    (16, 13), (17, 13), (18, 13), (19, 13), (20, 13),
    
    -- IT to IT Equipment
    (21, 14), (22, 14), (23, 14), (24, 14), (25, 14),
    (26, 14), (27, 14), (28, 14), (29, 14), (30, 14),
    
    -- Manufacturing equipment to Manufacturing Equipment
    (31, 15), (32, 15), (33, 15), (34, 15), (35, 15),
    (36, 15), (37, 15), (38, 15), (39, 15), (40, 15),
    
    -- General equipment to Main Campus
    (41, 1), (42, 1), (43, 1), (44, 1), (45, 1),
    (46, 1), (47, 1), (48, 1), (49, 1), (50, 1);

-- Secondary classifications (location-based)
INSERT INTO EquipmentClassifications (EquipmentId, ClassificationId)
VALUES
    -- Building A equipment
    (1, 2), (3, 2), (5, 2), (6, 2), (11, 2), (13, 2), 
    (15, 2), (18, 2), (28, 2), (30, 2), (41, 2), (43, 2), (47, 2),
    
    -- Building B equipment
    (2, 3), (4, 3), (7, 3), (12, 3), (14, 3), (19, 3), 
    (29, 3), (42, 3), (44, 3), (48, 3),
    
    -- Data Center equipment
    (8, 4), (16, 4), (21, 4), (22, 4), (23, 4), (24, 4), 
    (25, 4), (26, 4), (27, 4),
    
    -- Manufacturing equipment
    (9, 5), (10, 5), (17, 5), (20, 5), (31, 5), (32, 5), 
    (33, 5), (34, 5), (35, 5), (36, 5), (37, 5), (38, 5), 
    (39, 5), (40, 5), (50, 5);

-- Create 10 EnPI Definitions
INSERT INTO EnPIDefinitions (Id, Name, ClassificationId, FormulaType, NormalizeBy, NormalizationUnit, Description, CreatedAt)
VALUES
    (1, 'Total Energy Consumption', 1, 'TotalEnergy', 'None', NULL, 'Total energy consumption for the entire campus', '2023-01-01'),
    (2, 'Building A Energy Intensity', 2, 'EnergyPerHour', 'Area', 'm²', 'Energy consumption per square meter in Building A', '2023-01-01'),
    (3, 'Data Center PUE', 4, 'MaxPower', 'None', NULL, 'Power Usage Effectiveness of the Data Center', '2023-01-01'),
    (4, 'Manufacturing Energy per Unit', 5, 'TotalEnergy', 'Production', 'units', 'Energy consumption per production unit', '2023-01-01'),
    (5, 'Office Space Energy Intensity', 6, 'AvgPower', 'Area', 'm²', 'Average power demand per square meter in offices', '2023-01-01'),
    (6, 'HVAC System Efficiency', 12, 'EnergyPerHour', 'HDD', 'degree days', 'HVAC energy consumption normalized by heating degree days', '2023-01-01'),
    (7, 'Server Room Energy Efficiency', 9, 'MaxPower', 'Utilization', '%', 'Server room power consumption relative to utilization', '2023-01-01'),
    (8, 'Production Line A Efficiency', 10, 'TotalEnergy', 'Production', 'units', 'Energy per unit produced on Line A', '2023-01-01'),
    (9, 'Lighting Power Density', 13, 'AvgPower', 'Area', 'm²', 'Average lighting power per square meter', '2023-01-01'),
    (10, 'IT Equipment Energy Intensity', 14, 'TotalEnergy', 'Utilization', '%', 'IT equipment energy relative to utilization', '2023-01-01');

-- Create annual baselines for all classifications
INSERT INTO Baselines (ClassificationId, StartDate, EndDate, Description, CreatedAt)
SELECT 
    Id, 
    '2023-01-01', 
    '2023-12-31', 
    'Annual Baseline 2023 - ' || Name, 
    '2024-01-01'
FROM Classifications;

-- Create seasonal baselines for main classifications
-- Spring
INSERT INTO Baselines (ClassificationId, StartDate, EndDate, Description, CreatedAt)
SELECT 
    Id, 
    '2023-03-01', 
    '2023-05-31', 
    'Spring Baseline 2023 - ' || Name, 
    '2023-06-01'
FROM Classifications WHERE Id <= 5;

-- Summer
INSERT INTO Baselines (ClassificationId, StartDate, EndDate, Description, CreatedAt)
SELECT 
    Id, 
    '2023-06-01', 
    '2023-08-31', 
    'Summer Baseline 2023 - ' || Name, 
    '2023-09-01'
FROM Classifications WHERE Id <= 5;

-- Fall
INSERT INTO Baselines (ClassificationId, StartDate, EndDate, Description, CreatedAt)
SELECT 
    Id, 
    '2023-09-01', 
    '2023-11-30', 
    'Fall Baseline 2023 - ' || Name, 
    '2023-12-01'
FROM Classifications WHERE Id <= 5;

-- Winter
INSERT INTO Baselines (ClassificationId, StartDate, EndDate, Description, CreatedAt)
SELECT 
    Id, 
    '2023-12-01', 
    '2024-02-29', 
    'Winter Baseline 2023-2024 - ' || Name, 
    '2024-03-01'
FROM Classifications WHERE Id <= 5;

-- Create targets for all EnPI definitions
INSERT INTO Targets (EnPIDefinitionId, TargetValue, TargetType, TargetDate, Description, CreatedAt)
SELECT 
    Id, 
    5 + (ABS(random()) % 1500) / 100.0, -- Random reduction between 5% and 20%
    'Reduction',
    '2025-12-31', 
    'Reduction target for ' || Name, 
    '2023-06-01'
FROM EnPIDefinitions;

-- Equipment-specific targets
INSERT INTO Targets (EnPIDefinitionId, EquipmentId, TargetValue, TargetType, TargetDate, Description, CreatedAt)
SELECT 
    (ABS(random()) % 10) + 1, -- Random EnPI definition
    Id,
    10 + (ABS(random()) % 1000) / 100.0, -- Random reduction between 10% and 20%
    'Reduction',
    date('2024-01-01', '+' || (ABS(random()) % 365) || ' days'), -- Random date in 2024
    'Equipment-specific reduction target for ' || Name,
    '2023-06-01'
FROM Equipment
WHERE Id <= 20; -- Just first 20 equipment items

-- Create action plans
INSERT INTO ActionPlans (Name, ClassificationId, Description, EnergySavingEstimate, CostEstimate, StartDate, EndDate, Status, Responsible, Notes, CreatedAt)
VALUES
    ('HVAC Optimization Program', 12, 'Comprehensive optimization of all HVAC systems across campus', 250000, 75000, '2023-06-01', '2024-06-30', 'InProgress', 'John Smith', 'Phase 1 focusing on Building A systems', '2023-05-15'),
    ('Server Virtualization Project', 14, 'Consolidate physical servers through virtualization', 180000, 125000, '2023-07-01', '2024-02-28', 'InProgress', 'Jane Doe', 'Target 40% reduction in physical servers', '2023-06-15'),
    ('LED Lighting Retrofit', 13, 'Replace all lighting with high-efficiency LED fixtures', 120000, 200000, '2023-05-01', '2024-05-31', 'InProgress', 'Robert Johnson', 'Building A complete, Building B in progress', '2023-04-15'),
    ('Manufacturing Process Optimization', 15, 'Optimize production line energy consumption', 350000, 80000, '2023-08-01', '2024-07-31', 'Planned', 'Sarah Williams', 'Focusing on high-energy processes first', '2023-07-15'),
    ('Building Envelope Improvements', 2, 'Improve insulation and seal air leaks in Building A', 85000, 120000, '2023-09-01', '2024-01-31', 'Planned', 'Michael Brown', 'Includes window replacement on north side', '2023-08-15'),
    ('Data Center Cooling Efficiency', 4, 'Optimize cooling in data center', 210000, 90000, '2023-10-01', '2024-04-30', 'Planned', 'Emily Davis', 'Implementing hot/cold aisle containment', '2023-09-15'),
    ('Automated Power Management', 14, 'Implement power management for IT equipment', 75000, 40000, '2023-06-15', '2023-11-30', 'Completed', 'David Wilson', 'Successfully reduced idle power by 25%', '2023-06-01'),
    ('Weekend Setback Program', 12, 'Implement temperature setbacks for weekends', 95000, 15000, '2023-04-01', '2023-06-30', 'Completed', 'Jennifer Martinez', 'Program now in place for all buildings', '2023-03-15'),
    ('Solar PV Installation', 1, 'Install 250kW solar PV system on Building B roof', 175000, 450000, '2024-03-01', '2024-09-30', 'Planned', 'Thomas Anderson', 'Pending final permit approval', '2023-12-15'),
    ('Energy Awareness Campaign', 1, 'Campus-wide energy conservation awareness program', 50000, 25000, '2023-07-01', '2024-06-30', 'InProgress', 'Lisa Taylor', 'First workshop completed with 85% attendance', '2023-06-15');

-- Clean up any existing temporary tables
DROP TABLE IF EXISTS DateRange;
DROP TABLE IF EXISTS DateRange2022;
DROP TABLE IF EXISTS DateRange2023;
DROP TABLE IF EXISTS DateRange2024;
DROP TABLE IF EXISTS HourlyRange;

-- Create EnPIs (calculation results)
INSERT INTO EnPIs (Name, Formula, BaselineValue, CurrentValue, CalculationDate, ClassificationId)
SELECT 
    e.Name || ' - ' || strftime('%Y', 'now'),
    e.FormulaType,
    100 + (ABS(random()) % 20000) / 100.0, -- Random baseline between 100-300
    (100 + (ABS(random()) % 20000) / 100.0) * 0.85, -- Current values ~15% better than baseline
    date('now'),
    e.ClassificationId
FROM EnPIDefinitions e;

-- METERING DATA GENERATION

-- Create temporary table for 2022 data (monthly samples)
CREATE TEMPORARY TABLE DateRange2022(dt TEXT);
WITH RECURSIVE dates(date_val) AS (
    SELECT '2022-01-01' 
    UNION ALL 
    SELECT date(date_val, '+1 month') 
    FROM dates 
    WHERE date_val < '2022-12-01'
)
INSERT INTO DateRange2022 SELECT date_val FROM dates;

-- Generate 2022 data for all equipment (monthly)
INSERT INTO MeteringData (Timestamp, EnergyValue, Power, EquipmentId, ClassificationId)
SELECT
    dt || ' 12:00:00',
    -- 2022 values about 10-15% higher than 2023, with equipment type variation
    CASE 
        WHEN e.Id <= 10 THEN (90 + (ABS(random()) % 20)) * 1.15 -- HVAC
        WHEN e.Id <= 20 THEN (50 + (ABS(random()) % 15)) * 1.15 -- Lighting
        WHEN e.Id <= 30 THEN (120 + (ABS(random()) % 10)) * 1.15 -- IT
        WHEN e.Id <= 40 THEN (200 + (ABS(random()) % 50)) * 1.15 -- Manufacturing
        ELSE (70 + (ABS(random()) % 30)) * 1.15 -- General
    END * 
    -- Seasonal pattern
    (1 + 0.2 * sin((julianday(dt) - julianday('2022-01-01'))/73.0)),
    0,
    e.Id,
    c.ClassificationId
FROM DateRange2022 d
CROSS JOIN Equipment e
JOIN EquipmentClassifications c ON e.Id = c.EquipmentId
GROUP BY d.dt, e.Id, c.ClassificationId; -- Ensure unique combinations

-- Create temporary table for 2023 data (daily samples)
CREATE TEMPORARY TABLE DateRange2023(dt TEXT);
WITH RECURSIVE dates(date_val) AS (
    SELECT '2023-01-01' 
    UNION ALL 
    SELECT date(date_val, '+1 day') 
    FROM dates 
    WHERE date_val < '2023-12-31'
)
INSERT INTO DateRange2023 SELECT date_val FROM dates;

-- Generate 2023 data for all equipment (daily for first 10 equipment, then weekly)
INSERT INTO MeteringData (Timestamp, EnergyValue, Power, EquipmentId, ClassificationId)
SELECT
    dt || ' 12:00:00',
    -- 2023 values, with equipment type variation
    CASE 
        WHEN e.Id <= 10 THEN 90 + (ABS(random()) % 20) -- HVAC
        WHEN e.Id <= 20 THEN 50 + (ABS(random()) % 15) -- Lighting
        WHEN e.Id <= 30 THEN 120 + (ABS(random()) % 10) -- IT
        WHEN e.Id <= 40 THEN 200 + (ABS(random()) % 50) -- Manufacturing
        ELSE 70 + (ABS(random()) % 30) -- General
    END * 
    -- Seasonal pattern
    (1 + 0.2 * sin((julianday(dt) - julianday('2023-01-01'))/73.0)) *
    -- Random daily variation
    (0.9 + (ABS(random()) % 20) / 100.0),
    0,
    e.Id,
    c.ClassificationId
FROM DateRange2023 d
CROSS JOIN Equipment e
JOIN EquipmentClassifications c ON e.Id = c.EquipmentId
WHERE 
    (e.Id <= 10) OR -- Daily for first 10 equipment
    (e.Id > 10 AND substr(dt, 9, 1) = '1') -- Weekly (on 1, 10, 20, 30) for others
GROUP BY d.dt, e.Id, c.ClassificationId; -- Ensure unique combinations

-- Create temporary table for 2024 data (first quarter, hourly samples for critical equipment)
CREATE TEMPORARY TABLE HourlyRange2024(ts TEXT);
WITH RECURSIVE hours(ts_val) AS (
    SELECT '2024-01-01 00:00:00' 
    UNION ALL 
    SELECT datetime(ts_val, '+1 hour') 
    FROM hours 
    WHERE ts_val < '2024-03-31 23:00:00'
)
INSERT INTO HourlyRange2024 SELECT ts_val FROM hours;

-- Generate hourly data for 2024 (first quarter, critical equipment only)
INSERT INTO MeteringData (Timestamp, EnergyValue, Power, EquipmentId, ClassificationId)
SELECT
    ts,
    -- 2024 values (10% better than 2023)
    CASE 
        WHEN e.Id <= 5 THEN (90 + (ABS(random()) % 20)) * 0.9 -- HVAC
        WHEN e.Id IN (21, 22, 23) THEN (120 + (ABS(random()) % 10)) * 0.9 -- Servers
        WHEN e.Id IN (31, 32) THEN (200 + (ABS(random()) % 50)) * 0.9 -- Manufacturing
        ELSE (70 + (ABS(random()) % 30)) * 0.9 -- General
    END / 24.0, -- Hourly value (daily / 24)
    0,
    e.Id,
    c.ClassificationId
FROM HourlyRange2024 h
CROSS JOIN Equipment e
JOIN EquipmentClassifications c ON e.Id = c.EquipmentId
WHERE e.Id IN (1, 2, 3, 4, 5, 21, 22, 23, 31, 32) -- Critical equipment only
AND substr(ts, 15, 2) IN ('00', '08', '16') -- 3 times per day (8-hour intervals)
GROUP BY h.ts, e.Id, c.ClassificationId; -- Ensure unique combinations

-- Update all power values
UPDATE MeteringData SET Power = EnergyValue / 24.0 WHERE Power = 0;

-- Create temporary table for 2025 data (up to current date)
-- Create 2025 data with more realistic patterns
CREATE TEMPORARY TABLE DateRange2025(dt TEXT);
WITH RECURSIVE dates(date_val) AS (
    SELECT '2025-01-01' 
    UNION ALL 
    SELECT date(date_val, '+1 day') 
    FROM dates 
    WHERE date_val < date('now')
)
INSERT INTO DateRange2025 SELECT date_val FROM dates;

-- Generate 15-minute data for 2025 with smoother patterns
CREATE TEMPORARY TABLE TimeSlots(hour INTEGER, minute INTEGER);
INSERT INTO TimeSlots VALUES (0,0), (0,15), (0,30), (0,45),
                             (4,0), (4,15), (4,30), (4,45),
                             (8,0), (8,15), (8,30), (8,45),
                             (12,0), (12,15), (12,30), (12,45),
                             (16,0), (16,15), (16,30), (16,45),
                             (20,0), (20,15), (20,30), (20,45);

INSERT INTO MeteringData (Timestamp, EnergyValue, Power, EquipmentId, ClassificationId)
SELECT
    d.dt || ' ' || printf('%02d', t.hour) || ':' || printf('%02d', t.minute) || ':00',
    -- Base consumption with realistic patterns
    CASE 
        WHEN e.Id <= 10 THEN 
            -- HVAC: Higher during day, workday pattern
            (75 + 25 * sin(3.14159 * (t.hour - 8) / 12)) * -- Daily cycle (peak at 2pm)
            (1.0 - 0.2 * (strftime('%w', d.dt) IN ('0','6'))) * -- Weekend reduction
            (1.0 + 0.15 * sin(3.14159 * (julianday(d.dt) - julianday('2025-01-01'))/182.5)) * -- Seasonal
            (0.85 + (ABS(random()) % 10) / 100.0) -- Small random variation
        WHEN e.Id <= 20 THEN 
            -- Lighting: Higher during work hours, zero at night
            (CASE WHEN t.hour BETWEEN 7 AND 19 THEN 45 + 15 * sin(3.14159 * (t.hour - 13) / 12)
                  ELSE 10 + (ABS(random()) % 5) END) *
            (1.0 - 0.3 * (strftime('%w', d.dt) IN ('0','6'))) * -- Weekend reduction
            (0.85 + (ABS(random()) % 8) / 100.0) -- Small random variation
        WHEN e.Id <= 30 THEN 
            -- IT: Fairly constant with slight variations
            (110 + 10 * sin(3.14159 * t.hour / 24)) *
            (0.85 + (ABS(random()) % 5) / 100.0) -- Small random variation
        ELSE
            -- Other equipment: Working hours pattern
            (60 + 40 * (t.hour BETWEEN 8 AND 18)) *
            (1.0 - 0.5 * (strftime('%w', d.dt) IN ('0','6'))) * -- Weekend reduction
            (0.85 + (ABS(random()) % 15) / 100.0) -- Small random variation
    END / 96.0, -- Convert to 15-minute energy value
    
    -- Power calculation (will be updated later)
    0,
    e.Id,
    c.ClassificationId
FROM 
    DateRange2025 d
CROSS JOIN TimeSlots t
CROSS JOIN (SELECT Id FROM Equipment WHERE Id % 5 = 0) e -- Sample every 5th equipment
JOIN EquipmentClassifications c ON e.Id = c.EquipmentId
-- Get higher resolution for recent dates, sparser for older dates
WHERE (julianday(date('now')) - julianday(d.dt) < 30) OR 
      (julianday(date('now')) - julianday(d.dt) >= 30 AND t.hour % 8 = 0 AND d.dt LIKE '%-01' OR d.dt LIKE '%-15')
ORDER BY d.dt, t.hour, t.minute, e.Id;

-- Update power values for 15-minute intervals
UPDATE MeteringData 
SET Power = EnergyValue * 4.0
WHERE strftime('%Y', Timestamp) = '2025';

DROP TABLE DateRange2025;
DROP TABLE TimeSlots;

-- Drop the temporary table
DROP TABLE IF EXISTS DateRange2025;

-- Drop temporary tables
DROP TABLE IF EXISTS DateRange2022;
DROP TABLE IF EXISTS DateRange2023;
DROP TABLE IF EXISTS HourlyRange2024;

-- Add indexes for performance 
CREATE INDEX IF NOT EXISTS IX_MeteringData_Timestamp ON MeteringData(Timestamp);
CREATE INDEX IF NOT EXISTS IX_MeteringData_Equipment ON MeteringData(EquipmentId);
CREATE INDEX IF NOT EXISTS IX_MeteringData_Classification ON MeteringData(ClassificationId);
CREATE INDEX IF NOT EXISTS IX_EquipmentClassifications_Equipment ON EquipmentClassifications(EquipmentId);
CREATE INDEX IF NOT EXISTS IX_EquipmentClassifications_Classification ON EquipmentClassifications(ClassificationId);

-- Output summary statistics
SELECT 'Classifications' AS Entity, COUNT(*) AS Count FROM Classifications
UNION ALL
SELECT 'Equipment', COUNT(*) FROM Equipment
UNION ALL
SELECT 'Equipment Classifications', COUNT(*) FROM EquipmentClassifications
UNION ALL
SELECT 'EnPI Definitions', COUNT(*) FROM EnPIDefinitions
UNION ALL
SELECT 'EnPIs', COUNT(*) FROM EnPIs
UNION ALL
SELECT 'Targets', COUNT(*) FROM Targets
UNION ALL
SELECT 'Baselines', COUNT(*) FROM Baselines
UNION ALL
SELECT 'Action Plans', COUNT(*) FROM ActionPlans
UNION ALL
SELECT 'Metering Data Points', COUNT(*) FROM MeteringData;