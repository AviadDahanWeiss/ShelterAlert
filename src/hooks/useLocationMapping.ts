'use client';

import { useState, useEffect } from 'react';
import { loadMappings, saveMappings, clearMappings } from '@/lib/storage';
import type { AttendeeMapping } from '@/types';

interface UseLocationMappingReturn {
  mappings: AttendeeMapping[];
  /** Add a single new entry, or overwrite existing entry with same email. */
  addOrUpdateMapping: (m: AttendeeMapping) => void;
  /** Merge an array of entries into the existing mapping (incoming wins on collision). */
  mergeMappings: (incoming: AttendeeMapping[]) => void;
  /** Completely replace the mapping with a new array. */
  replaceMappings: (incoming: AttendeeMapping[]) => void;
  /** Edit a specific entry by email key. */
  editMapping: (email: string, updated: AttendeeMapping) => void;
  /** Remove a single entry by email. */
  deleteMapping: (email: string) => void;
  clearAll: () => void;
}

export function useLocationMapping(): UseLocationMappingReturn {
  const [mappings, setMappings] = useState<AttendeeMapping[]>([]);

  useEffect(() => {
    setMappings(loadMappings());
  }, []);

  const persist = (next: AttendeeMapping[]) => {
    setMappings(next);
    saveMappings(next);
  };

  const addOrUpdateMapping = (m: AttendeeMapping) => {
    const map = new Map(mappings.map((x) => [x.email.toLowerCase(), x]));
    map.set(m.email.toLowerCase(), { ...m, email: m.email.toLowerCase().trim() });
    persist(Array.from(map.values()));
  };

  const mergeMappings = (incoming: AttendeeMapping[]) => {
    const map = new Map(mappings.map((x) => [x.email.toLowerCase(), x]));
    incoming.forEach((m) => map.set(m.email.toLowerCase(), { ...m, email: m.email.toLowerCase().trim() }));
    persist(Array.from(map.values()));
  };

  const replaceMappings = (incoming: AttendeeMapping[]) => {
    persist(incoming.map((m) => ({ ...m, email: m.email.toLowerCase().trim() })));
  };

  const editMapping = (originalEmail: string, updated: AttendeeMapping) => {
    const next = mappings.map((m) =>
      m.email === originalEmail.toLowerCase()
        ? { ...updated, email: updated.email.toLowerCase().trim() }
        : m
    );
    persist(next);
  };

  const deleteMapping = (email: string) => {
    persist(mappings.filter((m) => m.email !== email.toLowerCase()));
  };

  const clearAll = () => {
    setMappings([]);
    clearMappings();
  };

  return {
    mappings,
    addOrUpdateMapping,
    mergeMappings,
    replaceMappings,
    editMapping,
    deleteMapping,
    clearAll,
  };
}
