import { useState, type FormEvent } from 'react';
import type { CreatePropertyInput } from '@soweto-stays/shared';

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
}

// Shared by the host "create/edit my listing" flow and the admin "create on behalf of a
// host" flow (claude_plan.md §10) - only the API call the parent page wires up differs.
export function ListingForm({ initialValues, onSubmit, submitLabel = 'Save listing' }: ListingFormProps) {
  const [values, setValues] = useState<CreatePropertyInput>({ ...DEFAULT_VALUES, ...initialValues });
  const [amenitiesText, setAmenitiesText] = useState((initialValues?.amenities ?? []).join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <label>
        Title
        <input
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          required
        />
      </label>

      <label>
        Description
        <textarea
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          required
        />
      </label>

      <fieldset>
        <legend>Location</legend>
        <label>
          Address
          <input
            value={values.location.address}
            onChange={(e) =>
              setValues({ ...values, location: { ...values.location, address: e.target.value } })
            }
            required
          />
        </label>
        <label>
          Suburb
          <input
            value={values.location.suburb}
            onChange={(e) =>
              setValues({ ...values, location: { ...values.location, suburb: e.target.value } })
            }
            required
          />
        </label>
        <label>
          City
          <input
            value={values.location.city}
            onChange={(e) =>
              setValues({ ...values, location: { ...values.location, city: e.target.value } })
            }
            required
          />
        </label>
        <label>
          Province
          <input
            value={values.location.province}
            onChange={(e) =>
              setValues({ ...values, location: { ...values.location, province: e.target.value } })
            }
            required
          />
        </label>
        <label>
          Latitude
          <input
            type="number"
            step="any"
            value={values.location.lat}
            onChange={(e) =>
              setValues({ ...values, location: { ...values.location, lat: Number(e.target.value) } })
            }
            required
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            value={values.location.lng}
            onChange={(e) =>
              setValues({ ...values, location: { ...values.location, lng: Number(e.target.value) } })
            }
            required
          />
        </label>
      </fieldset>

      <label>
        Nightly rate (ZAR)
        <input
          type="number"
          min={0}
          value={values.stayRate}
          onChange={(e) => setValues({ ...values, stayRate: Number(e.target.value) })}
          required
        />
      </label>

      <label>
        Minimum nights
        <input
          type="number"
          min={1}
          value={values.minNights}
          onChange={(e) => setValues({ ...values, minNights: Number(e.target.value) })}
          required
        />
      </label>

      <label>
        Maximum nights
        <input
          type="number"
          min={1}
          value={values.maxNights}
          onChange={(e) => setValues({ ...values, maxNights: Number(e.target.value) })}
          required
        />
      </label>

      <label>
        Max guests
        <input
          type="number"
          min={1}
          value={values.maxGuests}
          onChange={(e) => setValues({ ...values, maxGuests: Number(e.target.value) })}
          required
        />
      </label>

      <label>
        Bedrooms
        <input
          type="number"
          min={0}
          value={values.bedrooms}
          onChange={(e) => setValues({ ...values, bedrooms: Number(e.target.value) })}
          required
        />
      </label>

      <label>
        Bathrooms
        <input
          type="number"
          min={0}
          value={values.bathrooms}
          onChange={(e) => setValues({ ...values, bathrooms: Number(e.target.value) })}
          required
        />
      </label>

      <label>
        Beds
        <input
          type="number"
          min={1}
          value={values.beds}
          onChange={(e) => setValues({ ...values, beds: Number(e.target.value) })}
          required
        />
      </label>

      <label>
        Property type
        <select
          value={values.propertyType}
          onChange={(e) =>
            setValues({
              ...values,
              propertyType: e.target.value as CreatePropertyInput['propertyType'],
            })
          }
        >
          <option value="entire_place">Entire place</option>
          <option value="private_room">Private room</option>
          <option value="shared_room">Shared room</option>
        </select>
      </label>

      <label>
        Amenities (comma-separated)
        <input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} />
      </label>

      <label>
        House rules
        <textarea
          value={values.houseRules}
          onChange={(e) => setValues({ ...values, houseRules: e.target.value })}
        />
      </label>

      <label>
        Check-in time
        <input
          type="time"
          value={values.checkInTime}
          onChange={(e) => setValues({ ...values, checkInTime: e.target.value })}
          required
        />
      </label>

      <label>
        Check-out time
        <input
          type="time"
          value={values.checkOutTime}
          onChange={(e) => setValues({ ...values, checkOutTime: e.target.value })}
          required
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
