USE training_academy;

-- Donnees d'exemple pour sessions + inscriptions
-- Ce script n'ecrit QUE dans les tables `sessions` et `inscription`.

START TRANSACTION;

-- Session 1 liee au 1er cours existant
INSERT INTO sessions (id_cours, date_debut, date_fin, archivee)
SELECT c.id, '2026-04-08', '2026-04-12', 0
FROM (SELECT id FROM cours ORDER BY id LIMIT 1 OFFSET 0) c
WHERE NOT EXISTS (
  SELECT 1
  FROM sessions s
  WHERE s.id_cours = c.id
    AND s.date_debut = '2026-04-08'
    AND s.date_fin = '2026-04-12'
);

-- Session 2 liee au 2eme cours existant (si present)
INSERT INTO sessions (id_cours, date_debut, date_fin, archivee)
SELECT c.id, '2026-04-22', '2026-04-26', 0
FROM (SELECT id FROM cours ORDER BY id LIMIT 1 OFFSET 1) c
WHERE NOT EXISTS (
  SELECT 1
  FROM sessions s
  WHERE s.id_cours = c.id
    AND s.date_debut = '2026-04-22'
    AND s.date_fin = '2026-04-26'
);

-- Session 3 liee au 3eme cours existant (si present)
INSERT INTO sessions (id_cours, date_debut, date_fin, archivee)
SELECT c.id, '2026-05-06', '2026-05-10', 0
FROM (SELECT id FROM cours ORDER BY id LIMIT 1 OFFSET 2) c
WHERE NOT EXISTS (
  SELECT 1
  FROM sessions s
  WHERE s.id_cours = c.id
    AND s.date_debut = '2026-05-06'
    AND s.date_fin = '2026-05-10'
);

-- Inscriptions: lient les etudiants existants aux sessions creees ci-dessus
-- Utilise INSERT IGNORE pour eviter les doublons sur (id_session, id_etudiant)

INSERT IGNORE INTO inscription (id_session, id_etudiant)
SELECT s.id, e.id
FROM (SELECT id FROM sessions WHERE date_debut = '2026-04-08' ORDER BY id DESC LIMIT 1) s
JOIN (SELECT id FROM etudiants ORDER BY id LIMIT 1 OFFSET 0) e;

INSERT IGNORE INTO inscription (id_session, id_etudiant)
SELECT s.id, e.id
FROM (SELECT id FROM sessions WHERE date_debut = '2026-04-08' ORDER BY id DESC LIMIT 1) s
JOIN (SELECT id FROM etudiants ORDER BY id LIMIT 1 OFFSET 1) e;

INSERT IGNORE INTO inscription (id_session, id_etudiant)
SELECT s.id, e.id
FROM (SELECT id FROM sessions WHERE date_debut = '2026-04-22' ORDER BY id DESC LIMIT 1) s
JOIN (SELECT id FROM etudiants ORDER BY id LIMIT 1 OFFSET 1) e;

INSERT IGNORE INTO inscription (id_session, id_etudiant)
SELECT s.id, e.id
FROM (SELECT id FROM sessions WHERE date_debut = '2026-04-22' ORDER BY id DESC LIMIT 1) s
JOIN (SELECT id FROM etudiants ORDER BY id LIMIT 1 OFFSET 2) e;

INSERT IGNORE INTO inscription (id_session, id_etudiant)
SELECT s.id, e.id
FROM (SELECT id FROM sessions WHERE date_debut = '2026-05-06' ORDER BY id DESC LIMIT 1) s
JOIN (SELECT id FROM etudiants ORDER BY id LIMIT 1 OFFSET 0) e;

COMMIT;

-- Verification rapide
SELECT * FROM sessions ORDER BY id DESC LIMIT 10;
SELECT * FROM inscription ORDER BY id DESC LIMIT 20;
