import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from '@/pages/SettingsPage';
import type { Role } from '@/shared/types/auth';

const state = vi.hoisted(() => ({
  user: { id: 'test-user', name: 'Test User', email: 'test@example.com', phone: '', role: 'manager' as Role, is2FAEnabled: false },
  updateProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock('@/shared/lib/store', () => ({
  useAuthStore: () => ({ user: state.user, updateProfile: state.updateProfile, changePassword: vi.fn() }),
}));
vi.mock('@/features/settings/profileService', () => ({
  saveProfile: (p: unknown) => { state.saveProfile(p); return Promise.resolve({ ...state.user, ...(p as object) }); },
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
}));
vi.mock('@/features/settings/VMwareHorizonIntegrationPanel', () => ({ default: () => null }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe.each<Role>(['super_admin', 'admin', 'cafe_owner', 'manager'])('account rules for %s', role => {
  it('requires a nonblank mobile number before saving', async () => {
    state.user = { ...state.user, role, phone: '' };
    render(<SettingsPage />);
    const save = screen.getByRole('button', { name: 'Save Changes' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Mobile Number *'), { target: { value: '   ' } });
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(state.saveProfile).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Mobile Number *'), { target: { value: '+60123456789' } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(state.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ phone: '+60123456789' })));
  });

  it('shows the email read-only (it is the sign-in address)', () => {
    state.user = { ...state.user, role };
    render(<SettingsPage />);
    const email = screen.getByLabelText('Email Address *') as HTMLInputElement;
    expect(email.readOnly).toBe(true);
    fireEvent.change(email, { target: { value: 'other@example.com' } });
    expect(email.value).toBe('test@example.com');
  });

  it('sends password changes to the secure sign-in page (no password fields here)', () => {
    state.user = { ...state.user, role };
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' })); // the tab
    expect(screen.queryByLabelText('Current Password')).toBeNull();
    const [, action] = screen.getAllByRole('button', { name: 'Change Password' }); // tab, then the action button
    expect(action).toBeEnabled();
  });

  it.each(['Email Notifications', 'Push Notifications'])('%s remains enabled after attempted interaction', label => {
    state.user = { ...state.user, role };
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const toggle = screen.getByRole('switch', { name: label });
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: ' ' });
    expect(toggle).toBeChecked();
  });
});