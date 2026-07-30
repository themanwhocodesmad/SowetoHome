import { useNavigate } from 'react-router-dom';
import { EmailPasswordAuth } from '../components/EmailPasswordAuth.js';
import { GoogleSignIn } from '../components/GoogleSignIn.js';

export function LoginPage() {
  const navigate = useNavigate();
  const goHome = () => navigate('/', { replace: true });

  return (
    <div className="login-page">
      <h1>Sign in to BookMyStaySA</h1>
      <GoogleSignIn onSuccess={goHome} />

      <div className="login-page__divider">
        <span>or</span>
      </div>

      <EmailPasswordAuth onSuccess={goHome} />
    </div>
  );
}
