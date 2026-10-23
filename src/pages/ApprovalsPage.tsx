import { useState } from 'react';
import { useApprovalStore, ApprovalRequest } from '@/features/approvals/approvalService';
import { useBranchStore } from '@/shared/lib/store';
import { PendingChangesCompare } from '@/features/approvals/PendingChangesCompare';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ClipboardCheck, Building2, User, CalendarDays, Check, X, GitCompareArrows } from 'lucide-react';
import { toast } from 'sonner';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApprovalsPage() {
  const { requests, approve, reject } = useApprovalStore();
  const branches = useBranchStore(s => s.branches);
  const pending = requests.filter(r => r.status === 'pending');

  const [reviewing, setReviewing] = useState<ApprovalRequest | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState('');

  const branchName = (r: ApprovalRequest) =>
    branches.find(b => b.id === r.branchId)?.name ?? r.branchName;

  const openReview = (r: ApprovalRequest) => {
    setReviewing(r);
    setFeedback('');
  };

  const handleApprove = () => {
    if (!reviewing) return;
    approve(reviewing.id);
    toast.success(
      reviewing.type === 'new_cafe'
        ? `Cafe "${branchName(reviewing)}" approved and is now Active`
        : `Edit approved — new values for "${branchName(reviewing)}" are now live`
    );
    setConfirmApprove(false);
    setReviewing(null);
  };

  const handleReject = () => {
    if (!reviewing || !feedback.trim()) return;
    reject(reviewing.id, feedback);
    toast.success(`Request rejected — feedback sent to ${reviewing.createdByName}`);
    setShowReject(false);
    setReviewing(null);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Review new cafes and edit requests submitted by Sales Managers
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No pending approvals</h3>
            <p className="text-sm text-muted-foreground">
              New cafes and edit requests from Sales Managers will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pending.map(r => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{branchName(r)}</p>
                      <Badge
                        variant="outline"
                        className={
                          r.type === 'new_cafe'
                            ? 'text-[10px] bg-primary/10 text-primary border-primary/20'
                            : 'text-[10px] bg-warning/10 text-warning border-warning/20'
                        }
                      >
                        {r.type === 'new_cafe' ? 'New cafe' : 'Edit request'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Owner: {r.ownerName}</span>
                      <span className="hidden sm:inline">·</span>
                      <span>By {r.createdByName}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(r.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto" onClick={() => openReview(r)}>
                  <GitCompareArrows className="h-3.5 w-3.5" /> Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewing !== null} onOpenChange={o => { if (!o) setReviewing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {reviewing?.type === 'new_cafe' ? 'New cafe request' : 'Edit request'} — {reviewing ? branchName(reviewing) : ''}
            </DialogTitle>
            <DialogDescription>
              Submitted by {reviewing?.createdByName} on {reviewing ? formatDate(reviewing.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {reviewing?.type === 'new_cafe' && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Cafe Owner</span>
                <span className="font-medium text-right">{reviewing.ownerName}</span>
              </div>
              <div className="flex justify-between gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-right">
                  {branches.find(b => b.id === reviewing.branchId)?.address ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Seats</span>
                <span className="font-medium text-right">
                  {branches.find(b => b.id === reviewing.branchId)?.totalSeats ?? '—'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Approving makes this cafe Active and visible to the Cafe Owner. Rejecting keeps it Disabled and sends your feedback to the Sales Manager.
              </p>
            </div>
          )}

          {reviewing?.type === 'edit_cafe' && reviewing.proposed && reviewing.current && (
            <div className="space-y-3">
              <PendingChangesCompare current={reviewing.current} proposed={reviewing.proposed} />
              <p className="text-xs text-muted-foreground">
                Approving replaces the live values with the proposed ones. Rejecting keeps the current values live.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowReject(true)}
            >
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button className="gradient-primary text-primary-foreground gap-1.5" onClick={() => setConfirmApprove(true)}>
              <Check className="h-4 w-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {reviewing?.type === 'new_cafe'
                ? `"${reviewing ? branchName(reviewing) : ''}" will become Active and visible to the Cafe Owner.`
                : `The proposed values will replace the current live values for "${reviewing ? branchName(reviewing) : ''}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog — feedback mandatory */}
      <Dialog open={showReject} onOpenChange={o => { setShowReject(o); if (!o) setFeedback(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>
              Your feedback is sent to the Sales Manager so they can fix the request and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-feedback">Feedback *</Label>
            <Textarea
              id="reject-feedback"
              placeholder="Explain what needs to be fixed..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { setShowReject(false); setFeedback(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!feedback.trim()}>
              Reject with feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
