import SeatManagement from '@/features/dashboards/SeatManagement';
import BackendSeatManagement from '@/features/seats/BackendSeatManagement';
import { AUTH_MODE } from '@/shared/lib/bff';

/** Backend mode: the seat grid from the API (sessions come next); VITE_AUTH_MODE=mock keeps the demo page. */
export default function SeatsPage() {
  return AUTH_MODE === 'bff' ? <BackendSeatManagement /> : <SeatManagement />;
}
