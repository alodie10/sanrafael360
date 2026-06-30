"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Eye, MessageSquare, MousePointer2, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DataPoint {
  date: string;
  views: number;
  clicks_whatsapp: number;
  clicks_website: number;
}

interface TooltipState {
  x: number;
  y: number;
  point: DataPoint;
  visible: boolean;
}

type Period = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
};

const METRICS = [
  {
    key: "views" as const,
    label: "Visitas",
    color: "#3b82f6",
    fill: "rgba(59,130,246,0.12)",
    icon: Eye,
  },
  {
    key: "clicks_whatsapp" as const,
    label: "WhatsApp",
    color: "#10b981",
    fill: "rgba(16,185,129,0.12)",
    icon: MessageSquare,
  },
  {
    key: "clicks_website" as const,
    label: "Web",
    color: "#d4af37",
    fill: "rgba(212,175,55,0.10)",
    icon: MousePointer2,
  },
];

function buildPath(
  data: DataPoint[],
  key: keyof Omit<DataPoint, "date">,
  width: number,
  height: number,
  maxVal: number,
  padX = 0,
  padY = 12
): string {
  if (data.length < 2 || maxVal === 0) return "";
  const W = width - padX * 2;
  const H = height - padY * 2;

  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * W;
    const y = padY + H - (d[key] / maxVal) * H;
    return { x, y };
  });

  // Smooth bezier path
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y} ${cx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

function buildArea(
  linePath: string,
  data: DataPoint[],
  width: number,
  height: number,
  padX = 0,
  padY = 12
): string {
  if (!linePath) return "";
  const lastX = padX + width - padX;
  const firstX = padX;
  const baseY = height - padY + 1;
  return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
}

function formatDateLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr + "T12:00:00");
  if (period === "7d") {
    return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
  }
  if (period === "90d") {
    return d.toLocaleDateString("es-AR", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("es-AR", { month: "short", day: "numeric" });
}

export default function AdminStatsChart({ jwt }: { jwt: string }) {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0, y: 0, point: { date: "", views: 0, clicks_whatsapp: 0, clicks_website: 0 }, visible: false
  });
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(["views", "clicks_whatsapp", "clicks_website"])
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 220 });

  // Resize observer
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ width: Math.max(width, 300), height: 220 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
        const res = await fetch(
          `${strapiUrl}/api/negocios/stats/timeseries?period=${period}`,
          { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        setData(json.data || []);
      } catch (e) {
        console.error("Error fetching timeseries:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jwt, period]);

  const maxVal = data.length > 0
    ? Math.max(
        ...data.flatMap((d) => [d.views, d.clicks_whatsapp, d.clicks_website])
      )
    : 1;
  const yMax = Math.max(maxVal, 1);

  const PAD_X = 0;
  const PAD_Y = 14;

  // Totals for period
  const totals = data.reduce(
    (acc, d) => ({
      views: acc.views + d.views,
      clicks_whatsapp: acc.clicks_whatsapp + d.clicks_whatsapp,
      clicks_website: acc.clicks_website + d.clicks_website,
    }),
    { views: 0, clicks_whatsapp: 0, clicks_website: 0 }
  );

  // Hover handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || data.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const W = dims.width - PAD_X * 2;
      const idx = Math.min(
        data.length - 1,
        Math.max(0, Math.round((mouseX / W) * (data.length - 1)))
      );
      const point = data[idx];
      const x = PAD_X + (idx / (data.length - 1)) * W;
      setTooltip({ x, y: 30, point, visible: true });
    },
    [data, dims.width]
  );

  const handleMouseLeave = () => setTooltip((t) => ({ ...t, visible: false }));

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // mínimo 1 activo
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Tick labels en el eje X
  const tickCount = period === "7d" ? 7 : period === "30d" ? 6 : 6;
  const tickIndices = data.length > 0
    ? Array.from({ length: tickCount }, (_, i) =>
        Math.round((i / (tickCount - 1)) * (data.length - 1))
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Evolución en el tiempo</h3>
            <p className="text-xs text-zinc-500">Interacciones diarias de todos los negocios</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 bg-black/30 rounded-2xl border border-white/5">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p
                  ? "bg-primary text-black shadow-lg shadow-primary/20"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Metric toggles + totals */}
      <div className="px-6 md:px-8 pt-6 flex flex-wrap gap-4">
        {METRICS.map(({ key, label, color, icon: Icon }) => (
          <button
            key={key}
            onClick={() => toggleMetric(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
              activeMetrics.has(key)
                ? "bg-white/5 border-white/10"
                : "bg-transparent border-white/5 opacity-40"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <Icon className="w-3.5 h-3.5" style={{ color }} />
            <span style={{ color }}>{label}</span>
            <span className="text-zinc-400 font-black ml-1">
              {totals[key as keyof typeof totals].toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative px-2 pb-4 pt-2">
        {loading ? (
          <div className="h-[220px] flex items-center justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm font-serif italic">
            Sin datos para este período
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={dims.width}
            height={dims.height}
            className="w-full overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {METRICS.map(({ key, color, fill }) => (
                <linearGradient
                  key={key}
                  id={`grad-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
              ))}
            </defs>

            {/* Y-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = PAD_Y + (dims.height - PAD_Y * 2) * (1 - frac);
              const val = Math.round(yMax * frac);
              return (
                <g key={frac}>
                  <line
                    x1={0}
                    x2={dims.width}
                    y1={y}
                    y2={y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1}
                  />
                  <text
                    x={dims.width - 2}
                    y={y - 3}
                    fill="rgba(255,255,255,0.2)"
                    fontSize={9}
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area fills + lines */}
            {METRICS.map(({ key, color }) => {
              if (!activeMetrics.has(key)) return null;
              const linePath = buildPath(data, key, dims.width, dims.height, yMax, PAD_X, PAD_Y);
              const areaPath = buildArea(linePath, data, dims.width, dims.height, PAD_X, PAD_Y);
              return (
                <g key={key}>
                  <path
                    d={areaPath}
                    fill={`url(#grad-${key})`}
                    stroke="none"
                  />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* Tooltip vertical line */}
            {tooltip.visible && (
              <line
                x1={tooltip.x}
                x2={tooltip.x}
                y1={PAD_Y}
                y2={dims.height - PAD_Y}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            )}

            {/* Tooltip dots */}
            {tooltip.visible &&
              METRICS.filter((m) => activeMetrics.has(m.key)).map(({ key, color }) => {
                const W = dims.width - PAD_X * 2;
                const H = dims.height - PAD_Y * 2;
                const val = tooltip.point[key as keyof Omit<DataPoint, "date">] as number;
                const cy = PAD_Y + H - (val / yMax) * H;
                return (
                  <circle
                    key={key}
                    cx={tooltip.x}
                    cy={cy}
                    r={4}
                    fill={color}
                    stroke="black"
                    strokeWidth={2}
                  />
                );
              })}

            {/* X-axis labels */}
            {tickIndices.map((idx) => {
              const W = dims.width - PAD_X * 2;
              const x = PAD_X + (idx / (data.length - 1)) * W;
              return (
                <text
                  key={idx}
                  x={x}
                  y={dims.height}
                  fill="rgba(255,255,255,0.25)"
                  fontSize={9}
                  textAnchor="middle"
                >
                  {formatDateLabel(data[idx].date, period)}
                </text>
              );
            })}
          </svg>
        )}

        {/* Tooltip card */}
        <AnimatePresence>
          {tooltip.visible && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute top-2 pointer-events-none z-10"
              style={{
                left: tooltip.x > dims.width * 0.65
                  ? tooltip.x - 160
                  : tooltip.x + 12,
              }}
            >
              <div className="bg-zinc-900/95 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl min-w-[140px]">
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2">
                  {new Date(tooltip.point.date + "T12:00:00").toLocaleDateString("es-AR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                {METRICS.filter((m) => activeMetrics.has(m.key)).map(({ key, label, color, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3" style={{ color }} />
                      <span className="text-[10px] text-zinc-400">{label}</span>
                    </div>
                    <span className="text-xs font-black text-white">
                      {(tooltip.point[key as keyof Omit<DataPoint, "date">] as number).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
