import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from "./charts/rechartsTheme";
import type { AnalyticsData, ModelStats } from "../../../lib/analytics";
import { costEfficiency, hasPricing } from "../../../lib/pricing";

interface Props {
  model: ModelStats;
  data: AnalyticsData;
  costData: { totalCost: number; efficiency: number | null };
  onClose: () => void;
}

export function ModelDrilldown({ model, data, costData, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const radarData = Object.entries(model.questionStats).map(([qId, qs]) => ({
    question: `Q${qId}`,
    score: parseFloat(qs.mean.toFixed(2)),
    fullMark: qs.type === "binary" ? 1 : 5,
  }));

  const strengths = Object.entries(model.questionStats)
    .filter(([, qs]) => qs.mean >= 3.5)
    .map(([qId, qs]) => ({ qId, text: qs.questionText, mean: qs.mean }));

  const weaknesses = Object.entries(model.questionStats)
    .filter(([, qs]) => qs.mean < 2)
    .map(([qId, qs]) => ({ qId, text: qs.questionText, mean: qs.mean }));

  const rank = data.models.findIndex((m) => m.modelName === model.modelName) + 1;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Panel */}
        <motion.div
          className="relative z-10 w-full max-w-2xl bg-surface-900 border border-surface-700 rounded-2xl overflow-hidden shadow-2xl"
          initial={{ scale: 0.95, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-surface-700">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-surface-500 uppercase tracking-widest">
                  #{rank} · {model.provider}
                </span>
              </div>
              <h2 className="font-serif text-xl font-semibold text-surface-100">
                {model.shortName}
              </h2>
              <p className="text-xs text-surface-500 font-mono mt-0.5">{model.modelName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-surface-500 hover:text-surface-300 transition-colors p-1 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Score comp.", value: (model.compositeScore * 100).toFixed(1), unit: "" },
                { label: "Accuracy", value: (model.binaryAccuracy * 100).toFixed(0), unit: "%" },
                { label: "Ranking", value: model.meanRankingScore.toFixed(2), unit: "/5" },
                { label: "Tiempo medio", value: model.avgResponseTime.toFixed(1), unit: "s" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface-800 border border-surface-700 rounded-lg p-3 text-center"
                >
                  <p className="text-[10px] text-surface-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="font-serif text-lg font-semibold text-surface-100 tabular-nums">
                    {stat.value}
                    <span className="text-surface-500 text-sm">{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Radar chart */}
            {radarData.length > 0 && (
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-widest mb-3">
                  Perfil por pregunta
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis
                      dataKey="question"
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      tick={{ fill: "#4A5170", fontSize: 10 }}
                    />
                    <Radar
                      name={model.shortName}
                      dataKey="score"
                      stroke="#C8A85A"
                      fill="#C8A85A"
                      fillOpacity={0.2}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Cost profile */}
            {hasPricing(model.modelName) && (
              <div className="bg-surface-800 border border-surface-700 rounded-lg p-4">
                <p className="text-xs text-surface-500 uppercase tracking-widest mb-3">
                  Perfil de coste
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-surface-500 mb-1">Coste total</p>
                    <p className="font-mono text-sm font-semibold text-teal-400">
                      {costData.totalCost > 0 ? `$${costData.totalCost.toFixed(5)}` : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-surface-500 mb-1">Score/USD</p>
                    <p className="font-mono text-sm font-semibold text-amber-400">
                      {costData.efficiency !== null ? costData.efficiency.toFixed(4) : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-surface-500 mb-1">Rango global</p>
                    <p className="font-mono text-sm font-semibold text-surface-200">
                      #{rank} / {data.models.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths & weaknesses */}
            {(strengths.length > 0 || weaknesses.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {strengths.length > 0 && (
                  <div>
                    <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2">
                      Fortalezas
                    </p>
                    {strengths.map(({ qId, text, mean }) => (
                      <div key={qId} className="flex items-start gap-2 mb-2">
                        <span className="text-emerald-400 mt-0.5 text-xs">✓</span>
                        <div>
                          <p className="text-xs text-surface-300 leading-snug">
                            {text.length > 50 ? text.slice(0, 50) + "…" : text}
                          </p>
                          <p className="text-[10px] text-emerald-500">{mean.toFixed(2)} / 5</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs text-rose-400 uppercase tracking-widest mb-2">
                      Debilidades
                    </p>
                    {weaknesses.map(({ qId, text, mean }) => (
                      <div key={qId} className="flex items-start gap-2 mb-2">
                        <span className="text-rose-400 mt-0.5 text-xs">✗</span>
                        <div>
                          <p className="text-xs text-surface-300 leading-snug">
                            {text.length > 50 ? text.slice(0, 50) + "…" : text}
                          </p>
                          <p className="text-[10px] text-rose-500">{mean.toFixed(2)} / 5</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
