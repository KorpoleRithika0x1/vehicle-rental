export default function Loader({ label = 'Loading...', fullScreen = false }) {
  return (
    <div className={fullScreen ? 'flex min-h-[50vh] items-center justify-center' : 'flex items-center justify-center py-10'}>
      <div className="flex items-center gap-3 rounded-full bg-brand px-5 py-3 text-sm font-medium text-white shadow-soft">
        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-gold" />
        {label}
      </div>
    </div>
  );
}
