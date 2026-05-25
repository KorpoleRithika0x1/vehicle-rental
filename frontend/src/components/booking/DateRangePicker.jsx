import DatePicker from 'react-datepicker';

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, excludeDateIntervals = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-600">Pickup date</label>
        <DatePicker
          selected={startDate}
          onChange={onStartChange}
          minDate={new Date()}
          excludeDateIntervals={excludeDateIntervals}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          placeholderText="Select pickup date"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-600">Return date</label>
        <DatePicker
          selected={endDate}
          onChange={onEndChange}
          minDate={startDate || new Date()}
          excludeDateIntervals={excludeDateIntervals}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
          placeholderText="Select return date"
        />
      </div>
    </div>
  );
}
