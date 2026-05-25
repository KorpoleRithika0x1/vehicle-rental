import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';

import {
  BRAND_LOGOS,
  DESTINATIONS,
  FAQ_ITEMS,
  FEATURE_ITEMS,
  MAP_LOCATIONS,
  SIZE_CARDS,
  USP_ITEMS,
} from '../utils/constants';

export default function Home() {
  const [selectedDestination, setSelectedDestination] = useState(DESTINATIONS[0].id);
  const [location, setLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [sameLocation, setSameLocation] = useState(true);
  const [activeFaq, setActiveFaq] = useState(0);
  const navigate = useNavigate();

  const destination = useMemo(
    () => DESTINATIONS.find((item) => item.id === selectedDestination) || DESTINATIONS[0],
    [selectedDestination]
  );

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('search', location);
    if (pickupDate) params.set('pickup_date', pickupDate);
    if (returnDate) params.set('return_date', returnDate);
    navigate(`/vehicles?${params.toString()}`);
  }

  return (
    <div>
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(22,33,62,0.58)), url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto grid min-h-[78vh] max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Production-ready rentals for customers, managers, and admins
            </div>
            <h1 className="mt-8 max-w-3xl font-heading text-5xl leading-tight text-white md:text-7xl">
              Book a better drive with live fleet confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-200">
              Search premium vehicles, secure dates in real time, and manage operations from a full-stack rental platform built for calm, reliable movement.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-200">
              {['Instant availability', 'Secure JWT access', 'Redis lock protection'].map((item) => (
                <div key={item} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="self-end">
            <form onSubmit={handleSearch} className="glass-panel rounded-[2rem] bg-white/90 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Fast Search</p>
                  <h2 className="mt-2 font-heading text-3xl text-ink">Find the right vehicle</h2>
                </div>
                <div className="rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Live
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Pickup location or brand"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(event) => setPickupDate(event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
                <input
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
                <button type="submit" className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-ink">
                  Search vehicles
                </button>
              </div>
              <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={sameLocation}
                  onChange={(event) => setSameLocation(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Return to same location
              </label>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {USP_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-heading text-2xl text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">What Makes Us Different?</p>
          <h2 className="mt-4 font-heading text-5xl text-ink">Built for trust at every step of the rental journey.</h2>
        </div>
        <div className="mt-12 section-grid">
          {FEATURE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-heading text-2xl text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
            Connecting you to the biggest brands
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {BRAND_LOGOS.map((brand) => (
              <div key={brand} className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center text-lg font-semibold text-ink shadow-sm">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Browse by Destinations</p>
            <h2 className="mt-4 font-heading text-5xl text-ink">Pick the mood, then the route.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {DESTINATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDestination(item.id)}
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                  selectedDestination === item.id ? 'bg-brand text-white' : 'border border-slate-200 text-slate-600'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[2rem] shadow-soft">
            <img src={destination.image} alt={destination.title} className="h-full min-h-[360px] w-full object-cover" />
          </div>
          <div className="glass-panel p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{destination.subtitle}</p>
            <h3 className="mt-4 font-heading text-4xl text-ink">{destination.title}</h3>
            <div className="mt-8 grid gap-4">
              {destination.locations.map((locationName) => (
                <div key={locationName} className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
                  <div>
                    <p className="font-semibold text-ink">{locationName}</p>
                    <p className="text-sm text-slate-500">Curated pickup availability</p>
                  </div>
                  <Link to={`/vehicles?search=${encodeURIComponent(locationName)}`} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
                    Select location
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Meet Some of Our Car Sizes</p>
          <h2 className="mt-4 font-heading text-5xl text-ink">From compact city cars to spacious group movers.</h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {SIZE_CARDS.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
              <img src={item.image} alt={item.title} className="h-64 w-full object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-3xl text-ink">{item.title}</h3>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand">{item.priceRange}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-500">{item.description}</p>
                <Link to={`/vehicles?vehicle_type=${item.title.toLowerCase().slice(0, -1)}`} className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
                  Search for a car
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">FAQ</p>
          <h2 className="mt-4 font-heading text-5xl text-ink">Answers that keep booking clear and confident.</h2>
        </div>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <button
              key={item.question}
              type="button"
              onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}
              className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-soft"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-ink">{item.question}</h3>
                <span className="text-brand">{activeFaq === index ? '−' : '+'}</span>
              </div>
              {activeFaq === index && <p className="mt-4 text-sm leading-6 text-slate-500">{item.answer}</p>}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Map of Car Rental Locations</p>
          <h2 className="mt-4 font-heading text-5xl text-ink">Coverage that feels tangible.</h2>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-soft">
          <div className="h-[420px]">
            <MapContainer center={[39.5, -98.35]} zoom={4} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {MAP_LOCATIONS.map((locationItem) => (
                <CircleMarker key={locationItem.name} center={locationItem.position} radius={10} pathOptions={{ color: '#16213e', fillColor: '#d9a441', fillOpacity: 0.8 }}>
                  <Popup>{locationItem.name}</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-brand px-8 py-12 text-white shadow-soft">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Customer Care</p>
              <h2 className="mt-4 font-heading text-5xl">Support that stays human, even when the system scales.</h2>
              <p className="mt-5 max-w-2xl text-slate-200">
                Need a booking adjustment, manager follow-up, or help selecting the right fleet size? Reach the care desk and we’ll guide the next step.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { title: 'Booking Hotline', body: '+1 (800) 555-0199' },
                { title: 'Email Support', body: 'care@velocerentals.com' },
                { title: 'Manager Desk', body: 'Operations assistance 24/7' },
              ].map((item) => (
                <div key={item.title} className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm uppercase tracking-[0.25em] text-gold">{item.title}</p>
                  <p className="mt-2 text-lg text-white">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
