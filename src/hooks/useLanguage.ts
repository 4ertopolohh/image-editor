import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, TRANSLATIONS } from '../constants/translations'
import type { Language, TranslationDictionary } from '../types/i18n'

interface UseLanguageResult {
  language: Language
  setLanguage: (language: Language) => void
  dictionary: TranslationDictionary
}

interface InitialLanguageState {
  language: Language
  hasPersistedPreference: boolean
}

const RUSSIAN_DEFAULT_COUNTRY_CODES = new Set(['RU', 'UA', 'BY', 'KZ'])
const IP_LOOKUP_TIMEOUT_MS = 2500

const isLanguage = (value: string | null): value is Language => value === 'ru' || value === 'en'

const getInitialLanguageState = (): InitialLanguageState => {
  if (typeof window === 'undefined') {
    return {
      language: DEFAULT_LANGUAGE,
      hasPersistedPreference: false,
    }
  }

  const persistedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isLanguage(persistedLanguage)) {
    return {
      language: persistedLanguage,
      hasPersistedPreference: true,
    }
  }

  return {
    language: DEFAULT_LANGUAGE,
    hasPersistedPreference: false,
  }
}

const getCountryCode = (payload: unknown): string | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null
  }

  const valueMap = payload as Record<string, unknown>
  const candidates = [valueMap.country_code, valueMap.countryCode, valueMap.country]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim().toUpperCase()
    }
  }

  return null
}

const fetchCountryCode = async (url: string, signal: AbortSignal): Promise<string | null> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new Error(`IP geo lookup failed with status ${response.status}`)
  }

  const payload = (await response.json()) as unknown
  return getCountryCode(payload)
}

const detectLanguageByIp = async (signal: AbortSignal): Promise<Language | null> => {
  const providers = ['https://ipwho.is/', 'https://ipapi.co/json/']

  for (const provider of providers) {
    try {
      const countryCode = await fetchCountryCode(provider, signal)
      if (!countryCode) {
        continue
      }

      return RUSSIAN_DEFAULT_COUNTRY_CODES.has(countryCode) ? 'ru' : 'en'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  return null
}

export const useLanguage = (): UseLanguageResult => {
  const [initialState] = useState<InitialLanguageState>(getInitialLanguageState)
  const [language, setLanguageState] = useState<Language>(initialState.language)
  const hasManualLanguageChangeRef = useRef<boolean>(false)

  const setLanguage = useCallback((nextLanguage: Language): void => {
    hasManualLanguageChangeRef.current = true
    setLanguageState(nextLanguage)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || initialState.hasPersistedPreference) {
      return
    }

    const abortController = new AbortController()
    const timeoutId = window.setTimeout(() => {
      abortController.abort()
    }, IP_LOOKUP_TIMEOUT_MS)

    void (async () => {
      try {
        const ipLanguage = await detectLanguageByIp(abortController.signal)
        if (!ipLanguage || hasManualLanguageChangeRef.current) {
          return
        }

        setLanguageState((currentLanguage) => (currentLanguage === ipLanguage ? currentLanguage : ipLanguage))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      } finally {
        window.clearTimeout(timeoutId)
      }
    })()

    return () => {
      window.clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [initialState.hasPersistedPreference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.lang = language
  }, [language])

  const dictionary = useMemo(() => TRANSLATIONS[language], [language])

  return { language, setLanguage, dictionary }
}
