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

-- Cours
CREATE TABLE cours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  id_enseignant INT NOT NULL,
  CONSTRAINT fk_cours_enseignant
    FOREIGN KEY (id_enseignant) REFERENCES enseignants(id)
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

-- Sessions
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cours INT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  archivee TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_sessions_cours
    FOREIGN KEY (id_cours) REFERENCES cours(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Notes (sur sessions, note /20)
CREATE TABLE note (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_etudiant INT NOT NULL,
  id_session INT NOT NULL,
  note DECIMAL(5,2) NOT NULL,
  UNIQUE KEY uk_note_etudiant_session (id_etudiant, id_session),
  CONSTRAINT fk_note_etudiant
    FOREIGN KEY (id_etudiant) REFERENCES etudiants(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_note_session
    FOREIGN KEY (id_session) REFERENCES sessions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Inscriptions
CREATE TABLE inscription (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_session INT NOT NULL,
  id_etudiant INT NOT NULL,
  UNIQUE KEY uk_inscription_session_etudiant (id_session, id_etudiant),
  CONSTRAINT fk_inscription_session
    FOREIGN KEY (id_session) REFERENCES sessions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inscription_etudiant
    FOREIGN KEY (id_etudiant) REFERENCES etudiants(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
