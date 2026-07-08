import { useState, type FormEvent } from 'react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="marketing-page">
      <section className="content-section">
        <span className="content-section__eyebrow">Get In Touch</span>
        <h1>Talk to our stay advisory team</h1>
        <p>
          Have a question about a booking, a property, or a corporate consultation? Send us a
          message and a member of our team will follow up to schedule a call.
        </p>

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
              <strong>Consultation Scheduling</strong>
              Prefer to talk it through first? Request a consultation and we will find a time that
              works for corporate bookings or multi-property enquiries.
            </div>
            <div>
              <strong>Email</strong>
              hello@bookmystay.co.za
            </div>
            <div>
              <strong>Phone</strong>
              +27 11 000 0000
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
