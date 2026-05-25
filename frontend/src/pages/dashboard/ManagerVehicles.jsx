import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { createVehicle, deleteVehicle, fetchVehicles, updateVehicle } from '../../api/vehicles';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';

const initialForm = {
  vehicle_name: '',
  brand: '',
  vehicle_type: 'car',
  registration_number: '',
  rental_price_per_day: '',
  fuel_type: 'petrol',
  seating_capacity: 4,
  availability_status: true,
  description: '',
  image_url: '',
};

export default function ManagerVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const ownVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.manager_id === user.id), [vehicles, user.id]);

  async function loadVehicles() {
    setIsLoading(true);
    try {
      const response = await fetchVehicles({ page: 1, page_size: 50 });
      setVehicles(response.items);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function handleEdit(vehicle) {
    setEditingVehicleId(vehicle.id);
    setForm({
      vehicle_name: vehicle.vehicle_name,
      brand: vehicle.brand,
      vehicle_type: vehicle.vehicle_type,
      registration_number: vehicle.registration_number,
      rental_price_per_day: vehicle.rental_price_per_day,
      fuel_type: vehicle.fuel_type,
      seating_capacity: vehicle.seating_capacity,
      availability_status: vehicle.availability_status,
      description: vehicle.description || '',
      image_url: '',
    });
  }

  function resetForm() {
    setEditingVehicleId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    const { image_url: imageUrl, ...rest } = form;
    const payload = {
      ...rest,
      rental_price_per_day: Number(rest.rental_price_per_day),
      seating_capacity: Number(rest.seating_capacity),
    };

    try {
      if (editingVehicleId) {
        await updateVehicle(editingVehicleId, payload);
      } else {
        await createVehicle({
          ...payload,
          images: imageUrl ? [{ image_url: imageUrl, is_primary: true }] : [],
        });
      }
      resetForm();
      await loadVehicles();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(vehicleId) {
    await deleteVehicle(vehicleId);
    await loadVehicles();
  }

  if (isLoading) {
    return <Loader label="Loading fleet inventory..." fullScreen />;
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={handleSubmit} className="glass-panel space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl text-ink">{editingVehicleId ? 'Edit vehicle' : 'Add vehicle'}</h1>
          <button type="button" onClick={resetForm} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Reset
          </button>
        </div>
        {Object.keys(initialForm).map((field) =>
          field === 'availability_status' ? (
            <label key={field} className="inline-flex items-center gap-3 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={form.availability_status} onChange={(event) => setForm((current) => ({ ...current, availability_status: event.target.checked }))} />
              Available for booking
            </label>
          ) : field === 'description' ? (
            <textarea key={field} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Description" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          ) : field === 'vehicle_type' ? (
            <select key={field} value={form.vehicle_type} onChange={(event) => setForm((current) => ({ ...current, vehicle_type: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none">
              {['car', 'suv', 'van', 'truck', 'bike'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : field === 'fuel_type' ? (
            <select key={field} value={form.fuel_type} onChange={(event) => setForm((current) => ({ ...current, fuel_type: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none">
              {['petrol', 'diesel', 'electric', 'hybrid'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : (
            <input
              key={field}
              value={form[field]}
              type={['rental_price_per_day', 'seating_capacity'].includes(field) ? 'number' : 'text'}
              onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
              placeholder={field.replaceAll('_', ' ')}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          )
        )}
        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          {isSaving ? 'Saving...' : editingVehicleId ? 'Update vehicle' : 'Create vehicle'}
        </button>
      </form>

      <div className="space-y-5">
        <h2 className="font-heading text-4xl text-ink">Managed fleet</h2>
        {ownVehicles.map((vehicle) => (
          <div key={vehicle.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-2xl text-ink">{vehicle.vehicle_name}</h3>
                <p className="text-sm text-slate-500">
                  {vehicle.brand} · {vehicle.vehicle_type} · {vehicle.registration_number}
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => handleEdit(vehicle)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(vehicle.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
