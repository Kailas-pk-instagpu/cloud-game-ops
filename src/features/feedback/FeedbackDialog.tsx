import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquareHeart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeedbackStore, useWalletStore, useNotificationStore } from '@/shared/lib/store';
import { FEEDBACK_CHIPS, FeedbackChip } from '@/shared/lib/mock-data';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  customerName: string;
  branchId: string;
  seatNumber?: number;
}

export function FeedbackDialog({ open, onOpenChange, walletId, customerName, branchId, seatNumber }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [chips, setChips] = useState<FeedbackChip[]>([]);
  const [comment, setComment] = useState('');
  const addFeedback = useFeedbackStore(s => s.addFeedback);
  const addPoints = useWalletStore(s => s.addPoints);
  const notify = useNotificationStore.getState();

  function toggleChip(c: FeedbackChip) {
    setChips(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  function submit() {
    if (rating === 0) {
      toast({ title: 'Pick a rating', description: 'Tap a star from 1 to 5.', variant: 'destructive' });
      return;
    }
    addFeedback({
      walletId, customerName, branchId, seatNumber,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      chips, comment: comment.trim() || undefined,
    });
    addPoints(walletId, 5, 'Feedback bonus');
    if (rating <= 2) {
      notify.notifications.unshift({
        id: `n-${Date.now()}`,
        title: 'Low rating received',
        message: `${customerName} rated ${rating}/5${seatNumber ? ` (Seat ${seatNumber})` : ''}.`,
        type: 'warning',
        timestamp: 'just now',
        read: false,
      });
    }
    toast({ title: 'Thanks for the feedback!', description: '+5 loyalty points awarded.' });
    setRating(0); setChips([]); setComment('');
    onOpenChange(false);
  }

  function skip() {
    setRating(0); setChips([]); setComment('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && skip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareHeart className="h-5 w-5 text-primary" />
            How was the session?
          </DialogTitle>
          <DialogDescription>
            {customerName}{seatNumber ? ` · Seat ${seatNumber}` : ''} — earn 5 bonus points for sharing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1 rounded-md hover:bg-muted"
                aria-label={`${n} stars`}
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/40',
                  )}
                />
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">What stood out?</p>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_CHIPS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChip(c)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    chips.includes(c)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground border-border hover:bg-muted',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Optional comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={skip}>Skip</Button>
          <Button onClick={submit}>
            <Sparkles className="h-4 w-4" /> Submit & earn 5 pts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackDialog;
