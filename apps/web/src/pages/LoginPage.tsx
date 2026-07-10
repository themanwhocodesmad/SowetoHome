import { useNavigate } from 'react-router-dom';
import { GoogleSignIn } from '../components/GoogleSignIn.js';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <h1>Sign in to BookMyStay</h1>
      <GoogleSignIn onSuccess={() => navigate('/', { replace: true })} />
    </div>
  );
}
