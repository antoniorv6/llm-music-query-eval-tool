import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Legend,
  Cell,
} from "recharts";
import {
  CHART_COLORS,
  COMMON_AXIS_PROPS,
  COMMON_CARTESIAN_GRID,
  TOOLTIP_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_ITEM_STYLE,
  LEGEND_STYLE,
} from "./charts/rechartsTheme";
import type { AnalyticsData } from "../../../lib/analytics";

interface Props {
  data: AnalyticsData;
}

export function ResponseTimeAnalysis({ data }: Props) {
  const avgTime = useMemo(() => {
    const times = data.models.map((m) => m.avgResponseTime);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }, [data.models]);

  const barData = data.models.map((m, i) => ({
    name: m.shortName,
    tiempo: parseFloat(m.avgResponseTime.toFixed(2)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const scatterData = data.models.map((m, i) => ({
    x: parseFloat(m.avgResponseTime.toFixed(2)),
    y: parseFloat(m.meanRankingScore.toFixed(2)),
    name: m.shortName,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Avg response time bar */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Tiempo de respuesta medio
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid {...COMMON_CARTESIAN_GRID} vertical={false} />
            <XAxis dataKey="name" {...COMMON_AXIS_PROPS} />
            <YAxis
              unit="s"
              {...COMMON_AXIS_PROPS}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={(v) => { const n = v as number | undefined; return n !== undefined ? [`${n.toFixed(2)} s`, "Tiempo medio"] : ["—", "Tiempo medio"]; }}
            />
            <ReferenceLine
              y={avgTime}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{ value: `Media ${avgTime.toFixed(1)}s`, fill: "#F59E0B", fontSize: 10, position: "insideTopRight" }}
            />
            <Bar dataKey="tiempo" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter: tiempo vs calidad */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Tiempo vs calidad ranking
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid {...COMMON_CARTESIAN_GRID} />
            <XAxis
              dataKey="x"
              name="Tiempo (s)"
              unit="s"
              type="number"
              label={{ value: "Tiempo (s)", position: "insideBottom", offset: -4, fill: "#64748B", fontSize: 11 }}
              {...COMMON_AXIS_PROPS}
            />
            <YAxis
              dataKey="y"
              name="Score ranking"
              domain={[0, 5]}
              type="number"
              label={{ value: "Score", angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 11 }}
              {...COMMON_AXIS_PROPS}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              cursor={{ strokeDasharray: "3 3", stroke: "#252A3A" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div style={{ ...TOOLTIP_STYLE, padding: "8px 12px" }}>
                    <p style={{ ...TOOLTIP_LABEL_STYLE, marginBottom: 4 }}>{d.name}</p>
                    <p style={TOOLTIP_ITEM_STYLE}>Tiempo: {d.x.toFixed(2)} s</p>
                    <p style={TOOLTIP_ITEM_STYLE}>Score: {d.y.toFixed(2)} / 5</p>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={LEGEND_STYLE} />
            {scatterData.map((point, i) => (
              <Scatter
                key={i}
                name={point.name}
                data={[point]}
                fill={point.color}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
