-- Optionnel — Production uniquement.
-- A executer APRES `prisma migrate deploy` si l'extension TimescaleDB est installee.
-- Convertit la table `mesures` en hypertable partitionnee par temps.

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- La cle primaire doit inclure la colonne de partitionnement pour une hypertable.
-- Si besoin, adapter selon votre migration Prisma.
SELECT create_hypertable('mesures', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);

-- Politique de retention exemple : conserver 1 an de mesures fines.
-- SELECT add_retention_policy('mesures', INTERVAL '365 days');
