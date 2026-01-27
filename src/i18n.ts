import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'id'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  
  let locale: Locale = defaultLocale;
  
  // Check cookie first
  const cookieLocale = cookieStore.get('locale')?.value as Locale;
  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    // Check Accept-Language header
    const acceptLanguage = headerStore.get('accept-language');
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',')[0]?.split('-')[0];
      if (preferred && locales.includes(preferred as Locale)) {
        locale = preferred as Locale;
      }
    }
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
