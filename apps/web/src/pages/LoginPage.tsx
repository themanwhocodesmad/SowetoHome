import { useSearchParams } from 'react-router-dom';
import { googleLoginUrl } from '../api/auth.js';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');

  return (
    <div className="login-page">
      <h1>Sign in to Soweto Stays</h1>
      {oauthError && <p className="error">Sign-in failed. Please try again.</p>}
      <a className="button" href={googleLoginUrl()}>
        Sign in with Google
      </a>
    </div>
  );
}
