import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchPickupAddresses } from '../../api/pickupAddresses';
import Loader from '../common/Loader';

export default function PickupAddressSelect({ city, value, onChange, disabled = false }) {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!city) {
      setAddresses([]);
      onChange('');
      return;
    }

    onChange('');
    let ignore = false;
    setIsLoading(true);
    setLoadError('');
    fetchPickupAddresses(city)
      .then((data) => {
        if (ignore) return;
        setAddresses(data);
        if (data.length > 0 && !value) {
          onChange(data[0].address);
        }
      })
      .catch(() => {
        if (!ignore) setLoadError('Unable to load pickup locations for this region.');
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!city) return null;

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
        <MapPin className="h-4 w-4 text-brand" />
        Pickup location ({city})
      </p>
      {isLoading ? <Loader label="Loading pickup locations..." /> : null}
      {loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}
      {!isLoading && !loadError && addresses.length > 0 ? (
        <div className="space-y-2">
          {addresses.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                value === item.address
                  ? 'border-brand bg-brand/5'
                  : 'border-slate-200 hover:border-brand/40'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="pickup_address"
                value={item.address}
                checked={value === item.address}
                onChange={() => onChange(item.address)}
                disabled={disabled}
                className="mt-1 text-brand focus:ring-brand"
              />
              <span>
                <span className="font-semibold text-ink">{item.label}</span>
                <span className="mt-0.5 block text-slate-500">{item.address}</span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
      {!isLoading && !loadError && addresses.length === 0 ? (
        <p className="text-sm text-slate-500">No pickup locations are configured for this region yet.</p>
      ) : null}
    </div>
  );
}
