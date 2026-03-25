import { useState } from "react";
import type { ModelStats } from "../../../lib/analytics";
import { costEfficiency, hasPricing } from "../../../lib/pricing";
import { CHART_COLORS } from "./charts/rechartsTheme";

interface Props {
  models: ModelStats[];
  costMap: Record<string, number>;
  onSelectModel: (m: ModelStats) => void;
}

type SortKey =
  | "rank"
  | "compositeScore"
  | "binaryAccuracy"
  | "meanRankingScore"
  | "avgResponseTime"
  | "estimatedCost"
  | "costEfficiency";

export function ModelLeaderboard({ models, costMap, onSelectModel }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("compositeScore");
  const [sortAsc, setSortAsc] = useState(false);

  const sortedModels = [...models].sort((a, b) => {
    let av: number, bv: number;
    switch (sortKey) {
      case "rank":
      case "compositeScore":
        av = a.compositeScore;
        bv = b.compositeScore;
        break;
      case "binaryAccuracy":
        av = a.binaryAccuracy;
        bv = b.binaryAccuracy;
        break;
      case "meanRankingScore":
        av = a.meanRankingScore;
        bv = b.meanRankingScore;
        break;
      case "avgResponseTime":
        av = a.avgResponseTime;
        bv = b.avgResponseTime;
        break;
      case "estimatedCost":
        av = costMap[a.modelName] ?? 0;
        bv = costMap[b.modelName] ?? 0;
        break;
      case "costEfficiency":
        av = costEfficiency(a.compositeScore, costMap[a.modelName] ?? 0) ?? 0;
        bv = costEfficiency(b.compositeScore, costMap[b.modelName] ?? 0) ?? 0;
        break;
      default:
        av = a.compositeScore;
        bv = b.compositeScore;
    }
    return sortAsc ? av - bv : bv - av;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="ml-1 text-surface-600">↕</span>;
    return <span className="ml-1 text-amber-400">{sortAsc ? "↑" : "↓"}</span>;
  };

  const allEfficiencies = models.map(
    (m) => costEfficiency(m.compositeScore, costMap[m.modelName] ?? 0) ?? 0
  );
  const maxEff = Math.max(...allEfficiencies, 1);

  const efficiencyBadge = (eff: number | null) => {
    if (eff === null) return "text-surface-600";
    const norm = eff / maxEff;
    if (norm >= 0.66) return "text-emerald-400";
    if (norm >= 0.33) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
          Leaderboard de modelos
        </h3>
        <span className="ml-auto text-xs text-surface-500">{models.length} modelos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-700">
              {(
                [
                  { key: "rank" as SortKey, label: "#" },
                  { key: "compositeScore" as SortKey, label: "Score comp." },
                  { key: "binaryAccuracy" as SortKey, label: "Accuracy" },
                  { key: "meanRankingScore" as SortKey, label: "Ranking" },
                  { key: "avgResponseTime" as SortKey, label: "Tiempo" },
                  { key: "estimatedCost" as SortKey, label: "Coste est." },
                  { key: "costEfficiency" as SortKey, label: "Score/USD" },
                ] as const
              ).map(({ key, label }) => (
                <th
                  key={key}
                  className="py-2 px-3 text-left text-surface-500 font-medium uppercase tracking-widest cursor-pointer hover:text-surface-300 select-none"
                  onClick={() => handleSort(key)}
                >
                  {label} <SortIcon k={key} />
                </th>
              ))}
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, i) => {
              const originalRank =
                models.findIndex((m) => m.modelName === model.modelName) + 1;
              const cost = costMap[model.modelName] ?? null;
              const eff = hasPricing(model.modelName)
                ? costEfficiency(model.compositeScore, cost ?? 0)
                : null;
              const color = CHART_COLORS[originalRank - 1 % CHART_COLORS.length];

              return (
                <tr
                  key={model.modelName}
                  className="border-b border-surface-800 hover:bg-surface-800/50 transition-colors cursor-pointer group"
                  onClick={() => onSelectModel(model)}
                >
                  {/* Rank */}
                  <td className="py-3 px-3">
                    <span className="font-mono text-surface-500 tabular-nums">
                      {i + 1}
                    </span>
                  </td>

                  {/* Composite + mini bar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-[80px]">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-surface-200 font-medium truncate max-w-[100px]">
                            {model.shortName}
                          </span>
                          <span className="text-surface-400 font-mono tabular-nums ml-2">
                            {(model.compositeScore * 100).toFixed(1)}
                          </span>
                        </div>
                        <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className="h-1 rounded-full"
                            style={{
                              width: `${model.compositeScore * 100}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Binary accuracy */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-surface-300 tabular-nums font-mono">
                        {(model.binaryAccuracy * 100).toFixed(0)}%
                      </span>
                      <span className="text-surface-600 text-[10px]">
                        ({model.binaryCorrect}/{model.binaryTotal})
                      </span>
                    </div>
                  </td>

                  {/* Ranking score */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-surface-300 tabular-nums font-mono">
                        {model.meanRankingScore.toFixed(2)}
                      </span>
                      <span className="text-surface-600 text-[10px]">/5</span>
                    </div>
                  </td>

                  {/* Response time */}
                  <td className="py-3 px-3">
                    <span className="text-surface-400 tabular-nums font-mono">
                      {model.avgResponseTime.toFixed(1)}s
                    </span>
                  </td>

                  {/* Estimated cost */}
                  <td className="py-3 px-3">
                    {hasPricing(model.modelName) && cost !== null ? (
                      <span className="text-surface-300 tabular-nums font-mono">
                        ${cost.toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-surface-600">—</span>
                    )}
                  </td>

                  {/* Cost efficiency */}
                  <td className={`py-3 px-3 tabular-nums font-mono font-semibold ${efficiencyBadge(eff)}`}>
                    {eff !== null ? eff.toFixed(4) : "—"}
                  </td>

                  {/* Drilldown button */}
                  <td className="py-3 px-3">
                    <span className="text-surface-600 group-hover:text-amber-400 transition-colors text-xs">
                      →
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
