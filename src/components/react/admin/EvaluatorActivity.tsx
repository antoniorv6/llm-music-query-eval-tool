import type { AnalyticsData } from "../../../lib/analytics";

interface Props {
  data: AnalyticsData;
  totalPerEvaluator: number;
}

function timeSince(dateStr: string | null): string {
  if (!dateStr) return "Sin actividad";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function biasColor(bias: number): string {
  if (Math.abs(bias) < 0.1) return "text-surface-400";
  if (bias > 0) return "text-emerald-400";
  return "text-rose-400";
}

export function EvaluatorActivity({ data, totalPerEvaluator }: Props) {
  if (data.evaluators.length === 0) {
    return (
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <p className="text-sm text-surface-500 italic">Sin datos de evaluadores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary table */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
            Actividad por evaluador
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-700">
                {["Evaluador", "Progreso", "Completadas", "Score medio", "Desv. estándar", "Sesgo", "Última actividad"].map((h) => (
                  <th
                    key={h}
                    className="py-2 px-3 text-left text-surface-500 font-medium uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.evaluators.map((ev, i) => {
                const pct =
                  totalPerEvaluator > 0
                    ? Math.round((ev.completed / totalPerEvaluator) * 100)
                    : 0;
                return (
                  <tr
                    key={ev.id}
                    className="border-b border-surface-800 hover:bg-surface-800/40 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span className="font-medium text-surface-200">{ev.name}</span>
                    </td>
                    <td className="py-3 px-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-amber-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-surface-400 tabular-nums w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-surface-400 tabular-nums">
                      {ev.completed} / {totalPerEvaluator}
                    </td>
                    <td className="py-3 px-3 text-surface-300 tabular-nums font-mono">
                      {ev.meanScore.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-surface-400 tabular-nums font-mono">
                      {ev.stdDev.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 tabular-nums font-mono font-semibold ${biasColor(ev.bias)}`}>
                      {ev.bias >= 0 ? "+" : ""}{ev.bias.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-surface-500">
                      {timeSince(ev.lastActivity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score distribution per evaluator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.evaluators.map((ev) => {
          const total = ev.scoreDistribution.reduce((a, b) => a + b, 0);
          return (
            <div
              key={ev.id}
              className="bg-surface-900 border border-surface-700 rounded-xl p-4 card-elevated"
            >
              <p className="text-xs font-semibold text-surface-300 mb-3">{ev.name}</p>
              <div className="flex items-end gap-1 h-16">
                {ev.scoreDistribution.map((count, bucket) => {
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const colors = [
                    "#F43F5E", "#F59E0B", "#EAB308", "#4ECDC4", "#10B981", "#C8A85A",
                  ];
                  return (
                    <div
                      key={bucket}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(2, pct)}%`,
                          backgroundColor: colors[bucket],
                          opacity: pct > 0 ? 0.85 : 0.2,
                        }}
                      />
                      <span className="text-[9px] text-surface-600">{bucket}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-surface-600 mt-2">
                {total} evaluaciones · sesgo {ev.bias >= 0 ? "+" : ""}{ev.bias.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
