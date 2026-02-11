DROP DATABASE IF EXISTS training_academy;
CREATE DATABASE training_academy CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE training_academy;

-- Utilisateurs
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','etudiant','enseignant','administratif') NOT NULL DEFAULT 'etudiant',
  status ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  nom VARCHAR(100) NULL,
  prenom VARCHAR(100) NULL,
  phone VARCHAR(30) NULL,
  adresse VARCHAR(255) NULL,
  lastLogin DATETIME NULL,
  resetPasswordToken VARCHAR(255) NULL,
  resetPasswordExpires DATETIME NULL
);

-- Etudiants
CREATE TABLE etudiants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  adresse VARCHAR(255) NULL,
  dob DATE NULL,
  phone VARCHAR(30) NULL
);

-- Enseignants
CREATE TABLE enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  adresse VARCHAR(255) NULL,
  dob DATE NULL,
  phone VARCHAR(30) NULL
);

-- Cours (formations)
CREATE TABLE cours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  id_enseignant INT NOT NULL,
  CONSTRAINT fk_cours_enseignant
    FOREIGN KEY (id_enseignant) REFERENCES enseignants(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Notes (evaluations)
CREATE TABLE note (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_etudiant INT NOT NULL,
  id_cours INT NOT NULL,
  note FLOAT NOT NULL,
  CONSTRAINT fk_note_etudiant
    FOREIGN KEY (id_etudiant) REFERENCES etudiants(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_note_cours
    FOREIGN KEY (id_cours) REFERENCES cours(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Contacts
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NULL
);
