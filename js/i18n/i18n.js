/**
 * i18n.js
 * Motor de internacionalización.
 * Detecta el idioma del navegador automáticamente.
 * Permite cambio manual guardado en sessionStorage.
 */

import { translations } from "./translations.js";

const SUPPORTED = ["es", "en", "de"];
const STORAGE_KEY = "lz_lang";

function safeGetStoredLang() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function detectLanguage() {
  const saved = safeGetStoredLang();
  if (saved && SUPPORTED.includes(saved)) return saved;

  const browserLang = (navigator.language || "es").slice(0, 2).toLowerCase();
  if (SUPPORTED.includes(browserLang)) return browserLang;

  return "es";
}

let currentLang = detectLanguage();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  currentLang = lang;

  try {
    sessionStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage opcional
  }
}

export function getSupportedLangs() {
  return SUPPORTED;
}

export function t(key) {
  const parts = key.split(".");
  let value = translations[currentLang];

  for (const part of parts) {
    if (!value || typeof value !== "object") return key;
    value = value[part];
  }

  return typeof value === "string" ? value : key;
}
