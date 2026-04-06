import { useState, useRef } from 'react';
import { useAuthStore } from '@/shared/lib/store';
import { ROLE_LABELS, TwoFAMethod } from '@/shared/types/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Smartphone, Mail, KeyRound, Check, Copy, AlertTriangle, User, Lock, Camera, MapPin, Eye, EyeOff } from 'lucide-react';
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
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
          <Check className="h-5 w-5 text-success shrink-0" />
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
              <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]" maxLength={6} />
            </div>
          </div>
        )}

        {selectedMethod === 'sms' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Step 1: Enter Your Phone Number</h4>
              <p className="text-xs text-muted-foreground mb-2">We'll send a verification code to this number:</p>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className="max-w-[280px]" />
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Verification code sent! (Demo: use any 6 digits)')} disabled={phone.length < 8}>
              <Smartphone className="h-4 w-4 mr-2" /> Send Code
            </Button>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code sent to your phone:</p>
              <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]" maxLength={6} />
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
            <Button variant="outline" size="sm" onClick={() => toast.info('Verification code sent! (Demo: use any 6 digits)')}>
              <Mail className="h-4 w-4 mr-2" /> Send Code
            </Button>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code sent to your email:</p>
              <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]" maxLength={6} />
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

function ProfileSection() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [logoPreview, setLogoPreview] = useState(user?.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  if (!user) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { toast.error('Valid email is required'); return; }
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), logoUrl: logoPreview || undefined });
      toast.success('Profile updated successfully');
      setIsSaving(false);
    }, 500);
  };

  const handleChangePassword = () => {
    if (!currentPassword) { toast.error('Enter your current password'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    const result = changePassword(currentPassword, newPassword);
    if (result.success) {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-5">
      {/* Avatar / Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Profile Photo / Logo
          </CardTitle>
          <CardDescription>Upload a profile picture or company logo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Upload Photo
              </Button>
              {logoPreview && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setLogoPreview('')}>
                  Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG under 2MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profile-name">Full Name *</Label>
              <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="profile-email">Email Address *</Label>
              <Input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="profile-phone">Phone Number</Label>
              <Input id="profile-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="profile-role">Role</Label>
              <Input id="profile-role" value={ROLE_LABELS[user.role]} disabled className="bg-muted" />
            </div>
          </div>
          <div>
            <Label htmlFor="profile-address" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Address
            </Label>
            <Textarea id="profile-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address, city, state, zip..." rows={2} className="resize-none" />
          </div>
          <div className="flex justify-end">
            <Button className="gradient-primary text-primary-foreground" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-pw">Current Password</Label>
            <div className="relative">
              <Input id="current-pw" type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-pw">New Password</Label>
              <div className="relative">
                <Input id="new-pw" type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <Input id="confirm-pw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleChangePassword} disabled={!currentPassword || !newPassword}>
              <Lock className="h-4 w-4 mr-2" /> Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { user, theme, toggleTheme } = useAuthStore();
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile" className="gap-1.5 flex-1 sm:flex-none">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="general" className="flex-1 sm:flex-none">General</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 flex-1 sm:flex-none">
            <Shield className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label className="font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark theme</p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
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
