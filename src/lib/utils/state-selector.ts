/**
 * State selector utilities with fallbacks and normalization
 * Handles common variations like FCT = Abuja, etc.
 */

import { getAllStateNames } from '@/lib/data/nigerian-locations';

// State name aliases and fallbacks (common variations)
const STATE_ALIASES: Record<string, string> = {
  'fct': 'FCT (Abuja)',
  'abuja': 'FCT (Abuja)',
  'federal capital territory': 'FCT (Abuja)',
  'lagos state': 'Lagos',
  'rivers state': 'Rivers',
  'kaduna state': 'Kaduna',
  'kano state': 'Kano',
  'oyo state': 'Oyo',
  'enugu state': 'Enugu',
  'delta state': 'Delta',
  'imo state': 'Imo',
  'anambra state': 'Anambra',
  'abia state': 'Abia',
  'akwa ibom': 'Akwa Ibom',
  'cross river': 'Cross River',
  'ebonyi state': 'Ebonyi',
  'edo state': 'Edo',
  'ekiti state': 'Ekiti',
  'gombe state': 'Gombe',
  'jigawa state': 'Jigawa',
  'kebbi state': 'Kebbi',
  'kwara state': 'Kwara',
  'nasarawa state': 'Nasarawa',
  'niger state': 'Niger',
  'ogun state': 'Ogun',
  'ondo state': 'Ondo',
  'osun state': 'Osun',
  'plateau state': 'Plateau',
  'sokoto state': 'Sokoto',
  'taraba state': 'Taraba',
  'yobe state': 'Yobe',
  'zamfara state': 'Zamfara',
  'adamawa state': 'Adamawa',
  'bauchi state': 'Bauchi',
  'benue state': 'Benue',
  'borno state': 'Borno',
};

/**
 * Normalize state name - handles aliases and variations
 */
export function normalizeStateName(input: string): string {
  if (!input) return '';
  
  const normalized = input.trim().toLowerCase();
  
  // Check aliases first
  if (STATE_ALIASES[normalized]) {
    return STATE_ALIASES[normalized];
  }
  
  // Check exact match (case-insensitive)
  const allStates = getAllStateNames();
  const exactMatch = allStates.find(state => state.toLowerCase() === normalized);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Check partial match (contains)
  const partialMatch = allStates.find(state => 
    state.toLowerCase().includes(normalized) || 
    normalized.includes(state.toLowerCase())
  );
  if (partialMatch) {
    return partialMatch;
  }
  
  // Return original if no match found
  return input;
}

/**
 * Get all states for dropdown/search
 */
export function getAllStates(): string[] {
  return getAllStateNames();
}

/**
 * Search states by query
 */
export function searchStates(query: string): string[] {
  if (!query) return getAllStates();
  
  const normalizedQuery = query.toLowerCase().trim();
  const allStates = getAllStates();
  
  // First, check if query matches an alias
  if (STATE_ALIASES[normalizedQuery]) {
    return [STATE_ALIASES[normalizedQuery]];
  }
  
  // Filter states that match the query
  return allStates.filter(state => 
    state.toLowerCase().includes(normalizedQuery) ||
    normalizedQuery.includes(state.toLowerCase())
  );
}

/**
 * Validate if a state name is valid (after normalization)
 */
export function isValidState(stateName: string): boolean {
  const normalized = normalizeStateName(stateName);
  return getAllStates().includes(normalized);
}

