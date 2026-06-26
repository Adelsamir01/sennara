import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { t } from '../../../shared/i18n';
import * as speciesRepo from '../repositories/speciesRepository';
import { z } from 'zod';

const listSchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

function publicSpecies(row: speciesRepo.SpeciesRow) {
  return {
    id: row.id,
    scientificName: row.scientific_name,
    englishName: row.english_name,
    arabicName: row.arabic_name,
    egyptianSlangNames: row.egyptian_slang_names,
    family: row.family,
    category: row.category,
    waterBodies: row.water_bodies,
    description: row.description,
    habitat: row.habitat,
    averageWeightKg: row.average_weight_kg,
    imageUrl: row.image_url,
    conservationStatus: row.conservation_status,
  };
}

export async function listSpecies(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = listSchema.parse(req.query);
    const species = dto.q
      ? await speciesRepo.searchSpecies(dto.q, dto.limit, dto.offset)
      : await speciesRepo.listSpecies(dto.limit, dto.offset);

    res.status(200).json({ species: species.map(publicSpecies) });
  } catch (err) {
    next(err);
  }
}

export async function getSpecies(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
    const row = await speciesRepo.findSpeciesById(req.params.id);
    if (!row) {
      next(new AppError('notFound', 404, t(locale, 'species.notFound')));
      return;
    }
    res.status(200).json({ species: publicSpecies(row) });
  } catch (err) {
    next(err);
  }
}
