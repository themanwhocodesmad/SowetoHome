const SERVICES = [
  {
    title: 'Concierge',
    copy: 'Dedicated support before and during every stay, from itinerary planning to on-the-ground recommendations, so guests always have a direct line to help.',
  },
  {
    title: 'Property Management',
    copy: 'End-to-end operations for owners, covering maintenance, styling, pricing strategy, and turnover, so every listing performs at its best.',
  },
  {
    title: 'Guest Relations',
    copy: 'Consistent, responsive communication across the guest journey, handling requests, reviews, and issue resolution with a concierge-level standard.',
  },
];

export function ServicesPage() {
  return (
    <div className="marketing-page">
      <section className="content-section">
        <span className="content-section__eyebrow">What We Offer</span>
        <h1>Full-service stewardship for stays and estates</h1>
        <p>
          Whether you are booking a signature estate or entrusting us with your property, our
          services are built around one goal: a consistently premium experience on both sides of
          the stay.
        </p>

        <div className="card-grid">
          {SERVICES.map((service) => (
            <div className="panel" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
