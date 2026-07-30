import { useState, type FormEvent } from 'react';
import { authApi } from '../api/auth.js';
import { setAccessToken } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.js';

type Mode = 'login' | 'register' | 'forgot';

export function EmailPasswordAuth({ onSuccess }: { onSuccess?: () => void }) {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'forgot') {
        await authApi.forgotPassword(email);
        setNotice("If that email has an account with a password, we've sent a reset link to it.");
        return;
      }
      const { accessToken } =
        mode === 'register' ? await authApi.register({ name, email, password }) : await authApi.login({ email, password });
      setAccessToken(accessToken);
      await refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="email-auth-form" onSubmit={(e) => void handleSubmit(e)}>
      {mode === 'register' && (
        <label>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
      )}
      <label>
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>

      {mode !== 'forgot' && (
        <label>
          Password
          <input
            type="password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
          />
        </label>
      )}

      {mode === 'login' && (
        <button type="button" className="email-auth-form__forgot" onClick={() => switchMode('forgot')}>
          Forgot password?
        </button>
      )}

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      {!notice && (
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Please wait...'
            : mode === 'register'
              ? 'Create account'
              : mode === 'forgot'
                ? 'Send reset link'
                : 'Sign in'}
        </button>
      )}

      {mode === 'forgot' ? (
        <button type="button" className="email-auth-form__switch" onClick={() => switchMode('login')}>
          Back to sign in
        </button>
      ) : (
        <button type="button" className="email-auth-form__switch" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      )}
    </form>
  );
}
