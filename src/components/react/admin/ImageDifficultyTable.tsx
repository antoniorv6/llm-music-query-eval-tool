import { useState, useMemo } from "react";
import type { AnalyticsData } from "../../../lib/analytics";
import { CHART_COLORS } from "./charts/rechartsTheme";

interface Props {
  data: AnalyticsData;
}

type SortKey = "filename" | "avgScore" | "totalEvaluations";

function cellColor(score: number): string {
  const t = score / 5;
  if (t >= 0.8) return "rgba(16, 185, 129, 0.25)";
  if (t >= 0.6) return "rgba(78, 205, 196, 0.2)";
  if (t >= 0.4) return "rgba(200, 168, 90, 0.2)";
  if (t >= 0.2) return "rgba(245, 158, 11, 0.2)";
  return "rgba(244, 63, 94, 0.2)";
}

function cellTextColor(score: number): string {
  const t = score / 5;
  if (t >= 0.8) return "#10B981";
  if (t >= 0.6) return "#4ECDC4";
  if (t >= 0.4) return "#C8A85A";
  if (t >= 0.2) return "#F59E0B";
  return "#F43F5E";
}

export function ImageDifficultyTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("avgScore");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(
    () =>
      [...data.images].sort((a, b) => {
        let av: number | string, bv: number | string;
        switch (sortKey) {
          case "filename":
            av = a.imageFilename;
            bv = b.imageFilename;
            break;
          case "avgScore":
            av = a.avgScore;
            bv = b.avgScore;
            break;
          case "totalEvaluations":
            av = a.totalEvaluations;
            bv = b.totalEvaluations;
            break;
        }
        const cmp =
          typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
        return sortAsc ? cmp : -cmp;
      }),
    [data.images, sortKey, sortAsc]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k)
      return <span className="ml-1 text-surface-600">↕</span>;
    return (
      <span className="ml-1 text-amber-400">{sortAsc ? "↑" : "↓"}</span>
    );
  };

  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
        <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
          Dificultad por partitura
        </h3>
        <span className="ml-auto text-xs text-surface-500">
          {data.images.length} imágenes
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-700">
              <th
                className="py-2 px-3 text-left text-surface-500 font-medium uppercase tracking-widest cursor-pointer hover:text-surface-300"
                onClick={() => handleSort("filename")}
              >
                Partitura <SortIcon k="filename" />
              </th>
              <th
                className="py-2 px-3 text-left text-surface-500 font-medium uppercase tracking-widest cursor-pointer hover:text-surface-300"
                onClick={() => handleSort("avgScore")}
              >
                Score medio <SortIcon k="avgScore" />
              </th>
              {data.models.map((m, i) => (
                <th
                  key={m.modelName}
                  className="py-2 px-3 text-center text-surface-500 font-medium uppercase tracking-widest"
                  style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {m.shortName}
                </th>
              ))}
              <th
                className="py-2 px-3 text-left text-surface-500 font-medium uppercase tracking-widest cursor-pointer hover:text-surface-300"
                onClick={() => handleSort("totalEvaluations")}
              >
                Evals <SortIcon k="totalEvaluations" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((img) => (
              <tr
                key={img.imageFilename}
                className="border-b border-surface-800 hover:bg-surface-800/40 transition-colors"
              >
                <td className="py-2 px-3 font-mono text-surface-400 truncate max-w-[120px]">
                  {img.imageFilename}
                </td>
                <td className="py-2 px-3">
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: cellTextColor(img.avgScore) }}
                  >
                    {img.avgScore.toFixed(2)}
                  </span>
                </td>
                {data.models.map((m) => {
                  const score = img.modelScores[m.modelName];
                  const hasScore = score !== undefined && !isNaN(score);
                  return (
                    <td
                      key={m.modelName}
                      className="py-2 px-3 text-center tabular-nums font-mono"
                      style={
                        hasScore ? { backgroundColor: cellColor(score) } : undefined
                      }
                    >
                      <span style={hasScore ? { color: cellTextColor(score) } : { color: "#4A5170" }}>
                        {hasScore ? score.toFixed(2) : "—"}
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-surface-500 tabular-nums">
                  {img.totalEvaluations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
