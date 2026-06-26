import { query } from '../../../config/database';

export interface SpeciesRow {
  id: string;
  scientific_name: string;
  english_name: string | null;
  arabic_name: string | null;
  egyptian_slang_names: string[];
  family: string | null;
  category: string | null;
  water_bodies: string[];
  description: string | null;
  habitat: string | null;
  average_weight_kg: number | null;
  image_url: string | null;
  conservation_status: string;
}

export async function findSpeciesById(id: string): Promise<SpeciesRow | null> {
  const result = await query<SpeciesRow>('SELECT * FROM species WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

export async function searchSpecies(
  searchTerm: string,
  limit: number = 20,
  offset: number = 0
): Promise<SpeciesRow[]> {
  const term = `%${searchTerm.toLowerCase()}%`;
  const result = await query<SpeciesRow>(
    `SELECT *
     FROM species
     WHERE
       LOWER(scientific_name) LIKE $1
       OR LOWER(english_name) LIKE $1
       OR LOWER(arabic_name) LIKE $1
       OR EXISTS (
         SELECT 1 FROM unnest(egyptian_slang_names) AS slang
         WHERE LOWER(slang) LIKE $1
       )
     ORDER BY english_name NULLS LAST
     LIMIT $2 OFFSET $3`,
    [term, limit, offset]
  );
  return result.rows;
}

export async function listSpecies(
  limit: number = 50,
  offset: number = 0
): Promise<SpeciesRow[]> {
  const result = await query<SpeciesRow>(
    'SELECT * FROM species ORDER BY english_name NULLS LAST LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}
