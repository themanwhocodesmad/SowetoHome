import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BASE_SIZE_SCALES,
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  SECTION_KEYS,
  SECTION_LABELS,
  SECTION_SPACING_PRESETS,
  type BaseSizeScale,
  type BodyFontKey,
  type HeadingFontKey,
  type SectionSpacingMap,
  type TypographySettings,
} from '@soweto-stays/shared';
import { adminApi } from '../../api/admin.js';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { ADMIN_NAV_ITEMS } from '../../components/dashboardNav.js';
import { PaymentGatewaySettingsPanel } from '../../components/PaymentGatewaySettingsPanel.js';

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
  });

  const [cancellationFreeWindowHours, setCancellationFreeWindowHours] = useState(0);
  const [sectionSpacing, setSectionSpacing] = useState<SectionSpacingMap | null>(null);
  const [typography, setTypography] = useState<TypographySettings | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [typographyStatus, setTypographyStatus] = useState<string | null>(null);
  const [spacingStatus, setSpacingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setCancellationFreeWindowHours(data.cancellationFreeWindowHours);
      setSectionSpacing(data.sectionSpacing);
      setTypography(data.typography);
    }
  }, [data]);

  const handleSave = async () => {
    setStatus(null);
    try {
      await adminApi.updateSettings({ cancellationFreeWindowHours });
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save settings');
    }
  };

  const handleSaveTypography = async () => {
    if (!typography) return;
    setTypographyStatus(null);
    try {
      await adminApi.updateTypography(typography);
      await queryClient.invalidateQueries({ queryKey: ['site-theme'] });
      setTypographyStatus('Saved. Changes apply across the whole site.');
    } catch (err) {
      setTypographyStatus(err instanceof Error ? err.message : 'Could not save typography');
    }
  };

  const handleSaveSpacing = async () => {
    if (!sectionSpacing) return;
    setSpacingStatus(null);
    try {
      await adminApi.updateSectionSpacing(sectionSpacing);
      await queryClient.invalidateQueries({ queryKey: ['site-theme'] });
      setSpacingStatus('Saved.');
    } catch (err) {
      setSpacingStatus(err instanceof Error ? err.message : 'Could not save section spacing');
    }
  };

  return (
    <DashboardLayout title="Settings" navItems={ADMIN_NAV_ITEMS}>
      <div className="section-head">
        <h2>Platform settings</h2>
      </div>
      <p className="property-card__sub">
        These apply to new bookings going forward - they don't require a deploy to change.
      </p>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Could not load settings.</p>}

      {data && (
        <>
          <div className="panel" style={{ maxWidth: 420, marginBottom: '1.5rem' }}>
            {status && <p>{status}</p>}
            <label>
              Free cancellation window (hours before check-in)
              <input
                type="number"
                min={0}
                value={cancellationFreeWindowHours}
                onChange={(e) => setCancellationFreeWindowHours(Number(e.target.value))}
              />
            </label>
            <button type="button" onClick={() => void handleSave()}>
              Save settings
            </button>
          </div>

          <PaymentGatewaySettingsPanel />

          <div className="panel" style={{ maxWidth: 420, marginBottom: '1.5rem' }}>
            <h3>Typography</h3>
            <p className="property-card__sub">Applies site-wide, across every page.</p>
            {typographyStatus && <p>{typographyStatus}</p>}
            {typography && (
              <>
                <label>
                  Heading font
                  <select
                    value={typography.headingFont}
                    onChange={(e) =>
                      setTypography((t) => (t ? { ...t, headingFont: e.target.value as HeadingFontKey } : t))
                    }
                  >
                    {HEADING_FONT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Body font
                  <select
                    value={typography.bodyFont}
                    onChange={(e) =>
                      setTypography((t) => (t ? { ...t, bodyFont: e.target.value as BodyFontKey } : t))
                    }
                  >
                    {BODY_FONT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Base text size
                  <select
                    value={typography.baseSizeScale}
                    onChange={(e) =>
                      setTypography((t) =>
                        t ? { ...t, baseSizeScale: e.target.value as BaseSizeScale } : t,
                      )
                    }
                  >
                    {BASE_SIZE_SCALES.map((scale) => (
                      <option key={scale} value={scale}>
                        {scale.charAt(0).toUpperCase() + scale.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => void handleSaveTypography()}>
                  Save typography
                </button>
              </>
            )}
          </div>

          <div className="panel" style={{ maxWidth: 480 }}>
            <h3>Section spacing</h3>
            <p className="property-card__sub">
              Controls the vertical padding (breathing room) of each section independently.
            </p>
            {spacingStatus && <p>{spacingStatus}</p>}
            {sectionSpacing && (
              <>
                {SECTION_KEYS.map((key) => (
                  <label key={key}>
                    {SECTION_LABELS[key]}
                    <select
                      value={sectionSpacing[key]}
                      onChange={(e) =>
                        setSectionSpacing((prev) =>
                          prev ? { ...prev, [key]: e.target.value as SectionSpacingMap[typeof key] } : prev,
                        )
                      }
                    >
                      {SECTION_SPACING_PRESETS.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset.charAt(0).toUpperCase() + preset.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <button type="button" onClick={() => void handleSaveSpacing()}>
                  Save section spacing
                </button>
              </>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
