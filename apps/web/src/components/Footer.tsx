import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { newsletterApi } from '../api/newsletter.js';

type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await newsletterApi.subscribe({ email });
      setStatus('success');
      setMessage('Thanks - you are on the list.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Could not subscribe. Please try again.');
    }
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <Link to="/" className="site-footer__brand">
            Book<span>My</span>Stay
          </Link>
          <p>
            Premium vacation and boutique stay bookings, backed by full-service property
            stewardship for owners and guests alike.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li>
              <Link to="/">Properties</Link>
            </li>
            <li>
              <Link to="/services">Services</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Support</h4>
          <ul>
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/become-host">Become a Host</Link>
            </li>
            <li>
              <Link to="/login">Sign In</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Stay Informed</h4>
          <p>Get new signature estates and offers straight to your inbox.</p>
          <form className="newsletter-form" onSubmit={(e) => void handleSubscribe(e)}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {status === 'success' && <p className="newsletter-status newsletter-status--success">{message}</p>}
          {status === 'error' && <p className="newsletter-status newsletter-status--error">{message}</p>}
        </div>
      </div>

      <div className="site-footer__bottom">© {new Date().getFullYear()} BookMyStay. All rights reserved.</div>
    </footer>
  );
}
