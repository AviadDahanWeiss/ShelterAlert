/**
 * Hebrew ↔ English area name lookup, sourced from:
 * https://github.com/eladnava/pikud-haoref-api/blob/master/cities.json
 *
 * The Pikud HaOref alerts API returns Hebrew area names exclusively.
 * This module lets users type area names in English (or Hebrew) and
 * normalises them to the canonical Hebrew string used in the alerts API.
 */

import Fuse from 'fuse.js';
import citiesRaw from './cities.json';

interface CityEntry {
  id: number;
  name: string;       // Hebrew — matches what alerts.json returns
  name_en: string;    // English
  value: string;
}

const cities = citiesRaw as CityEntry[];
const validCities = cities.filter((c) => c.name && c.value !== 'all');

// English (lowercased) → Hebrew name
const enToHe = new Map<string, string>();
// Hebrew → Hebrew (canonical, for exact match)
const heToHe = new Map<string, string>();

for (const city of validCities) {
  if (city.name_en) enToHe.set(city.name_en.toLowerCase().trim(), city.name);
  heToHe.set(city.name.trim(), city.name);
}

// Lazy Fuse instance for fuzzy Hebrew matching (handles spelling variants like
// קרית/קריית, common in Israeli city names).
let _hebrewFuse: Fuse<CityEntry> | null = null;
function getHebrewFuse() {
  if (!_hebrewFuse) {
    _hebrewFuse = new Fuse(validCities, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    });
  }
  return _hebrewFuse;
}

// Lazy Fuse for fuzzy English → Hebrew matching.
// Handles partial city names like "Beer Sheva" when cities.json only has
// sub-areas like "Beer Sheva - North", "Beer Sheva - South", etc.
let _englishFuse: Fuse<CityEntry> | null = null;
function getEnglishFuse() {
  if (!_englishFuse) {
    _englishFuse = new Fuse(validCities, {
      keys: ['name_en'],
      threshold: 0.35,
      includeScore: true,
    });
  }
  return _englishFuse;
}

// Hebrew character range
const HE_RANGE = /[\u05D0-\u05EA]/;

/**
 * Given a user-supplied area string (English or Hebrew),
 * return the canonical Hebrew area name used by the Pikud HaOref API.
 * Falls back to the original string if no match is found.
 */
export function toHebrewAreaName(area: string): string {
  const trimmed = area.trim();
  // Exact Hebrew match
  if (heToHe.has(trimmed)) return trimmed;
  // Exact English match (case-insensitive)
  const fromEn = enToHe.get(trimmed.toLowerCase());
  if (fromEn) return fromEn;
  // Fuzzy Hebrew match — handles common spelling variants (e.g. קרית/קריית)
  if (HE_RANGE.test(trimmed)) {
    const results = getHebrewFuse().search(trimmed);
    if (results[0] && (results[0].score ?? 1) < 0.25) {
      return results[0].item.name;
    }
  }
  // Fuzzy English match — handles "Beer Sheva" when cities.json only has
  // "Beer Sheva - North", "Beer Sheva - South", etc.  The prefix check in
  // safety.ts isAreaInAlert() will then match all sub-areas of that city.
  const enResults = getEnglishFuse().search(trimmed);
  if (enResults[0] && (enResults[0].score ?? 1) < 0.35) {
    return enResults[0].item.name;
  }
  // Return original — Fuse.js in safety.ts will still attempt a match
  return trimmed;
}

/**
 * Given a Hebrew area name from the alerts API,
 * return the English display name (or the Hebrew original if not found).
 */
export function toEnglishAreaName(hebrewArea: string): string {
  const city = cities.find((c) => c.name === hebrewArea);
  return city?.name_en || hebrewArea;
}

/** All English area names (for autocomplete / hints). */
export function allEnglishAreaNames(): string[] {
  return cities
    .filter((c) => c.name_en && c.value !== 'all')
    .map((c) => c.name_en);
}
