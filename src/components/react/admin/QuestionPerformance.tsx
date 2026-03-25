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

export function QuestionPerformance({ data }: Props) {
  const chartData = data.questions.map((q) => {
    const row: Record<string, string | number> = {
      question: `Q${q.questionId}: ${q.questionText.length > 30 ? q.questionText.slice(0, 30) + "…" : q.questionText}`,
      type: q.type,
    };
    for (const model of data.models) {
      const stats = q.modelStats[model.modelName];
      row[model.shortName] = stats ? parseFloat(stats.mean.toFixed(2)) : 0;
    }
    return row;
  });

  const formatTick = (value: string) => {
    if (value.length > 24) return value.slice(0, 24) + "…";
    return value;
  };

  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
        <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
          Rendimiento por pregunta
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
        >
          <CartesianGrid {...COMMON_CARTESIAN_GRID} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 5]}
            {...COMMON_AXIS_PROPS}
          />
          <YAxis
            type="category"
            dataKey="question"
            width={140}
            tickFormatter={formatTick}
            {...COMMON_AXIS_PROPS}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={(value, name, props) => {
              const v = value as number | undefined;
              if (v === undefined) return ["—", name as string];
              const type = (props as { payload?: { type?: string } })?.payload?.type;
              if (type === "binary") return [`${(v * 100).toFixed(0)}%`, name as string];
              return [`${v.toFixed(2)} / 5`, name as string];
            }}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
          {data.models.map((model, i) => (
            <Bar
              key={model.modelName}
              dataKey={model.shortName}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              radius={[0, 3, 3, 0]}
              maxBarSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
