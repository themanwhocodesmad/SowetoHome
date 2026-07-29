import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AboutContentDto, ContactContentDto, ServicesContentDto } from '@soweto-stays/shared';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_SERVICES_CONTENT,
} from '@soweto-stays/shared';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

type Tab = 'about' | 'services' | 'contact';
const TABS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'contact', label: 'Contact' },
];

function AboutEditor() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin', 'pages', 'about'], queryFn: adminApi.getAboutContent });
  const [content, setContent] = useState<AboutContentDto>(DEFAULT_ABOUT_CONTENT);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) setContent(data);
  }, [data]);

  const handleSave = async () => {
    setStatus(null);
    setIsSaving(true);
    try {
      await adminApi.updateAboutContent(content);
      await queryClient.invalidateQueries({ queryKey: ['site-content', 'about'] });
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      {status && <p>{status}</p>}
      <h3>Our Vision section</h3>
      <label>
        Eyebrow
        <input
          value={content.visionEyebrow}
          onChange={(e) => setContent((c) => ({ ...c, visionEyebrow: e.target.value }))}
        />
      </label>
      <label>
        Title
        <input
          value={content.visionTitle}
          onChange={(e) => setContent((c) => ({ ...c, visionTitle: e.target.value }))}
        />
      </label>
      <label>
        Paragraph 1
        <textarea
          rows={4}
          value={content.visionCopy1}
          onChange={(e) => setContent((c) => ({ ...c, visionCopy1: e.target.value }))}
        />
      </label>
      <label>
        Paragraph 2
        <textarea
          rows={3}
          value={content.visionCopy2}
          onChange={(e) => setContent((c) => ({ ...c, visionCopy2: e.target.value }))}
        />
      </label>

      <h3>Corporate Booking Solutions section</h3>
      <label>
        Eyebrow
        <input
          value={content.corporateEyebrow}
          onChange={(e) => setContent((c) => ({ ...c, corporateEyebrow: e.target.value }))}
        />
      </label>
      <label>
        Title
        <input
          value={content.corporateTitle}
          onChange={(e) => setContent((c) => ({ ...c, corporateTitle: e.target.value }))}
        />
      </label>
      <label>
        Paragraph
        <textarea
          rows={3}
          value={content.corporateCopy}
          onChange={(e) => setContent((c) => ({ ...c, corporateCopy: e.target.value }))}
        />
      </label>

      <button type="button" disabled={isSaving} onClick={() => void handleSave()}>
        {isSaving ? 'Saving...' : 'Save About page'}
      </button>
    </div>
  );
}

function ServicesEditor() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'pages', 'services'],
    queryFn: adminApi.getServicesContent,
  });
  const [content, setContent] = useState<ServicesContentDto>(DEFAULT_SERVICES_CONTENT);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) setContent(data);
  }, [data]);

  const updateService = (index: number, field: 'title' | 'copy', value: string) => {
    setContent((c) => ({
      ...c,
      services: c.services.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const addService = () => {
    setContent((c) => ({ ...c, services: [...c.services, { title: '', copy: '' }] }));
  };

  const removeService = (index: number) => {
    setContent((c) => ({ ...c, services: c.services.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setStatus(null);
    setIsSaving(true);
    try {
      await adminApi.updateServicesContent(content);
      await queryClient.invalidateQueries({ queryKey: ['site-content', 'services'] });
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      {status && <p>{status}</p>}
      <label>
        Eyebrow
        <input value={content.eyebrow} onChange={(e) => setContent((c) => ({ ...c, eyebrow: e.target.value }))} />
      </label>
      <label>
        Title
        <input value={content.title} onChange={(e) => setContent((c) => ({ ...c, title: e.target.value }))} />
      </label>
      <label>
        Subtitle
        <textarea
          rows={3}
          value={content.subtitle}
          onChange={(e) => setContent((c) => ({ ...c, subtitle: e.target.value }))}
        />
      </label>

      <h3>Services</h3>
      {content.services.map((service, index) => (
        <div key={index} className="panel" style={{ marginBottom: '0.75rem' }}>
          <label>
            Title
            <input value={service.title} onChange={(e) => updateService(index, 'title', e.target.value)} />
          </label>
          <label>
            Copy
            <textarea
              rows={2}
              value={service.copy}
              onChange={(e) => updateService(index, 'copy', e.target.value)}
            />
          </label>
          <button type="button" className="button button--ghost" onClick={() => removeService(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="button button--outline" onClick={addService} style={{ marginBottom: '1rem' }}>
        + Add service
      </button>
      <div>
        <button type="button" disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? 'Saving...' : 'Save Services page'}
        </button>
      </div>
    </div>
  );
}

function ContactEditor() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin', 'pages', 'contact'], queryFn: adminApi.getContactContent });
  const [content, setContent] = useState<ContactContentDto>(DEFAULT_CONTACT_CONTENT);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) setContent(data);
  }, [data]);

  const handleSave = async () => {
    setStatus(null);
    setIsSaving(true);
    try {
      await adminApi.updateContactContent(content);
      await queryClient.invalidateQueries({ queryKey: ['site-content', 'contact'] });
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      {status && <p>{status}</p>}
      <label>
        Eyebrow
        <input value={content.eyebrow} onChange={(e) => setContent((c) => ({ ...c, eyebrow: e.target.value }))} />
      </label>
      <label>
        Title
        <input value={content.title} onChange={(e) => setContent((c) => ({ ...c, title: e.target.value }))} />
      </label>
      <label>
        Subtitle
        <textarea
          rows={3}
          value={content.subtitle}
          onChange={(e) => setContent((c) => ({ ...c, subtitle: e.target.value }))}
        />
      </label>
      <label>
        Consultation heading
        <input
          value={content.consultationTitle}
          onChange={(e) => setContent((c) => ({ ...c, consultationTitle: e.target.value }))}
        />
      </label>
      <label>
        Consultation copy
        <textarea
          rows={2}
          value={content.consultationCopy}
          onChange={(e) => setContent((c) => ({ ...c, consultationCopy: e.target.value }))}
        />
      </label>
      <label>
        Email
        <input value={content.email} onChange={(e) => setContent((c) => ({ ...c, email: e.target.value }))} />
      </label>
      <label>
        Phone
        <input value={content.phone} onChange={(e) => setContent((c) => ({ ...c, phone: e.target.value }))} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
        <input
          type="checkbox"
          checked={content.showPhone}
          onChange={(e) => setContent((c) => ({ ...c, showPhone: e.target.checked }))}
        />
        Show phone number on the Contact page
      </label>
      <button type="button" disabled={isSaving} onClick={() => void handleSave()}>
        {isSaving ? 'Saving...' : 'Save Contact page'}
      </button>
    </div>
  );
}

export function AdminPagesPage() {
  const [tab, setTab] = useState<Tab>('about');

  return (
    <DashboardLayout title="Pages" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Page content</h2>
      </div>
      <p className="property-card__sub">
        Edit the copy shown on the About, Services, and Contact pages - no code deploy needed.
      </p>

      <div className="tab-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'button' : 'button button--outline'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'about' && <AboutEditor />}
      {tab === 'services' && <ServicesEditor />}
      {tab === 'contact' && <ContactEditor />}
    </DashboardLayout>
  );
}
