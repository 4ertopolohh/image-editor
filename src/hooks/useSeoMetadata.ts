import { useEffect } from 'react'
import type { Language } from '../types/i18n'

interface LocalizedSeoMetadata {
  title: string
  description: string
  ogLocale: string
  appName: string
  ogImageAlt: string
}

const DEFAULT_SITE_ORIGIN = 'https://4ertopolohh.github.io'
const SEO_META_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const SITE_NAME = 'Nemida Studio Image Editor'
const SOCIAL_IMAGE_FILE_NAME = 'og-image.png'
const SOCIAL_IMAGE_TYPE = 'image/png'
const SOCIAL_IMAGE_WIDTH = '1200'
const SOCIAL_IMAGE_HEIGHT = '630'
const SUPPORTED_OG_LOCALES = ['en_US', 'ru_RU']

const SEO_METADATA: Record<Language, LocalizedSeoMetadata> = {
  en: {
    title: 'Photo Editor - Crop and Convert Images Online | Nemida Studio',
    description:
      'Free online photo editor to crop images, rotate, round corners, and export to PNG, JPG, WebP, or ICO.',
    ogLocale: 'en_US',
    appName: 'Nemida Studio Photo Editor',
    ogImageAlt: 'Nemida Studio online photo editor interface preview',
  },
  ru: {
    title: 'Фоторедактор онлайн - обрезка и экспорт PNG/JPG/WebP/ICO | Nemida Studio',
    description:
      'Бесплатный онлайн-фоторедактор для обрезки, поворота, скругления углов и экспорта изображений в PNG, JPG, WebP и ICO.',
    ogLocale: 'ru_RU',
    appName: 'Фоторедактор Nemida Studio',
    ogImageAlt: 'Превью интерфейса онлайн-фоторедактора Nemida Studio',
  },
}

const upsertMetaTag = (
  selector: string,
  attributes: Readonly<Record<string, string>>,
  content: string,
): void => {
  const existingMeta = document.head.querySelector<HTMLMetaElement>(selector)
  const metaTag = existingMeta ?? document.createElement('meta')

  if (!existingMeta) {
    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      metaTag.setAttribute(attributeName, attributeValue)
    })

    document.head.append(metaTag)
  }

  metaTag.setAttribute('content', content)
}

const resolveSiteOrigin = (): string => {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim()
  if (configuredSiteUrl) {
    try {
      return new URL(configuredSiteUrl).origin
    } catch {
      return DEFAULT_SITE_ORIGIN
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return DEFAULT_SITE_ORIGIN
}

const resolveCanonicalUrl = (): string => {
  const basePath = import.meta.env.BASE_URL
  const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`
  const canonicalPath = normalizedBasePath.endsWith('/') ? normalizedBasePath : `${normalizedBasePath}/`
  return new URL(canonicalPath, resolveSiteOrigin()).toString()
}

const resolveSocialImageUrl = (canonicalUrl: string): string => {
  return new URL(SOCIAL_IMAGE_FILE_NAME, canonicalUrl).toString()
}

const upsertCanonicalLink = (canonicalUrl: string): void => {
  const existingLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  const linkTag = existingLink ?? document.createElement('link')

  if (!existingLink) {
    linkTag.setAttribute('rel', 'canonical')
    document.head.append(linkTag)
  }

  linkTag.setAttribute('href', canonicalUrl)
}

const upsertJsonLdScript = (id: string, payload: object): void => {
  const selector = `script#${id}[type="application/ld+json"]`
  const existingScript = document.head.querySelector<HTMLScriptElement>(selector)
  const scriptTag = existingScript ?? document.createElement('script')

  if (!existingScript) {
    scriptTag.id = id
    scriptTag.type = 'application/ld+json'
    document.head.append(scriptTag)
  }

  scriptTag.textContent = JSON.stringify(payload)
}

const upsertStructuredData = (metadata: LocalizedSeoMetadata, canonicalUrl: string, socialImageUrl: string): void => {
  const organization = {
    '@type': 'Organization',
    name: 'Nemida Studio',
    url: 'https://t.me/NemidaStudio',
  }

  const webApplicationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: metadata.appName,
    url: canonicalUrl,
    description: metadata.description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    inLanguage: ['en', 'ru'],
    image: socialImageUrl,
    publisher: organization,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: ['Crop image', 'Rotate image', 'Round image corners', 'Export to PNG/JPG/WebP/ICO'],
  }

  const webSiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: canonicalUrl,
    description: metadata.description,
    inLanguage: ['en', 'ru'],
    publisher: organization,
  }

  upsertJsonLdScript('structured-data-webapp', webApplicationStructuredData)
  upsertJsonLdScript('structured-data-website', webSiteStructuredData)
}

const upsertAlternateLocaleTags = (activeLocale: string): void => {
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((metaTag) => {
    metaTag.remove()
  })

  SUPPORTED_OG_LOCALES.filter((locale) => locale !== activeLocale).forEach((alternateLocale) => {
    const metaTag = document.createElement('meta')
    metaTag.setAttribute('property', 'og:locale:alternate')
    metaTag.setAttribute('content', alternateLocale)
    document.head.append(metaTag)
  })
}

export const useSeoMetadata = (language: Language): void => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const metadata = SEO_METADATA[language]
    const canonicalUrl = resolveCanonicalUrl()
    const socialImageUrl = resolveSocialImageUrl(canonicalUrl)

    document.title = metadata.title
    document.documentElement.lang = language

    upsertMetaTag('meta[name="application-name"]', { name: 'application-name' }, metadata.appName)
    upsertMetaTag('meta[name="description"]', { name: 'description' }, metadata.description)
    upsertMetaTag('meta[name="robots"]', { name: 'robots' }, SEO_META_ROBOTS)
    upsertMetaTag('meta[name="googlebot"]', { name: 'googlebot' }, SEO_META_ROBOTS)
    upsertMetaTag('meta[property="og:type"]', { property: 'og:type' }, 'website')
    upsertMetaTag('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME)
    upsertMetaTag('meta[property="og:title"]', { property: 'og:title' }, metadata.title)
    upsertMetaTag('meta[property="og:description"]', { property: 'og:description' }, metadata.description)
    upsertMetaTag('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl)
    upsertMetaTag('meta[property="og:image"]', { property: 'og:image' }, socialImageUrl)
    upsertMetaTag('meta[property="og:image:type"]', { property: 'og:image:type' }, SOCIAL_IMAGE_TYPE)
    upsertMetaTag('meta[property="og:image:width"]', { property: 'og:image:width' }, SOCIAL_IMAGE_WIDTH)
    upsertMetaTag('meta[property="og:image:height"]', { property: 'og:image:height' }, SOCIAL_IMAGE_HEIGHT)
    upsertMetaTag('meta[property="og:image:alt"]', { property: 'og:image:alt' }, metadata.ogImageAlt)
    upsertMetaTag('meta[property="og:locale"]', { property: 'og:locale' }, metadata.ogLocale)
    upsertAlternateLocaleTags(metadata.ogLocale)
    upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, metadata.title)
    upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }, metadata.description)
    upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }, socialImageUrl)
    upsertMetaTag('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, metadata.ogImageAlt)

    upsertCanonicalLink(canonicalUrl)
    upsertStructuredData(metadata, canonicalUrl, socialImageUrl)
  }, [language])
}
