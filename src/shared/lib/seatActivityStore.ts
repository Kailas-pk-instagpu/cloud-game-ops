import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SeatActivityField = 'label' | 'gpuModel' | 'status';

export interface SeatActivityEntry {
  id: string;
  timestamp: string; // ISO
  seatId: string;
  seatNumber: number;
  cafeId: string;
  cafeName: string;
  field: SeatActivityField;
  fromValue: string;
  toValue: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}

interface SeatActivityState {
  entries: SeatActivityEntry[];
  log: (entry: Omit<SeatActivityEntry, 'id' | 'timestamp'>) => void;
  clear: () => void;
}

const SEED: Omit<SeatActivityEntry, 'id' | 'timestamp'>[] = [
  { seatId: 'cafe-1-seat-3', seatNumber: 3, cafeId: 'cafe-1', cafeName: 'Downtown Hub', field: 'gpuModel', fromValue: 'RTX 4070', toValue: 'RTX 4090', actorId: '4', actorName: 'Sam Rivera', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-1-seat-3', seatNumber: 3, cafeId: 'cafe-1', cafeName: 'Downtown Hub', field: 'label', fromValue: '—', toValue: 'VIP-1', actorId: '4', actorName: 'Sam Rivera', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-1-seat-7', seatNumber: 7, cafeId: 'cafe-1', cafeName: 'Downtown Hub', field: 'status', fromValue: 'available', toValue: 'maintenance', actorId: '6', actorName: 'Riley Chen', actorRole: 'Manager' },
  { seatId: 'cafe-1-seat-12', seatNumber: 12, cafeId: 'cafe-1', cafeName: 'Downtown Hub', field: 'gpuModel', fromValue: 'RTX 4080', toValue: 'RTX 4070 Ti', actorId: '4', actorName: 'Sam Rivera', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-2-seat-1', seatNumber: 1, cafeId: 'cafe-2', cafeName: 'Uptown Arena', field: 'label', fromValue: 'VIP-A', toValue: 'Stream Booth', actorId: '4', actorName: 'Sam Rivera', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-2-seat-1', seatNumber: 1, cafeId: 'cafe-2', cafeName: 'Uptown Arena', field: 'gpuModel', fromValue: 'RTX 4070', toValue: 'RTX 4090', actorId: '4', actorName: 'Sam Rivera', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-2-seat-5', seatNumber: 5, cafeId: 'cafe-2', cafeName: 'Uptown Arena', field: 'status', fromValue: 'maintenance', toValue: 'available', actorId: '7', actorName: 'Morgan Tran', actorRole: 'Manager' },
  { seatId: 'cafe-2-seat-9', seatNumber: 9, cafeId: 'cafe-2', cafeName: 'Uptown Arena', field: 'gpuModel', fromValue: 'RTX 3080', toValue: 'RTX 4080', actorId: '2', actorName: 'Jordan Lee', actorRole: 'Sales Manager' },
  { seatId: 'cafe-3-seat-4', seatNumber: 4, cafeId: 'cafe-3', cafeName: 'Westside Lounge', field: 'label', fromValue: '—', toValue: 'Tournament-1', actorId: '5', actorName: 'Casey Park', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-3-seat-4', seatNumber: 4, cafeId: 'cafe-3', cafeName: 'Westside Lounge', field: 'gpuModel', fromValue: 'RTX 4070 Ti', toValue: 'RTX 4090', actorId: '5', actorName: 'Casey Park', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-3-seat-11', seatNumber: 11, cafeId: 'cafe-3', cafeName: 'Westside Lounge', field: 'status', fromValue: 'available', toValue: 'maintenance', actorId: '5', actorName: 'Casey Park', actorRole: 'Cafe Owner' },
  { seatId: 'cafe-3-seat-18', seatNumber: 18, cafeId: 'cafe-3', cafeName: 'Westside Lounge', field: 'gpuModel', fromValue: 'RTX 3070', toValue: 'RTX 4070', actorId: '2', actorName: 'Jordan Lee', actorRole: 'Sales Manager' },
  { seatId: 'cafe-4-seat-2', seatNumber: 2, cafeId: 'cafe-4', cafeName: 'Eastside Den', field: 'status', fromValue: 'maintenance', toValue: 'available', actorId: '3', actorName: 'Taylor Kim', actorRole: 'Sales Manager' },
  { seatId: 'cafe-4-seat-6', seatNumber: 6, cafeId: 'cafe-4', cafeName: 'Eastside Den', field: 'label', fromValue: 'Old-6', toValue: 'Practice-A', actorId: '3', actorName: 'Taylor Kim', actorRole: 'Sales Manager' },
  { seatId: 'cafe-4-seat-10', seatNumber: 10, cafeId: 'cafe-4', cafeName: 'Eastside Den', field: 'gpuModel', fromValue: 'RTX 3090', toValue: 'RTX 4080', actorId: '1', actorName: 'Alex Mercer', actorRole: 'Super Admin' },
];

// Spread timestamps over the last 5 days
const now = Date.now();
const seedEntries: SeatActivityEntry[] = SEED.map((e, i) => ({
  ...e,
  id: `sact-seed-${i}`,
  timestamp: new Date(now - (i * 3.2 + Math.random() * 2) * 60 * 60 * 1000).toISOString(),
}));

export const useSeatActivityStore = create<SeatActivityState>()(
  persist(
    (set) => ({
      entries: seedEntries,
      log: (entry) =>
        set((s) => ({
          entries: [
            {
              ...entry,
              id: `sact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: new Date().toISOString(),
            },
            ...s.entries,
          ].slice(0, 1000),
        })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'gpu-cloud-seat-activity',
      version: 2,
      migrate: (persisted: any) => {
        if (!persisted || !persisted.entries || persisted.entries.length === 0) {
          return { entries: seedEntries };
        }
        return persisted;
      },
    }
  )
);

