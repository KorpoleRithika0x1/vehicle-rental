import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { createVehicle, deleteVehicle, fetchVehicles, updateVehicle, uploadVehicleImage } from '../../api/vehicles';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';

const initialForm = {
  vehicle_name: '',
  brand: '',
  vehicle_type: 'car',
  registration_number: '',
  rental_price_per_day: '',
  fuel_type: 'petrol',
  seating_capacity: '',
  vehicle_count: 1,
  availability_status: true,
  description: '',
  image_url: '',
};

const vehicleTypeOptions = [
  { value: 'car', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Scooty' },
  { value: 'bike', label: 'Bike' },
];

function formatVehicleType(type) {
  return vehicleTypeOptions.find((option) => option.value === type)?.label || type;
}

function getStockBadge(vehicle) {
  const count = Number(vehicle.vehicle_count ?? 0);
  if (!vehicle.availability_status || count === 0) return { label: 'Out of Stock', className: 'bg-rose-100 text-rose-700' };
  if (count === 1) return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Available', className: 'bg-emerald-100 text-emerald-700' };
}

function EditModal({ form, setForm, onSubmit, onClose, isSaving, isUploadingImage, onImageUpload, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="font-heading text-xl text-ink">Edit Vehicle</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={form.vehicle_name} required onChange={(e) => setForm((c) => ({ ...c, vehicle_name: e.target.value }))} placeholder="Vehicle name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
            <input value={form.brand} required onChange={(e) => setForm((c) => ({ ...c, brand: e.target.value }))} placeholder="Brand" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
            <input value={form.registration_number} required onChange={(e) => setForm((c) => ({ ...c, registration_number: e.target.value }))} placeholder="Registration number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
            <select value={form.vehicle_type} onChange={(e) => setForm((c) => ({ ...c, vehicle_type: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
              {vehicleTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={form.fuel_type} onChange={(e) => setForm((c) => ({ ...c, fuel_type: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
              {['petrol', 'diesel', 'electric', 'hybrid'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input value={form.rental_price_per_day} type="number" required onChange={(e) => setForm((c) => ({ ...c, rental_price_per_day: e.target.value }))} placeholder="Price per day" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
            <input value={form.seating_capacity} type="number" required onChange={(e) => setForm((c) => ({ ...c, seating_capacity: e.target.value }))} placeholder="Seating capacity" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
            <input value={form.vehicle_count} type="number" min="0" required onChange={(e) => setForm((c) => ({ ...c, vehicle_count: e.target.value }))} placeholder="Vehicle count" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={form.availability_status} onChange={(e) => setForm((c) => ({ ...c, availability_status: e.target.checked }))} />
              Available for booking
            </label>
            <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} rows={2} placeholder="Description" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none md:col-span-2" />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">Vehicle image</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {isUploadingImage ? 'Uploading...' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} disabled={isUploadingImage} />
              </label>
              {form.image_url ? <span className="text-xs text-emerald-600">Image ready</span> : <span className="text-xs text-slate-400">No image</span>}
            </div>
            {form.image_url ? <img src={form.image_url} alt="preview" className="mt-2 h-20 w-32 rounded-lg object-cover" /> : null}
          </div>
          {error ? <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isSaving || isUploadingImage} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? 'Updating...' : 'Update vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerVehicles() {
  const location = useLocation();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stockDrafts, setStockDrafts] = useState({});
  const [savingStockId, setSavingStockId] = useState(null);
  const [error, setError] = useState('');
  const showToast = useUiStore((state) => state.showToast);

  const ownVehicles = useMemo(() => vehicles.filter((v) => v.manager_id === user.id), [vehicles, user.id]);
  const isAddCarPage = location.pathname.endsWith('/vehicles/add');

  async function loadVehicles() {
    setIsLoading(true);
    try {
      const response = await fetchVehicles({ page: 1, page_size: 50 });
      setVehicles(response.items);
      setStockDrafts(Object.fromEntries(response.items.map((vehicle) => [vehicle.id, String(vehicle.vehicle_count ?? 0)])));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadVehicles(); }, []);

  useEffect(() => {
    if (!isAddCarPage || !location.state?.vehicle) return;
    const vehicle = location.state.vehicle;
    setEditingVehicleId(vehicle.id);
    setForm({
      vehicle_name: vehicle.vehicle_name,
      brand: vehicle.brand,
      vehicle_type: vehicle.vehicle_type,
      registration_number: vehicle.registration_number,
      rental_price_per_day: vehicle.rental_price_per_day,
      fuel_type: vehicle.fuel_type,
      seating_capacity: vehicle.seating_capacity,
      vehicle_count: vehicle.vehicle_count ?? 1,
      availability_status: vehicle.availability_status,
      description: vehicle.description || '',
      image_url: vehicle.primary_image || '',
    });
  }, [isAddCarPage, location.state]);

  function handleEdit(vehicle) {
    if (vehicle.has_active_booking) {
      showToast({ type: 'error', message: 'This vehicle has active or pending bookings and cannot be edited.' });
      return;
    }
    setEditingVehicleId(vehicle.id);
    setForm({
      vehicle_name: vehicle.vehicle_name,
      brand: vehicle.brand,
      vehicle_type: vehicle.vehicle_type,
      registration_number: vehicle.registration_number,
      rental_price_per_day: vehicle.rental_price_per_day,
      fuel_type: vehicle.fuel_type,
      seating_capacity: vehicle.seating_capacity,
      vehicle_count: vehicle.vehicle_count ?? 1,
      availability_status: vehicle.availability_status,
      description: vehicle.description || '',
      image_url: vehicle.primary_image || '',
    });
  }

  function closeModal() {
    setEditingVehicleId(null);
    setForm(initialForm);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const { image_url: imageUrl, ...rest } = form;
    const payload = {
      ...rest,
      rental_price_per_day: Number(rest.rental_price_per_day),
      seating_capacity: Number(rest.seating_capacity),
      vehicle_count: Number(rest.vehicle_count),
    };

    try {
      if (editingVehicleId) {
        await updateVehicle(editingVehicleId, payload);
        showToast({ type: 'success', message: 'Vehicle updated successfully.' });
        closeModal();
      } else {
        await createVehicle({ ...payload, images: imageUrl ? [{ image_url: imageUrl, is_primary: true }] : [] });
        showToast({ type: 'success', message: 'Vehicle created successfully.' });
        setForm(initialForm);
      }
      await loadVehicles();
    } catch (requestError) {
      const message = requestError?.normalizedMessage || 'Failed to save vehicle.';
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(vehicleId) {
    const vehicle = ownVehicles.find((item) => item.id === vehicleId);
    if (vehicle?.has_active_booking) {
      showToast({ type: 'error', message: 'This vehicle has active or pending bookings and cannot be deleted.' });
      return;
    }
    try {
      await deleteVehicle(vehicleId);
      showToast({ type: 'success', message: 'Vehicle deleted successfully.' });
      await loadVehicles();
    } catch (requestError) {
      showToast({ type: 'error', message: requestError?.normalizedMessage || 'Failed to delete vehicle.' });
    }
  }

  async function handleStockSave(vehicle) {
    const nextCount = Number(stockDrafts[vehicle.id]);
    if (!Number.isInteger(nextCount) || nextCount < 0) {
      showToast({ type: 'error', message: 'Vehicle count must be a whole number 0 or greater.' });
      return;
    }
    setSavingStockId(vehicle.id);
    try {
      await updateVehicle(vehicle.id, { vehicle_count: nextCount });
      showToast({ type: 'success', message: 'Stock count updated.' });
      await loadVehicles();
    } catch (requestError) {
      showToast({ type: 'error', message: requestError?.normalizedMessage || 'Failed to update stock count.' });
    } finally {
      setSavingStockId(null);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setIsUploadingImage(true);
    try {
      const response = await uploadVehicleImage(file);
      setForm((current) => ({ ...current, image_url: response.image_url }));
      showToast({ type: 'success', message: 'Vehicle image uploaded.' });
    } catch (requestError) {
      const message = requestError?.normalizedMessage || 'Failed to upload image.';
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  }

  if (isLoading) return <Loader label="Loading fleet inventory..." fullScreen />;

  return (
    <DashboardShell
      title={isAddCarPage ? 'Add Car' : 'Manage Vehicles'}
      subtitle={
        isAddCarPage
          ? 'Create a new vehicle listing with pricing, availability, and image.'
          : 'Edit or delete your existing fleet listings.'
      }
      links={[
        { label: 'Dashboard', to: '/dashboard/manager', end: true },
        { label: 'Add Car', to: '/dashboard/manager/vehicles/add', end: true },
        { label: 'Manage Vehicles', to: '/dashboard/manager/vehicles', end: true },
        { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
      ]}
    >
      {/* Edit modal — only shown when editing */}
      {editingVehicleId && !isAddCarPage ? (
        <EditModal
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isSaving={isSaving}
          isUploadingImage={isUploadingImage}
          onImageUpload={handleImageUpload}
          error={error}
        />
      ) : null}

      {/* Add car form */}
      {isAddCarPage ? (
        <form onSubmit={handleSubmit} className="glass-panel max-w-5xl p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input value={form.vehicle_name} required onChange={(e) => setForm((c) => ({ ...c, vehicle_name: e.target.value }))} placeholder="Vehicle name" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            <input value={form.brand} required onChange={(e) => setForm((c) => ({ ...c, brand: e.target.value }))} placeholder="Brand" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            <input value={form.registration_number} required onChange={(e) => setForm((c) => ({ ...c, registration_number: e.target.value }))} placeholder="Registration number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            <select value={form.vehicle_type} onChange={(e) => setForm((c) => ({ ...c, vehicle_type: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none">
              {vehicleTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={form.fuel_type} onChange={(e) => setForm((c) => ({ ...c, fuel_type: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none">
              {['petrol', 'diesel', 'electric', 'hybrid'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input value={form.rental_price_per_day} type="number" required onChange={(e) => setForm((c) => ({ ...c, rental_price_per_day: e.target.value }))} placeholder="Price per day" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            <input value={form.seating_capacity} type="number" required onChange={(e) => setForm((c) => ({ ...c, seating_capacity: e.target.value }))} placeholder="Seating capacity" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            <input value={form.vehicle_count} type="number" min="0" required onChange={(e) => setForm((c) => ({ ...c, vehicle_count: e.target.value }))} placeholder="Vehicle count" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={form.availability_status} onChange={(e) => setForm((c) => ({ ...c, availability_status: e.target.checked }))} />
              Available for booking
            </label>
            <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} rows={3} placeholder="Description" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none md:col-span-2" />
          </div>
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-600">Vehicle image</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                {isUploadingImage ? 'Uploading...' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
              </label>
              {form.image_url ? <span className="text-xs text-emerald-600">Image uploaded</span> : <span className="text-xs text-slate-500">No image selected</span>}
            </div>
            {form.image_url ? <img src={form.image_url} alt="Vehicle preview" className="mt-3 h-24 w-40 rounded-xl object-cover" /> : null}
          </div>
          <button type="submit" disabled={isSaving || isUploadingImage} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            <Plus className="h-4 w-4" />
            {isSaving ? 'Creating...' : 'Create vehicle'}
          </button>
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        </form>
      ) : null}

      {/* Vehicle list */}
      {!isAddCarPage ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {ownVehicles.map((vehicle) => {
            const stockBadge = getStockBadge(vehicle);
            const draftCount = stockDrafts[vehicle.id] ?? String(vehicle.vehicle_count ?? 0);
            return (
            <div key={vehicle.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[16/9] bg-slate-100">
                {vehicle.primary_image ? (
                  <img src={vehicle.primary_image} alt={vehicle.vehicle_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-base text-ink">{vehicle.vehicle_name}</h3>
                    <p className="text-xs text-slate-500">{vehicle.brand} · {formatVehicleType(vehicle.vehicle_type)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${stockBadge.className}`}>
                    {stockBadge.label}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-slate-500">
                  <span className="truncate">{vehicle.registration_number}</span>
                  <span className="text-right font-medium text-slate-700">${vehicle.rental_price_per_day}/day</span>
                  <span className="capitalize">{vehicle.fuel_type}</span>
                  <span className="text-right">{vehicle.seating_capacity} seats</span>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 p-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Stock count</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={draftCount}
                      onChange={(event) => setStockDrafts((current) => ({ ...current, [vehicle.id]: event.target.value }))}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleStockSave(vehicle)}
                      disabled={savingStockId === vehicle.id || Number(draftCount) === Number(vehicle.vehicle_count ?? 0)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingStockId === vehicle.id ? 'Saving' : 'Save'}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={vehicle.has_active_booking} onClick={() => handleEdit(vehicle)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button type="button" disabled={vehicle.has_active_booking} onClick={() => handleDelete(vehicle.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : null}
    </DashboardShell>
  );
}
