import { provideALTranslate } from '@angular-libs/translate';
import en from './en.json';
import nb from './nb.json';

export const RETURN_APPS_LANG_KEY = 'return-apps-lang';

export type ReturnAppsLang = 'en' | 'nb';

export function detectReturnAppsLang(): ReturnAppsLang {
  try {
    const saved = localStorage.getItem(RETURN_APPS_LANG_KEY);
    if (saved === 'nb' || saved === 'en') {
      return saved;
    }
  } catch {
    /* private mode / SSR */
  }
  const nav =
    typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
  return nav.startsWith('nb') || nav.startsWith('nn') || nav.startsWith('no') ? 'nb' : 'en';
}

export function persistReturnAppsLang(lang: string): void {
  try {
    localStorage.setItem(RETURN_APPS_LANG_KEY, lang === 'nb' ? 'nb' : 'en');
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'nb' ? 'nb' : 'en';
  }
}

export function dictionaryForLang(lang: string) {
  return lang === 'nb' ? nb : en;
}

/** Shared en/nb translations for every return-app SPA. */
export function provideReturnI18n() {
  const defaultLang = detectReturnAppsLang();
  persistReturnAppsLang(defaultLang);
  return provideALTranslate({
    defaultLang,
    loader: async (lang) => dictionaryForLang(lang),
    fallbackData: en,
    blockBootstrap: true,
    plugins: [
      {
        name: 'persist-lang',
        onLangChange: ({ lang }) => persistReturnAppsLang(lang),
      },
    ],
  });
}
