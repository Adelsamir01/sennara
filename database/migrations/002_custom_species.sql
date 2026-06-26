-- Allow anglers to log catches with a free-text species name
-- when the species is not in the taxonomy list yet.

ALTER TABLE catches
ADD COLUMN IF NOT EXISTS custom_species_name VARCHAR(255);
