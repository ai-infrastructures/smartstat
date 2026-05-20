/**
 * A building belonging to a tenant. A hospital can have multiple buildings
 * (main building, outpatient pavilion, etc.).
 */

export interface BuildingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  /** WGS84 latitude */
  latitude: number;
  /** WGS84 longitude */
  longitude: number;
}

export interface Building {
  id: string;
  tenantId: string;
  name: string;
  address: BuildingAddress;
  /** Number of floors mapped */
  floorCount: number;
  /** ISO */
  createdAt: string;
  /** ISO */
  updatedAt: string;
}
