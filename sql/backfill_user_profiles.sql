USE training_academy;

-- Backfill automatique des profils metier a partir des users existants.
-- Ne modifie pas la table users. Insere uniquement dans etudiants / enseignants si manquant.

START TRANSACTION;

INSERT INTO etudiants (nom, prenom, adresse, dob, phone)
SELECT
  u.nom,
  u.prenom,
  u.adresse,
  NULL,
  COALESCE(u.phone, '')
FROM users u
LEFT JOIN etudiants e
  ON e.nom = u.nom
 AND e.prenom = u.prenom
 AND e.phone = COALESCE(u.phone, '')
WHERE u.role = 'etudiant'
  AND u.nom IS NOT NULL AND u.nom <> ''
  AND u.prenom IS NOT NULL AND u.prenom <> ''
  AND e.id IS NULL;

INSERT INTO enseignants (nom, prenom, adresse, dob, phone)
SELECT
  u.nom,
  u.prenom,
  u.adresse,
  NULL,
  COALESCE(u.phone, '')
FROM users u
LEFT JOIN enseignants e
  ON e.nom = u.nom
 AND e.prenom = u.prenom
 AND e.phone = COALESCE(u.phone, '')
WHERE u.role = 'enseignant'
  AND u.nom IS NOT NULL AND u.nom <> ''
  AND u.prenom IS NOT NULL AND u.prenom <> ''
  AND e.id IS NULL;

COMMIT;

SELECT COUNT(*) AS nb_etudiants FROM etudiants;
SELECT COUNT(*) AS nb_enseignants FROM enseignants;
