/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'bff' (default): real sign-in through the InstaGPU backend. 'mock': demo logins, no backend. */
  readonly VITE_AUTH_MODE?: 'bff' | 'mock';
}
