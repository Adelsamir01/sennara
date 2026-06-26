import ar from './ar.json';
import en from './en.json';

type Locale = 'ar' | 'en';
type Translations = typeof ar;

const translations: Record<Locale, Translations> = { ar, en };

export function t(
  locale: Locale,
  key: string,
  interpolations: Record<string, string | number> = {}
): string {
  const dict = translations[locale] || translations.ar;
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);

  if (typeof value !== 'string') {
    return key;
  }

  return value.replace(/\{\{(\w+)\}\}/g, (_match, token) =>
    String(interpolations[token] ?? `{{${token}}}`)
  );
}

export const defaultLocale: Locale = 'ar';
