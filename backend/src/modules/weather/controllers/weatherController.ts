import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { t } from '../../../shared/i18n';
import { requirePremium } from '../../auth/middleware/requirePremium';
import { currentWeatherSchema, forecastSchema } from '../dto/weatherSchemas';
import { getCurrentWeather, getForecast } from '../services/weatherService';

export async function getCurrent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = currentWeatherSchema.parse(req.query);
    const data = await getCurrentWeather(dto.lat, dto.lng);
    if (!data) {
      const locale = (req.headers['x-locale'] as 'ar' | 'en') || 'ar';
      next(new AppError('notFound', 404, t(locale, 'errors.generic')));
      return;
    }
    res.status(200).json({ weather: data });
  } catch (err) {
    next(err);
  }
}

export async function getForecastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = forecastSchema.parse(req.query);
    const data = await getForecast(dto.lat, dto.lng, dto.days);
    res.status(200).json({ forecast: data });
  } catch (err) {
    next(err);
  }
}

// Middleware composition helper for premium-only forecast
export const premiumForecast = [requirePremium, getForecastHandler];
