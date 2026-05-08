import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SeatActivityField = 'label' | 'gpuModel' | 'status';

export interface SeatActivityEntry {
  id: string;
  timestamp: string; // ISO
  seatId: string;
  seatNumber: number;
  branchId: string;
  branchName: string;
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

export const useSeatActivityStore = create<SeatActivityState>()(
  persist(
    (set) => ({
      entries: [],
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
    { name: 'gpu-cloud-seat-activity' }
  )
);
