# Dispensary Management System  
**CS 432 – Databases (Track 1) – Assignment 1**

## Project Overview

This project implements a fully normalized and constraint-driven **Dispensary Management System** database.

The system addresses real-world issues in campus dispensaries such as:
- Lost medical records
- Untracked allergies
- Medicine stock shortages
- Lack of emergency monitoring
- Manual billing inefficiencies

The database strictly follows **3NF normalization**, enforces referential integrity, and supports intelligent inventory management.

---

# Core Functionalities

## 1️⃣ Member & Medical History Management
- Register students, faculty, and staff
- Track allergies and chronic conditions
- Maintain emergency contact details

Tables:
- `Member`
- `MedicalHistory`

---

## 2️⃣ Appointment & Visit Workflow
- Book appointments with doctors
- Manage walk-in and emergency visits
- Record diagnosis and vitals

Tables:
- `Appointment`
- `Visit`
- `Doctor`

---

## 3️⃣ Prescription & Medicine Dispensing
- Multi-medicine prescriptions
- Batch-wise dispensing
- Inventory auto-update

Tables:
- `Prescription`
- `PrescriptionItem`
- `Medicine`
- `Inventory`
- `MedicineDispense`

---

## 4️⃣ Emergency Response Tracking
- Real-time emergency logging
- Allergy lookup during crisis
- Ambulance coordination
- Severity classification

Tables:
- `EmergencyCase`

---

## 5️⃣ Intelligent Inventory Management
- Batch-level stock tracking
- Expiry date monitoring
- Reorder level alerts
- Supplier management

Tables:
- `Inventory`
- `MedicalSupplier`

---

# Database Statistics

| Requirement | Implementation |
|------------|---------------|
| Minimum Tables | 10 |
| Implemented Tables | 14 |
| Primary Keys | 14 |
| Foreign Keys | 25+ |
| Normalization | 3NF |
| Constraints | 35+ CHECK rules |

---

# Normalization Highlights

### ✔ Prescription Normalization
Split into:
- `Prescription`
- `PrescriptionItem`

Allows multiple medicines per prescription.

### ✔ Inventory Normalization
Stock & expiry moved from `Medicine` to `Inventory`.

Ensures batch-specific tracking.

---

# UML and ER Diagrams

Diagrams created using **draw.io**

- `/diagrams/UML_Diagram.png`
- `/diagrams/ER_Diagram.png`

UML classes were converted to ER entities by:
- Mapping associations to foreign keys
- Translating multiplicity to 1:M relationships
- Resolving M:N using junction tables

---

# Constraints & Integrity

- Age ≥ 16
- ExpiryDate > ManufactureDate
- Quantity ≥ 0
- ValidUntil > IssueDate
- Unique Email enforcement
- CASCADE and RESTRICT rules
- Bill amount consistency validation

---

# Real-Life Design Considerations

- Emergency allergy lookup query
- Stock alert query
- Batch traceability
- Audit trail for medicine dispensing
- Free/Insurance billing support

---

# 🏁 Conclusion

This database design ensures:

- Correctness
- Strong normalization
- Referential integrity
- Real-world applicability
- Scalability foundation

It serves as the base architecture for future indexing, transaction, and distributed database enhancements.
