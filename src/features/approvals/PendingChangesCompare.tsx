import { BranchEditProposal, MOCK_USERS } from '@/shared/lib/mock-data';
import { cn } from '@/lib/utils';

const FIELDS: { key: keyof BranchEditProposal; label: string }[] = [
  { key: 'name', label: 'Branch Name' },
  { key: 'address', label: 'Address' },
  { key: 'totalSeats', label: 'Seats' },
  { key: 'adminId', label: 'Sales Manager' },
  { key: 'cafeOwnerId', label: 'Cafe Owner' },
  { key: 'managerId', label: 'Floor Manager' },
];

function display(p: BranchEditProposal, key: keyof BranchEditProposal): string {
  const v = p[key];
  if (key === 'totalSeats') return String(v ?? '—');
  if (key === 'name' || key === 'address') return (v as string) || '—';
  return v ? MOCK_USERS.find(u => u.id === v)?.name ?? '—' : 'Unassigned';
}

/** Side-by-side current vs proposed comparison for a pending cafe edit. */
export function PendingChangesCompare({
  current,
  proposed,
}: {
  current: BranchEditProposal;
  proposed: BranchEditProposal;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="grid grid-cols-3 bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="p-2.5">Field</div>
        <div className="p-2.5 border-l">Current</div>
        <div className="p-2.5 border-l">Proposed</div>
      </div>
      {FIELDS.map(f => {
        const cur = display(current, f.key);
        const next = display(proposed, f.key);
        const changed = cur !== next;
        return (
          <div key={f.key} className={cn('grid grid-cols-3 text-sm border-t', changed && 'bg-warning/5')}>
            <div className="p-2.5 text-muted-foreground">{f.label}</div>
            <div className="p-2.5 border-l break-words">{cur}</div>
            <div className={cn('p-2.5 border-l break-words', changed && 'text-warning font-medium')}>{next}</div>
          </div>
        );
      })}
    </div>
  );
}
