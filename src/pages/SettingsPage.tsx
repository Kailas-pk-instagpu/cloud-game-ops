import { useState } from 'react';
import { useAuthStore } from '@/shared/lib/store';
import { ROLE_LABELS, TwoFAMethod } from '@/shared/types/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Mail, KeyRound, Check, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const MOCK_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/GPUCloud:user@example.com?secret=${MOCK_TOTP_SECRET}&issuer=GPUCloud`;

function TwoFASetup() {
  const { user, enable2FA, disable2FA } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<TwoFAMethod>(null);
  const [step, setStep] = useState<'select' | 'setup' | 'verify'>('select');
  const [verifyCode, setVerifyCode] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!user) return null;

  const handleDisable = () => {
    disable2FA();
    toast.success('Two-factor authentication has been disabled');
    setStep('select');
    setSelectedMethod(null);
    setVerifyCode('');
  };

  const handleVerify = () => {
    if (verifyCode.length !== 6 || !/^\d+$/.test(verifyCode)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      enable2FA(selectedMethod, selectedMethod === 'sms' ? phone : undefined);
      toast.success(`2FA enabled via ${selectedMethod === 'authenticator' ? 'Google Authenticator' : selectedMethod === 'sms' ? 'SMS' : 'Email'}`);
      setStep('select');
      setSelectedMethod(null);
      setVerifyCode('');
      setIsVerifying(false);
    }, 1000);
  };

  const methodLabel: Record<string, string> = {
    authenticator: 'Google Authenticator',
    sms: 'SMS',
    email: 'Email',
  };

  if (user.is2FAEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Check className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Two-factor authentication is enabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Method: <Badge variant="secondary" className="ml-1 text-xs">{methodLabel[user.twoFAMethod!] || 'Unknown'}</Badge>
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDisable}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Disable 2FA
        </Button>
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Choose how you'd like to receive verification codes:</p>
        <div className="grid gap-3">
          {([
            { method: 'authenticator' as TwoFAMethod, icon: KeyRound, title: 'Google Authenticator', desc: 'Use an authenticator app to generate codes. Most secure option.' },
            { method: 'sms' as TwoFAMethod, icon: Smartphone, title: 'SMS', desc: 'Receive codes via text message to your phone number.' },
            { method: 'email' as TwoFAMethod, icon: Mail, title: 'Email', desc: 'Receive codes via email. Easiest to set up.' },
          ]).map(({ method, icon: Icon, title, desc }) => (
            <button
              key={method}
              onClick={() => { setSelectedMethod(method); setStep('setup'); }}
              className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => { setStep('select'); setVerifyCode(''); }}>
          ← Back
        </Button>

        {selectedMethod === 'authenticator' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Step 1: Scan QR Code</h4>
              <p className="text-xs text-muted-foreground">Open Google Authenticator (or any TOTP app) and scan this QR code:</p>
            </div>
            <div className="flex justify-center p-4 bg-white rounded-lg w-fit mx-auto">
              <img src={MOCK_QR_URL} alt="2FA QR Code" className="w-[200px] h-[200px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Or enter this secret key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono tracking-widest">{MOCK_TOTP_SECRET}</code>
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(MOCK_TOTP_SECRET); toast.info('Secret copied'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code from your authenticator app:</p>
              <Input
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]"
                maxLength={6}
              />
            </div>
          </div>
        )}

        {selectedMethod === 'sms' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Step 1: Enter Your Phone Number</h4>
              <p className="text-xs text-muted-foreground mb-2">We'll send a verification code to this number:</p>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="max-w-[280px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Verification code sent! (Demo: use any 6 digits)')}
              disabled={phone.length < 8}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Send Code
            </Button>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code sent to your phone:</p>
              <Input
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]"
                maxLength={6}
              />
            </div>
          </div>
        )}

        {selectedMethod === 'email' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Step 1: Confirm Your Email</h4>
              <p className="text-xs text-muted-foreground mb-2">We'll send a verification code to:</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Verification code sent! (Demo: use any 6 digits)')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Code
            </Button>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code sent to your email:</p>
              <Input
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]"
                maxLength={6}
              />
            </div>
          </div>
        )}

        <Button onClick={handleVerify} disabled={verifyCode.length !== 6 || isVerifying} className="mt-2">
          <Shield className="h-4 w-4 mr-2" />
          {isVerifying ? 'Verifying...' : 'Enable 2FA'}
        </Button>
      </div>
    );
  }

  return null;
}

export default function SettingsPage() {
  const { user, theme, toggleTheme } = useAuthStore();
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account by requiring a verification code in addition to your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TwoFASetup />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
