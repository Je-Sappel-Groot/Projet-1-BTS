USE training_academy;

-- Migration one-shot: note liee a session (au lieu de cours) + note /20
-- A executer une seule fois sur une base existante.

START TRANSACTION;

-- 1) Ajoute la colonne id_session (temporairement nullable)
ALTER TABLE note
  ADD COLUMN id_session INT NULL AFTER id_etudiant;

-- 2) Garantit qu'il existe au moins 1 session pour chaque cours present dans note
INSERT INTO sessions (id_cours, date_debut, date_fin, archivee)
SELECT DISTINCT n.id_cours, CURDATE(), CURDATE(), 0
FROM note n
LEFT JOIN sessions s ON s.id_cours = n.id_cours
WHERE s.id IS NULL;

-- 3) Mappe les anciennes notes cours -> 1ere session du cours
UPDATE note n
JOIN (
  SELECT id_cours, MIN(id) AS id_session
  FROM sessions
  GROUP BY id_cours
) s ON s.id_cours = n.id_cours
SET n.id_session = s.id_session
WHERE n.id_session IS NULL;

-- 4) Dedoublonne (si plusieurs notes etudiant/session, on garde la plus recente)
DELETE n1
FROM note n1
JOIN note n2
  ON n1.id < n2.id
 AND n1.id_etudiant = n2.id_etudiant
 AND n1.id_session = n2.id_session;

-- 5) Supprime l'ancienne FK + colonne id_cours
ALTER TABLE note DROP FOREIGN KEY fk_note_cours;
ALTER TABLE note DROP COLUMN id_cours;

-- 6) Convertit la note en decimal /20 + contraintes finales
ALTER TABLE note
  MODIFY COLUMN id_session INT NOT NULL,
  MODIFY COLUMN note DECIMAL(5,2) NOT NULL;

ALTER TABLE note
  ADD CONSTRAINT fk_note_session
    FOREIGN KEY (id_session) REFERENCES sessions(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE note
  ADD UNIQUE KEY uk_note_etudiant_session (id_etudiant, id_session);

COMMIT;
