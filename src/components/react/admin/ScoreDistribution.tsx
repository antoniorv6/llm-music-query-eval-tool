import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

export function ScoreDistribution({ data }: Props) {
  // Ranking score histogram — buckets 0..5
  const buckets = [0, 1, 2, 3, 4, 5];
  const rankingData = buckets.map((bucket) => {
    const row: Record<string, number | string> = { score: String(bucket) };
    for (const model of data.models) {
      row[model.shortName] = model.rankingScores.filter((s) => Math.round(s) === bucket).length;
    }
    return row;
  });

  // Binary accuracy stacked bar
  const binaryData = data.models.map((model, i) => ({
    name: model.shortName,
    Correctas: model.binaryCorrect,
    Incorrectas: model.binaryTotal - model.binaryCorrect,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Ranking histogram */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Distribución ranking
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rankingData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid {...COMMON_CARTESIAN_GRID} vertical={false} />
            <XAxis dataKey="score" {...COMMON_AXIS_PROPS} />
            <YAxis {...COMMON_AXIS_PROPS} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelFormatter={(v) => `Score ${v}`}
            />
            <Legend wrapperStyle={LEGEND_STYLE} />
            {data.models.map((model, i) => (
              <Bar
                key={model.modelName}
                dataKey={model.shortName}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Binary accuracy stacked */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Accuracy binaria por modelo
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={binaryData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 8, bottom: 0 }}
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
            />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="Correctas" stackId="binary" fill="#10B981" radius={[0, 3, 3, 0]} />
            <Bar dataKey="Incorrectas" stackId="binary" fill="#F43F5E" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
