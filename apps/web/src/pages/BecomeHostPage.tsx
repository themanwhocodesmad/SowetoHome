import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../api/users.js';
import { useAuth } from '../auth/AuthContext.js';

// Becoming a host is an application: the guest submits it here and an admin approves it
// from the admin dashboard before the 'host' role (and /host/* pages) unlock.
export function BecomeHostPage() {
  const { user, refresh } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await usersApi.applyToHost(message.trim() || undefined);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.roles.includes('host')) {
    return (
      <div className="become-host">
        <h1>You&rsquo;re a host</h1>
        <p>Your host account is active. Manage your properties from the host dashboard.</p>
        <Link to="/host/listings" className="button">
          Go to my listings
        </Link>
      </div>
    );
  }

  if (user?.hostApplication?.status === 'pending') {
    return (
      <div className="become-host">
        <h1>Application under review</h1>
        <p>
          Thanks for applying! Our team is reviewing your host application. You&rsquo;ll be able to
        list properties as soon as it&rsquo;s approved.
        </p>
        <span className="pill pill--warning">Pending review</span>
      </div>
    );
  }

  const wasRejected = user?.hostApplication?.status === 'rejected';

  return (
    <div className="become-host">
      <h1>Become a host</h1>
      <p>
        List your property on BookMyStay and start earning. Tell us a little about yourself and the
        place you&rsquo;d like to list &mdash; an admin will review your application.
      </p>

      {wasRejected && (
        <p className="notice">
          Your previous application wasn&rsquo;t approved. You&rsquo;re welcome to apply again with
          more detail.
        </p>
      )}
      {error && <p className="error">{error}</p>}

      <form className="become-host__form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          About you and your property (optional)
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="e.g. I have a two-bedroom garden cottage in Orlando West I'd like to list for weekend stays."
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
