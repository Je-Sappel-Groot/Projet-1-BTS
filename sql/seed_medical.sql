USE training_academy;

-- Utilisateurs demo (mot de passe: P@ssw0rd!)
INSERT INTO users (username, email, password, nom, prenom, phone, adresse, role, status)
VALUES
('admin', 'admin@medical.tld', '$2b$10$1gk3yF2s0u7dDkuCzZkUOe8m2z9Xj4i5vVYy1O9I6o7e4Qw2TgD1a', 'Martin', 'Claire', '0611223344', '12 rue des Soins, Toulouse', 'admin', 'active'),
('formateur1', 'formateur1@medical.tld', '$2b$10$1gk3yF2s0u7dDkuCzZkUOe8m2z9Xj4i5vVYy1O9I6o7e4Qw2TgD1a', 'Durand', 'Lucas', '0611223355', '5 avenue du CHU, Toulouse', 'enseignant', 'active'),
('etudiant1', 'etudiant1@medical.tld', '$2b$10$1gk3yF2s0u7dDkuCzZkUOe8m2z9Xj4i5vVYy1O9I6o7e4Qw2TgD1a', 'Bernard', 'Lea', '0611223366', '18 rue Pasteur, Toulouse', 'etudiant', 'active');

-- Etudiants
INSERT INTO etudiants (nom, prenom, adresse, dob, phone) VALUES
('Bernard', 'Lea', '18 rue Pasteur, Toulouse', '2002-05-12', '0611223366'),
('Petit', 'Nina', '4 rue des Lilas, Toulouse', '2001-11-03', '0611223377'),
('Moreau', 'Adam', '10 chemin du Lac, Toulouse', '2000-02-21', '0611223388');

-- Enseignants
INSERT INTO enseignants (nom, prenom, adresse, dob, phone) VALUES
('Durand', 'Lucas', '5 avenue du CHU, Toulouse', '1985-09-08', '0611223355'),
('Martin', 'Hugo', '2 boulevard des Hopitaux, Toulouse', '1979-03-14', '0611223399');

-- Cours (formations)
INSERT INTO cours (nom, id_enseignant) VALUES
('Urgences medicales', 1),
('Soins infirmiers', 1),
('Imagerie medicale', 2),
('Hygiene hospitaliere', 2);

-- Notes (evaluations)
INSERT INTO note (id_etudiant, id_cours, note) VALUES
(1, 1, 15),
(2, 1, 13),
(3, 2, 16),
(1, 3, 14),
(2, 4, 17);

-- Contacts
INSERT INTO contacts (name, email, message) VALUES
('Sophie Laurent', 'sophie.laurent@mail.tld', 'Je souhaite des infos sur la formation urgences.'),
('Paul Renard', 'paul.renard@mail.tld', 'Quelles sont les dates de la prochaine session ?');
