import { useMemo } from "react";
import { NumberTicker } from "../../magicui/number-ticker";
import { MagicCard } from "../../magicui/magic-card";
import type { AnalyticsData, ModelStats } from "../../../lib/analytics";
import { costEfficiency, hasPricing } from "../../../lib/pricing";

interface Props {
  data: AnalyticsData;
  costMap: Record<string, number>;
}

function alphaLabel(alpha: number, nEvaluators: number): string {
  if (nEvaluators < 2) return "Requiere 2+ evaluadores";
  if (alpha >= 0.8) return "Fiabilidad excelente";
  if (alpha >= 0.667) return "Fiabilidad aceptable";
  if (alpha >= 0.4) return "Fiabilidad moderada";
  return "Fiabilidad baja";
}

interface KPI {
  label: string;
  value: string;
  numericValue?: number;
  sublabel: string;
  accentColor: string;
  gradientColor: string;
  dotColor: string;
}

export function KPIGrid({ data, costMap }: Props) {
  const totalCost = useMemo(
    () => Object.values(costMap).reduce((a, b) => a + b, 0),
    [costMap]
  );

  const bestValueModel = useMemo<ModelStats | null>(() => {
    const modelsWithPricing = data.models.filter(
      (m) => hasPricing(m.modelName) && (costMap[m.modelName] ?? 0) > 0
    );
    if (modelsWithPricing.length === 0) return null;
    return modelsWithPricing.reduce((best, m) => {
      const eff = costEfficiency(m.compositeScore, costMap[m.modelName] ?? 0) ?? 0;
      const bestEff = costEfficiency(best.compositeScore, costMap[best.modelName] ?? 0) ?? 0;
      return eff > bestEff ? m : best;
    });
  }, [data.models, costMap]);

  const kpis: KPI[] = [
    {
      label: "Accuracy binaria",
      value:
        data.totalEvaluations > 0
          ? `${(data.globalBinaryAccuracy * 100).toFixed(1)}%`
          : "—",
      numericValue:
        data.totalEvaluations > 0
          ? Math.round(data.globalBinaryAccuracy * 100)
          : undefined,
      sublabel: `${data.models.reduce((s, m) => s + m.binaryCorrect, 0)} / ${data.models.reduce((s, m) => s + m.binaryTotal, 0)} correctas`,
      accentColor: "text-amber-400",
      gradientColor: "#C8A85A",
      dotColor: "bg-amber-400",
    },
    {
      label: "Score medio ranking",
      value:
        data.totalEvaluations > 0 ? data.globalMeanRanking.toFixed(2) : "—",
      sublabel: "de 5.00 posibles",
      accentColor: "text-teal-400",
      gradientColor: "#4ECDC4",
      dotColor: "bg-teal-400",
    },
    {
      label: "Evaluaciones totales",
      value: data.totalEvaluations.toLocaleString("es-ES"),
      numericValue: data.totalEvaluations,
      sublabel: `${data.evaluators.length} evaluador${data.evaluators.length !== 1 ? "es" : ""}`,
      accentColor: "text-emerald-400",
      gradientColor: "#10B981",
      dotColor: "bg-emerald-400",
    },
    {
      label: "Alpha de Krippendorff",
      value:
        data.evaluators.length >= 2
          ? data.interRater.krippendorffAlpha.toFixed(3)
          : "—",
      sublabel: alphaLabel(
        data.interRater.krippendorffAlpha,
        data.evaluators.length
      ),
      accentColor: "text-violet-400",
      gradientColor: "#8B5CF6",
      dotColor: "bg-violet-400",
    },
    {
      label: "Coste API estimado",
      value: totalCost > 0 ? `$${totalCost.toFixed(4)}` : "—",
      sublabel: `${Object.keys(costMap).length} modelos evaluados`,
      accentColor: "text-rose-400",
      gradientColor: "#F43F5E",
      dotColor: "bg-rose-400",
    },
    {
      label: "Mejor valor (coste/calidad)",
      value: bestValueModel ? bestValueModel.shortName : "—",
      sublabel:
        bestValueModel && costMap[bestValueModel.modelName]
          ? `$${costMap[bestValueModel.modelName].toFixed(4)} total`
          : "Sin datos de precio",
      accentColor: "text-cyan-400",
      gradientColor: "#06B6D4",
      dotColor: "bg-cyan-400",
    },
    {
      label: "Mejor modelo global",
      value: data.models.length > 0 ? data.models[0].shortName : "—",
      sublabel:
        data.models.length > 0
          ? `Score: ${(data.models[0].compositeScore * 100).toFixed(1)}`
          : "Sin datos",
      accentColor: "text-indigo-400",
      gradientColor: "#818CF8",
      dotColor: "bg-indigo-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {kpis.map((kpi, i) => (
        <MagicCard
          key={i}
          gradientColor={kpi.gradientColor}
          gradientOpacity={0.1}
          className="bg-surface-900 border border-surface-700 rounded-xl p-4 card-elevated flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${kpi.dotColor}`} />
            <span className="text-[10px] font-medium text-surface-500 uppercase tracking-widest leading-tight">
              {kpi.label}
            </span>
          </div>
          <div className={`font-serif text-2xl font-semibold leading-none tabular-nums ${kpi.accentColor}`}>
            {kpi.numericValue !== undefined ? (
              <NumberTicker
                value={kpi.numericValue}
                className={`font-serif text-2xl font-semibold ${kpi.accentColor}`}
              />
            ) : (
              kpi.value
            )}
          </div>
          <p className="text-[11px] text-surface-500 leading-tight">{kpi.sublabel}</p>
        </MagicCard>
      ))}
    </div>
  );
}
