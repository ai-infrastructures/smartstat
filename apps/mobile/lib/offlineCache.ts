/**
 * Offline cache for floor data.
 *
 * Strategy:
 * - On a successful network fetch, persist the floor's POIs + nav graph
 *   under a stable key in AsyncStorage with a timestamp.
 * - When network calls fail (or the app starts offline), serve the
 *   cached snapshot if it exists and is not older than MAX_AGE_MS.
 * - The Realtime subscription on the Navigate screen automatically
 *   refreshes the cache when changes flow in.
 *
 * Keys:
 *   ss:cache:floor:<floorId>          { pois, nodes, edges, savedAt }
 *   ss:cache:tenants                  Tenant[]
 *   ss:cache:building:<buildingId>    Building snapshot
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Building,
  Floor,
  NavEdge,
  NavNode,
  Poi,
  Tenant,
} from "@smartstat/shared";

const PREFIX = "ss:cache:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // one week

export interface FloorSnapshot {
  floor: Floor;
  pois: Poi[];
  nodes: NavNode[];
  edges: NavEdge[];
  savedAt: number;
}

export interface BuildingSnapshot {
  building: Building;
  floors: Floor[];
  savedAt: number;
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number } & T;
    if (parsed.savedAt && Date.now() - parsed.savedAt > MAX_AGE_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

async function writeJson<T extends object>(key: string, value: T): Promise<void> {
  try {
    const payload = JSON.stringify({ ...value, savedAt: Date.now() });
    await AsyncStorage.setItem(key, payload);
  } catch {
    /* swallow — cache failures must never break the app */
  }
}

/** Tenants list (used by the directory app on cold start). */
export const tenantsCache = {
  key: () => `${PREFIX}tenants`,
  async read(): Promise<Tenant[] | null> {
    const snap = await readJson<{ tenants: Tenant[] }>(this.key());
    return snap ? snap.tenants : null;
  },
  async write(tenants: Tenant[]): Promise<void> {
    await writeJson(this.key(), { tenants });
  },
};

/** Building + its published floors. */
export const buildingCache = {
  key: (buildingId: string) => `${PREFIX}building:${buildingId}`,
  async read(buildingId: string): Promise<BuildingSnapshot | null> {
    return readJson<BuildingSnapshot>(this.key(buildingId));
  },
  async write(snap: Omit<BuildingSnapshot, "savedAt">): Promise<void> {
    await writeJson(this.key(snap.building.id), snap);
  },
};

/** Full snapshot of one floor: meta, POIs, graph. */
export const floorCache = {
  key: (floorId: string) => `${PREFIX}floor:${floorId}`,
  async read(floorId: string): Promise<FloorSnapshot | null> {
    return readJson<FloorSnapshot>(this.key(floorId));
  },
  async write(snap: Omit<FloorSnapshot, "savedAt">): Promise<void> {
    await writeJson(this.key(snap.floor.id), snap);
  },
  async clear(floorId: string): Promise<void> {
    await AsyncStorage.removeItem(this.key(floorId));
  },
};

/** List all cached floor IDs (for the offline "available maps" screen). */
export async function listCachedFloors(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter((k: string) => k.startsWith(`${PREFIX}floor:`))
      .map((k: string) => k.slice(`${PREFIX}floor:`.length));
  } catch {
    return [];
  }
}

/** Wipe all cached SmartStat data (for sign-out or troubleshooting). */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k: string) => k.startsWith(PREFIX));
    await Promise.all(ours.map((k) => AsyncStorage.removeItem(k)));
  } catch {
    /* swallow */
  }
}
