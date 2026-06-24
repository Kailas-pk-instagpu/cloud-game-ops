import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad2, AlertCircle, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import GPUBackground from '@/features/login/GPUBackground';
import { Role } from '@/shared/types/auth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('cafe_owner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signup(email, password, fullName, role);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Sign up failed');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GPUBackground />
      <div className="relative z-20 w-full max-w-md animate-login-up">
        <div className="relative rounded-2xl border border-white/10 bg-[hsl(var(--card)/0.55)] backdrop-blur-2xl shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.35)] p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/40">
              <Gamepad2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">GPU Cloud</p>
              <p className="text-xs text-muted-foreground">Beyond Hardware</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Pilot your cafe with the POC backend.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11 bg-background/40 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-background/40 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11 bg-background/40 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid grid-cols-2 gap-2">
                <label className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${role === 'cafe_owner' ? 'border-primary bg-primary/10' : 'border-white/10 bg-background/40'}`}>
                  <RadioGroupItem value="cafe_owner" />
                  <span className="text-sm">Cafe Owner</span>
                </label>
                <label className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${role === 'manager' ? 'border-primary bg-primary/10' : 'border-white/10 bg-background/40'}`}>
                  <RadioGroupItem value="manager" />
                  <span className="text-sm">Manager</span>
                </label>
              </RadioGroup>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 gradient-primary text-primary-foreground text-sm font-semibold rounded-xl">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating…</> : 'Create account'}
            </Button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Already have an account? <Link to="/login" className="text-primary hover:text-primary/80">Log in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
