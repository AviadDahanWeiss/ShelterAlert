import type { AttendeeMapping } from '@/types';

const MAPPING_KEY = 'shelteralert_mapping_v1';

export function saveMappings(mappings: AttendeeMapping[]): void {
  try {
    localStorage.setItem(MAPPING_KEY, JSON.stringify(mappings));
  } catch {
    console.warn('[ShelterAlert] localStorage write failed (quota exceeded?)');
  }
}

export function loadMappings(): AttendeeMapping[] {
  try {
    const raw = localStorage.getItem(MAPPING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AttendeeMapping[];
  } catch {
    return [];
  }
}

export function clearMappings(): void {
  try {
    localStorage.removeItem(MAPPING_KEY);
  } catch {
    // ignore
  }
}
