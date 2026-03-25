import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceArea,
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
import {
  costEfficiency,
  estimateTotalTokens,
  hasPricing,
  MODEL_PRICING,
} from "../../../lib/pricing";
import type { ResponsesData } from "../../../lib/types";

interface Props {
  data: AnalyticsData;
  costMap: Record<string, number>;
  responsesData: ResponsesData;
}

export function CostAnalysis({ data, costMap, responsesData }: Props) {
  const efficiencyData = useMemo(
    () =>
      data.models
        .filter((m) => hasPricing(m.modelName) && (costMap[m.modelName] ?? 0) > 0)
        .map((m, i) => ({
          name: m.shortName,
          modelName: m.modelName,
          efficiency: parseFloat(
            (costEfficiency(m.compositeScore, costMap[m.modelName] ?? 0) ?? 0).toFixed(4)
          ),
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
        .sort((a, b) => b.efficiency - a.efficiency),
    [data.models, costMap]
  );

  const scatterData = useMemo(
    () =>
      data.models.map((m, i) => ({
        x: parseFloat((costMap[m.modelName] ?? 0).toFixed(5)),
        y: parseFloat(m.compositeScore.toFixed(3)),
        name: m.shortName,
        color: CHART_COLORS[i % CHART_COLORS.length],
        hasPricing: hasPricing(m.modelName),
      })),
    [data.models, costMap]
  );

  const medianCost = useMemo(() => {
    const costs = scatterData.map((d) => d.x).sort((a, b) => a - b);
    const mid = Math.floor(costs.length / 2);
    return costs.length % 2 !== 0
      ? costs[mid]
      : ((costs[mid - 1] ?? 0) + (costs[mid] ?? 0)) / 2;
  }, [scatterData]);

  const medianScore = useMemo(() => {
    const scores = scatterData.map((d) => d.y).sort((a, b) => a - b);
    const mid = Math.floor(scores.length / 2);
    return scores.length % 2 !== 0
      ? scores[mid]
      : ((scores[mid - 1] ?? 0) + (scores[mid] ?? 0)) / 2;
  }, [scatterData]);

  const tokenData = useMemo(
    () =>
      data.models.map((m, i) => {
        const tokens = estimateTotalTokens(m.modelName, responsesData);
        const pricing = MODEL_PRICING[m.modelName];
        const inputCost = pricing
          ? (tokens.input / 1_000_000) * pricing.inputPer1M
          : null;
        const outputCost = pricing
          ? (tokens.output / 1_000_000) * pricing.outputPer1M
          : null;
        const eff = costEfficiency(m.compositeScore, costMap[m.modelName] ?? 0);
        return {
          shortName: m.shortName,
          modelName: m.modelName,
          inputTokens: tokens.input.toLocaleString("es-ES"),
          outputTokens: tokens.output.toLocaleString("es-ES"),
          totalTokens: tokens.total.toLocaleString("es-ES"),
          inputCost,
          outputCost,
          totalCost: costMap[m.modelName] ?? null,
          efficiency: eff,
          compositeScore: m.compositeScore,
          color: CHART_COLORS[i % CHART_COLORS.length],
        };
      }),
    [data.models, costMap, responsesData]
  );

  const formatCost = (v: number | null) =>
    v === null ? "—" : v < 0.00001 && v > 0 ? "<$0.00001" : `$${v.toFixed(5)}`;

  const efficiencyColor = (eff: number | null, all: (number | null)[]) => {
    if (eff === null) return "text-surface-500";
    const valid = all.filter((e): e is number => e !== null);
    const max = Math.max(...valid);
    const min = Math.min(...valid);
    const range = max - min || 1;
    const pct = (eff - min) / range;
    if (pct >= 0.66) return "text-emerald-400";
    if (pct >= 0.33) return "text-amber-400";
    return "text-rose-400";
  };

  const allEfficiencies = tokenData.map((d) => d.efficiency);

  return (
    <div className="space-y-6">
      {/* Scatter: coste vs rendimiento */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Coste vs rendimiento
          </h3>
        </div>
        <p className="text-xs text-surface-500 mb-4 ml-3.5">
          Cuadrante superior-izquierdo = mejor valor (bajo coste, alto rendimiento)
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 16, right: 30, left: 0, bottom: 24 }}>
            <CartesianGrid {...COMMON_CARTESIAN_GRID} />
            {medianCost > 0 && medianScore > 0 && (
              <ReferenceArea
                x1={0}
                x2={medianCost}
                y1={medianScore}
                y2={1}
                fill="#4ECDC4"
                fillOpacity={0.05}
                stroke="#4ECDC4"
                strokeOpacity={0.15}
                strokeDasharray="4 4"
              />
            )}
            <XAxis
              dataKey="x"
              name="Coste estimado (USD)"
              type="number"
              label={{ value: "Coste estimado (USD)", position: "insideBottom", offset: -16, fill: "#64748B", fontSize: 11 }}
              tickFormatter={(v) => `$${v.toFixed(4)}`}
              {...COMMON_AXIS_PROPS}
            />
            <YAxis
              dataKey="y"
              name="Score compuesto"
              domain={[0, 1]}
              type="number"
              label={{ value: "Score compuesto", angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 11 }}
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
                    <p style={TOOLTIP_ITEM_STYLE}>Coste: {formatCost(d.x)}</p>
                    <p style={TOOLTIP_ITEM_STYLE}>Score: {(d.y * 100).toFixed(1)}</p>
                    {!d.hasPricing && (
                      <p style={{ ...TOOLTIP_ITEM_STYLE, color: "#F59E0B" }}>Sin pricing</p>
                    )}
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
                opacity={point.hasPricing ? 1 : 0.4}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Efficiency bar */}
      {efficiencyData.length > 0 && (
        <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
              Eficiencia (score / USD)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(120, efficiencyData.length * 52)}>
            <BarChart
              data={efficiencyData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
            >
              <CartesianGrid {...COMMON_CARTESIAN_GRID} horizontal={false} />
              <XAxis type="number" {...COMMON_AXIS_PROPS} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                {...COMMON_AXIS_PROPS}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={(v) => { const n = v as number | undefined; return n !== undefined ? [`${n.toFixed(4)} score/USD`, "Eficiencia"] : ["—", "Eficiencia"]; }}
              />
              <Bar dataKey="efficiency" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {efficiencyData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Token & cost table */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Desglose por modelo
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-700">
                {["Modelo", "Tokens entrada", "Tokens salida", "Coste entrada", "Coste salida", "Coste total", "Score/USD"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-surface-500 font-medium uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {tokenData.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-surface-800 hover:bg-surface-800/50 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="text-surface-200 font-medium">{row.shortName}</span>
                    </div>
                    {!hasPricing(row.modelName) && (
                      <span className="text-[10px] text-amber-500 ml-4">Sin pricing</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-surface-400 tabular-nums font-mono">
                    {row.inputTokens}
                  </td>
                  <td className="py-2.5 px-3 text-surface-400 tabular-nums font-mono">
                    {row.outputTokens}
                  </td>
                  <td className="py-2.5 px-3 text-surface-400 tabular-nums font-mono">
                    {formatCost(row.inputCost)}
                  </td>
                  <td className="py-2.5 px-3 text-surface-400 tabular-nums font-mono">
                    {formatCost(row.outputCost)}
                  </td>
                  <td className="py-2.5 px-3 font-semibold tabular-nums font-mono text-surface-200">
                    {formatCost(row.totalCost)}
                  </td>
                  <td
                    className={`py-2.5 px-3 tabular-nums font-mono font-semibold ${efficiencyColor(row.efficiency, allEfficiencies)}`}
                  >
                    {row.efficiency !== null
                      ? row.efficiency.toFixed(4)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
