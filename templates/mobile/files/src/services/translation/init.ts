import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import {z} from 'zod'
import en from './en.json'
import es from './es.json'
import ptBR from './pt-BR.json'

export const SUPPORTED_LOCALES = ['en', 'es', 'pt-BR'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const resources = {
  en: {translation: en},
  es: {translation: es},
  'pt-BR': {translation: ptBR}
} as const

export const isSupportedLocale = (locale: string): locale is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(locale)

// Zod's built-in messages follow the app language. Custom schema messages are i18n keys.
const ZOD_LOCALES = {
  en: z.locales.en,
  es: z.locales.es,
  'pt-BR': z.locales.ptBR
} satisfies Record<SupportedLocale, () => unknown>

const applyZodLocale = (locale: string) =>
  z.config(ZOD_LOCALES[isSupportedLocale(locale) ? locale : DEFAULT_LOCALE]())

i18n.on('languageChanged', applyZodLocale)

// TODO(init): resolve the device locale with react-native-localize (Bare) or
// expo-localization (Expo) and pass it here; fall back to DEFAULT_LOCALE.
export const initI18n = (locale: SupportedLocale = DEFAULT_LOCALE) =>
  i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {escapeValue: false}
  })
