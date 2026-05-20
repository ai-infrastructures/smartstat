/**
 * Point of Interest = a destination users can search and navigate to.
 */

export type PoiCategory =
  | "department"      // e.g., Cardiology, Oncology
  | "clinic"          // outpatient clinic
  | "room"            // specific room number
  | "counter"         // reception, info desk
  | "elevator"
  | "stairs"
  | "restroom"
  | "pharmacy"
  | "emergency"       // ER, emergency exit
  | "cafeteria"
  | "parking_entry"
  | "entrance"
  | "exit"
  | "other";

export interface PoiAccessibility {
  /** Reachable without using stairs */
  wheelchairAccessible: boolean;
  /** Has braille signage nearby */
  braille?: boolean;
  /** Has audio guidance / talking sign */
  audioGuidance?: boolean;
}

export interface PoiOpeningHours {
  /** Day 0=Sunday ... 6=Saturday */
  dayOfWeek: number;
  /** HH:MM 24h */
  openTime: string;
  /** HH:MM 24h */
  closeTime: string;
}

export interface Poi {
  id: string;
  floorId: string;
  /** Internal name (e.g., "Cardiology Department - Reception") */
  name: string;
  /** Public display name shown in search results */
  displayName: string;
  /** Comma-separated keywords / synonyms for search (e.g., "heart, cardiac, ECG") */
  searchKeywords: string[];
  category: PoiCategory;
  /** Position in floor coordinates (meters), x = east, y = north, z = up from floor level */
  position: { x: number; y: number; z: number };
  accessibility: PoiAccessibility;
  openingHours: PoiOpeningHours[];
  /** Optional: human-readable description shown when arrived */
  description?: string;
  /** Soft delete */
  isActive: boolean;
  /** ISO */
  createdAt: string;
  /** ISO */
  updatedAt: string;
}
