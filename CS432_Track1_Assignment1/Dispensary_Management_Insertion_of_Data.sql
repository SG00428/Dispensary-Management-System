USE DispensaryManagement;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO Member (Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode, Department, BloodGroup, EmergencyContact, Address, RegistrationDate, MemberType, Status) VALUES
('Rahul Sharma', 21, 'rahul.sharma@college.edu', '9876543210', 'CS2021001', 'Computer Science', 'O+', '9876543211', '123 MG Road, Bangalore, Karnataka', '2021-08-15', 'Student', 'Active'),
('Priya Patel', 20, 'priya.patel@college.edu', '9876543212', 'EC2022045', 'Electronics', 'A+', '9876543213', '456 FC Road, Pune, Maharashtra', '2022-08-20', 'Student', 'Active'),
('Arjun Kumar', 22, 'arjun.kumar@college.edu', '9876543214', 'ME2020089', 'Mechanical', 'B+', '9876543215', '789 Anna Salai, Chennai, Tamil Nadu', '2020-08-10', 'Student', 'Active'),
('Ananya Reddy', 19, 'ananya.reddy@college.edu', '9876543216', 'CS2023012', 'Computer Science', 'AB+', '9876543217', '321 Jubilee Hills, Hyderabad, Telangana', '2023-08-25', 'Student', 'Active'),
('Dr. Vikram Singh', 35, 'vikram.singh@college.edu', '9876543218', 'FAC001', 'Computer Science', 'O-', '9876543219', '654 Civil Lines, Delhi', '2015-07-01', 'Faculty', 'Active'),
('Meera Iyer', 21, 'meera.iyer@college.edu', '9876543220', 'BT2021056', 'Biotechnology', 'A-', '9876543221', '987 Indiranagar, Bangalore, Karnataka', '2021-08-18', 'Student', 'Active'),
('Karthik Nair', 23, 'karthik.nair@college.edu', '9876543222', 'EE2019034', 'Electrical', 'B-', '9876543223', '147 Marine Drive, Mumbai, Maharashtra', '2019-08-12', 'Student', 'Active'),
('Sneha Desai', 20, 'sneha.desai@college.edu', '9876543224', 'CH2022078', 'Chemical', 'O+', '9876543225', '258 Satellite, Ahmedabad, Gujarat', '2022-08-22', 'Student', 'Active'),
('Dr. Rajesh Gupta', 42, 'rajesh.gupta@college.edu', '9876543226', 'FAC002', 'Physics', 'A+', '9876543227', '369 Vasant Vihar, Delhi', '2010-06-15', 'Faculty', 'Active'),
('Aarav Mehta', 22, 'aarav.mehta@college.edu', '9876543228', 'IT2020067', 'Information Technology', 'AB-', '9876543229', '741 Koramangala, Bangalore, Karnataka', '2020-08-08', 'Student', 'Active'),
('Diya Chatterjee', 19, 'diya.chatterjee@college.edu', '9876543230', 'CS2023089', 'Computer Science', 'B+', '9876543231', '852 Salt Lake, Kolkata, West Bengal', '2023-08-28', 'Student', 'Active'),
('Rohan Joshi', 21, 'rohan.joshi@college.edu', '9876543232', 'ME2021043', 'Mechanical', 'O-', '9876543233', '963 Deccan, Pune, Maharashtra', '2021-08-16', 'Student', 'Active'),
('Ishita Kapoor', 20, 'ishita.kapoor@college.edu', '9876543234', 'EC2022091', 'Electronics', 'A-', '9876543235', '159 Connaught Place, Delhi', '2022-08-24', 'Student', 'Active'),
('Aditya Rao', 28, 'aditya.rao@college.edu', '9876543236', 'STAFF001', 'Administration', 'O+', '9876543237', '357 Jayanagar, Bangalore, Karnataka', '2018-03-10', 'Staff', 'Active'),
('Pooja Malhotra', 22, 'pooja.malhotra@college.edu', '9876543238', 'BT2020055', 'Biotechnology', 'B+', '9876543239', '486 Model Town, Chandigarh, Punjab', '2020-08-14', 'Student', 'Active'),
('Siddharth Verma', 21, 'siddharth.verma@college.edu', '9876543240', 'CS2021098', 'Computer Science', 'AB+', '9876543241', '753 Gomti Nagar, Lucknow, Uttar Pradesh', '2021-08-19', 'Student', 'Active'),
('Kavya Krishnan', 19, 'kavya.krishnan@college.edu', '9876543242', 'EE2023034', 'Electrical', 'A+', '9876543243', '864 T Nagar, Chennai, Tamil Nadu', '2023-08-30', 'Student', 'Active'),
('Aryan Saxena', 23, 'aryan.saxena@college.edu', '9876543244', 'ME2019076', 'Mechanical', 'O-', '9876543245', '975 Hazratganj, Lucknow, Uttar Pradesh', '2019-08-11', 'Student', 'Active'),
('Riya Bhatt', 20, 'riya.bhatt@college.edu', '9876543246', 'CH2022067', 'Chemical', 'B-', '9876543247', '147 CG Road, Ahmedabad, Gujarat', '2022-08-26', 'Student', 'Active'),
('Dr. Sunita Rao', 38, 'sunita.rao@college.edu', '9876543248', 'FAC003', 'Chemistry', 'A-', '9876543249', '258 Banjara Hills, Hyderabad, Telangana', '2012-07-20', 'Faculty', 'Active');



INSERT INTO Doctor (Name, Specialization, Email, Phone, LicenseNumber, AvailableFrom, AvailableTo, WorkingDays, Status) VALUES
('Dr. Amit Deshmukh', 'General Physician', 'amit.deshmukh@hospital.com', '9123456701', 'MH-DOC-2015-001', '09:00:00', '17:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Active'),
('Dr. Kavita Menon', 'General Physician', 'kavita.menon@hospital.com', '9123456702', 'KL-DOC-2016-045', '09:00:00', '13:00:00', 'Monday,Wednesday,Friday', 'Active'),
('Dr. Suresh Reddy', 'Cardiologist', 'suresh.reddy@hospital.com', '9123456703', 'AP-DOC-2014-089', '14:00:00', '18:00:00', 'Tuesday,Thursday,Saturday', 'Active'),
('Dr. Neha Kapoor', 'Dermatologist', 'neha.kapoor@hospital.com', '9123456704', 'DL-DOC-2017-234', '10:00:00', '16:00:00', 'Monday,Tuesday,Thursday,Friday', 'Active'),
('Dr. Rajiv Malhotra', 'Orthopedic', 'rajiv.malhotra@hospital.com', '9123456705', 'PB-DOC-2013-567', '08:00:00', '14:00:00', 'Monday,Wednesday,Friday', 'Active'),
('Dr. Priya Sharma', 'ENT Specialist', 'priya.sharma@hospital.com', '9123456706', 'KA-DOC-2018-123', '11:00:00', '17:00:00', 'Tuesday,Wednesday,Thursday,Saturday', 'Active'),
('Dr. Anil Kumar', 'General Physician', 'anil.kumar@hospital.com', '9123456707', 'TN-DOC-2015-456', '09:00:00', '15:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Active'),
('Dr. Sneha Iyer', 'Gynecologist', 'sneha.iyer@hospital.com', '9123456708', 'KA-DOC-2019-789', '13:00:00', '18:00:00', 'Monday,Wednesday,Friday', 'Active'),
('Dr. Vikram Patel', 'General Physician', 'vikram.patel@hospital.com', '9123456709', 'GJ-DOC-2016-321', '08:00:00', '16:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 'Active'),
('Dr. Anjali Verma', 'Pediatrician', 'anjali.verma@hospital.com', '9123456710', 'UP-DOC-2017-654', '10:00:00', '16:00:00', 'Monday,Tuesday,Thursday,Friday', 'Active'),
('Dr. Ramesh Nair', 'Dentist', 'ramesh.nair@hospital.com', '9123456711', 'KL-DOC-2015-987', '09:00:00', '13:00:00', 'Tuesday,Wednesday,Thursday,Saturday', 'Active'),
('Dr. Deepa Singh', 'Ophthalmologist', 'deepa.singh@hospital.com', '9123456712', 'DL-DOC-2018-147', '14:00:00', '19:00:00', 'Monday,Wednesday,Friday,Saturday', 'Active'),
('Dr. Kiran Joshi', 'General Physician', 'kiran.joshi@hospital.com', '9123456713', 'MH-DOC-2016-258', '09:00:00', '17:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Active'),
('Dr. Pooja Gupta', 'Psychiatrist', 'pooja.gupta@hospital.com', '9123456714', 'DL-DOC-2019-369', '11:00:00', '18:00:00', 'Tuesday,Thursday,Friday', 'Active'),
('Dr. Sanjay Rao', 'General Physician', 'sanjay.rao@hospital.com', '9123456715', 'TG-DOC-2015-741', '08:00:00', '14:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Active');


INSERT INTO StaffEmployee (Name, Role, Email, Phone, ShiftTiming, HireDate, LicenseNumber, Status) VALUES
('Sunita Kadam', 'Nurse', 'sunita.kadam@college.edu', '9234567801', 'Morning (8AM-4PM)', '2019-06-01', 'NUR-MH-2019-001', 'Active'),
('Ramesh Pillai', 'Pharmacist', 'ramesh.pillai@college.edu', '9234567802', 'Morning (8AM-4PM)', '2018-05-15', 'PHR-KL-2018-045', 'Active'),
('Lakshmi Nair', 'Nurse', 'lakshmi.nair@college.edu', '9234567803', 'Evening (4PM-12AM)', '2020-03-10', 'NUR-KL-2020-089', 'Active'),
('Vijay Kumar', 'Technician', 'vijay.kumar@college.edu', '9234567804', 'Morning (8AM-4PM)', '2019-08-20', 'TECH-TN-2019-234', 'Active'),
('Anita Desai', 'Admin', 'anita.desai@college.edu', '9234567805', 'General (9AM-6PM)', '2017-01-05', NULL, 'Active'),
('Prakash Sharma', 'Pharmacist', 'prakash.sharma@college.edu', '9234567806', 'Evening (4PM-12AM)', '2019-07-12', 'PHR-KA-2019-567', 'Active'),
('Geeta Menon', 'Nurse', 'geeta.menon@college.edu', '9234567807', 'Night (12AM-8AM)', '2020-09-18', 'NUR-KL-2020-123', 'Active'),
('Sunil Reddy', 'Support Staff', 'sunil.reddy@college.edu', '9234567808', 'Morning (8AM-4PM)', '2018-11-22', NULL, 'Active'),
('Kavita Joshi', 'Nurse', 'kavita.joshi@college.edu', '9234567809', 'Morning (8AM-4PM)', '2019-02-14', 'NUR-MH-2019-456', 'Active'),
('Rajesh Iyer', 'Technician', 'rajesh.iyer@college.edu', '9234567810', 'Evening (4PM-12AM)', '2020-04-30', 'TECH-KA-2020-789', 'Active'),
('Neha Patel', 'Pharmacist', 'neha.patel@college.edu', '9234567811', 'Morning (8AM-4PM)', '2018-12-05', 'PHR-GJ-2018-321', 'Active'),
('Arun Kumar', 'Support Staff', 'arun.kumar@college.edu', '9234567812', 'General (9AM-6PM)', '2019-10-11', NULL, 'Active'),
('Priya Singh', 'Nurse', 'priya.singh@college.edu', '9234567813', 'Evening (4PM-12AM)', '2020-06-25', 'NUR-DL-2020-654', 'Active'),
('Manoj Verma', 'Admin', 'manoj.verma@college.edu', '9234567814', 'General (9AM-6PM)', '2017-08-16', NULL, 'Active'),
('Deepa Nair', 'Nurse', 'deepa.nair@college.edu', '9234567815', 'Night (12AM-8AM)', '2020-01-09', 'NUR-KL-2020-987', 'Active');


INSERT INTO Medicine (Name, GenericName, Category, Form, Manufacturer, UnitPrice, RequiresPrescription, Status) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Analgesic', 'Tablet', 'Cipla Ltd', 2.50, FALSE, 'Available'),
('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic', 'Capsule', 'Sun Pharma', 8.00, TRUE, 'Available'),
('Azithromycin 250mg', 'Azithromycin', 'Antibiotic', 'Tablet', 'Torrent Pharma', 15.00, TRUE, 'Available'),
('Cetirizine 10mg', 'Cetirizine', 'Antihistamine', 'Tablet', 'Dr. Reddy\'s', 3.50, FALSE, 'Available'),
('Ibuprofen 400mg', 'Ibuprofen', 'Analgesic', 'Tablet', 'Lupin Ltd', 4.00, FALSE, 'Available'),
('Omeprazole 20mg', 'Omeprazole', 'Antacid', 'Capsule', 'Cadila Healthcare', 6.50, TRUE, 'Available'),
('Metformin 500mg', 'Metformin', 'Antidiabetic', 'Tablet', 'USV Ltd', 3.00, TRUE, 'Available'),
('Atorvastatin 10mg', 'Atorvastatin', 'Statin', 'Tablet', 'Ranbaxy', 7.00, TRUE, 'Available'),
('Salbutamol Inhaler', 'Salbutamol', 'Bronchodilator', 'Injection', 'Cipla Ltd', 120.00, TRUE, 'Available'),
('Cough Syrup', 'Dextromethorphan', 'Antitussive', 'Syrup', 'Dabur India', 85.00, FALSE, 'Available'),
('Ranitidine 150mg', 'Ranitidine', 'Antacid', 'Tablet', 'Glenmark', 2.00, FALSE, 'Available'),
('Diclofenac Gel', 'Diclofenac', 'Analgesic', 'Ointment', 'Sun Pharma', 95.00, FALSE, 'Available'),
('Vitamin D3 1000IU', 'Cholecalciferol', 'Vitamin Supplement', 'Tablet', 'Mankind Pharma', 5.00, FALSE, 'Available'),
('Calcium Tablets', 'Calcium Carbonate', 'Mineral Supplement', 'Tablet', 'Pfizer India', 4.50, FALSE, 'Available'),
('Ciprofloxacin 500mg', 'Ciprofloxacin', 'Antibiotic', 'Tablet', 'Aurobindo Pharma', 10.00, TRUE, 'Available'),
('Prednisolone 5mg', 'Prednisolone', 'Corticosteroid', 'Tablet', 'Zydus Cadila', 3.50, TRUE, 'Available'),
('Eye Drops Lubricant', 'Carboxymethylcellulose', 'Ophthalmic', 'Drops', 'Allergan India', 75.00, FALSE, 'Available'),
('Multivitamin Syrup', 'Multivitamin', 'Vitamin Supplement', 'Syrup', 'Abbott India', 150.00, FALSE, 'Available'),
('Betadine Solution', 'Povidone-Iodine', 'Antiseptic', 'Other', 'Win Medicare', 45.00, FALSE, 'Available'),
('Paracetamol Syrup', 'Paracetamol', 'Analgesic', 'Syrup', 'Cipla Ltd', 55.00, FALSE, 'Available');


INSERT INTO MedicalSupplier (CompanyName, ContactPerson, Email, Phone, AlternatePhone, Address, City, State, PinCode, GSTNumber, LicenseNumber, SupplyCategory, Rating, ContractStartDate, ContractEndDate, PaymentTerms, Status, LastSupplyDate) VALUES
('MediCare Supplies Pvt Ltd', 'Rajesh Kumar', 'rajesh@medicare.com', '9345678901', '9345678902', 'Plot 15, Industrial Area Phase 1', 'Mumbai', 'Maharashtra', '400001', '27AABCU9603R1ZM', 'SUP-MH-2018-001', 'Tablets, Capsules', 4.50, '2020-01-01', '2025-12-31', 'Net 30 days', 'Active', '2026-02-10'),
('PharmaCorp India Ltd', 'Sunita Sharma', 'sunita@pharmacorp.com', '9345678903', '9345678904', '45 MG Road', 'Bangalore', 'Karnataka', '560001', '29AABCP1234D1Z5', 'SUP-KA-2019-045', 'Syrups, Injections', 4.80, '2019-06-15', '2025-06-14', 'Net 45 days', 'Active', '2026-02-08'),
('HealthFirst Distributors', 'Anil Patel', 'anil@healthfirst.com', '9345678905', '9345678906', 'Shop 23, Medical Complex', 'Ahmedabad', 'Gujarat', '380001', '24AABHC5678K1ZX', 'SUP-GJ-2018-089', 'General Medicines', 4.20, '2020-03-10', '2026-03-09', 'Net 30 days', 'Active', '2026-01-25'),
('Wellness Pharma Solutions', 'Meera Iyer', 'meera@wellness.com', '9345678907', '9345678908', '12 Anna Salai', 'Chennai', 'Tamil Nadu', '600001', '33AABCW9012F1ZP', 'SUP-TN-2019-234', 'Antibiotics, Analgesics', 4.60, '2019-08-20', '2025-08-19', 'Net 30 days', 'Active', '2026-02-12'),
('Prime Medical Suppliers', 'Vikram Singh', 'vikram@primemedical.com', '9345678909', '9345678910', '78 Connaught Place', 'Delhi', 'Delhi', '110001', '07AABCP3456M1Z8', 'SUP-DL-2020-567', 'Surgical Items, Medicines', 4.40, '2020-02-01', '2026-01-31', 'Net 45 days', 'Active', '2026-02-05'),
('BioMed Suppliers Co', 'Priya Reddy', 'priya@biomed.com', '9345678911', '9345678912', '56 Jubilee Hills', 'Hyderabad', 'Telangana', '500001', '36AABCB7890H1ZK', 'SUP-TG-2019-123', 'Vitamins, Supplements', 4.70, '2019-11-10', '2025-11-09', 'Net 30 days', 'Active', '2026-02-01'),
('LifeCare Pharmaceuticals', 'Karthik Nair', 'karthik@lifecare.com', '9345678913', '9345678914', '34 Marine Drive', 'Kochi', 'Kerala', '682001', '32AABCL4567E1ZM', 'SUP-KL-2020-456', 'General Medicines', 4.30, '2020-05-15', '2026-05-14', 'Net 30 days', 'Active', '2026-01-28'),
('MedEx Distributors', 'Sneha Desai', 'sneha@medex.com', '9345678915', '9345678916', '89 CG Road', 'Ahmedabad', 'Gujarat', '380002', '24AABCM2345G1ZR', 'SUP-GJ-2018-789', 'Syrups, Ointments', 4.10, '2020-07-01', '2025-06-30', 'Net 45 days', 'Active', '2026-02-09'),
('Global Health Supplies', 'Rajiv Malhotra', 'rajiv@globalhealth.com', '9345678917', '9345678918', '67 Sector 17', 'Chandigarh', 'Punjab', '160017', '03AABCG6789P1ZN', 'SUP-PB-2019-321', 'All Categories', 4.90, '2019-04-01', '2025-03-31', 'Net 30 days', 'Active', '2026-02-13'),
('Cure & Care Suppliers', 'Anjali Verma', 'anjali@curecare.com', '9345678919', '9345678920', '23 Hazratganj', 'Lucknow', 'Uttar Pradesh', '226001', '09AABCC8901U1ZT', 'SUP-UP-2020-654', 'Tablets, Capsules', 4.50, '2020-09-01', '2026-08-31', 'Net 30 days', 'Active', '2026-02-07'),
('Medico Supplies Hub', 'Ramesh Joshi', 'ramesh@medicohub.com', '9345678921', '9345678922', '45 FC Road', 'Pune', 'Maharashtra', '411001', '27AABCM1234P1ZW', 'SUP-MH-2019-987', 'Antiseptics, First Aid', 4.20, '2019-12-15', '2025-12-14', 'Net 45 days', 'Active', '2026-01-30'),
('Healthcare Plus Ltd', 'Deepa Singh', 'deepa@healthcareplus.com', '9345678923', '9345678924', '12 Park Street', 'Kolkata', 'West Bengal', '700001', '19AABCH5678W1ZY', 'SUP-WB-2020-147', 'General Medicines', 4.40, '2020-10-20', '2026-10-19', 'Net 30 days', 'Active', '2026-02-06'),
('MedSupply Express', 'Pooja Gupta', 'pooja@medsupplyexpress.com', '9345678925', '9345678926', '78 Residency Road', 'Bangalore', 'Karnataka', '560025', '29AABCM9012K1ZA', 'SUP-KA-2019-258', 'All Categories', 4.70, '2019-07-10', '2025-07-09', 'Net 30 days', 'Active', '2026-02-11'),
('Pharma Connect India', 'Sanjay Rao', 'sanjay@pharmaconnect.com', '9345678927', '9345678928', '34 Banjara Hills', 'Hyderabad', 'Telangana', '500034', '36AABCP3456T1ZB', 'SUP-TG-2020-369', 'Imported Medicines', 4.60, '2020-11-01', '2026-10-31', 'Net 45 days', 'Active', '2026-02-04'),
('SupraMed Suppliers', 'Kavita Menon', 'kavita@supramed.com', '9345678929', '9345678930', '56 MG Road', 'Thiruvananthapuram', 'Kerala', '695001', '32AABCS7890K1ZC', 'SUP-KL-2019-741', 'Chronic Disease Medicines', 4.80, '2019-09-15', '2025-09-14', 'Net 30 days', 'Active', '2026-02-02');

INSERT INTO MedicalHistory (MemberID, ChronicConditions, KnownAllergies, PastSurgeries, FamilyHistory, BloodPressure, Height, Weight) VALUES
(1, 'None', 'None', 'None', 'Father has Diabetes', '120/80', 175.5, 70.2),
(2, 'Asthma (Mild)', 'Penicillin, Pollen', 'Appendectomy (2020)', 'Mother has Hypertension', '115/75', 162.0, 55.5),
(3, 'None', 'Dust, Seafood', 'None', 'Grandfather has Heart Disease', '118/78', 180.0, 78.0),
(4, 'None', 'None', 'None', 'None', '110/70', 158.5, 52.0),
(5, 'Hypertension', 'None', 'Knee Surgery (2018)', 'Father has Diabetes, Mother has Hypertension', '140/90', 172.0, 82.5),
(6, 'Migraine', 'Sulfa drugs', 'None', 'Mother has Migraine', '112/72', 165.0, 58.0),
(7, 'None', 'None', 'Fracture Surgery (2021)', 'None', '122/82', 178.0, 75.5),
(8, 'None', 'Lactose Intolerant', 'None', 'Father has Diabetes', '116/76', 160.0, 54.0),
(9, 'Diabetes Type 2', 'None', 'Cataract Surgery (2019)', 'Father has Diabetes, Brother has Diabetes', '135/88', 170.0, 78.0),
(10, 'None', 'None', 'None', 'None', '119/79', 176.0, 72.0),
(11, 'None', 'Peanuts', 'None', 'Grandmother has Arthritis', '114/74', 163.0, 56.5),
(12, 'None', 'None', 'None', 'None', '120/80', 177.5, 74.0),
(13, 'Thyroid (Hypothyroidism)', 'Iodine contrast', 'None', 'Mother has Thyroid', '118/78', 161.0, 57.0),
(14, 'None', 'None', 'None', 'None', '125/80', 168.0, 65.0),
(15, 'None', 'Eggs, Soy', 'Tonsillectomy (2019)', 'None', '117/77', 164.0, 59.0),
(16, 'None', 'None', 'None', 'Father has Heart Disease', '121/81', 179.0, 76.0),
(17, 'None', 'Aspirin', 'None', 'None', '113/73', 159.0, 51.0),
(18, 'None', 'None', 'ACL Repair (2020)', 'None', '123/83', 181.0, 80.0),
(19, 'None', 'Latex', 'None', 'Mother has Asthma', '115/75', 162.5, 55.0),
(20, 'Arthritis', 'None', 'Hip Replacement (2015)', 'Mother has Arthritis', '138/92', 166.0, 70.0);


INSERT INTO Appointment (MemberID, DoctorID, AppointmentDate, AppointmentTime, Symptoms, Status, Priority, TokenNumber, CreatedAt) VALUES
(1, 1, '2026-02-20', '10:00:00', 'Fever and headache for 2 days', 'Scheduled', 'Normal', 101, '2026-02-15 08:30:00'),
(2, 2, '2026-02-21', '11:00:00', 'Breathing difficulty', 'Scheduled', 'Urgent', 102, '2026-02-15 09:00:00'),
(3, 3, '2026-02-22', '14:30:00', 'Chest pain', 'Scheduled', 'Urgent', 103, '2026-02-15 10:15:00'),
(4, 4, '2026-02-20', '15:00:00', 'Skin rash on arms', 'Scheduled', 'Normal', 104, '2026-02-15 11:00:00'),
(6, 1, '2026-02-23', '09:30:00', 'Severe headache', 'Scheduled', 'Normal', 105, '2026-02-15 12:00:00'),
(7, 5, '2026-02-22', '10:00:00', 'Knee pain after exercise', 'Scheduled', 'Normal', 106, '2026-02-15 13:30:00'),
(8, 1, '2026-02-24', '11:30:00', 'Stomach ache and vomiting', 'Scheduled', 'Normal', 107, '2026-02-15 14:00:00'),
(10, 7, '2026-02-21', '13:00:00', 'Cold and cough', 'Scheduled', 'Normal', 108, '2026-02-15 15:00:00'),
(11, 1, '2026-02-25', '10:30:00', 'General checkup', 'Scheduled', 'Normal', 109, '2026-02-15 16:00:00'),
(12, 5, '2026-02-23', '12:00:00', 'Back pain', 'Scheduled', 'Normal', 110, '2026-02-14 10:00:00'),
(13, 6, '2026-02-22', '14:00:00', 'Ear pain and hearing loss', 'Scheduled', 'Normal', 111, '2026-02-14 11:30:00'),
(15, 1, '2026-02-24', '09:00:00', 'Fever', 'Scheduled', 'Normal', 112, '2026-02-14 13:00:00'),
(16, 7, '2026-02-25', '11:00:00', 'Throat infection', 'Scheduled', 'Normal', 113, '2026-02-14 14:30:00'),
(17, 12, '2026-02-22', '16:00:00', 'Eye irritation', 'Scheduled', 'Normal', 114, '2026-02-14 15:00:00'),
(18, 5, '2026-02-26', '08:30:00', 'Shoulder pain', 'Scheduled', 'Normal', 115, '2026-02-14 16:00:00'),
(1, 1, '2026-02-16', '10:00:00', 'Regular checkup', 'Scheduled', 'Normal', 116, '2026-02-12 09:00:00'),
(4, 4, '2026-02-17', '14:00:00', 'Acne treatment followup', 'Scheduled', 'Normal', 117, '2026-02-13 10:00:00'),
(6, 1, '2026-02-18', '11:00:00', 'Migraine', 'Scheduled', 'Normal', 118, '2026-02-11 14:00:00'),
(10, 1, '2026-02-17', '09:30:00', 'Fever and body ache', 'Scheduled', 'Normal', 119, '2026-02-09 11:00:00'),
(14, 7, '2026-02-18', '10:00:00', 'Cold and sore throat', 'Scheduled', 'Normal', 120, '2026-02-10 13:00:00');


INSERT INTO Inventory (MedicineID, BatchNumber, Quantity, ManufactureDate, ExpiryDate, Location, SupplierID, PurchaseDate, PurchasePrice, ReorderLevel, MinimumStock, Status) VALUES
(1, 'PAR-2024-001', 500, '2024-01-15', '2026-12-31', 'Shelf A-1', 1, '2024-02-01', 2.00, 100, 50, 'Available'),
(2, 'AMOX-2024-045', 300, '2024-02-20', '2026-08-20', 'Shelf A-2', 2, '2024-03-01', 7.00, 50, 25, 'Available'),
(3, 'AZI-2024-089', 200, '2024-03-10', '2026-09-10', 'Shelf A-3', 4, '2024-03-25', 13.50, 40, 20, 'Available'),
(4, 'CET-2024-234', 400, '2024-01-25', '2027-01-25', 'Shelf B-1', 3, '2024-02-15', 3.00, 80, 40, 'Available'),
(5, 'IBU-2024-567', 450, '2024-02-05', '2026-11-05', 'Shelf B-2', 1, '2024-02-20', 3.50, 90, 45, 'Available'),
(6, 'OME-2024-123', 250, '2024-03-15', '2026-12-15', 'Shelf B-3', 5, '2024-04-01', 6.00, 50, 25, 'Available'),
(7, 'MET-2024-456', 600, '2024-01-10', '2027-01-10', 'Shelf C-1', 7, '2024-01-25', 2.50, 120, 60, 'Available'),
(8, 'ATO-2024-789', 350, '2024-02-18', '2026-08-18', 'Shelf C-2', 8, '2024-03-05', 6.50, 70, 35, 'Available'),
(9, 'SAL-2024-321', 100, '2024-03-20', '2027-03-20', 'Refrigerator R-1', 2, '2024-04-05', 110.00, 20, 10, 'Available'),
(10, 'COUGH-2024-654', 80, '2024-02-28', '2026-08-28', 'Shelf D-1', 3, '2024-03-15', 80.00, 15, 8, 'Available'),
(11, 'RAN-2024-987', 550, '2024-01-20', '2027-01-20', 'Shelf D-2', 6, '2024-02-05', 1.80, 110, 55, 'Available'),
(12, 'DIC-2024-147', 120, '2024-03-05', '2026-09-05', 'Shelf D-3', 9, '2024-03-20', 90.00, 25, 12, 'Available'),
(13, 'VIT-2024-258', 700, '2024-02-15', '2027-08-15', 'Shelf E-1', 10, '2024-03-01', 4.50, 140, 70, 'Available'),
(14, 'CAL-2024-369', 650, '2024-01-30', '2027-07-30', 'Shelf E-2', 11, '2024-02-15', 4.00, 130, 65, 'Available'),
(15, 'CIP-2024-741', 280, '2024-03-12', '2026-09-12', 'Shelf E-3', 4, '2024-03-28', 9.50, 56, 28, 'Available'),
(16, 'PRE-2024-852', 320, '2024-02-22', '2026-08-22', 'Shelf F-1', 13, '2024-03-10', 3.20, 64, 32, 'Available'),
(17, 'EYE-2024-963', 90, '2024-03-08', '2026-09-08', 'Refrigerator R-2', 14, '2024-03-25', 72.00, 18, 9, 'Available'),
(18, 'MULTI-2024-159', 60, '2024-02-10', '2026-08-10', 'Shelf F-2', 15, '2024-02-25', 145.00, 12, 6, 'Available'),
(19, 'BET-2024-753', 200, '2024-01-05', '2028-01-05', 'Shelf F-3', 12, '2024-01-20', 43.00, 40, 20, 'Available'),
(20, 'PARSYR-2024-486', 70, '2024-03-01', '2026-09-01', 'Shelf G-1', 1, '2024-03-18', 52.00, 14, 7, 'Available');



INSERT INTO Visit (MemberID, DoctorID, AppointmentID, VisitDate, VisitTime, ChiefComplaint, Diagnosis, VitalSigns, TreatmentNotes, FollowUpRequired, FollowUpDate, VisitType, Status) VALUES
(1, 1, NULL, '2026-02-13', '10:15:00', 'Regular checkup', 'Healthy, no issues found', '{"bp": "120/80", "temp": "98.6", "pulse": "72", "oxygen": "98"}', 'Advised regular exercise and balanced diet', FALSE, NULL, 'Walk-in', 'Completed'),
(4, 4, NULL, '2026-02-14', '14:15:00', 'Acne treatment followup', 'Acne improving with medication', '{"bp": "115/75", "temp": "98.4", "pulse": "68"}', 'Continue current medication for 2 more weeks', TRUE, '2026-02-28', 'Walk-in', 'Completed'),
(6, 1, NULL, '2026-02-12', '11:20:00', 'Migraine', 'Tension headache', '{"bp": "118/78", "temp": "98.7", "pulse": "70"}', 'Prescribed pain reliever, advised rest and stress management', FALSE, NULL, 'Walk-in', 'Completed'),
(10, 1, NULL, '2026-02-10', '09:45:00', 'Fever and body ache', 'Viral fever', '{"bp": "119/79", "temp": "101.2", "pulse": "82", "oxygen": "97"}', 'Prescribed antipyretics and rest for 3 days', TRUE, '2026-02-20', 'Walk-in', 'Completed'),
(14, 7, NULL, '2026-02-11', '10:20:00', 'Cold and sore throat', 'Upper respiratory tract infection', '{"bp": "120/80", "temp": "99.8", "pulse": "75"}', 'Prescribed antibiotics and cough syrup', TRUE, '2026-02-25', 'Walk-in', 'Completed'),
(2, 7, NULL, '2026-02-08', '14:30:00', 'Severe cough and breathing difficulty', 'Acute bronchitis', '{"bp": "115/75", "temp": "100.4", "pulse": "88", "oxygen": "94"}', 'Prescribed bronchodilator and antibiotics, advised steam inhalation', TRUE, '2026-02-22', 'Walk-in', 'Completed'),
(8, 1, NULL, '2026-02-09', '16:00:00', 'Stomach pain and nausea', 'Gastritis', '{"bp": "116/76", "temp": "98.8", "pulse": "70"}', 'Prescribed antacid and dietary modifications', FALSE, NULL, 'Walk-in', 'Completed'),
(12, 5, NULL, '2026-02-07', '11:00:00', 'Lower back pain', 'Muscle strain', '{"bp": "122/82", "temp": "98.6", "pulse": "74"}', 'Prescribed pain reliever and muscle relaxant, advised physiotherapy', TRUE, '2026-02-28', 'Walk-in', 'Completed'),
(15, 1, NULL, '2026-02-06', '09:30:00', 'High fever and weakness', 'Viral infection', '{"bp": "117/77", "temp": "102.8", "pulse": "90", "oxygen": "96"}', 'Prescribed antipyretic and rest, advised hydration', TRUE, '2026-02-20', 'Walk-in', 'Completed'),
(3, 1, NULL, '2026-02-05', '15:45:00', 'Severe headache and dizziness', 'Dehydration and fatigue', '{"bp": "110/70", "temp": "98.2", "pulse": "65"}', 'Advised increased fluid intake and rest', FALSE, NULL, 'Walk-in', 'Completed'),
(7, 1, NULL, '2026-02-04', '10:00:00', 'Joint pain in fingers', 'Mild arthritis', '{"bp": "118/78", "temp": "98.5", "pulse": "72"}', 'Prescribed anti-inflammatory medication', TRUE, '2026-03-04', 'Walk-in', 'Completed'),
(11, 7, NULL, '2026-02-03', '13:30:00', 'Persistent cough', 'Allergic cough', '{"bp": "114/74", "temp": "98.4", "pulse": "68"}', 'Prescribed antihistamine and advised to avoid allergens', FALSE, NULL, 'Walk-in', 'Completed'),
(16, 1, NULL, '2026-02-02', '11:45:00', 'Chest congestion', 'Common cold', '{"bp": "121/81", "temp": "99.2", "pulse": "76"}', 'Prescribed decongestant and cough syrup', FALSE, NULL, 'Walk-in', 'Completed'),
(19, 4, NULL, '2026-01-30', '14:00:00', 'Skin rash on legs', 'Contact dermatitis', '{"bp": "115/75", "temp": "98.6", "pulse": "70"}', 'Prescribed topical cream and antihistamine', TRUE, '2026-02-20', 'Walk-in', 'Completed'),
(5, 1, NULL, '2026-01-28', '09:00:00', 'Blood pressure checkup', 'Hypertension (controlled)', '{"bp": "138/88", "temp": "98.6", "pulse": "74"}', 'Current medication working well, continue same dosage', TRUE, '2026-03-28', 'Walk-in', 'Completed'),
(17, 12, NULL, '2026-01-25', '16:30:00', 'Eye redness and itching', 'Conjunctivitis', '{"bp": "113/73", "temp": "98.5", "pulse": "68"}', 'Prescribed eye drops and advised hygiene measures', TRUE, '2026-02-08', 'Walk-in', 'Completed'),
(18, 5, NULL, '2026-01-22', '08:45:00', 'Ankle sprain from sports', 'Ligament strain', '{"bp": "123/83", "temp": "98.7", "pulse": "78"}', 'Applied bandage, prescribed pain relief, advised rest and ice', TRUE, '2026-02-12', 'Walk-in', 'Completed'),
(9, 1, NULL, '2026-01-20', '10:30:00', 'Diabetes routine checkup', 'Diabetes Type 2 (controlled)', '{"bp": "135/88", "temp": "98.6", "pulse": "72", "glucose": "125"}', 'Blood sugar levels stable, continue medication and diet', TRUE, '2026-04-20', 'Walk-in', 'Completed'),
(13, 7, NULL, '2026-01-18', '12:00:00', 'Sore throat and fever', 'Throat infection', '{"bp": "118/78", "temp": "100.6", "pulse": "80"}', 'Prescribed antibiotics and throat lozenges', TRUE, '2026-02-02', 'Walk-in', 'Completed'),
(20, 5, NULL, '2026-01-15', '09:15:00', 'Knee pain and stiffness', 'Arthritis flare-up', '{"bp": "138/92", "temp": "98.8", "pulse": "76"}', 'Prescribed anti-inflammatory and advised gentle exercises', TRUE, '2026-02-28', 'Walk-in', 'Completed');


INSERT INTO Prescription (VisitID, MemberID, DoctorID, IssueDate, ValidUntil, Diagnosis, SpecialInstructions, Status) VALUES
(1, 1, 1, '2026-02-13', '2026-03-13', 'Healthy, no issues found', 'Continue healthy lifestyle', 'Completed'),
(2, 4, 4, '2026-02-14', '2026-03-14', 'Acne improving with medication', 'Apply cream twice daily after washing face', 'Active'),
(3, 6, 1, '2026-02-12', '2026-03-12', 'Tension headache', 'Take medication with food, avoid stress', 'Completed'),
(4, 10, 1, '2026-02-10', '2026-02-24', 'Viral fever', 'Complete course of medication, rest for 3 days', 'Completed'),
(5, 14, 7, '2026-02-11', '2026-02-25', 'Upper respiratory tract infection', 'Complete antibiotic course, avoid cold drinks', 'Active'),
(6, 2, 7, '2026-02-08', '2026-02-22', 'Acute bronchitis', 'Use inhaler as prescribed, take steam twice daily', 'Active'),
(7, 8, 1, '2026-02-09', '2026-02-23', 'Gastritis', 'Take antacid before meals, avoid spicy food', 'Active'),
(8, 12, 5, '2026-02-07', '2026-02-28', 'Muscle strain', 'Apply hot compress, avoid heavy lifting', 'Active'),
(9, 15, 1, '2026-02-06', '2026-02-20', 'Viral infection', 'Take medicines after food, drink plenty of fluids', 'Completed'),
(10, 3, 1, '2026-02-05', '2026-02-19', 'Dehydration and fatigue', 'Increase water intake to 3 liters daily', 'Completed'),
(11, 7, 1, '2026-02-04', '2026-03-04', 'Mild arthritis', 'Take with food, avoid prolonged standing', 'Active'),
(12, 11, 7, '2026-02-03', '2026-02-17', 'Allergic cough', 'Take at bedtime, avoid dust and pollen', 'Completed'),
(13, 16, 1, '2026-02-02', '2026-02-16', 'Common cold', 'Complete the course, stay warm', 'Completed'),
(14, 19, 4, '2026-01-30', '2026-02-20', 'Contact dermatitis', 'Apply cream on affected area only', 'Active'),
(15, 5, 1, '2026-01-28', '2026-03-28', 'Hypertension (controlled)', 'Take daily in morning, monitor BP weekly', 'Active'),
(16, 17, 12, '2026-01-25', '2026-02-08', 'Conjunctivitis', 'Use eye drops 3 times daily, maintain hygiene', 'Completed'),
(17, 18, 5, '2026-01-22', '2026-02-12', 'Ligament strain', 'Apply ice 3 times daily, rest ankle', 'Completed'),
(18, 9, 1, '2026-01-20', '2026-04-20', 'Diabetes Type 2 (controlled)', 'Take daily before breakfast', 'Active'),
(19, 13, 7, '2026-01-18', '2026-02-02', 'Throat infection', 'Complete antibiotic course, gargle with warm salt water', 'Completed'),
(20, 20, 5, '2026-01-15', '2026-02-28', 'Arthritis flare-up', 'Take after food, continue gentle exercises', 'Active');


INSERT INTO PrescriptionItem (PrescriptionID, MedicineID, Dosage, Frequency, Duration, Quantity, Instructions) VALUES
-- Prescription 1 (Vitamin supplements)
(1, 13, '1 tablet', 'Once daily', '30 days', 30, 'Take after breakfast'),
(1, 14, '1 tablet', 'Once daily', '30 days', 30, 'Take with Vitamin D'),
-- Prescription 2 (Acne treatment)
(2, 12, 'Apply thin layer', 'Twice daily', '14 days', 1, 'Apply on affected areas after washing face'),
-- Prescription 3 (Headache)
(3, 1, '1 tablet', 'Every 6 hours if needed', '5 days', 10, 'Take with food'),
(3, 5, '1 tablet', 'Every 8 hours if needed', '3 days', 6, 'Take after meals'),
-- Prescription 4 (Viral fever)
(4, 1, '2 tablets', 'Every 6 hours', '3 days', 24, 'Take with water after food'),
(4, 4, '1 tablet', 'Once at night', '3 days', 3, 'Take before sleep'),
-- Prescription 5 (Respiratory infection)
(5, 3, '1 tablet', 'Once daily', '5 days', 5, 'Take after breakfast'),
(5, 10, '10 ml', 'Three times daily', '7 days', 1, 'Shake well before use'),
-- Prescription 6 (Bronchitis)
(6, 2, '1 capsule', 'Three times daily', '7 days', 21, 'Complete full course'),
(6, 9, '2 puffs', 'When needed', '14 days', 1, 'Use inhaler as demonstrated'),
(6, 10, '10 ml', 'Three times daily', '7 days', 1, 'Take after meals'),
-- Prescription 7 (Gastritis)
(7, 6, '1 capsule', 'Before breakfast', '14 days', 14, 'Take 30 minutes before meals'),
(7, 11, '1 tablet', 'After meals', '7 days', 21, 'Take if acidity persists'),
-- Prescription 8 (Muscle strain)
(8, 5, '1 tablet', 'Three times daily', '5 days', 15, 'Take after meals'),
(8, 12, 'Apply', 'Three times daily', '7 days', 1, 'Massage gently on affected area'),
-- Prescription 9 (Viral infection)
(9, 1, '2 tablets', 'Every 6 hours', '5 days', 40, 'Take with lukewarm water'),
(9, 4, '1 tablet', 'Once at night', '5 days', 5, 'Helps with symptoms'),
-- Prescription 10 (Dehydration)
(10, 13, '1 tablet', 'Once daily', '15 days', 15, 'Take after breakfast'),
-- Prescription 11 (Arthritis)
(11, 5, '1 tablet', 'Twice daily', '15 days', 30, 'Take after meals'),
(11, 16, '1 tablet', 'Once daily', '10 days', 10, 'Take in morning with food'),
-- Prescription 12 (Allergic cough)
(12, 4, '1 tablet', 'Once at night', '7 days', 7, 'Avoid driving after taking'),
-- Prescription 13 (Common cold)
(13, 1, '1 tablet', 'Every 6 hours if needed', '3 days', 12, 'For fever'),
(13, 10, '10 ml', 'Three times daily', '5 days', 1, 'For cough relief'),
-- Prescription 14 (Contact dermatitis)
(14, 12, 'Apply thin layer', 'Twice daily', '10 days', 1, 'On affected skin only'),
(14, 4, '1 tablet', 'Once at night', '5 days', 5, 'Reduces itching'),
-- Prescription 15 (Hypertension)
(15, 8, '1 tablet', 'Once daily', '60 days', 60, 'Take in morning before food'),
-- Prescription 16 (Conjunctivitis)
(16, 17, '2 drops', 'Three times daily', '7 days', 1, 'In both eyes'),
-- Prescription 17 (Ligament strain)
(17, 5, '1 tablet', 'Three times daily', '7 days', 21, 'Take with food'),
-- Prescription 18 (Diabetes)
(18, 7, '1 tablet', 'Once daily', '90 days', 90, 'Before breakfast'),
-- Prescription 19 (Throat infection)
(19, 15, '1 tablet', 'Twice daily', '5 days', 10, 'Complete the course'),
(19, 1, '1 tablet', 'Every 6 hours if needed', '3 days', 12, 'For pain and fever'),
-- Prescription 20 (Arthritis flare-up)
(20, 5, '1 tablet', 'Three times daily', '10 days', 30, 'After meals'),
(20, 16, '1 tablet', 'Once daily', '14 days', 14, 'In morning');


INSERT INTO MedicineDispense (PrescriptionID, PrescriptionItemID, MedicineID, InventoryID, QuantityDispensed, DispensedBy, DispenseDate, DispenseTime, BatchNumber, UnitPrice, TotalPrice) VALUES
-- Prescription 1
(1, 1, 13, 13, 30, 2, '2026-02-13', '10:45:00', 'VIT-2024-258', 5.00, 150.00),
(1, 2, 14, 14, 30, 2, '2026-02-13', '10:46:00', 'CAL-2024-369', 4.50, 135.00),
-- Prescription 2
(2, 3, 12, 12, 1, 2, '2026-02-14', '14:45:00', 'DIC-2024-147', 95.00, 95.00),
-- Prescription 3
(3, 4, 1, 1, 10, 2, '2026-02-12', '11:50:00', 'PAR-2024-001', 2.50, 25.00),
(3, 5, 5, 5, 6, 2, '2026-02-12', '11:51:00', 'IBU-2024-567', 4.00, 24.00),
-- Prescription 4
(4, 6, 1, 1, 24, 2, '2026-02-10', '10:15:00', 'PAR-2024-001', 2.50, 60.00),
(4, 7, 4, 4, 3, 2, '2026-02-10', '10:16:00', 'CET-2024-234', 3.50, 10.50),
-- Prescription 5
(5, 8, 3, 3, 5, 6, '2026-02-11', '10:50:00', 'AZI-2024-089', 15.00, 75.00),
(5, 9, 10, 10, 1, 6, '2026-02-11', '10:51:00', 'COUGH-2024-654', 85.00, 85.00),
-- Prescription 6
(6, 10, 2, 2, 21, 2, '2026-02-08', '15:00:00', 'AMOX-2024-045', 8.00, 168.00),
(6, 11, 9, 9, 1, 2, '2026-02-08', '15:01:00', 'SAL-2024-321', 120.00, 120.00),
(6, 12, 10, 10, 1, 2, '2026-02-08', '15:02:00', 'COUGH-2024-654', 85.00, 85.00),
-- Prescription 7
(7, 13, 6, 6, 14, 2, '2026-02-09', '16:30:00', 'OME-2024-123', 6.50, 91.00),
(7, 14, 11, 11, 21, 2, '2026-02-09', '16:31:00', 'RAN-2024-987', 2.00, 42.00),
-- Prescription 8
(8, 15, 5, 5, 15, 6, '2026-02-07', '11:30:00', 'IBU-2024-567', 4.00, 60.00),
(8, 16, 12, 12, 1, 6, '2026-02-07', '11:31:00', 'DIC-2024-147', 95.00, 95.00),
-- Prescription 9
(9, 17, 1, 1, 40, 2, '2026-02-06', '10:00:00', 'PAR-2024-001', 2.50, 100.00),
(9, 18, 4, 4, 5, 2, '2026-02-06', '10:01:00', 'CET-2024-234', 3.50, 17.50),
-- Prescription 10
(10, 19, 13, 13, 15, 2, '2026-02-05', '16:15:00', 'VIT-2024-258', 5.00, 75.00),
-- Prescription 11
(11, 20, 5, 5, 30, 2, '2026-02-04', '10:30:00', 'IBU-2024-567', 4.00, 120.00),
(11, 21, 16, 16, 10, 2, '2026-02-04', '10:31:00', 'PRE-2024-852', 3.50, 35.00),
-- Prescription 12
(12, 22, 4, 4, 7, 6, '2026-02-03', '14:00:00', 'CET-2024-234', 3.50, 24.50),
-- Prescription 13
(13, 23, 1, 1, 12, 2, '2026-02-02', '12:15:00', 'PAR-2024-001', 2.50, 30.00),
(13, 24, 10, 10, 1, 2, '2026-02-02', '12:16:00', 'COUGH-2024-654', 85.00, 85.00),
-- Prescription 14
(14, 25, 12, 12, 1, 2, '2026-01-30', '14:30:00', 'DIC-2024-147', 95.00, 95.00),
(14, 26, 4, 4, 5, 2, '2026-01-30', '14:31:00', 'CET-2024-234', 3.50, 17.50),
-- Prescription 15
(15, 27, 8, 8, 60, 6, '2026-01-28', '09:30:00', 'ATO-2024-789', 7.00, 420.00),
-- Prescription 16
(16, 28, 17, 17, 1, 2, '2026-01-25', '17:00:00', 'EYE-2024-963', 75.00, 75.00),
-- Prescription 17
(17, 29, 5, 5, 21, 2, '2026-01-22', '09:15:00', 'IBU-2024-567', 4.00, 84.00),
-- Prescription 18
(18, 30, 7, 7, 90, 6, '2026-01-20', '11:00:00', 'MET-2024-456', 3.00, 270.00),
-- Prescription 19
(19, 31, 15, 15, 10, 2, '2026-01-18', '12:30:00', 'CIP-2024-741', 10.00, 100.00),
(19, 32, 1, 1, 12, 2, '2026-01-18', '12:31:00', 'PAR-2024-001', 2.50, 30.00),
-- Prescription 20
(20, 33, 5, 5, 30, 2, '2026-01-15', '09:45:00', 'IBU-2024-567', 4.00, 120.00),
(20, 34, 16, 16, 14, 2, '2026-01-15', '09:46:00', 'PRE-2024-852', 3.50, 49.00);


INSERT INTO BillPayment (VisitID, BillDate, BillTime, ConsultationFee, MedicineCost, LabTestCost, OtherCharges, SubTotal, DiscountAmount, TaxAmount, TotalAmount, PaymentMethod, PaymentStatus, TransactionID, PaidAmount, BalanceAmount, BilledBy, Remarks) VALUES
(1, '2026-02-13', '11:00:00', 0.00, 285.00, 0.00, 0.00, 285.00, 0.00, 0.00, 285.00, 'UPI', 'Paid', 'UPI2026021311001', 285.00, 0.00, 5, 'Student - No consultation fee'),
(2, '2026-02-14', '15:00:00', 0.00, 95.00, 0.00, 0.00, 95.00, 0.00, 0.00, 95.00, 'Cash', 'Paid', NULL, 95.00, 0.00, 5, 'Student - No consultation fee'),
(3, '2026-02-12', '12:00:00', 0.00, 49.00, 0.00, 0.00, 49.00, 0.00, 0.00, 49.00, 'Card', 'Paid', 'CARD2026021212001', 49.00, 0.00, 5, 'Student - No consultation fee'),
(4, '2026-02-10', '10:30:00', 0.00, 70.50, 0.00, 0.00, 70.50, 0.00, 0.00, 70.50, 'UPI', 'Paid', 'UPI2026021010301', 70.50, 0.00, 5, 'Student - No consultation fee'),
(5, '2026-02-11', '11:15:00', 0.00, 160.00, 0.00, 0.00, 160.00, 0.00, 0.00, 160.00, 'Cash', 'Paid', NULL, 160.00, 0.00, 11, 'Student - No consultation fee'),
(6, '2026-02-08', '15:30:00', 0.00, 373.00, 0.00, 0.00, 373.00, 0.00, 0.00, 373.00, 'Insurance', 'Paid', 'INS2026020815301', 373.00, 0.00, 5, 'Covered by college health insurance'),
(7, '2026-02-09', '17:00:00', 0.00, 133.00, 0.00, 0.00, 133.00, 0.00, 0.00, 133.00, 'UPI', 'Paid', 'UPI2026020917001', 133.00, 0.00, 5, 'Student - No consultation fee'),
(8, '2026-02-07', '12:00:00', 0.00, 155.00, 0.00, 0.00, 155.00, 0.00, 0.00, 155.00, 'Card', 'Paid', 'CARD2026020712001', 155.00, 0.00, 11, 'Student - No consultation fee'),
(9, '2026-02-06', '10:30:00', 0.00, 117.50, 0.00, 0.00, 117.50, 0.00, 0.00, 117.50, 'Cash', 'Paid', NULL, 117.50, 0.00, 5, 'Student - No consultation fee'),
(10, '2026-02-05', '16:30:00', 0.00, 75.00, 0.00, 0.00, 75.00, 0.00, 0.00, 75.00, 'UPI', 'Paid', 'UPI2026020516301', 75.00, 0.00, 5, 'Student - No consultation fee'),
(11, '2026-02-04', '11:00:00', 0.00, 155.00, 0.00, 0.00, 155.00, 0.00, 0.00, 155.00, 'Cash', 'Paid', NULL, 155.00, 0.00, 5, 'Student - No consultation fee'),
(12, '2026-02-03', '14:30:00', 0.00, 24.50, 0.00, 0.00, 24.50, 0.00, 0.00, 24.50, 'Card', 'Paid', 'CARD2026020314301', 24.50, 0.00, 11, 'Student - No consultation fee'),
(13, '2026-02-02', '12:45:00', 0.00, 115.00, 0.00, 0.00, 115.00, 0.00, 0.00, 115.00, 'UPI', 'Paid', 'UPI2026020212451', 115.00, 0.00, 5, 'Student - No consultation fee'),
(14, '2026-01-30', '15:00:00', 0.00, 112.50, 0.00, 0.00, 112.50, 0.00, 0.00, 112.50, 'Cash', 'Paid', NULL, 112.50, 0.00, 5, 'Student - No consultation fee'),
(15, '2026-01-28', '10:00:00', 50.00, 420.00, 0.00, 0.00, 470.00, 0.00, 0.00, 470.00, 'Card', 'Paid', 'CARD2026012810001', 470.00, 0.00, 11, 'Faculty - Consultation fee charged'),
(16, '2026-01-25', '17:30:00', 0.00, 75.00, 0.00, 0.00, 75.00, 0.00, 0.00, 75.00, 'UPI', 'Paid', 'UPI2026012517301', 75.00, 0.00, 5, 'Student - No consultation fee'),
(17, '2026-01-22', '09:45:00', 0.00, 84.00, 0.00, 0.00, 84.00, 0.00, 0.00, 84.00, 'Cash', 'Paid', NULL, 84.00, 0.00, 5, 'Student - No consultation fee'),
(18, '2026-01-20', '11:30:00', 50.00, 270.00, 150.00, 0.00, 470.00, 50.00, 0.00, 420.00, 'Insurance', 'Paid', 'INS2026012011301', 420.00, 0.00, 11, 'Faculty - Includes blood sugar test, discount applied'),
(19, '2026-01-18', '13:00:00', 0.00, 130.00, 0.00, 0.00, 130.00, 0.00, 0.00, 130.00, 'UPI', 'Paid', 'UPI2026011813001', 130.00, 0.00, 5, 'Student - No consultation fee'),
(20, '2026-01-15', '10:15:00', 50.00, 169.00, 0.00, 0.00, 219.00, 0.00, 0.00, 219.00, 'Card', 'Paid', 'CARD2026011510151', 219.00, 0.00, 5, 'Faculty - Consultation fee charged');



INSERT INTO EmergencyCase (MemberID, DoctorID, AttendingStaffID, VisitID, IncidentDateTime, ReportedBy, Location, Severity, Symptoms, VitalSignsAtArrival, FirstAidGiven, ActionTaken, MedicationAdministered, Outcome, ReferredToHospital, AmbulanceUsed, AmbulanceArrivalTime, ResolvedDateTime, FollowUpRequired, CriticalNotes, Status) VALUES
(2, 7, 1, 6, '2026-02-08 14:15:00', 'Classmate Rohan', 'Computer Lab, 3rd Floor', 'High', 'Severe breathing difficulty, wheezing, chest tightness', '{"bp": "110/70", "pulse": "95", "oxygen": "88", "temp": "100.2"}', 'Patient seated upright, oxygen support provided', 'Administered bronchodilator inhaler, oxygen mask applied, monitored vitals every 5 minutes', 'Salbutamol inhaler 2 puffs', 'Stabilized', NULL, FALSE, NULL, '2026-02-08 15:30:00', TRUE, 'Severe asthma attack triggered by dust in lab. Patient responded well to bronchodilator.', 'Resolved'),

(10, 1, 3, 4, '2026-02-10 09:20:00', 'Hostel Warden', 'Boys Hostel Room 304', 'Moderate', 'High fever (103°F), severe weakness, unable to stand', '{"bp": "115/75", "pulse": "88", "oxygen": "96", "temp": "103.2"}', 'Patient laid flat, cold compress on forehead', 'Administered antipyretic injection, IV fluids started, shifted to dispensary bed for observation', 'Paracetamol 1g IV, Normal Saline IV', 'Stabilized', NULL, FALSE, NULL, '2026-02-10 12:00:00', TRUE, 'Viral fever with dehydration. Temperature reduced to 99°F after treatment. Advised 2 days rest.', 'Resolved'),

(18, 5, 7, 17, '2026-01-22 08:30:00', 'Sports Coach', 'Football Ground', 'Moderate', 'Severe ankle pain, swelling, unable to walk', '{"bp": "120/80", "pulse": "82", "oxygen": "98", "temp": "98.6"}', 'Ice pack applied, ankle elevated, pain relief spray applied', 'Ankle examined, X-ray advised to rule out fracture, pressure bandage applied, crutches provided', 'Ibuprofen 400mg oral', 'Stabilized', NULL, FALSE, NULL, '2026-01-22 10:00:00', TRUE, 'Ligament sprain from football. X-ray showed no fracture. Advised rest for 2 weeks.', 'Resolved'),

(15, 1, 1, 9, 'Appointment2026-02-06 09:15:00', 'Faculty Dr. Vikram', 'Lecture Hall B-201', 'High', 'Sudden collapse, unconscious for 2 minutes, high fever', '{"bp": "100/60", "pulse": "100", "oxygen": "94", "temp": "102.8"}', 'Patient placed in recovery position, airways cleared', 'Patient regained consciousness in 2 minutes, IV fluids started, antipyretic given, monitored for 1 hour', 'Paracetamol 650mg IV', 'Stabilized', NULL, FALSE, NULL, '2026-02-06 11:00:00', TRUE, 'Febrile seizure due to very high fever. No previous history. Neurological examination normal.', 'Resolved'),

(7, 1, 3, 11, '2026-02-04 09:45:00', 'Librarian', 'Central Library', 'Low', 'Sudden joint pain in hands, mild swelling', '{"bp": "118/78", "pulse": "72", "oxygen": "98", "temp": "98.5"}', 'Patient seated comfortably, cold compress on joints', 'Anti-inflammatory medication given, advised rest and joint exercises', 'Ibuprofen 400mg oral', 'Stabilized', NULL, FALSE, NULL, '2026-02-04 10:30:00', TRUE, 'Mild arthritis flare-up. Patient has history of occasional joint pain.', 'Resolved'),

(17, 12, 5, 16, '2026-01-25 16:15:00', 'Classmate Ishita', 'Chemistry Lab', 'Moderate', 'Chemical splash in eye, severe pain, redness, tearing', '{"bp": "110/70", "pulse": "85", "oxygen": "98", "temp": "98.6"}', 'Eye irrigation with normal saline for 15 minutes immediately', 'Continuous eye wash, ophthalmologist consulted, antibiotic eye drops given', 'Antibiotic eye drops, Lubricant drops', 'Stabilized', NULL, FALSE, NULL, '2026-01-25 17:45:00', TRUE, 'Dilute acid splash in left eye. Immediate irrigation prevented serious damage. Vision normal.', 'Resolved'),

(3, 1, 1, 10, '2026-02-05 15:30:00', 'Gym Instructor', 'College Gymnasium', 'Moderate', 'Sudden dizziness, severe headache, nearly fainted', '{"bp": "95/60", "pulse": "60", "oxygen": "97", "temp": "98.2"}', 'Patient laid flat with legs elevated, glucose water given', 'Blood pressure and sugar checked, IV glucose started, observation for 45 minutes', 'IV Dextrose 25%, Oral glucose', 'Stabilized', NULL, FALSE, NULL, '2026-02-05 16:45:00', FALSE, 'Dehydration and low blood sugar after intense workout without proper meal. Recovered fully.', 'Resolved'),

(11, 7, 7, 12, '2026-02-03 13:15:00', 'Roommate Diya', 'Girls Hostel Room 205', 'Low', 'Severe allergic reaction - skin rash, mild throat itching', '{"bp": "112/72", "pulse": "75", "oxygen": "97", "temp": "98.4"}', 'Antihistamine tablet given immediately', 'Monitored for anaphylaxis signs, antihistamine injection given, observation for 2 hours', 'Cetirizine 10mg oral, then IV', 'Stabilized', NULL, FALSE, NULL, '2026-02-03 15:30:00', FALSE, 'Allergic reaction to peanuts in hostel mess food. Responded well to antihistamine.', 'Resolved'),

(4, 4, 3, NULL, '2026-02-15 11:30:00', 'Faculty Dr. Rajesh', 'Main Auditorium', 'Low', 'Sudden anxiety attack, hyperventilation, chest tightness', '{"bp": "125/85", "pulse": "105", "oxygen": "97", "temp": "98.6"}', 'Calm environment provided, breathing exercises guided', 'Counseled about breathing technique, mild sedative given, referred to psychiatrist', 'Alprazolam 0.25mg', 'Stabilized', NULL, FALSE, NULL, '2026-02-15 12:30:00', TRUE, 'Panic attack before exam presentation. First episode. Advised stress management counseling.', 'Resolved'),

(16, 1, 1, 13, '2026-02-02 11:30:00', 'Canteen Staff', 'College Canteen', 'Low', 'Minor burn from hot water spill on hand', '{"bp": "120/80", "pulse": "74", "oxygen": "98", "temp": "98.7"}', 'Cold water immersion for 10 minutes, burn cream applied', 'Wound cleaned, antibiotic ointment applied, sterile dressing done', 'Betadine, Silver sulfadiazine cream', 'Discharged', NULL, FALSE, NULL, '2026-02-02 12:00:00', TRUE, 'First degree burn, small area on left palm. No blistering. Healing expected in 5-7 days.', 'Resolved'),

(19, 4, 7, 14, '2026-01-30 13:45:00', 'Lab Assistant', 'Biology Lab', 'Low', 'Allergic skin reaction after touching plant specimen', '{"bp": "115/75", "pulse": "70", "oxygen": "98", "temp": "98.6"}', 'Affected area washed with soap and water', 'Antihistamine cream applied, oral antihistamine given', 'Cetirizine 10mg, Hydrocortisone cream', 'Discharged', NULL, FALSE, NULL, '2026-01-30 14:15:00', FALSE, 'Contact dermatitis from plant. Mild reaction. Advised precautions in lab.', 'Resolved'),

(8, 1, 3, 7, '2026-02-09 15:45:00', 'Friend Sneha', 'Cafeteria', 'Moderate', 'Severe stomach cramps, vomiting, nausea', '{"bp": "110/70", "pulse": "78", "oxygen": "97", "temp": "98.9"}', 'Patient kept nil per oral, vomiting basin provided', 'IV fluids started, antiemetic injection given, observation for gastroenteritis', 'Ondansetron 4mg IV, Normal Saline IV', 'Stabilized', NULL, FALSE, NULL, '2026-02-09 17:30:00', TRUE, 'Food poisoning suspected from outside food. Symptoms improved after IV hydration.', 'Resolved'),

(12, 5, 1, 8, '2026-02-07 10:45:00', 'Gym Partner', 'Fitness Center', 'Moderate', 'Severe lower back pain, muscle spasm, difficulty moving', '{"bp": "125/85", "pulse": "80", "oxygen": "98", "temp": "98.6"}', 'Patient positioned comfortably, hot pack applied', 'Muscle relaxant injection given, pain relief medication, advised complete rest', 'Diclofenac 75mg IM, Muscle relaxant', 'Stabilized', NULL, FALSE, NULL, '2026-02-07 12:00:00', TRUE, 'Acute muscle strain from improper lifting technique. No disc involvement. Advised physiotherapy.', 'Resolved'),

(13, 7, 7, 19, '2026-01-18 11:50:00', 'Classmate Aryan', 'Hostel Common Room', 'Moderate', 'High fever with chills, severe throat pain, difficulty swallowing', '{"bp": "118/78", "pulse": "88", "oxygen": "96", "temp": "101.8"}', 'Antipyretic given, cold compress applied', 'Rapid strep test done (positive), antibiotic started, IV fluids for hydration', 'Paracetamol 650mg, Azithromycin 500mg', 'Stabilized', NULL, FALSE, NULL, '2026-01-18 14:00:00', TRUE, 'Acute bacterial throat infection (Strep throat). Started on antibiotics. Advised isolation for 24 hours.', 'Resolved'),

(1, 1, 1, NULL, '2026-02-01 16:30:00', 'Sports Team Captain', 'Cricket Ground', 'Low', 'Minor cut on finger from cricket ball, bleeding', '{"bp": "120/80", "pulse": "72", "oxygen": "98", "temp": "98.6"}', 'Direct pressure applied to stop bleeding', 'Wound cleaned with antiseptic, tetanus toxoid given, sterile dressing applied', 'Betadine solution, Tetanus Toxoid 0.5ml IM', 'Discharged', NULL, FALSE, NULL, '2026-02-01 17:00:00', FALSE, 'Superficial laceration, 1cm length. Tetanus prophylaxis updated. Healing expected in 5 days.', 'Resolved');

SET FOREIGN_KEY_CHECKS = 1;
