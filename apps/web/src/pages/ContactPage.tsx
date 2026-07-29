import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CONTACT_CONTENT } from '@soweto-stays/shared';
import { siteContentApi } from '../api/siteContent.js';
import { useSectionSpacingClass } from '../hooks/useSiteTheme.js';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data } = useQuery({
    queryKey: ['site-content', 'contact'],
    queryFn: siteContentApi.getContact,
  });
  const content = data ?? DEFAULT_CONTACT_CONTENT;
  const spacing = useSectionSpacingClass('contact');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="marketing-page">
      <section className={`content-section ${spacing}`}>
        <span className="content-section__eyebrow">{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>

        <div className="contact-grid">
          <form onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              <span>Message</span>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your stay or consultation request"
              />
            </label>
            <button type="submit">Send Inquiry</button>
            {submitted && <p className="notice form-notice">Thanks - we will be in touch shortly.</p>}
          </form>

          <div className="contact-details">
            <div>
              <strong>{content.consultationTitle}</strong>
              {content.consultationCopy}
            </div>
            <div>
              <strong>Email</strong>
              {content.email}
            </div>
            <div>
              <strong>Phone</strong>
              {content.phone}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
