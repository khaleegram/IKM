/**
 * Northern Nigerian Waybill Parks
 * Major bus parks used for inter-state deliveries
 */

export interface Park {
  id: string;
  name: string;
  city: string;
  state: string;
  isActive: boolean;
}

export const NORTHERN_PARKS: Park[] = [
  // Kano Parks
  {
    id: "naibawa",
    name: "Naibawa Park",
    city: "Kano",
    state: "Kano",
    isActive: true
  },
  {
    id: "mariri",
    name: "Mariri Park",
    city: "Kano",
    state: "Kano",
    isActive: true
  },
  {
    id: "unguwa-uku",
    name: "Unguwa Uku Park",
    city: "Kano",
    state: "Kano",
    isActive: true
  },
  
  // Kaduna Parks
  {
    id: "mando",
    name: "Mando Park",
    city: "Kaduna",
    state: "Kaduna",
    isActive: true
  },
  {
    id: "command",
    name: "Command Park",
    city: "Kaduna",
    state: "Kaduna",
    isActive: true
  },
  {
    id: "television",
    name: "Television Park",
    city: "Kaduna",
    state: "Kaduna",
    isActive: true
  },
  
  // Abuja Parks
  {
    id: "jabi",
    name: "Jabi Park",
    city: "Abuja",
    state: "FCT",
    isActive: true
  },
  {
    id: "utako",
    name: "Utako Park",
    city: "Abuja",
    state: "FCT",
    isActive: true
  },
  {
    id: "zuba",
    name: "Zuba Park",
    city: "Abuja",
    state: "FCT",
    isActive: true
  }
];

/**
 * Get parks by city
 */
export function getParksByCity(city: string): Park[] {
  return NORTHERN_PARKS.filter(park => 
    park.city.toLowerCase() === city.toLowerCase() && park.isActive
  );
}

/**
 * Get all active parks
 */
export function getActiveParks(): Park[] {
  return NORTHERN_PARKS.filter(park => park.isActive);
}

/**
 * Get park by ID
 */
export function getParkById(id: string): Park | undefined {
  return NORTHERN_PARKS.find(park => park.id === id);
}

