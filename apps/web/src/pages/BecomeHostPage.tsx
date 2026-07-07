import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users.js';
import { useAuth } from '../auth/AuthContext.js';

// A guest becomes a host by adding the role to their existing account (claude_plan.md §2) -
// there's no separate host signup flow.
export function BecomeHostPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();

  const handleBecomeHost = async () => {
    await usersApi.becomeHost();
    await refresh();
    navigate('/host/listings');
  };

  return (
    <div>
      <h1>Become a host</h1>
      <p>List your property on Soweto Stays and start earning.</p>
      <button type="button" onClick={() => void handleBecomeHost()}>
        Become a host
      </button>
    </div>
  );
}
