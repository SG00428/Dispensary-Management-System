-- ═══════════════════════════════════════════════════════════════════════════
-- Shard Schema — Exact copy of DispensaryManagement schema
--
-- Run on each shard:
--   mysql -h 10.0.116.184 -P 3307 -u SQL_ed -p SQL_ed < 01_create_schema.sql
--   mysql -h 10.0.116.184 -P 3308 -u SQL_ed -p SQL_ed < 01_create_schema.sql
--   mysql -h 10.0.116.184 -P 3309 -u SQL_ed -p SQL_ed < 01_create_schema.sql
--
-- Triggers are omitted (auth triggers reference tables not on shards,
-- date-check triggers would block historical data migration).
-- ═══════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS EmergencyCase;
DROP TABLE IF EXISTS MedicineDispense;
DROP TABLE IF EXISTS BillPayment;
DROP TABLE IF EXISTS PrescriptionItem;
DROP TABLE IF EXISTS Prescription;
DROP TABLE IF EXISTS Visit;
DROP TABLE IF EXISTS Appointment;
DROP TABLE IF EXISTS Inventory;
DROP TABLE IF EXISTS MedicalHistory;
DROP TABLE IF EXISTS DoctorSchedule;
DROP TABLE IF EXISTS Member;
DROP TABLE IF EXISTS Doctor;
DROP TABLE IF EXISTS StaffEmployee;
DROP TABLE IF EXISTS Medicine;
DROP TABLE IF EXISTS MedicalSupplier;
DROP TABLE IF EXISTS UserLogin;
DROP TABLE IF EXISTS SystemRole;
DROP TABLE IF EXISTS UserRoleMapping;
DROP TABLE IF EXISTS SuperAdmin;
DROP TABLE IF EXISTS DirectDBChangeLog;
DROP TABLE IF EXISTS ShardMetadata;

SET FOREIGN_KEY_CHECKS = 1;

-- Schema adapted for shards
CREATE TABLE Member (
    MemberID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Age INT NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    ContactNumber VARCHAR(15) NOT NULL,
    RollNumberOrEmployeeCode VARCHAR(50),
    Department VARCHAR(100),
    BloodGroup VARCHAR(5) NOT NULL,
    EmergencyContact VARCHAR(15) NOT NULL,
    Address TEXT,
    RegistrationDate DATE NOT NULL,
    MemberType ENUM('Student', 'Faculty', 'Staff') NOT NULL,
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    
    -- Constraints
    CONSTRAINT chk_age CHECK (Age >= 16),
    CONSTRAINT chk_contact CHECK (ContactNumber REGEXP '^[0-9]{10,15}$')
);

CREATE TABLE Doctor (
    DoctorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Specialization VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL,
    LicenseNumber VARCHAR(50) NOT NULL UNIQUE,
    AvailableFrom TIME,
    AvailableTo TIME,
    WorkingDays VARCHAR(100),
    Status ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active',
    
    CONSTRAINT chk_doctor_time CHECK (AvailableTo > AvailableFrom)
);

CREATE TABLE StaffEmployee (EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role ENUM('Nurse', 'Pharmacist', 'Admin', 'Technician', 'Support Staff') NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL,
    ShiftTiming VARCHAR(50),
    HireDate DATE NOT NULL,
    LicenseNumber VARCHAR(50),
    Status ENUM('Active', 'On Leave', 'Resigned') DEFAULT 'Active'
);


CREATE TABLE Medicine (
    MedicineID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(200) NOT NULL,
    GenericName VARCHAR(200),
    Category VARCHAR(100) NOT NULL,
    Form ENUM('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other') NOT NULL,
    Manufacturer VARCHAR(200),
    UnitPrice DECIMAL(10,2) NOT NULL,
    RequiresPrescription BOOLEAN DEFAULT TRUE,
    Status ENUM('Available', 'Discontinued') DEFAULT 'Available',
    
    CONSTRAINT chk_price CHECK (UnitPrice >= 0)
);


CREATE TABLE MedicalSupplier (
    SupplierID INT AUTO_INCREMENT PRIMARY KEY,
    CompanyName VARCHAR(200) NOT NULL,
    ContactPerson VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    AlternatePhone VARCHAR(15),
    Address TEXT NOT NULL,
    City VARCHAR(100),
    State VARCHAR(100),
    PinCode VARCHAR(10),
    GSTNumber VARCHAR(15),
    LicenseNumber VARCHAR(50) NOT NULL,
    SupplyCategory VARCHAR(200),
    Rating DECIMAL(3,2) DEFAULT 0.00,
    ContractStartDate DATE,
    ContractEndDate DATE,
    PaymentTerms VARCHAR(100),
    Status ENUM('Active', 'Inactive', 'Blacklisted') DEFAULT 'Active',
    RegisteredDate DATE DEFAULT (CURDATE()),
    LastSupplyDate DATE,
    
    CONSTRAINT chk_supplier_rating CHECK (Rating >= 0 AND Rating <= 5),
    CONSTRAINT chk_supplier_contract CHECK (
        ContractEndDate IS NULL OR 
        ContractStartDate IS NULL OR 
        ContractEndDate > ContractStartDate
    )
);

CREATE TABLE MedicalHistory (
    HistoryID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    ChronicConditions TEXT,
    KnownAllergies TEXT NOT NULL,
    PastSurgeries TEXT,
    FamilyHistory TEXT,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    BloodPressure VARCHAR(20),
    Height DECIMAL(5,2),
    Weight DECIMAL(5,2),
    
    CONSTRAINT fk_medical_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

CREATE TABLE Appointment (
    AppointmentID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    DoctorID INT NOT NULL,
    AppointmentDate DATE NOT NULL,
    AppointmentTime TIME NOT NULL,
    Symptoms TEXT,
    Status ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') 
        DEFAULT 'Scheduled' NOT NULL,
    Priority ENUM('Normal', 'Urgent', 'Emergency') 
        DEFAULT 'Normal' NOT NULL,
    TokenNumber INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appt_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT fk_appt_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);



CREATE TABLE Inventory (
    InventoryID INT AUTO_INCREMENT PRIMARY KEY,
    MedicineID INT NOT NULL,
    BatchNumber VARCHAR(50) NOT NULL,
    Quantity INT NOT NULL,
    ManufactureDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    Location VARCHAR(100) NOT NULL,
    SupplierID INT,
    PurchaseDate DATE,
    PurchasePrice DECIMAL(10,2),
    ReorderLevel INT NOT NULL DEFAULT 10,
    MinimumStock INT NOT NULL DEFAULT 5,
    Status ENUM('Available', 'Reserved', 'Expired', 'Damaged') DEFAULT 'Available',
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_inv_medicine FOREIGN KEY (MedicineID) 
        REFERENCES Medicine(MedicineID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_inv_supplier FOREIGN KEY (SupplierID) 
        REFERENCES MedicalSupplier(SupplierID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_inv_quantity CHECK (Quantity >= 0),
    CONSTRAINT chk_inv_dates CHECK (ExpiryDate > ManufactureDate),
    CONSTRAINT chk_inv_price CHECK (PurchasePrice >= 0),
    CONSTRAINT chk_inv_reorder CHECK (ReorderLevel > 0 AND MinimumStock > 0),
    CONSTRAINT uq_batch_medicine UNIQUE (MedicineID, BatchNumber)
);

CREATE TABLE Visit (
    VisitID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    DoctorID INT NOT NULL,
    AppointmentID INT,
    VisitDate DATE NOT NULL,
    VisitTime TIME NOT NULL,
    ChiefComplaint TEXT NOT NULL,
    Diagnosis TEXT,
    VitalSigns JSON,
    TreatmentNotes TEXT,
    FollowUpRequired BOOLEAN DEFAULT FALSE,
    FollowUpDate DATE,
    VisitType ENUM('Walk-in', 'Scheduled', 'Emergency') NOT NULL,
    Status ENUM('In Progress', 'Completed', 'Referred') DEFAULT 'In Progress',
    
    CONSTRAINT fk_visit_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_visit_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_visit_appt FOREIGN KEY (AppointmentID) 
        REFERENCES Appointment(AppointmentID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_followup_date CHECK (FollowUpDate IS NULL OR FollowUpDate > VisitDate)
);

CREATE TABLE Prescription (
    PrescriptionID INT AUTO_INCREMENT PRIMARY KEY,
    VisitID INT NOT NULL,
    MemberID INT NOT NULL,
    DoctorID INT NOT NULL,
    IssueDate DATE NOT NULL,
    ValidUntil DATE NOT NULL,
    Diagnosis TEXT NOT NULL,
    SpecialInstructions TEXT,
    Status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    
    CONSTRAINT fk_presc_visit FOREIGN KEY (VisitID) 
        REFERENCES Visit(VisitID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_presc_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_presc_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_presc_validity CHECK (ValidUntil > IssueDate)
);

CREATE TABLE PrescriptionItem (
    PrescriptionItemID INT AUTO_INCREMENT PRIMARY KEY,
    PrescriptionID INT NOT NULL,
    MedicineID INT NOT NULL,
    Dosage VARCHAR(100) NOT NULL,
    Frequency VARCHAR(100) NOT NULL,
    Duration VARCHAR(50) NOT NULL,
    Quantity INT NOT NULL,
    Instructions TEXT,
    
    CONSTRAINT fk_prescitem_presc FOREIGN KEY (PrescriptionID) 
        REFERENCES Prescription(PrescriptionID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_prescitem_medicine FOREIGN KEY (MedicineID) 
        REFERENCES Medicine(MedicineID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_prescitem_quantity CHECK (Quantity > 0)
);

CREATE TABLE MedicineDispense (
    DispenseID INT AUTO_INCREMENT PRIMARY KEY,
    PrescriptionID INT NOT NULL,
    PrescriptionItemID INT NOT NULL,
    MedicineID INT NOT NULL,
    InventoryID INT NOT NULL,
    QuantityDispensed INT NOT NULL,
    DispensedBy INT NOT NULL,
    DispenseDate DATE NOT NULL,
    DispenseTime TIME NOT NULL,
    BatchNumber VARCHAR(50),
    UnitPrice DECIMAL(10,2) NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    
    CONSTRAINT fk_dispense_presc FOREIGN KEY (PrescriptionID) 
        REFERENCES Prescription(PrescriptionID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_prescitem FOREIGN KEY (PrescriptionItemID) 
        REFERENCES PrescriptionItem(PrescriptionItemID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_medicine FOREIGN KEY (MedicineID) 
        REFERENCES Medicine(MedicineID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_inventory FOREIGN KEY (InventoryID) 
        REFERENCES Inventory(InventoryID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_staff FOREIGN KEY (DispensedBy) 
        REFERENCES StaffEmployee(EmployeeID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_dispense_quantity CHECK (QuantityDispensed > 0),
    CONSTRAINT chk_dispense_price CHECK (UnitPrice >= 0 AND TotalPrice >= 0)
);

CREATE TABLE BillPayment (
    BillID INT AUTO_INCREMENT PRIMARY KEY,
    VisitID INT NOT NULL,
    BillDate DATE NOT NULL,
    BillTime TIME NOT NULL,
    
   
    ConsultationFee DECIMAL(10,2) DEFAULT 0.00,
    MedicineCost DECIMAL(10,2) DEFAULT 0.00,
    LabTestCost DECIMAL(10,2) DEFAULT 0.00,
    OtherCharges DECIMAL(10,2) DEFAULT 0.00,
    SubTotal DECIMAL(10,2) NOT NULL,
    DiscountAmount DECIMAL(10,2) DEFAULT 0.00,
    TaxAmount DECIMAL(10,2) DEFAULT 0.00,
    TotalAmount DECIMAL(10,2) NOT NULL,
    
    
    PaymentMethod ENUM('Cash', 'Card', 'UPI', 'Insurance', 'Free') NOT NULL,
    PaymentStatus ENUM('Paid', 'Pending', 'Partially Paid', 'Waived') DEFAULT 'Pending' NOT NULL,
    TransactionID VARCHAR(100),
    PaidAmount DECIMAL(10,2) DEFAULT 0.00,
    BalanceAmount DECIMAL(10,2) DEFAULT 0.00,
    
    BilledBy INT,
    Remarks TEXT,
    
    CONSTRAINT fk_bill_visit FOREIGN KEY (VisitID) 
        REFERENCES Visit(VisitID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_bill_staff FOREIGN KEY (BilledBy) 
        REFERENCES StaffEmployee(EmployeeID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_bill_amounts CHECK (
        SubTotal >= 0 AND 
        TotalAmount >= 0 AND 
        DiscountAmount >= 0 AND 
        TaxAmount >= 0 AND
        PaidAmount >= 0 AND
        BalanceAmount >= 0
    ),
    CONSTRAINT chk_bill_total CHECK (TotalAmount = SubTotal - DiscountAmount + TaxAmount)
);

CREATE TABLE EmergencyCase (
    EmergencyID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    DoctorID INT,
    AttendingStaffID INT NOT NULL,
    VisitID INT,
    
    IncidentDateTime DATETIME NOT NULL,
    ReportedBy VARCHAR(100),
    Location VARCHAR(200) NOT NULL,
    
    Severity ENUM('Critical', 'High', 'Moderate', 'Low') NOT NULL,
    Symptoms TEXT NOT NULL,
    VitalSignsAtArrival JSON,
    
    FirstAidGiven TEXT,
    ActionTaken TEXT NOT NULL,
    MedicationAdministered TEXT,
    
    Outcome ENUM('Stabilized', 'Referred to Hospital', 'Admitted', 'Discharged', 'Fatal') NOT NULL,
    ReferredToHospital VARCHAR(200),
    AmbulanceUsed BOOLEAN DEFAULT FALSE,
    AmbulanceArrivalTime DATETIME,
    
    ResolvedDateTime DATETIME,
    FollowUpRequired BOOLEAN DEFAULT FALSE,
    
    CriticalNotes TEXT,
    Status ENUM('Active', 'Resolved', 'Under Observation') DEFAULT 'Active',
    
    CONSTRAINT fk_emerg_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_emerg_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT fk_emerg_staff FOREIGN KEY (AttendingStaffID) 
        REFERENCES StaffEmployee(EmployeeID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_emerg_visit FOREIGN KEY (VisitID) 
        REFERENCES Visit(VisitID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_emerg_resolution CHECK (
        ResolvedDateTime IS NULL OR 
        ResolvedDateTime > IncidentDateTime
    ),
    CONSTRAINT chk_emerg_ambulance CHECK (
        AmbulanceArrivalTime IS NULL OR 
        AmbulanceArrivalTime >= IncidentDateTime
    )
);


-- Doctor

-- Appointment

-- Visit

-- Prescription

-- PrescriptionItem

-- Medicine

-- Inventory

-- MedicineDispense

-- BillPayment

-- MedicalSupplier

-- EmergencyCase



-- ─── DoctorSchedule (from doctor_schedule_migration.sql) ────────────────────
CREATE TABLE IF NOT EXISTS DoctorSchedule (
    ScheduleID  INT AUTO_INCREMENT PRIMARY KEY,
    DoctorID    INT NOT NULL,
    DayOfWeek   ENUM('Monday','Tuesday','Wednesday','Thursday',
                     'Friday','Saturday','Sunday') NOT NULL,
    StartTime   TIME NOT NULL,
    EndTime     TIME NOT NULL,
    IsActive    BOOLEAN DEFAULT TRUE,
    UNIQUE KEY uq_doctor_day (DoctorID, DayOfWeek)
) ENGINE=InnoDB;

-- ─── Auth tables (from auth-system.sql) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS SuperAdmin (
    SuperAdminID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Active', 'Inactive') DEFAULT 'Active'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS SystemRole (
    RoleID INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS UserLogin (
    UserLoginID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL DEFAULT 'CHANGEME',
    EntityType ENUM('Member', 'Doctor', 'Staff', 'SuperAdmin') NOT NULL,
    EntityID INT NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    LastLogin TIMESTAMP NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS UserRoleMapping (
    MappingID INT AUTO_INCREMENT PRIMARY KEY,
    UserLoginID INT NOT NULL,
    RoleID INT NOT NULL,
    AssignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── ShardMetadata ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ShardMetadata (
    Key_ VARCHAR(50) PRIMARY KEY,
    Value_ VARCHAR(100) NOT NULL,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SELECT 'Schema created successfully' AS Status;
