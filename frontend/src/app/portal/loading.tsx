export default function PortalLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 px-6">
      <div
        className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-400 tracking-wide">Cargando…</p>
    </div>
  );
}
