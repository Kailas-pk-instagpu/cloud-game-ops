import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginWelcomePopup } from '@/shared/ui/organisms/LoginWelcomePopup';
import { markLoginWelcome } from '@/shared/lib/loginWelcome';
import type { User } from '@/shared/types/auth';

const state = vi.hoisted(() => ({ user: null as unknown as User | null }));

vi.mock('@/shared/lib/store', () => ({
  useAuthStore: (selector: (s: { user: User | null }) => unknown) => selector({ user: state.user }),
}));

// Render motion elements as plain nodes so mount/unmount is synchronous and timer-driven.
vi.mock('framer-motion', () => {
  const React = require('react');
  const make = (tag: string) => (props: Record<string, unknown>) => {
    const { children, initial, animate, exit, transition, layout, ...rest } = props;
    return React.createElement('div', { ...rest, 'data-motion': tag }, children);
  };
  return {
    motion: new Proxy({}, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  };
});

const USER: User = {
  id: 'u-1',
  email: 'salesmanager@gpucloud.io',
  name: 'Ravi Menon',
  role: 'admin',
  createdBy: null,
  assignedScope: [],
  is2FAEnabled: true,
  twoFAMethod: 'authenticator',
  createdAt: '2026-01-01',
};

beforeEach(() => {
  vi.useFakeTimers();
  state.user = USER;
  markLoginWelcome(USER);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('login welcome popup', () => {
  it('names the signed-in user, role and email', () => {
    render(<LoginWelcomePopup />);
    expect(screen.getByText('Ravi Menon')).toBeInTheDocument();
    expect(screen.getByText('Sales Manager')).toBeInTheDocument();
    expect(screen.getByText('salesmanager@gpucloud.io')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close welcome message' })).toBeInTheDocument();
  });

  it('stays for 5 seconds then closes itself', () => {
    render(<LoginWelcomePopup />);
    act(() => { vi.advanceTimersByTime(4999); });
    expect(screen.getByText('Ravi Menon')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByText('Ravi Menon')).not.toBeInTheDocument();
  });

  it('closes on the button before the 5 seconds are up and never reopens', () => {
    render(<LoginWelcomePopup />);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.click(screen.getByRole('button', { name: 'Close welcome message' }));
    expect(screen.queryByText('Ravi Menon')).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(6000); });
    expect(screen.queryByText('Ravi Menon')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<LoginWelcomePopup />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Ravi Menon')).not.toBeInTheDocument();
  });

  it('shows once per sign-in, not on a later mount', () => {
    render(<LoginWelcomePopup />);
    expect(screen.getByText('Ravi Menon')).toBeInTheDocument();
    cleanup();
    render(<LoginWelcomePopup />);
    expect(screen.queryByText('Ravi Menon')).not.toBeInTheDocument();
  });
});
