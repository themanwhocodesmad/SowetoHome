import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PROVINCES, type CreatePropertyInput } from '@soweto-stays/shared';

const DEFAULT_VALUES: CreatePropertyInput = {
  title: '',
  description: '',
  location: { address: '', suburb: '', city: '', province: '', lat: 0, lng: 0 },
  stayRate: 0,
  minNights: 1,
  maxNights: 14,
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
  beds: 1,
  amenities: [],
  propertyType: 'entire_place',
  houseRules: '',
  checkInTime: '14:00',
  checkOutTime: '10:00',
};

interface ListingFormProps {
  initialValues?: Partial<CreatePropertyInput>;
  onSubmit: (values: CreatePropertyInput) => Promise<void>;
  submitLabel?: string;
  // When provided, the form shows a photo picker; the parent owns the files and uploads
  // them itself (images can only be uploaded once the property exists and has an id).
  files?: File[];
  onFilesChange?: (files: File[]) => void;
}

// Shared by the host "create/edit my listing" flow and the admin "create on behalf of a
// host" flow (claude_plan.md §10) - only the API call the parent page wires up differs.
export function ListingForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save listing',
  files,
  onFilesChange,
}: ListingFormProps) {
  const [values, setValues] = useState<CreatePropertyInput>({ ...DEFAULT_VALUES, ...initialValues });
  const [amenitiesText, setAmenitiesText] = useState((initialValues?.amenities ?? []).join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(
    () => (files ?? []).map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const set = (patch: Partial<CreatePropertyInput>) => setValues((v) => ({ ...v, ...patch }));
  const setLocation = (patch: Partial<CreatePropertyInput['location']>) =>
    setValues((v) => ({ ...v, location: { ...v.location, ...patch } }));

  const handleAddFiles = (added: FileList | null) => {
    if (!added || !onFilesChange) return;
    onFilesChange([...(files ?? []), ...Array.from(added)].slice(0, 8));
  };

  const handleRemoveFile = (index: number) => {
    if (!onFilesChange) return;
    onFilesChange((files ?? []).filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const amenities = amenitiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      await onSubmit({ ...values, amenities });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="listing-form" onSubmit={(e) => void handleSubmit(e)}>
      {error && <p className="error">{error}</p>}

      <div className="listing-form__section">
        <h3>Basics</h3>
        <label>
          Title
          <input
            value={values.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Garden cottage in Jabavu"
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={values.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={4}
            placeholder="What makes your place special?"
            required
          />
        </label>
        <div className="listing-form__row listing-form__row--2">
          <label>
            Property type
            <select
              value={values.propertyType}
              onChange={(e) => set({ propertyType: e.target.value as CreatePropertyInput['propertyType'] })}
            >
              <option value="entire_place">Entire place</option>
              <option value="private_room">Private room</option>
              <option value="shared_room">Shared room</option>
            </select>
          </label>
          <label>
            Nightly rate (ZAR)
            <input
              type="number"
              min={1}
              value={values.stayRate || ''}
              onChange={(e) => set({ stayRate: Number(e.target.value) })}
              placeholder="850"
              required
            />
          </label>
        </div>
      </div>

      <div className="listing-form__section">
        <h3>Location</h3>
        <label>
          Address
          <input
            value={values.location.address}
            onChange={(e) => setLocation({ address: e.target.value })}
            required
          />
        </label>
        <div className="listing-form__row listing-form__row--3">
          <label>
            Suburb
            <input
              value={values.location.suburb}
              onChange={(e) => setLocation({ suburb: e.target.value })}
              required
            />
          </label>
          <label>
            City
            <input
              value={values.location.city}
              onChange={(e) => setLocation({ city: e.target.value })}
              required
            />
          </label>
          <label>
            Province
            <select
              value={values.location.province}
              onChange={(e) => setLocation({ province: e.target.value })}
              required
            >
              <option value="" disabled>
                Select...
              </option>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="listing-form__row listing-form__row--2">
          <label>
            Latitude
            <input
              type="number"
              step="any"
              value={values.location.lat}
              onChange={(e) => setLocation({ lat: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="any"
              value={values.location.lng}
              onChange={(e) => setLocation({ lng: Number(e.target.value) })}
              required
            />
          </label>
        </div>
      </div>

      <div className="listing-form__section">
        <h3>Capacity &amp; stays</h3>
        <div className="listing-form__row listing-form__row--4">
          <label>
            Guests
            <input
              type="number"
              min={1}
              value={values.maxGuests}
              onChange={(e) => set({ maxGuests: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Bedrooms
            <input
              type="number"
              min={0}
              value={values.bedrooms}
              onChange={(e) => set({ bedrooms: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Beds
            <input
              type="number"
              min={1}
              value={values.beds}
              onChange={(e) => set({ beds: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Bathrooms
            <input
              type="number"
              min={0}
              value={values.bathrooms}
              onChange={(e) => set({ bathrooms: Number(e.target.value) })}
              required
            />
          </label>
        </div>
        <div className="listing-form__row listing-form__row--4">
          <label>
            Min nights
            <input
              type="number"
              min={1}
              value={values.minNights}
              onChange={(e) => set({ minNights: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Max nights
            <input
              type="number"
              min={1}
              value={values.maxNights}
              onChange={(e) => set({ maxNights: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Check-in
            <input
              type="time"
              value={values.checkInTime}
              onChange={(e) => set({ checkInTime: e.target.value })}
              required
            />
          </label>
          <label>
            Check-out
            <input
              type="time"
              value={values.checkOutTime}
              onChange={(e) => set({ checkOutTime: e.target.value })}
              required
            />
          </label>
        </div>
      </div>

      <div className="listing-form__section">
        <h3>Details</h3>
        <label>
          Amenities <span className="listing-form__hint">comma-separated, e.g. wifi, parking, pool</span>
          <input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} />
        </label>
        <label>
          House rules <span className="listing-form__hint">optional</span>
          <textarea
            value={values.houseRules}
            onChange={(e) => set({ houseRules: e.target.value })}
            rows={2}
          />
        </label>
      </div>

      {onFilesChange && (
        <div className="listing-form__section">
          <h3>
            Photos <span className="listing-form__hint">{previews.length}/8 &middot; JPEG, PNG or WEBP</span>
          </h3>
          <div className="photo-grid photo-grid--compact">
            {previews.map((preview, index) => (
              <div key={preview.url} className="photo-grid__item">
                <img src={preview.url} alt={`Photo ${index + 1}`} />
                <button
                  type="button"
                  className="photo-grid__remove"
                  onClick={() => handleRemoveFile(index)}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
            {previews.length < 8 && (
              <label className="photo-grid__add">
                + Add photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    handleAddFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      <div className="listing-form__actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
