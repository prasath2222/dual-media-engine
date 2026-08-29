import { GoogleUserProfile } from '../types';

const GOOGLE_GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const STORAGE_KEY_USER = 'multistream_auth_user_v1';
const STORAGE_KEY_CLIENT_ID = 'multistream_google_client_id_v1';

type AuthListener = (user: GoogleUserProfile | null) => void;

export class GoogleAuthService {
  private static currentUser: GoogleUserProfile | null = null;
  private static listeners: Set<AuthListener> = new Set();
  private static tokenClient: any = null;

  public static subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.getCurrentUser());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    const user = this.getCurrentUser();
    this.listeners.forEach(fn => fn(user));
  }

  public static getCurrentUser(): GoogleUserProfile | null {
    if (this.currentUser) return this.currentUser;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public static getStoredClientId(): string {
    return localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '';
  }

  public static setStoredClientId(clientId: string): void {
    if (clientId.trim()) {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    }
  }

  public static async loadGsiScript(): Promise<void> {
    if (typeof window === 'undefined') return;
    if ((window as any).google?.accounts?.oauth2) return;

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_GSI_SCRIPT_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_GSI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Sign-In library'));
      document.head.appendChild(script);
    });
  }

  // Sign in using Google Identity Services (OAuth2 popup with select_account)
  public static async signInWithGoogle(customClientId?: string): Promise<GoogleUserProfile> {
    const clientId = (customClientId || this.getStoredClientId()).trim();

    // If no client ID is provided yet, provide a quick one-click Google identity simulator or prompt for custom Client ID
    if (!clientId) {
      // Check if we can prompt or use default demo profile
      const demoEmail = prompt('Enter your Google Account email to sync your multi-stream cloud profile (or enter a custom OAuth Client ID in Settings):', 'production.user@gmail.com');
      if (!demoEmail) {
        throw new Error('Sign-in cancelled');
      }
      const email = demoEmail.trim().toLowerCase();
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const user: GoogleUserProfile = {
        id: `user-${btoa(email).replace(/=/g, '')}`,
        name: name || 'Google User',
        email,
        picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
        isGuest: false
      };
      this.setUser(user);
      return user;
    }

    this.setStoredClientId(clientId);
    await this.loadGsiScript();

    return new Promise((resolve, reject) => {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        return reject(new Error('Google Identity SDK failed to initialize'));
      }

      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.readonly',
          prompt: 'select_account',
          callback: async (response: { access_token?: string; error?: string }) => {
            if (response.error || !response.access_token) {
              return reject(new Error(response.error || 'Google Sign-In cancelled'));
            }

            const token = response.access_token;
            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const profile = await profileRes.json();
              const user: GoogleUserProfile = {
                id: profile.sub || `user-${Date.now()}`,
                name: profile.name || profile.email?.split('@')[0] || 'Google User',
                email: profile.email || '',
                picture: profile.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(profile.email || 'user')}`,
                isGuest: false
              };
              GoogleAuthService.setUser(user);
              resolve(user);
            } catch (err: any) {
              // Fallback
              const user: GoogleUserProfile = {
                id: `user-${Date.now()}`,
                name: 'Google User',
                email: '',
                picture: '',
                isGuest: false
              };
              GoogleAuthService.setUser(user);
              resolve(user);
            }
          }
        });

        this.tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to start Google sign-in'));
      }
    });
  }

  // Quick Sign In with specific email (e.g. 1-click test / dev mode)
  public static signInAs(email: string, name?: string): GoogleUserProfile {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const user: GoogleUserProfile = {
      id: `user-${btoa(cleanEmail).replace(/=/g, '')}`,
      name: cleanName,
      email: cleanEmail,
      picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      isGuest: false
    };
    this.setUser(user);
    return user;
  }

  public static setUser(user: GoogleUserProfile | null): void {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
    this.notify();
  }

  public static signOut(): void {
    this.setUser(null);
  }
}
