import { useEffect, useMemo, useState } from 'react';
import { Lock, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROLE_LABELS, type Role } from '@/shared/types/auth';
import { PERMISSIONS, PERMISSIONS_MANAGE } from '@/shared/lib/permissions';
import { BffError } from '@/shared/lib/bff';
import {
  loadPermissionMatrix, saveRolePermissions, type PermissionInfo, type PermissionMatrix,
} from '@/features/permissions/permissionsService';

const CAFE_ROLES: Role[] = ['cafe_owner', 'manager'];

// Show features and keys in the order of the app's catalog (Dashboard, Users, Branches, ...); keys the app does not know go last.
const CATALOG_ORDER = Object.keys(PERMISSIONS);
const rank = (key: string) => {
  const i = CATALOG_ORDER.indexOf(key);
  return i === -1 ? CATALOG_ORDER.length : i;
};

type Draft = Record<Role, Set<string>>;

const toDraft = (grants: PermissionMatrix['grants']): Draft =>
  Object.fromEntries(Object.entries(grants).map(([r, keys]) => [r, new Set(keys)])) as Draft;

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((k) => b.has(k));

/** Why a cell cannot be changed, or null when it can. */
function lockReason(role: Role, p: PermissionInfo): string | null {
  if (p.locked && CAFE_ROLES.includes(role)) return 'Platform-only: cannot be given to cafe roles';
  if (role === 'super_admin' && p.key === PERMISSIONS_MANAGE) return 'Always on, so a Super Admin can never be locked out';
  return null;
}

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const m = await loadPermissionMatrix();
      setMatrix(m);
      setDraft(toDraft(m.grants));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load permissions.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const groups = useMemo(() => {
    const out = new Map<string, PermissionInfo[]>();
    for (const p of [...(matrix?.permissions ?? [])].sort((a, b) => rank(a.key) - rank(b.key))) {
      if (!out.has(p.feature)) out.set(p.feature, []);
      out.get(p.feature)!.push(p);
    }
    return [...out];
  }, [matrix]);

  const saved = useMemo(() => (matrix ? toDraft(matrix.grants) : null), [matrix]);
  const changedRoles = matrix && draft && saved ? matrix.roles.filter((r) => !sameSet(draft[r], saved[r])) : [];

  const toggle = (role: Role, key: string, on: boolean) => {
    setDraft((d) => {
      if (!d) return d;
      const next = new Set(d[role]);
      if (on) next.add(key);
      else next.delete(key);
      return { ...d, [role]: next };
    });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      for (const role of changedRoles) {
        const r = await saveRolePermissions(role, [...draft[role]].sort());
        toast.success(`${ROLE_LABELS[role]}: ${r.added.length} added, ${r.removed.length} removed`);
      }
      await load();
    } catch (e) {
      const msg = e instanceof BffError ? e.message : 'Saving failed. Nothing after the error was saved.';
      toast.error(msg);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl">
            Choose what each role may do. Changes apply to everyone with that role within 30 seconds. Which cafes and
            branches a person can see is set by their assignments, not here.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {changedRoles.length > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              Unsaved: {changedRoles.map((r) => ROLE_LABELS[r]).join(', ')}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={changedRoles.length === 0 || saving}
            onClick={() => saved && setDraft(toDraft(matrix!.grants))}
          >
            <RotateCcw className="h-4 w-4" /> Discard
          </Button>
          <Button size="sm" className="gap-1.5 gradient-primary text-primary-foreground" disabled={changedRoles.length === 0 || saving} onClick={save}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6 text-sm flex items-center justify-between gap-3">
            <span className="text-destructive">{error}</span>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {!matrix || !draft ? (
        !error && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-semibold p-3 pl-4">Permission</th>
                  {matrix.roles.map((r) => (
                    <th key={r} className="font-semibold p-3 text-center w-28">
                      <span className="whitespace-nowrap">{ROLE_LABELS[r]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(([feature, perms]) => (
                  <FeatureRows key={feature} feature={feature} perms={perms} roles={matrix.roles} draft={draft} saved={saved!} onToggle={toggle} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" /> Every change is recorded in the audit log.
        <Lock className="h-3.5 w-3.5 ml-2" /> Locked cells cannot be changed.
      </p>
    </div>
  );
}

function FeatureRows({
  feature, perms, roles, draft, saved, onToggle,
}: {
  feature: string;
  perms: PermissionInfo[];
  roles: Role[];
  draft: Draft;
  saved: Draft;
  onToggle: (role: Role, key: string, on: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-muted/40">
        <td colSpan={roles.length + 1} className="px-4 py-2 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {feature}
        </td>
      </tr>
      {perms.map((p) => (
        <tr key={p.key} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
          <td className="p-3 pl-4">
            <p className="font-medium">{p.description}</p>
            <p className="text-[11px] leading-normal text-muted-foreground font-mono mt-0.5">{p.key}</p>
          </td>
          {roles.map((r) => {
            const reason = lockReason(r, p);
            const checked = draft[r].has(p.key);
            const changed = checked !== saved[r].has(p.key);
            const box = (
              <span className={`inline-flex items-center justify-center rounded-md p-1.5 ${changed ? 'bg-warning/15 ring-1 ring-warning/40' : ''}`}>
                <Checkbox
                  checked={checked}
                  disabled={!!reason}
                  onCheckedChange={(v) => onToggle(r, p.key, v === true)}
                  aria-label={`${ROLE_LABELS[r]}: ${p.description}`}
                />
              </span>
            );
            return (
              <td key={r} className="p-3 text-center">
                {reason ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1">
                        {box}
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{reason}</TooltipContent>
                  </Tooltip>
                ) : (
                  box
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
