import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.js';

// The API redirects here with the access token in the URL fragment (never the query
// string, so it's not sent to any server or logged) after a successful Google sign-in.
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('accessToken');
    if (token) {
      setAccessToken(token);
    }
    void refresh().then(() => navigate('/', { replace: true }));
  }, [navigate, refresh]);

  return <p>Signing you in...</p>;
}
