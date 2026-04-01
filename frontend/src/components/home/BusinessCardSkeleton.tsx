import { cn } from "@/lib/utils";

export default function BusinessCardSkeleton() {
  return (
    <div className="group bg-slate-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl">
      {/* Media Placeholder */}
      <div className="relative h-64 bg-slate-800/50 animate-pulse">
        <div className="absolute top-6 left-6 w-24 h-6 bg-slate-700/50 rounded-full" />
        <div className="absolute -bottom-8 right-8 w-20 h-20 bg-slate-800 p-1 rounded-full border border-white/5">
          <div className="w-full h-full bg-slate-700/50 rounded-full" />
        </div>
      </div>

      <div className="p-8 pt-10">
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full bg-slate-800/80 animate-pulse" />
          ))}
        </div>
        
        <div className="h-8 w-3/5 bg-slate-800/80 rounded-xl mb-4 animate-pulse" />
        
        <div className="space-y-2 mb-8">
          <div className="h-4 w-full bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="h-4 w-4/5 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          <div className="h-4 w-24 bg-slate-800/50 rounded-full animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-slate-800/80 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
