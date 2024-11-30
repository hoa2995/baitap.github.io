CREATE DATABASE ktx_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ktx_management;

CREATE TABLE buildings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    number VARCHAR(10) NOT NULL,
    building_id INT NOT NULL,
    max_occupants INT NOT NULL,
    current_occupants INT DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

CREATE TABLE registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    student_faculty VARCHAR(100) NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Thêm dữ liệu mẫu cho buildings
INSERT INTO buildings (name) VALUES ('A'), ('B'), ('C');

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    registration_id INT,
    amount DECIMAL(10,2),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    semester VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (registration_id) REFERENCES registrations(id)
);