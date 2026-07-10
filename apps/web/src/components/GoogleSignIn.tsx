import { useEffect, useRef, useState } from 'react';
import { authApi } from '../api/auth.js';
import { setAccessToken } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.js';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

// Loads the GIS script once and resolves when window.google.accounts.id is usable, even
// if another instance of this component already injected the tag.
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')));
    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

export function GoogleSignIn({ onSuccess }: { onSuccess?: () => void }) {
  const { refresh } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google sign-in is not configured (VITE_GOOGLE_CLIENT_ID is missing)');
      return;
    }

    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void (async () => {
              try {
                const { accessToken } = await authApi.googleSignIn(response.credential);
                // Seed the in-memory token, then refresh() trades the httpOnly refresh
                // cookie (set by the sign-in response) for the user profile.
                setAccessToken(accessToken);
                await refresh();
                onSuccess?.();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Sign-in failed');
              }
            })();
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 280,
        });
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load Google sign-in');
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, onSuccess]);

  return (
    <div className="google-signin">
      <div ref={buttonRef} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}
