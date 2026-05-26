import { Search } from 'lucide-react';

export default function VehicleFilters({ filters, onChange, onReset }) {
  return (
    <div className="glass-panel space-y-5 p-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_repeat(5,1fr)_auto]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Search by vehicle, brand, or registration"
            className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <select value={filters.vehicle_type} onChange={(event) => onChange('vehicle_type', event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none">
          <option value="">All types</option>
          <option value="car">Sedan</option>
          <option value="suv">SUV</option>
          <option value="van">Van</option>
          <option value="truck">Scooty</option>
          <option value="bike">Bike</option>
        </select>
        <input
          type="text"
          value={filters.brand}
          onChange={(event) => onChange('brand', event.target.value)}
          placeholder="Brand"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
        />
        <select value={filters.fuel_type} onChange={(event) => onChange('fuel_type', event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none">
          <option value="">All fuel</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <input
          type="number"
          min="0"
          value={filters.min_price}
          onChange={(event) => onChange('min_price', event.target.value)}
          placeholder="Min price"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
        />
        <input
          type="number"
          min="0"
          value={filters.max_price}
          onChange={(event) => onChange('max_price', event.target.value)}
          placeholder="Max price"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
        />
        <button type="button" onClick={onReset} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
          Reset
        </button>
      </div>
      <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          checked={filters.available_only}
          onChange={(event) => onChange('available_only', event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
        />
        Show available vehicles only
      </label>
    </div>
  );
}
