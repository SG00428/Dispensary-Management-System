# Dispensary Management System - Database Design

## CS 432 - Databases | Assignment 1 | Track 1

---

## Table of Contents

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

---

## Project Overview

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

## Problem Statement

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

-  Maintains complete patient health histories with mandatory allergy tracking
-  Enables instant emergency response with one-click access to critical data
-  Provides intelligent inventory management with automated reorder alerts
-  Integrates appointments with doctor schedules and patient records
-  Ensures medication safety through prescription validation
-  Supports comprehensive audit trails for accountability

---

## System Architecture

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
- **Documentation**: LaTeX, Markdown
- **Version Control**: Git, GitHub

---

## Database Schema

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

## Core Functionalities

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

##  Normalization

### Normalization to Third Normal Form (3NF)

#### First Normal Form (1NF)

**Requirement**: No repeating groups, atomic values

**Compliance**:
-  No multi-valued attributes
-  All attributes contain atomic values
-  No repeating groups (Medicine1, Medicine2, etc.)

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

#### Second Normal Form (2NF) 

**Requirement**: No partial dependencies (all non-key attributes fully dependent on PK)

**Compliance**:
-  All tables use single-column primary keys
-  No composite keys causing partial dependencies
-  All attributes depend on entire primary key

#### Third Normal Form (3NF) 

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

## UML Diagrams

UML class diagrams were created to represent the conceptual structure of the database system.

Each class corresponds to a database table and includes:
- Key attributes
- Relationships
- Multiplicity constraints

Multiplicity notation used:

- **1** → exactly one  
- **M** → many  
- **0..1** → optional (zero or one)

---

# Core Patient and Visit Flow

This diagram represents the primary workflow of the dispensary system, including:

- Member registration
- Appointment booking
- Visit tracking
- Prescription generation
- Billing

<img width="1284" height="894" alt="image" src="https://github.com/user-attachments/assets/c481c53a-d160-4f71-834c-d05fac84f9f9" />


---

## Relationships and Multiplicity

### Member & Appointment
- **Member (1) — (M) Appointment**  
  A member can book multiple appointments.  
  Each appointment belongs to exactly one member.

### Doctor & Appointment
- **Doctor (1) — (M) Appointment**  
  A doctor can attend multiple appointments.

### Appointment & Visit
- **Appointment (1) — (0..1) Visit**  
  Each appointment may result in at most one visit.  
  A visit can also occur without an appointment (walk-in).

### Member & Visit
- **Member (1) — (M) Visit**  
  A member can have multiple visits over time.

### Doctor & Visit
- **Doctor (1) — (M) Visit**  
  A doctor can conduct multiple visits.

### Visit & Prescription
- **Visit (1) — (M) Prescription**  
  Each visit may generate multiple prescriptions.

### Member & Prescription
- **Member (1) — (M) Prescription**  
  A member may receive multiple prescriptions over time.

### Doctor & Prescription
- **Doctor (1) — (M) Prescription**  
  A doctor can issue multiple prescriptions.

### Prescription & PrescriptionItem
- **Prescription (1) — (M) PrescriptionItem**  
  Each prescription contains multiple medicine items.

### Medicine & PrescriptionItem
- **Medicine (1) — (M) PrescriptionItem**  
  Each medicine can appear in multiple prescription items.

### Visit & BillPayment
- **Visit (1) — (1) BillPayment**  
  Each visit generates exactly one bill.

### StaffEmployee & BillPayment
- **StaffEmployee (1) — (M) BillPayment**  
  A staff member can generate multiple bills.

---

# Inventory and Medicine Flow

This diagram represents:

- Medicine master catalog
- Batch-wise inventory storage
- Supplier relationships
- Actual medicine dispensing workflow

<img width="1140" height="686" alt="image" src="https://github.com/user-attachments/assets/0d5267e7-1ec4-4d2a-bf65-62b2658f0c4f" />


---

## Relationships and Multiplicity

### Medicine & Inventory
- **Medicine (1) — (M) Inventory**  
  A medicine can exist in multiple inventory batches.

### MedicalSupplier & Inventory
- **MedicalSupplier (1) — (M) Inventory**  
  A supplier can provide multiple inventory batches.

### PrescriptionItem & MedicineDispense
- **PrescriptionItem (1) — (M) MedicineDispense**  
  A prescription item may be dispensed in multiple batches.

### Inventory & MedicineDispense
- **Inventory (1) — (M) MedicineDispense**  
  An inventory batch can be used in multiple dispensing records.

### StaffEmployee & MedicineDispense
- **StaffEmployee (1) — (M) MedicineDispense**  
  A staff member can dispense medicines multiple times.

---

# Emergency Case Flow

This diagram models emergency case management and its integration with:

- Members
- Doctors
- Visits

<img width="1106" height="598" alt="image" src="https://github.com/user-attachments/assets/d14b6f4c-7287-46fa-8e70-c1534ef1ad7e" />


---

## Relationships and Multiplicity

### Member & EmergencyCase
- **Member (1) — (M) EmergencyCase**  
  A member can have multiple emergency cases.

### Doctor & EmergencyCase
- **Doctor (1) — (M) EmergencyCase**  
  A doctor can handle multiple emergency cases.

### Visit & EmergencyCase
- **Visit (1) — (0..1) EmergencyCase**  
  An emergency case may be associated with a visit.  
  However, not all visits are emergency cases.

---

The UML diagrams collectively represent:

- Core clinical workflow  
- Inventory management and supplier tracking  
- Emergency response integration  

Each UML class directly maps to a database table in Module A.  
Multiplicity constraints are enforced in the relational schema using:

- Primary Keys  
- Foreign Keys  
- NOT NULL constraints  
- CASCADE and RESTRICT rules  

These diagrams form the conceptual foundation for the ER model and relational schema implementation.


---

## ER Diagrams

### Complete System ER

<img width="2785" height="2311" alt="Er drawio" src="https://github.com/user-attachments/assets/541b3879-f8b7-4ac1-8756-fe760a53ac2d" />


> **Note:** The complete ER diagram is uploaded in the file section.

---

### ER Notation Guide

| Symbol | Meaning | Example |
|--------|---------|---------|
| **Rectangle** | Entity (database table) | Member, Doctor, Visit |
| **Diamond** | Relationship between entities | BOOKS, ATTENDS, GENERATES |
| **Oval** | Attribute (column) | Name, Age, Email |
| **Underlined** | Primary Key | <u>MemberID</u>, <u>DoctorID</u> |
| **(PK)** | Primary Key annotation | MemberID (PK) |
| **(FK)** | Foreign Key annotation | Appointment.MemberID (FK) |
| **(U)** | Unique constraint | Doctor.LicenseNumber (U) |
| **1, M, 0..1** | Cardinality notation | 1 = exactly one, M = many, 0..1 = optional |

---

### Complete Entity List (14 Tables)

| # | Entity | Primary Key | Purpose |
|---|--------|-------------|---------|
| 1 | **Member** | MemberID (PK) | Central patient registry (students, faculty, staff) |
| 2 | **Doctor** | DoctorID (PK) | Medical professional information with schedules |
| 3 | **StaffEmployee** | EmployeeID (PK) | Nurses, pharmacists, administrative staff |
| 4 | **Medicine** | MedicineID (PK) | Medicine catalog (NO stock/expiry - normalized!) |
| 5 | **MedicalSupplier** | SupplierID (PK) | Vendor management for procurement |
| 6 | **MedicalHistory** | HistoryID (PK) | Patient health records with allergies |
| 7 | **Appointment** | AppointmentID (PK) | Appointment scheduling |
| 8 | **Visit** | VisitID (PK) | Every dispensary visit (walk-in or scheduled) |
| 9 | **Inventory** | InventoryID (PK) | Batch-wise stock tracking with expiry dates |
| 10 | **Prescription** | PrescriptionID (PK) | Prescription header with diagnosis |
| 11 | **PrescriptionItem** | PrescriptionItemID (PK) | Individual medicines in prescription (normalized) |
| 12 | **MedicineDispense** | DispenseID (PK) | Actual dispensing record (separate from prescription) |
| 13 | **BillPayment** | BillID (PK) | Financial records and payment tracking |
| 14 | **EmergencyCase** | EmergencyID (PK) | Emergency incident documentation |

---

### Key ER Relationships

#### Core Patient Flow
```
Member (1) ──HAS_HISTORY──> MedicalHistory (0..1)
   │
   ├──BOOKS──> Appointment (M) ──> Doctor (1)
   │                │
   │                └──HAS_VISIT──> Visit (1)
   │
   └──ATTENDS──> Visit (M) ──CONDUCTS──> Doctor (1)
```

#### Prescription & Dispensing Flow
```
Visit (1) ──GENERATES──> Prescription (0..1)
                             │
                             └──contains──> PrescriptionItem (1..*)
                                                 │
                                                 ├──references──> Medicine (1)
                                                 │
                                                 └──dispensed_as──> MedicineDispense (1..*)
                                                                         │
                                                                         ├──uses──> Inventory (1)
                                                                         └──by──> StaffEmployee (1)
```

#### Inventory Management Flow
```
Medicine (1) ──STOCK_OF──> Inventory (M) ──SUPPLIES──> MedicalSupplier (1)
                               │
                               └──used_in──> MedicineDispense (M)
```

#### Emergency Response Flow
```
Member (1) ──EMERGENCY_FOR──> EmergencyCase (M)
                                    │
                                    ├──HANDLED_BY──> Doctor (0..1)
                                    ├──ATTENDED_BY──> StaffEmployee (1)
                                    └──links_to──> Visit (1)
```

#### Financial Flow
```
Visit (1) ──BILLED_FOR──> BillPayment (1) ──PROCESSED_BY──> StaffEmployee (1)
```

---

### Critical Entity Attributes

#### 1. Member (Patient Registry)
```
Member
├── MemberID (PK)
├── Name (NOT NULL)
├── Age (NOT NULL)
├── Email (U) (NOT NULL) - Unique constraint
├── ContactNumber (NOT NULL)
├── BloodGroup (NOT NULL)
├── EmergencyContact (NOT NULL) 
├── Department
├── MemberType - Student/Faculty/Staff
└── Status
```

#### 2. Doctor
```
Doctor
├── DoctorID (PK) 
├── Name (NOT NULL)
├── Specialization (NOT NULL)
├── LicenseNumber (U) (NOT NULL) - Unique, verified
├── Email (U) (NOT NULL)
├── AvailableFrom 
├── AvailableTo 
├── WorkingDays
└── Status
```

#### 3. Medicine (Master Catalog - NO STOCK!)
```
Medicine
├── MedicineID (PK) 
├── Name (NOT NULL)
├── GenericName
├── Category (NOT NULL)
├── Form - Tablet/Syrup/Injection
├── UnitPrice (NOT NULL)
└── RequiresPrescription

❌ NO StockQuantity (moved to Inventory)
❌ NO ExpiryDate (moved to Inventory)
❌ NO ReorderLevel (moved to Inventory)
```

#### 4. Inventory (Batch-Specific Stock) 
```
Inventory
├── InventoryID (PK) 
├── MedicineID (FK) → Medicine
├── BatchNumber (NOT NULL, UNIQUE per medicine)
├── Quantity (NOT NULL) 
├── ManufactureDate
├── ExpiryDate (NOT NULL) 
├── Location (NOT NULL) - Storage location
├── SupplierID (FK) → MedicalSupplier
├── ReorderLevel (NOT NULL) 
├── MinimumStock (NOT NULL)
└── Status
```

**Why Separate Medicine and Inventory?**
- One medicine can have **multiple batches** with different expiry dates
- Enables **FEFO** (First Expiry First Out) dispensing
- Proper **3NF compliance** (no transitive dependencies)

#### 5. Prescription vs PrescriptionItem 
```
Prescription (Header)
├── PrescriptionID (PK)
├── VisitID (FK) → Visit
├── MemberID (FK) → Member
├── DoctorID (FK) → Doctor
├── IssueDate (NOT NULL)
├── ValidUntil (NOT NULL)
├── Diagnosis (NOT NULL)
└── Status

PrescriptionItem (Detail - Normalized!)
├── PrescriptionItemID (PK)
├── PrescriptionID (FK) → Prescription (CASCADE)
├── MedicineID (FK) → Medicine (RESTRICT)
├── Dosage (NOT NULL) - "1 tablet", "5ml"
├── Frequency (NOT NULL) - "Every 6 hours"
├── Duration (NOT NULL) - "5 days"
└── Quantity (NOT NULL)
```

**Why Split?**
- Allows **unlimited medicines** per prescription
- Complies with **1NF** (no repeating groups)
- Real prescriptions have 2-5 medicines typically

#### 6. MedicineDispense (Separation from Prescription) 
```
MedicineDispense
├── DispenseID (PK) 
├── PrescriptionID (FK)
├── PrescriptionItemID (FK)
├── MedicineID (FK)
├── InventoryID (FK) → Tracks which batch used! 
├── QuantityDispensed (NOT NULL)
├── DispensedBy (FK) → StaffEmployee - Audit trail
├── DispenseDate (NOT NULL)
├── DispenseTime (NOT NULL)
├── BatchNumber - For traceability
├── UnitPrice (NOT NULL)
└── TotalPrice (NOT NULL)
```

**Why Separate from Prescription?**
- Prescription = **what doctor ordered**
- MedicineDispense = **what pharmacist actually gave**
- Batch tracking for recalls
- Partial dispensing support (stock shortages)

#### 7. EmergencyCase (Comprehensive Tracking)
```
EmergencyCase
├── EmergencyID (PK)
├── MemberID (FK) → Member (CASCADE)
├── DoctorID (FK) → Doctor (0..1, optional)
├── AttendingStaffID (FK) → StaffEmployee
├── VisitID (FK) → Visit
├── IncidentDateTime (NOT NULL)
├── Location (NOT NULL)
├── Severity (NOT NULL) - Critical/High/Moderate/Low
├── Symptoms (NOT NULL)
├── VitalSignsAtArrival (JSON)
├── FirstAidGiven
├── ActionTaken (NOT NULL)
├── MedicationAdministered
├── Outcome (NOT NULL)
├── ReferredToHospital
├── AmbulanceUsed
├── AmbulanceArrivalTime
├── ResolvedDateTime
└── Status
```

---

### Relationship Cardinalities Explained

| Relationship | Cardinality | Foreign Key Location | DELETE Rule |
|-------------|-------------|---------------------|-------------|
| Member → MedicalHistory | 1:1 | MedicalHistory.MemberID (FK) | CASCADE |
| Member → Appointment | 1:M | Appointment.MemberID (FK) | CASCADE |
| Doctor → Appointment | 1:M | Appointment.DoctorID (FK) | RESTRICT |
| Appointment → Visit | 0..1:1 | Visit.AppointmentID (FK, nullable) | SET NULL |
| Visit → Prescription | 1:M | Prescription.VisitID (FK) | CASCADE |
| Prescription → PrescriptionItem | 1:M | PrescriptionItem.PrescriptionID (FK) | CASCADE |
| PrescriptionItem → MedicineDispense | 1:M | MedicineDispense.PrescriptionItemID (FK) | RESTRICT |
| Medicine → Inventory | 1:M | Inventory.MedicineID (FK) | RESTRICT |
| Inventory → MedicineDispense | M:1 | MedicineDispense.InventoryID (FK) | RESTRICT |
| Visit → BillPayment | 1:1 | BillPayment.VisitID (FK) | CASCADE |
| Member → EmergencyCase | 1:M | EmergencyCase.MemberID (FK) | CASCADE |


---

## Key Design Decisions

### 1. Medicine vs Inventory Separation

**Benefits**:
-  Multiple batches per medicine
-  Different expiry dates tracked
-  FEFO (First Expiry First Out) dispensing possible
-  Batch-level supplier tracking

---

### 2. Prescription → PrescriptionItem Normalization

**Benefits**:
-  Unlimited medicines per prescription
-  Each medicine has own dosage/frequency
-  Properly normalized (1NF compliant)
-  Easy to query specific medicines

**Real-World Example**:
```
Prescription #501: "Throat Infection"
├── Item #1: Azithromycin 250mg, 1 tablet, Once daily, 5 days
├── Item #2: Paracetamol 500mg, 1 tablet, Every 6 hours, 3 days
└── Item #3: Throat lozenges, 1 lozenge, Every 4 hours, 3 days
```

---

### 3. Prescription vs Dispensing Separation


**Why Separate?**
1. **Timing**: Prescription written at 10 AM, dispensing at 11 AM
2. **Batch Tracking**: Need to record which inventory batch was used
3. **Price Changes**: Medicine price may change between prescription and dispensing
4. **Partial Dispensing**: Stock shortage may require partial/later dispensing
5. **Staff Attribution**: Different staff (doctor prescribes, pharmacist dispenses)
6. **Audit Trail**: Complete history of what was actually given


---

### 4. BillPayment Foreign Key Simplification

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

---

## Sample Queries

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

## Team Members

| Name |
|------|
| Shreyas Dharmatti |
| Anushika Mishra |
| Harsh Jain |
| Kandarp Jani |
| Sneha Gautam | 

---

## Setup Instructions

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

## References

1. Ramez Elmasri and Shamkant B. Navathe, *Fundamentals of Database Systems*, 7th Edition, Pearson, 2015
2. Abraham Silberschatz, Henry F. Korth, and S. Sudarshan, *Database System Concepts*, 7th Edition, McGraw-Hill, 2019
3. MySQL 8.0 Reference Manual, https://dev.mysql.com/doc/refman/8.0/
4. CS 432 Course Lecture Notes, Dr. Yogesh K. Meena, IIT Gandhinagar


