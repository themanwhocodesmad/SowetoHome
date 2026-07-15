import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HomepageContentDto } from '@soweto-stays/shared';
import { DEFAULT_HOMEPAGE_CONTENT, SITE_IMAGE_SLOTS } from '@soweto-stays/shared';
import { adminApi } from '../../api/admin.js';
import { apiBaseUrl } from '../../api/client.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';

export function AdminHomepagePage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'homepage'],
    queryFn: adminApi.getHomepage,
  });

  const propertiesQuery = useQuery({
    queryKey: ['admin', 'properties', 'published'],
    queryFn: () => adminApi.listProperties(1, 100, 'published'),
  });

  const [content, setContent] = useState<HomepageContentDto>(DEFAULT_HOMEPAGE_CONTENT);
  const [featuredPropertyIds, setFeaturedPropertyIds] = useState<string[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setContent(data.content);
      setFeaturedPropertyIds(data.featuredPropertyIds);
    }
  }, [data]);

  const handleUpload = async (key: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setSlotError((prev) => ({ ...prev, [key]: '' }));
    setBusyKey(key);
    try {
      await adminApi.uploadSiteImage(key, file);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
    } catch (err) {
      setSlotError((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'Could not upload image',
      }));
    } finally {
      setBusyKey(null);
    }
  };

  const handleResetImage = async (key: string) => {
    setSlotError((prev) => ({ ...prev, [key]: '' }));
    setBusyKey(key);
    try {
      await adminApi.deleteSiteImage(key);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
    } catch (err) {
      setSlotError((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'Could not reset image',
      }));
    } finally {
      setBusyKey(null);
    }
  };

  const toggleFeatured = (propertyId: string) => {
    setFeaturedPropertyIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    );
  };

  const handleSave = async () => {
    setStatus(null);
    setIsSaving(true);
    try {
      await adminApi.updateHomepage({ content, featuredPropertyIds });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
      setStatus('Homepage saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save homepage');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStat = (index: number, field: 'value' | 'label', value: string) => {
    setContent((prev) => ({
      ...prev,
      trustStats: prev.trustStats.map((stat, i) => (i === index ? { ...stat, [field]: value } : stat)),
    }));
  };

  const updateStep = (index: number, field: 'number' | 'title' | 'copy', value: string) => {
    setContent((prev) => ({
      ...prev,
      valueSteps: prev.valueSteps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    }));
  };

  return (
    <DashboardLayout title="Homepage" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Homepage content</h2>
      </div>
      <p className="property-card__sub">
        Manage the public homepage — hero copy, stats, featured listings, and marketing photos — without
        a code deploy.
      </p>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load homepage settings.</p>}

      {data && (
        <>
          <section className="panel" style={{ marginBottom: '1.5rem' }}>
            <h3>Marketing photos</h3>
            {SITE_IMAGE_SLOTS.map((slot) => {
              const currentPath = data.siteImages[slot.key];
              return (
                <div key={slot.key} className="site-image-row">
                  <div>
                    <strong>{slot.label}</strong>
                    {slotError[slot.key] && <p className="error">{slotError[slot.key]}</p>}
                  </div>
                  <div className="site-image-row__preview">
                    {currentPath ? (
                      <img src={`${apiBaseUrl()}${currentPath}`} alt={slot.label} />
                    ) : (
                      <span className="property-card__sub">Using default / listing fallback</span>
                    )}
                  </div>
                  <div className="site-image-row__actions">
                    <label className="button button--outline">
                      {busyKey === slot.key ? 'Uploading...' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        disabled={busyKey === slot.key}
                        onChange={(e) => void handleUpload(slot.key, e.target.files)}
                      />
                    </label>
                    {currentPath && (
                      <button
                        type="button"
                        className="button button--ghost"
                        disabled={busyKey === slot.key}
                        onClick={() => void handleResetImage(slot.key)}
                      >
                        Reset to default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="panel" style={{ marginBottom: '1.5rem' }}>
            <h3>Hero &amp; discovery copy</h3>
            <label>
              Hero eyebrow
              <input
                value={content.heroEyebrow}
                onChange={(e) => setContent((c) => ({ ...c, heroEyebrow: e.target.value }))}
              />
            </label>
            <label>
              Hero title (before accent)
              <input
                value={content.heroTitle}
                onChange={(e) => setContent((c) => ({ ...c, heroTitle: e.target.value }))}
              />
            </label>
            <label>
              Hero title accent
              <input
                value={content.heroTitleAccent}
                onChange={(e) => setContent((c) => ({ ...c, heroTitleAccent: e.target.value }))}
              />
            </label>
            <label>
              Hero subtitle
              <textarea
                rows={3}
                value={content.heroSubtitle}
                onChange={(e) => setContent((c) => ({ ...c, heroSubtitle: e.target.value }))}
              />
            </label>
            <label>
              Discovery section title
              <input
                value={content.discoveryTitle}
                onChange={(e) => setContent((c) => ({ ...c, discoveryTitle: e.target.value }))}
              />
            </label>
            <label>
              Discovery section subtitle
              <input
                value={content.discoverySubtitle}
                onChange={(e) => setContent((c) => ({ ...c, discoverySubtitle: e.target.value }))}
              />
            </label>
          </section>

          <section className="panel" style={{ marginBottom: '1.5rem' }}>
            <h3>Trust stats</h3>
            {content.trustStats.map((stat, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <label>
                  Value
                  <input value={stat.value} onChange={(e) => updateStat(index, 'value', e.target.value)} />
                </label>
                <label>
                  Label
                  <input value={stat.label} onChange={(e) => updateStat(index, 'label', e.target.value)} />
                </label>
              </div>
            ))}
          </section>

          <section className="panel" style={{ marginBottom: '1.5rem' }}>
            <h3>Value proposition</h3>
            <label>
              Eyebrow
              <input
                value={content.valuePropEyebrow}
                onChange={(e) => setContent((c) => ({ ...c, valuePropEyebrow: e.target.value }))}
              />
            </label>
            <label>
              Title
              <input
                value={content.valuePropTitle}
                onChange={(e) => setContent((c) => ({ ...c, valuePropTitle: e.target.value }))}
              />
            </label>
            <label>
              Paragraph 1
              <textarea
                rows={3}
                value={content.valuePropCopy1}
                onChange={(e) => setContent((c) => ({ ...c, valuePropCopy1: e.target.value }))}
              />
            </label>
            <label>
              Paragraph 2
              <textarea
                rows={3}
                value={content.valuePropCopy2}
                onChange={(e) => setContent((c) => ({ ...c, valuePropCopy2: e.target.value }))}
              />
            </label>
            <h4>Steps</h4>
            {content.valueSteps.map((step, index) => (
              <div key={index} className="panel" style={{ marginBottom: '0.75rem' }}>
                <label>
                  Number
                  <input value={step.number} onChange={(e) => updateStep(index, 'number', e.target.value)} />
                </label>
                <label>
                  Title
                  <input value={step.title} onChange={(e) => updateStep(index, 'title', e.target.value)} />
                </label>
                <label>
                  Copy
                  <textarea
                    rows={2}
                    value={step.copy}
                    onChange={(e) => updateStep(index, 'copy', e.target.value)}
                  />
                </label>
              </div>
            ))}
          </section>

          <section className="panel" style={{ marginBottom: '1.5rem' }}>
            <h3>Featured listings</h3>
            <p className="property-card__sub">
              Select published listings to show on the homepage when visitors are not searching. Leave
              none selected to show search results instead.
            </p>
            {propertiesQuery.isLoading && <p>Loading listings...</p>}
            <ul className="booking-list">
              {propertiesQuery.data?.items.map((property) => (
                <li key={property.id}>
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={featuredPropertyIds.includes(property.id)}
                      onChange={() => toggleFeatured(property.id)}
                    />
                    {property.title} — {property.location.suburb}, R{property.stayRate}/night
                  </label>
                </li>
              ))}
            </ul>
            {propertiesQuery.data?.items.length === 0 && (
              <p>No published listings yet. Approve listings under Admin → Listings first.</p>
            )}
          </section>

          {status && <p>{status}</p>}
          <button type="button" className="button" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? 'Saving...' : 'Save homepage'}
          </button>
        </>
      )}
    </DashboardLayout>
  );
}