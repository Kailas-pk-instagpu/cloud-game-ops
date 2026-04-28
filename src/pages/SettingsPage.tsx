import { useState, useRef } from 'react';
import { useAuthStore } from '@/shared/lib/store';
import { ROLE_LABELS, TwoFAMethod } from '@/shared/types/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Smartphone, Mail, KeyRound, Check, Copy, AlertTriangle, User, Lock, Camera, MapPin, Eye, EyeOff, Bell, Settings2, Trash2, PlugZap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import E2LinkIntegrationPanel from '@/features/settings/E2LinkIntegrationPanel';

const MOCK_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const MOCK_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/GPUCloud:user@example.com?secret=${MOCK_TOTP_SECRET}&issuer=GPUCloud`;

// --- 2FA Setup (unchanged logic) ---
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
            { method: 'authenticator' as TwoFAMethod, icon: KeyRound, title: 'Google Authenticator', desc: 'Use an authenticator app to generate codes.' },
            { method: 'sms' as TwoFAMethod, icon: Smartphone, title: 'SMS', desc: 'Receive codes via text message.' },
            { method: 'email' as TwoFAMethod, icon: Mail, title: 'Email', desc: 'Receive codes via email.' },
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
              <p className="text-xs text-muted-foreground">Open Google Authenticator and scan this QR code:</p>
            </div>
            <div className="flex justify-center p-4 bg-card rounded-lg w-fit mx-auto border border-border">
              <img src={MOCK_QR_URL} alt="2FA QR Code" className="w-[180px] h-[180px]" />
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

// --- Vertical Tab Item ---
const baseTabs = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: PlugZap, roles: ['super_admin'] as string[] },
  { id: 'general', label: 'General', icon: Settings2 },
] as const;

type TabId = typeof baseTabs[number]['id'];

export default function SettingsPage() {
  const { user, theme, toggleTheme, updateProfile, changePassword } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const tabs = baseTabs.filter(t => !('roles' in t) || (t.roles as string[]).includes(user?.role ?? ''));

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [logoPreview, setLogoPreview] = useState(user?.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  if (!user) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
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
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      toast.error(result.error || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, security, and preferences</p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[520px]">
          {/* Vertical Tabs Sidebar */}
          <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-3 md:p-4">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap w-full text-left',
                    activeTab === id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5 md:p-8 overflow-y-auto">
            {/* ===== PROFILE TAB ===== */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Avatar centered */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center cursor-pointer group shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <Camera className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => fileInputRef.current?.click()}>
                      Upload New
                    </Button>
                    {logoPreview && (
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setLogoPreview('')}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Avatar
                      </Button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                </div>

                <Separator />

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Full Name *</Label>
                    <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email">Email Address *</Label>
                    <Input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone">Mobile Number</Label>
                    <Input id="profile-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-role">Role</Label>
                    <Input id="profile-role" value={ROLE_LABELS[user.role]} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-address" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Residential Address
                  </Label>
                  <Textarea id="profile-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address, city, state, zip..." rows={2} className="resize-none" />
                </div>

                <div className="flex justify-center pt-2">
                  <Button className="gradient-primary text-primary-foreground px-10" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {/* ===== PASSWORD TAB ===== */}
            {activeTab === 'password' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h2 className="text-lg font-semibold">Change Password</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update your account password for security</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-pw">Current Password</Label>
                    <div className="relative">
                      <Input id="current-pw" type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw">New Password</Label>
                    <div className="relative">
                      <Input id="new-pw" type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowNewPw(!showNewPw)}>
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pw">Confirm New Password</Label>
                    <Input id="confirm-pw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <Button className="gradient-primary text-primary-foreground px-10" onClick={handleChangePassword} disabled={!currentPassword || !newPassword}>
                    <Lock className="h-4 w-4 mr-2" /> Change Password
                  </Button>
                </div>
              </div>
            )}

            {/* ===== NOTIFICATIONS TAB ===== */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h2 className="text-lg font-semibold">Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose what notifications you receive</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  {[
                    { label: 'Email Notifications', desc: 'Receive important updates via email' },
                    { label: 'Push Notifications', desc: 'Get real-time alerts in your browser' },
                    { label: 'System Alerts', desc: 'Critical system and security alerts' },
                    { label: 'Activity Summary', desc: 'Weekly summary of your account activity' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={i < 3} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== SECURITY TAB ===== */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account</p>
                </div>
                <Separator />
                <TwoFASetup />
              </div>
            )}

            {/* ===== GENERAL TAB ===== */}
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h2 className="text-lg font-semibold">Preferences</h2>
                  <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark theme</p>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
