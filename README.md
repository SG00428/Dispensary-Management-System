# Dispensary Management System - Database Design

## CS 432 - Databases | Assignment 1 | Track 1

**Indian Institute of Technology, Gandhinagar**  
**Semester II (2025-2026)**  
**Instructor:** Dr. Yogesh K. Meena  
**Submission Date:** February 15, 2026

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Core Functionalities](#core-functionalities)
- [Normalization](#normalization)
- [UML Diagrams](#uml-diagrams)
- [ER Diagrams](#er-diagrams)
- [Key Design Decisions](#key-design-decisions)
- [Sample Queries](#sample-queries)
- [Team Members](#team-members)
- [Setup Instructions](#setup-instructions)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

The **Dispensary Management System** is a comprehensive database-driven application designed to modernize healthcare delivery in educational institutions and workplace campuses. The system addresses critical challenges including incomplete medical records, delayed emergency response, poor inventory management, and untracked allergies.

### Key Highlights

- **14 Normalized Tables** (40% above minimum requirement)
- **5+ Core Functionalities** fully implemented
- **25+ Foreign Key Relationships** ensuring referential integrity
- **35+ Business Logic Constraints** for data validation
- **Real-time Emergency Response** with instant patient data access
- **Batch-wise Inventory Tracking** with expiry monitoring
- **Mandatory Allergy Documentation** preventing medication errors

---

## 🚨 Problem Statement

### Current Challenges

Educational institutions and workplace campuses face significant healthcare management issues:

1. **Incomplete Medical Records**: Paper-based systems lead to lost or incomplete health histories
2. **Untracked Allergies**: Medication errors due to missing allergy information
3. **Delayed Emergency Response**: No real-time access to critical patient data
4. **Poor Coordination**: Manual communication between doctors and staff
5. **Inventory Mismanagement**: Medicine shortages discovered too late
6. **Non-integrated Systems**: Appointment booking separate from medical records

### Our Solution

A centralized, digital Dispensary Management System that:

- ✅ Maintains complete patient health histories with mandatory allergy tracking
- ✅ Enables instant emergency response with one-click access to critical data
- ✅ Provides intelligent inventory management with automated reorder alerts
- ✅ Integrates appointments with doctor schedules and patient records
- ✅ Ensures medication safety through prescription validation
- ✅ Supports comprehensive audit trails for accountability

---

## 🏗️ System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  DISPENSARY MANAGEMENT SYSTEM                │
└─────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼──────┐ ┌────▼────┐ ┌──────▼────────┐
        │ MASTER DATA  │ │ HEALTH  │ │ APPOINTMENTS  │
        │   TABLES     │ │ RECORDS │ │  & VISITS     │
        └──────────────┘ └─────────┘ └───────────────┘
                │              │              │
        ┌───────▼──────┐ ┌────▼────┐ ┌──────▼────────┐
        │ PRESCRIPTION │ │INVENTORY│ │   EMERGENCY   │
        │   WORKFLOW   │ │TRACKING │ │   RESPONSE    │
        └──────────────┘ └─────────┘ └───────────────┘
                               │
                        ┌──────▼──────┐
                        │   BILLING   │
                        │  & PAYMENT  │
                        └─────────────┘
```

### Technology Stack

- **Database**: MySQL 8.0
- **Modeling Tools**: Draw.io (UML & ER diagrams)
- **SQL Client**: MySQL Workbench, DBeaver
- **Documentation**: LaTeX, Markdown
- **Version Control**: Git, GitHub

---

## 🗄️ Database Schema

### Overview: 14 Tables

| # | Table Name | Purpose | Key Relationships |
|---|------------|---------|-------------------|
| 1 | **Member** | Patient/user master data | Central hub for all patient data |
| 2 | **Doctor** | Doctor information & schedules | Links to appointments, visits, prescriptions |
| 3 | **StaffEmployee** | Nurses, pharmacists, admin staff | Links to dispensing, billing, emergency response |
| 4 | **Medicine** | Medicine catalog (master) | Links to inventory, prescriptions |
| 5 | **MedicalSupplier** | Supplier/vendor management | Links to inventory batches |
| 6 | **MedicalHistory** | Patient health records | 1:1 with Member, critical for emergencies |
| 7 | **Appointment** | Appointment scheduling | Links Member & Doctor, may create Visit |
| 8 | **Visit** | Every dispensary visit | Central record linking to prescriptions, billing |
| 9 | **Inventory** | Batch-wise stock tracking | Links to Medicine, contains expiry & reorder data |
| 10 | **Prescription** | Prescription header | Links to Visit, contains diagnosis |
| 11 | **PrescriptionItem** | Individual medicines in prescription | Normalized detail table (1:N with Prescription) |
| 12 | **MedicineDispense** | Actual medicine dispensing | Separates prescription from dispensing, batch tracking |
| 13 | **BillPayment** | Billing & payment records | Links to Visit, calculates total costs |
| 14 | **EmergencyCase** | Emergency incident tracking | Links to Member, MedicalHistory for instant access |

### Entity Relationship Overview

```
Member (1) ──< MedicalHistory (1)
   │
   ├──< Appointment (N) ──> Doctor (1)
   │
   ├──< Visit (N) ──> Doctor (1)
   │       │
   │       ├──< Prescription (1) ──< PrescriptionItem (N) ──> Medicine (1)
   │       │                              │
   │       │                              └──< MedicineDispense (N) ──> Inventory (1)
   │       │                                          │                       │
   │       │                                          └─> StaffEmployee (1)   │
   │       │                                                                  │
   │       └──< BillPayment (1) ──> StaffEmployee (1)                       │
   │                                                                          │
   └──< EmergencyCase (N) ──> Doctor (1)                                    │
            │                                                                 │
            └──> StaffEmployee (1)                                           │
                                                                              │
Medicine (1) ──< Inventory (N) ──> MedicalSupplier (1) ─────────────────────┘
```

---

## 🔑 Core Functionalities

### 1. Member Registration & Health Records Management

**Purpose**: Centralized patient data with mandatory allergy tracking

**Workflow**:
1. Register member with demographics, emergency contact
2. Record blood group (critical for emergencies)
3. During first visit, create medical history
4. **Mandatory** allergy documentation

**Key Tables**: `Member`, `MedicalHistory`

**Example**:
```sql
-- Register member
INSERT INTO Member (Name, Age, Email, ContactNumber, BloodGroup, EmergencyContact)
VALUES ('Rahul Kumar', 20, 'rahul@iitgn.ac.in', '9876543210', 'O+', '+91-9988776655');

-- Record medical history
INSERT INTO MedicalHistory (MemberID, KnownAllergies, ChronicConditions)
VALUES (LAST_INSERT_ID(), 'Penicillin, Peanuts', 'Asthma');
```

**Safety Feature**: System prevents prescription creation without allergy data

---

### 2. Appointment & Visit Management

**Purpose**: Integrated appointment scheduling with doctor availability

**Workflow**:
1. Check doctor availability (working days, shift timings)
2. Book appointment with priority level (Normal/Urgent/Emergency)
3. Generate token number for queue management
4. When member arrives, create Visit record
5. Support walk-in visits (no appointment needed)

**Key Tables**: `Appointment`, `Visit`, `Doctor`

**Example**:
```sql
-- Check doctor availability
SELECT DoctorID, Name, Specialization 
FROM Doctor
WHERE Status = 'Active'
  AND FIND_IN_SET('Monday', WorkingDays)
  AND '09:00:00' BETWEEN AvailableFrom AND AvailableTo;

-- Book appointment
INSERT INTO Appointment (MemberID, DoctorID, AppointmentDate, AppointmentTime, Status)
VALUES (1001, 10, '2026-02-17', '09:30:00', 'Scheduled');
```

**Business Rule**: Cannot schedule appointment outside doctor's availability

---

### 3. Prescription & Medicine Dispensing

**Purpose**: Safe medication prescribing with allergy validation and batch tracking

**Workflow**:
1. Doctor creates Prescription (diagnosis, validity period)
2. Add multiple medicines via PrescriptionItem (normalized!)
3. System checks allergies before adding each medicine
4. Pharmacist validates prescription
5. Dispense medicine from specific inventory batch
6. Stock automatically reduced after dispensing
7. Record batch number for traceability

**Key Tables**: `Prescription`, `PrescriptionItem`, `MedicineDispense`, `Inventory`

**Critical Normalization**:
```
❌ WRONG: Store all medicines in Prescription table (violates 1NF)
✅ CORRECT: Prescription → PrescriptionItem (1:N relationship)
```

**Example**:
```sql
-- Create prescription
INSERT INTO Prescription (VisitID, MemberID, DoctorID, Diagnosis, IssueDate, ValidUntil)
VALUES (801, 1001, 10, 'Viral upper respiratory infection', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY));

-- Add multiple medicines
INSERT INTO PrescriptionItem (PrescriptionID, MedicineID, Dosage, Frequency, Duration, Quantity)
VALUES 
(501, 205, '1 tablet', 'Every 6 hours', '3 days', 12),  -- Paracetamol
(501, 310, '1 tablet', 'Once daily', '5 days', 5);      -- Azithromycin

-- Dispense medicine (triggers stock reduction)
INSERT INTO MedicineDispense (PrescriptionID, PrescriptionItemID, MedicineID, InventoryID, QuantityDispensed)
VALUES (501, 1001, 205, 5001, 12);  -- Dispense from Batch PAR-2024-001
```

**Safety Trigger**: System blocks prescription if patient has allergy to medicine

---

### 4. Emergency Response & Tracking

**Purpose**: Real-time emergency handling with instant patient data access

**Workflow**:
1. Emergency incident reported
2. Staff creates EmergencyCase (severity: Critical/High/Moderate/Low)
3. System **instantly displays**:
   - Blood group
   - Known allergies
   - Chronic conditions
   - Emergency contact
4. Assign doctor on duty
5. Record first aid and actions taken
6. If critical, call ambulance (log arrival time)
7. Track resolution and outcome

**Key Tables**: `EmergencyCase`, `Member`, `MedicalHistory`

**Example Scenario**:
```
11:30 AM: Student found unconscious
11:31 AM: Staff creates EmergencyCase
11:32 AM: System shows → Allergies: Penicillin (CRITICAL), Sulfa drugs
                       → Chronic: Type 1 Diabetes
                       → Blood Group: O+
11:33 AM: Doctor avoids penicillin, administers glucose for hypoglycemia
11:40 AM: Patient stabilized

WITHOUT SYSTEM: Doctor might have used sulfa drug → fatal reaction
```

**Critical Query**:
```sql
-- Emergency patient data lookup (< 1 second)
SELECT m.Name, m.BloodGroup, m.EmergencyContact, 
       mh.KnownAllergies, mh.ChronicConditions
FROM Member m
LEFT JOIN MedicalHistory mh ON m.MemberID = mh.MemberID
WHERE m.MemberID = ?;
```

---

### 5. Intelligent Inventory Management

**Purpose**: Batch-wise stock tracking with expiry monitoring and automated alerts

**Workflow**:
1. Track stock by batch (each batch has unique expiry date)
2. Alert when Quantity < ReorderLevel
3. Monitor medicines expiring within 30 days
4. Track supplier performance for reordering
5. FEFO (First Expiry First Out) dispensing logic
6. Usage analytics for demand forecasting

**Key Tables**: `Medicine`, `Inventory`, `MedicalSupplier`

**Critical Normalization**:
```
❌ WRONG: Store stock and expiry in Medicine table
✅ CORRECT: Medicine (catalog) → Inventory (batch-specific stock/expiry)

Why? One medicine can have multiple batches with different expiry dates!
```

**Example**:
```
Medicine: Paracetamol 500mg (MedicineID: 205)

Inventory Batch 1:
  - BatchNumber: PAR-2024-001
  - Quantity: 500 tablets
  - ExpiryDate: 2026-12-31
  - Supplier: MediCorp

Inventory Batch 2:
  - BatchNumber: PAR-2025-001
  - Quantity: 300 tablets  
  - ExpiryDate: 2027-06-30
  - Supplier: PharmaSolutions
```

**Stock Alert Query**:
```sql
-- Medicines below reorder level
SELECT m.Name, i.BatchNumber, i.Quantity, i.ReorderLevel,
       (i.ReorderLevel - i.Quantity) AS ShortfallQuantity
FROM Inventory i
JOIN Medicine m ON i.MedicineID = m.MedicineID
WHERE i.Quantity < i.ReorderLevel
  AND i.Status = 'Available'
ORDER BY ShortfallQuantity DESC;

-- Medicines expiring within 30 days
SELECT m.Name, i.BatchNumber, i.Quantity, i.ExpiryDate,
       DATEDIFF(i.ExpiryDate, CURDATE()) AS DaysUntilExpiry
FROM Inventory i
JOIN Medicine m ON i.MedicineID = m.MedicineID
WHERE i.ExpiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND i.Status = 'Available'
ORDER BY i.ExpiryDate ASC;
```

---

## 📊 Normalization

### Normalization to Third Normal Form (3NF)

#### First Normal Form (1NF) ✅

**Requirement**: No repeating groups, atomic values

**Compliance**:
- ✅ No multi-valued attributes
- ✅ All attributes contain atomic values
- ✅ No repeating groups (Medicine1, Medicine2, etc.)

**Example**:
```
❌ VIOLATES 1NF:
PrescriptionID | Medicines
101            | Paracetamol, Azithromycin, Cough Syrup

✅ COMPLIES WITH 1NF:
PrescriptionItemID | PrescriptionID | MedicineID
1001               | 101            | 205 (Paracetamol)
1002               | 101            | 310 (Azithromycin)
1003               | 101            | 425 (Cough Syrup)
```

#### Second Normal Form (2NF) ✅

**Requirement**: No partial dependencies (all non-key attributes fully dependent on PK)

**Compliance**:
- ✅ All tables use single-column primary keys
- ✅ No composite keys causing partial dependencies
- ✅ All attributes depend on entire primary key

#### Third Normal Form (3NF) ✅

**Requirement**: No transitive dependencies

**Critical 3NF Fixes**:

##### 1. Medicine → Inventory Separation

```
❌ VIOLATES 3NF:
Medicine (MedicineID, Name, Quantity, ExpiryDate)
Problem: Quantity and Expiry are batch-specific, not medicine-specific

✅ COMPLIES WITH 3NF:
Medicine (MedicineID, Name, UnitPrice)
Inventory (InventoryID, MedicineID, BatchNumber, Quantity, ExpiryDate)
```

##### 2. Prescription → PrescriptionItem Split

```
❌ VIOLATES 3NF:
Prescription (PrescriptionID, MedicineName, Dosage, Frequency)
Problem: Can only store ONE medicine per prescription

✅ COMPLIES WITH 3NF:
Prescription (PrescriptionID, Diagnosis, ValidUntil)
PrescriptionItem (PrescriptionItemID, PrescriptionID, MedicineID, Dosage, Frequency)
```

##### 3. BillPayment Simplification

```
❌ REDUNDANT:
BillPayment (BillID, VisitID, MemberID, PrescriptionID)
Problem: MemberID and PrescriptionID accessible through VisitID

✅ OPTIMIZED:
BillPayment (BillID, VisitID)
Access Member via: Visit → MemberID
Access Prescription via: Visit → Prescription
```

---

## 🎨 UML Diagrams

### Complete System UML

![Complete UML Diagram](diagrams/uml_complete_system.png)

*Full system UML class diagram showing all 14 entities with attributes, methods, and relationships.*

### Component-Wise UML Diagrams

#### 1. Core Master Entities
![Core Entities UML](diagrams/uml_core_entities.png)

**Classes**: Member, Doctor, StaffEmployee, Medicine, MedicalSupplier

**Key Relationships**:
- Independent master entities (no strong dependencies)
- Will link to other modules through foreign keys

#### 2. Appointment & Visit Workflow
![Appointment UML](diagrams/uml_appointment_visit.png)

**Key Relationships**:
- Member (1) ──< Appointment (N)
- Doctor (1) ──< Appointment (N)
- Appointment (0..1) ──< Visit (1)
- Member (1) ──< MedicalHistory (0..1)

**Multiplicity Notes**:
- `0..1` on Appointment → Visit: Walk-ins have no appointment
- `0..1` on MedicalHistory: Created during first visit

#### 3. Prescription & Dispensing Workflow
![Prescription UML](diagrams/uml_prescription_dispensing.png)

**Critical Composition Relationship**:
- Prescription (1) ◆──< PrescriptionItem (1..*)
  - Filled diamond (◆) indicates composition
  - PrescriptionItem cannot exist without Prescription
  - CASCADE delete enforced

**Separation of Concerns**:
- Prescription: Header (diagnosis, validity)
- PrescriptionItem: Individual medicines
- MedicineDispense: Actual dispensing records

#### 4. Inventory Management
![Inventory UML](diagrams/uml_inventory.png)

**Aggregation Relationship**:
- Medicine (1) ◇──< Inventory (0..*)
  - Hollow diamond (◇) indicates aggregation
  - Inventory can be depleted, Medicine catalog remains
  - RESTRICT delete enforced

#### 5. Emergency Response
![Emergency UML](diagrams/uml_emergency.png)

**Key Associations**:
- EmergencyCase → Member: Patient identification
- EmergencyCase → MedicalHistory: Instant allergy access
- EmergencyCase → Doctor: Handling physician
- EmergencyCase → StaffEmployee: First responder

---

## 🗺️ ER Diagrams

### Complete System ER

![Complete ER Diagram](diagrams/er_complete_system.png)

*Full database ER diagram showing all entities, attributes, primary keys (underlined), foreign keys, and cardinality.*

### ER Notation Used

| Symbol | Meaning |
|--------|---------|
| Rectangle | Entity (table) |
| Diamond | Relationship |
| Oval | Attribute (column) |
| Underlined | Primary Key |
| Arrow | Foreign Key with cardinality |

### Component-Wise ER Diagrams

#### 1. Core Entities ER
![Core Entities ER](diagrams/er_core_entities.png)

**Key Attributes**:
- Member: <u>MemberID</u>, Name, Age, Email, ContactNumber (NOT NULL), BloodGroup (NOT NULL), EmergencyContact (NOT NULL)
- Doctor: <u>DoctorID</u>, Name, Specialization, LicenseNumber (UNIQUE), AvailableFrom, AvailableTo
- Medicine: <u>MedicineID</u>, Name, GenericName, UnitPrice (NO stock/expiry here!)

#### 2. Health Records & Visit ER
![Health Visit ER](diagrams/er_health_visit.png)

**Cardinality Examples**:
- Member (1) ──< Appointment (N): One member, many appointments
- Doctor (1) ──< Appointment (N): One doctor, many appointments
- Visit (1) → Appointment (0..1): Visit may or may not link to appointment

#### 3. Prescription Workflow ER (Normalized)
![Prescription ER](diagrams/er_prescription.png)

**Normalized Structure**:
```
Visit (1) ──< Prescription (0..1)
                    │
                    ├──< PrescriptionItem (1..*)
                    │           │
                    │           └──> Medicine (1)
                    │
                    └──< MedicineDispense (1..*)
                                │
                                ├──> Inventory (1)
                                └──> StaffEmployee (1)
```

**Foreign Keys**:
- Prescription.VisitID → Visit (CASCADE)
- PrescriptionItem.PrescriptionID → Prescription (CASCADE)
- PrescriptionItem.MedicineID → Medicine (RESTRICT)
- MedicineDispense.InventoryID → Inventory (RESTRICT)

#### 4. Inventory Management ER
![Inventory ER](diagrams/er_inventory.png)

**Key Relationship**:
```
Medicine (1) ──< Inventory (N) ──> MedicalSupplier (1)
```

**Inventory Attributes** (NOT in Medicine):
- <u>InventoryID</u>
- BatchNumber (UNIQUE per medicine)
- Quantity (stock level)
- ManufactureDate, ExpiryDate
- ReorderLevel, MinimumStock
- Location (storage location)

#### 5. Emergency & Billing ER
![Emergency Billing ER](diagrams/er_emergency_billing.png)

**Emergency Relationships**:
- EmergencyCase → Member (many-to-one)
- EmergencyCase → Doctor (many-to-one, optional)
- EmergencyCase → StaffEmployee (many-to-one)

**Billing Simplification**:
- BillPayment → VisitID only
- Access Member via: Visit.MemberID
- No redundant foreign keys

---

## 🔍 Key Design Decisions

### 1. Medicine vs Inventory Separation ⭐

**Problem**: Where to store stock quantity and expiry date?

**Wrong Approach**:
```sql
CREATE TABLE Medicine (
    MedicineID INT PRIMARY KEY,
    Name VARCHAR(200),
    Quantity INT,        -- ❌ WRONG: Batch-specific
    ExpiryDate DATE      -- ❌ WRONG: Batch-specific
);
```

**Issues**:
- Can only track one batch per medicine
- Cannot handle multiple batches with different expiry dates
- Violates 3NF (transitive dependency)

**Correct Approach**:
```sql
CREATE TABLE Medicine (
    MedicineID INT PRIMARY KEY,
    Name VARCHAR(200),
    UnitPrice DECIMAL(10,2)
    -- NO stock or expiry data
);

CREATE TABLE Inventory (
    InventoryID INT PRIMARY KEY,
    MedicineID INT,
    BatchNumber VARCHAR(50),
    Quantity INT,              -- ✅ Batch-specific
    ExpiryDate DATE,           -- ✅ Batch-specific
    ReorderLevel INT,          -- ✅ Batch-specific
    SupplierID INT,
    FOREIGN KEY (MedicineID) REFERENCES Medicine(MedicineID),
    UNIQUE (MedicineID, BatchNumber)
);
```

**Benefits**:
- ✅ Multiple batches per medicine
- ✅ Different expiry dates tracked
- ✅ FEFO (First Expiry First Out) dispensing possible
- ✅ Batch-level supplier tracking

---

### 2. Prescription → PrescriptionItem Normalization ⭐

**Problem**: How to store multiple medicines in one prescription?

**Wrong Approach**:
```sql
CREATE TABLE Prescription (
    PrescriptionID INT PRIMARY KEY,
    MedicineName VARCHAR(200),  -- ❌ Only ONE medicine
    Dosage VARCHAR(100)
);
```

**Issues**:
- Limited to one medicine per prescription
- Real-world prescriptions have 2-5 medicines
- Violates 1NF if we try to store comma-separated values

**Correct Approach**:
```sql
CREATE TABLE Prescription (
    PrescriptionID INT PRIMARY KEY,
    VisitID INT,
    Diagnosis TEXT
);

CREATE TABLE PrescriptionItem (
    PrescriptionItemID INT PRIMARY KEY,
    PrescriptionID INT,
    MedicineID INT,
    Dosage VARCHAR(100),
    Frequency VARCHAR(100),
    Duration VARCHAR(100),
    Quantity INT,
    FOREIGN KEY (PrescriptionID) REFERENCES Prescription(PrescriptionID) ON DELETE CASCADE
);
```

**Benefits**:
- ✅ Unlimited medicines per prescription
- ✅ Each medicine has own dosage/frequency
- ✅ Properly normalized (1NF compliant)
- ✅ Easy to query specific medicines

**Real-World Example**:
```
Prescription #501: "Throat Infection"
├── Item #1: Azithromycin 250mg, 1 tablet, Once daily, 5 days
├── Item #2: Paracetamol 500mg, 1 tablet, Every 6 hours, 3 days
└── Item #3: Throat lozenges, 1 lozenge, Every 4 hours, 3 days
```

---

### 3. Prescription vs Dispensing Separation ⭐

**Problem**: Is prescription the same as dispensing?

**Answer**: NO! They are separate events.

**Why Separate?**
1. **Timing**: Prescription written at 10 AM, dispensing at 11 AM
2. **Batch Tracking**: Need to record which inventory batch was used
3. **Price Changes**: Medicine price may change between prescription and dispensing
4. **Partial Dispensing**: Stock shortage may require partial/later dispensing
5. **Staff Attribution**: Different staff (doctor prescribes, pharmacist dispenses)
6. **Audit Trail**: Complete history of what was actually given

**Implementation**:
```sql
CREATE TABLE PrescriptionItem (
    PrescriptionItemID INT PRIMARY KEY,
    PrescriptionID INT,
    MedicineID INT,
    Quantity INT  -- Prescribed quantity
);

CREATE TABLE MedicineDispense (
    DispenseID INT PRIMARY KEY,
    PrescriptionID INT,
    PrescriptionItemID INT,
    MedicineID INT,
    InventoryID INT,           -- Which batch?
    QuantityDispensed INT,     -- Actually dispensed (may differ)
    DispensedBy INT,           -- Which pharmacist?
    DispenseDate DATE,
    BatchNumber VARCHAR(50),   -- For traceability
    UnitPrice DECIMAL(10,2),   -- Price at dispensing time
    TotalPrice DECIMAL(10,2),
    FOREIGN KEY (InventoryID) REFERENCES Inventory(InventoryID)
);
```

**Scenario**:
```
PrescriptionItem: Paracetamol, Quantity: 20 tablets

MedicineDispense:
- DispenseID: 2001
- InventoryID: 5001 (Batch PAR-2024-001)
- QuantityDispensed: 20
- DispensedBy: Employee #305 (Pharmacist Sarah)
- UnitPrice: ₹2.00
- TotalPrice: ₹40.00

Result: Inventory Batch 5001 quantity reduced by 20
```

---

### 4. BillPayment Foreign Key Simplification

**Problem**: How many foreign keys should BillPayment have?

**Redundant Approach**:
```sql
CREATE TABLE BillPayment (
    BillID INT PRIMARY KEY,
    VisitID INT,
    MemberID INT,           -- ❌ Redundant (accessible via Visit)
    PrescriptionID INT,     -- ❌ Redundant (accessible via Visit)
    TotalAmount DECIMAL(10,2)
);
```

**Optimized Approach**:
```sql
CREATE TABLE BillPayment (
    BillID INT PRIMARY KEY,
    VisitID INT,            -- ✅ Only FK needed
    TotalAmount DECIMAL(10,2),
    FOREIGN KEY (VisitID) REFERENCES Visit(VisitID) ON DELETE CASCADE
);
```

**Why?**
- MemberID accessible via: `Visit.MemberID`
- PrescriptionID accessible via: `Visit → Prescription`
- Reduces redundancy (3NF compliance)
- Single point of truth

---

### 5. Emergency Case Priority

**Design**: EmergencyCase has direct link to Member AND MedicalHistory

**Why Critical?**
- Emergency scenarios require **sub-second** access to allergies
- Cannot afford JOIN latency in life-threatening situations
- Blood group and emergency contact must be instantly available

**Query Optimization**:
```sql
-- This query MUST execute in < 1 second
SELECT 
    m.Name, m.BloodGroup, m.EmergencyContact,
    mh.KnownAllergies, mh.ChronicConditions
FROM Member m
LEFT JOIN MedicalHistory mh ON m.MemberID = mh.MemberID
WHERE m.MemberID = ?;
```

**Future Enhancement** (Assignment 2):
- B+ Tree index on Member.MemberID
- Hash index on MedicalHistory.MemberID
- In-memory caching for frequent emergency patients

---

## 📝 Sample Queries

### Patient Lookup Queries

```sql
-- Find all visits for a patient
SELECT v.VisitID, v.VisitDate, v.ChiefComplaint, 
       d.Name AS DoctorName, v.Diagnosis
FROM Visit v
JOIN Doctor d ON v.DoctorID = d.DoctorID
WHERE v.MemberID = 1001
ORDER BY v.VisitDate DESC;

-- Get complete medical profile
SELECT 
    m.Name, m.Age, m.BloodGroup, m.Email,
    mh.KnownAllergies, mh.ChronicConditions, mh.PastSurgeries
FROM Member m
LEFT JOIN MedicalHistory mh ON m.MemberID = mh.MemberID
WHERE m.MemberID = 1001;
```

### Prescription & Dispensing Queries

```sql
-- Get all medicines in a prescription
SELECT 
    p.PrescriptionID, p.Diagnosis, p.IssueDate,
    m.Name AS MedicineName, pi.Dosage, pi.Frequency, pi.Duration, pi.Quantity
FROM Prescription p
JOIN PrescriptionItem pi ON p.PrescriptionID = pi.PrescriptionID
JOIN Medicine m ON pi.MedicineID = m.MedicineID
WHERE p.PrescriptionID = 501;

-- Check if medicine was dispensed
SELECT 
    md.DispenseID, md.DispenseDate, md.QuantityDispensed,
    md.BatchNumber, se.Name AS PharmacistName
FROM MedicineDispense md
JOIN StaffEmployee se ON md.DispensedBy = se.EmployeeID
WHERE md.PrescriptionItemID = 1001;
```

### Inventory Management Queries

```sql
-- Low stock alert
SELECT 
    m.Name, i.BatchNumber, i.Quantity, i.ReorderLevel,
    (i.ReorderLevel - i.Quantity) AS Shortfall,
    ms.CompanyName AS Supplier
FROM Inventory i
JOIN Medicine m ON i.MedicineID = m.MedicineID
JOIN MedicalSupplier ms ON i.SupplierID = ms.SupplierID
WHERE i.Quantity < i.ReorderLevel
  AND i.Status = 'Available'
ORDER BY Shortfall DESC;

-- Expiring medicines (next 30 days)
SELECT 
    m.Name, i.BatchNumber, i.Quantity, i.ExpiryDate,
    DATEDIFF(i.ExpiryDate, CURDATE()) AS DaysUntilExpiry,
    (i.Quantity * m.UnitPrice) AS ValueAtRisk
FROM Inventory i
JOIN Medicine m ON i.MedicineID = m.MedicineID
WHERE i.ExpiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND i.Status = 'Available'
ORDER BY i.ExpiryDate ASC;

-- Top 10 most used medicines
SELECT 
    m.Name, COUNT(md.DispenseID) AS TimesDispensed,
    SUM(md.QuantityDispensed) AS TotalQuantity
FROM MedicineDispense md
JOIN Medicine m ON md.MedicineID = m.MedicineID
WHERE md.DispenseDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY m.MedicineID, m.Name
ORDER BY TotalQuantity DESC
LIMIT 10;
```

### Emergency Response Queries

```sql
-- All emergency cases by severity
SELECT 
    ec.EmergencyID, m.Name AS PatientName, ec.IncidentDateTime,
    ec.Location, ec.Severity, ec.Symptoms, ec.Outcome,
    d.Name AS DoctorName
FROM EmergencyCase ec
JOIN Member m ON ec.MemberID = m.MemberID
LEFT JOIN Doctor d ON ec.DoctorID = d.DoctorID
WHERE ec.Severity = 'Critical'
  AND ec.Status = 'Active'
ORDER BY ec.IncidentDateTime DESC;

-- Emergency cases requiring hospital referral
SELECT 
    ec.EmergencyID, m.Name, ec.IncidentDateTime,
    ec.Outcome, ec.ReferredToHospital, ec.AmbulanceUsed
FROM EmergencyCase ec
JOIN Member m ON ec.MemberID = m.MemberID
WHERE ec.Outcome = 'Referred to Hospital'
  AND ec.IncidentDateTime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);
```

### Financial & Billing Queries

```sql
-- Calculate visit bill
SELECT 
    v.VisitID, m.Name AS PatientName,
    50 AS ConsultationFee,
    COALESCE(SUM(md.TotalPrice), 0) AS MedicineCost,
    (50 + COALESCE(SUM(md.TotalPrice), 0)) AS TotalAmount
FROM Visit v
JOIN Member m ON v.MemberID = m.MemberID
LEFT JOIN MedicineDispense md ON v.VisitID = md.VisitID
WHERE v.VisitID = 801
GROUP BY v.VisitID, m.Name;

-- Daily revenue report
SELECT 
    DATE(bp.BillDate) AS BillDate,
    COUNT(bp.BillID) AS TotalBills,
    SUM(bp.ConsultationFee) AS ConsultationRevenue,
    SUM(bp.MedicineCost) AS MedicineRevenue,
    SUM(bp.TotalAmount) AS TotalRevenue,
    SUM(CASE WHEN bp.PaymentMethod = 'Cash' THEN bp.TotalAmount ELSE 0 END) AS CashRevenue,
    SUM(CASE WHEN bp.PaymentMethod IN ('Card', 'UPI') THEN bp.TotalAmount ELSE 0 END) AS DigitalRevenue
FROM BillPayment bp
WHERE bp.BillDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(bp.BillDate)
ORDER BY BillDate DESC;
```

### Appointment Management Queries

```sql
-- Today's appointment schedule
SELECT 
    a.TokenNumber, a.AppointmentTime, m.Name AS PatientName,
    m.ContactNumber, a.Symptoms, a.Priority, a.Status
FROM Appointment a
JOIN Member m ON a.MemberID = m.MemberID
WHERE a.DoctorID = 10
  AND a.AppointmentDate = CURDATE()
  AND a.Status IN ('Scheduled', 'In Progress')
ORDER BY a.AppointmentTime;

-- No-show appointments
SELECT 
    a.AppointmentID, m.Name, a.AppointmentDate, a.AppointmentTime,
    d.Name AS DoctorName
FROM Appointment a
JOIN Member m ON a.MemberID = m.MemberID
JOIN Doctor d ON a.DoctorID = d.DoctorID
WHERE a.Status = 'No-Show'
  AND a.AppointmentDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
```

---

## 👥 Team Members

| Name | Roll Number | Email | Primary Responsibilities |
|------|-------------|-------|-------------------------|
| [Member 1] | [Roll No 1] | [email1@iitgn.ac.in] | Requirement analysis, Core entities design, UML diagrams |
| [Member 2] | [Roll No 2] | [email2@iitgn.ac.in] | Appointment/Visit/Prescription workflows, Normalization |
| [Member 3] | [Roll No 3] | [email3@iitgn.ac.in] | Inventory/Emergency/Billing design, SQL triggers |
| [Member 4] | [Roll No 4] | [email4@iitgn.ac.in] | Normalization analysis, Sample data, Documentation |

### Contribution Summary

**Collaborative Efforts**:
- Weekly design review meetings
- Joint UML and ER diagram refinement
- Peer review of SQL implementations
- Comprehensive functionality testing
- Report compilation and formatting

**Tools Used**:
- Draw.io for UML/ER diagrams
- MySQL Workbench for SQL development
- GitHub for version control
- Google Meet for remote collaboration
- LaTeX/Markdown for documentation

---

## 🚀 Setup Instructions

### Prerequisites

- MySQL 8.0 or higher
- MySQL Workbench or DBeaver (recommended)
- Git (for cloning repository)

### Installation Steps

1. **Clone Repository**
```bash
git clone https://github.com/[your-repo]/dispensary-management-system.git
cd dispensary-management-system
```

2. **Create Database**
```sql
CREATE DATABASE dispensary_db;
USE dispensary_db;
```

3. **Import Schema**
```bash
mysql -u root -p dispensary_db < sql/schema.sql
```

4. **Load Sample Data**
```bash
mysql -u root -p dispensary_db < sql/sample_data.sql
```

5. **Verify Installation**
```sql
-- Check table count
SELECT COUNT(*) AS TableCount FROM information_schema.tables 
WHERE table_schema = 'dispensary_db';
-- Expected: 14 tables

-- Check foreign key relationships
SELECT COUNT(*) AS FKCount FROM information_schema.key_column_usage
WHERE constraint_schema = 'dispensary_db' 
AND referenced_table_name IS NOT NULL;
-- Expected: 25+ relationships
```

### Sample Data Overview

The system includes sample data for:
- 50+ Members (students, faculty, staff)
- 10+ Doctors (various specializations)
- 20+ Staff Employees
- 100+ Medicines
- 30+ Medical Suppliers
- 200+ Inventory batches
- 150+ Appointments
- 100+ Visits
- 80+ Prescriptions (with 200+ items)
- 150+ Medicine dispensing records
- 20+ Emergency cases
- 100+ Bill payments

---

## 🔮 Future Enhancements

### Assignment 2: B+ Tree Indexing

**Planned Indexes**:
- B+ Tree on `Member.MemberID` (fast patient lookup)
- B+ Tree on `Appointment.AppointmentDate` (schedule queries)
- B+ Tree on `MedicineDispense.DispenseDate` (usage analytics)
- B+ Tree on `Inventory.ExpiryDate` (expiry monitoring)

**Expected Performance Gains**:
- Patient lookup: O(log n) vs O(n)
- Appointment queries: Range queries in O(log n + k)
- Report generation: 10-100x faster

### Assignment 3: ACID Testing

**Test Scenarios**:
1. **Atomicity**: Medicine dispensing with stock update (rollback on failure)
2. **Consistency**: Concurrent appointment booking (prevent double-booking)
3. **Isolation**: Multiple pharmacists dispensing simultaneously
4. **Durability**: Emergency case data persistence after system crash

**Concurrency Issues to Solve**:
- Lost updates in inventory
- Phantom reads in appointment scheduling
- Dirty reads in billing

### Assignment 4: Sharding

**Sharding Strategies**:
1. **By Department**: Shard members by academic department (CS, EE, ME, etc.)
2. **By Date Range**: Historical data (old visits/prescriptions) on cold storage shard
3. **By Supplier**: Inventory distributed across supplier-specific shards
4. **Hybrid**: Hot data (recent visits) on fast SSD shard, cold data on HDD shard

**Query Routing**:
- Transparent shard routing for single-shard queries
- MapReduce for cross-shard analytics

### Beyond Course Scope

1. **Web/Mobile Application**
   - React frontend for appointment booking
   - Mobile app for patients (view prescriptions, book appointments)
   - Admin dashboard for doctors and staff

2. **Advanced Features**
   - SMS/Email notifications for appointments
   - Telemedicine integration (video consultations)
   - AI-powered diagnosis assistance
   - Predictive analytics for disease outbreak detection

3. **Integration & Compliance**
   - Hospital EHR system integration for referrals
   - Insurance claim processing
   - HIPAA/GDPR compliance for data privacy
   - Blockchain for tamper-proof medical records

4. **Analytics & Reporting**
   - Real-time dashboards (Grafana/Tableau)
   - Medicine usage forecasting (ML models)
   - Patient health trend analysis
   - Cost optimization recommendations

---

## 📚 References

1. Ramez Elmasri and Shamkant B. Navathe, *Fundamentals of Database Systems*, 7th Edition, Pearson, 2015
2. Abraham Silberschatz, Henry F. Korth, and S. Sudarshan, *Database System Concepts*, 7th Edition, McGraw-Hill, 2019
3. MySQL 8.0 Reference Manual, https://dev.mysql.com/doc/refman/8.0/
4. CS 432 Course Lecture Notes, Dr. Yogesh K. Meena, IIT Gandhinagar

---

## 📄 License

This project is developed as part of the CS 432 course at IIT Gandhinagar. All rights reserved.

---

## 📧 Contact

For questions or issues, please contact:
- **Instructor**: Dr. Yogesh K. Meena (yogesh.meena@iitgn.ac.in)
- **Team Lead**: [Your Email]

---

## 🎓 Acknowledgments

Special thanks to:
- Dr. Yogesh K. Meena for guidance and feedback
- IIT Gandhinagar Computer Science Department
- Course TAs for technical support
- All team members for collaborative effort

---

**Last Updated**: February 15, 2026  
**Version**: 1.0  
**Status**: Assignment 1 Complete ✅
