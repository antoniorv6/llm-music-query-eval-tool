import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  validateEvaluatorKey,
  getAllEvaluations,
  getAllEvaluators,
  getAllEvaluatorsWithKeys,
  getAllSampleAssignments,
} from "../../../lib/supabase";
import { canAccessAdmin, canAccessDashboard, type Evaluator } from "../../../lib/types";
import { countTotalEvaluations } from "../../../lib/responses";
import { computeAnalytics, type AnalyticsData, type ModelStats } from "../../../lib/analytics";
import { estimateTotalModelCost, costEfficiency } from "../../../lib/pricing";
import type { ResponsesData } from "../../../lib/types";

import { KPIGrid } from "./KPIGrid";
import { ModelLeaderboard } from "./ModelLeaderboard";
import { ModelDrilldown } from "./ModelDrilldown";
import { QuestionPerformance } from "./QuestionPerformance";
import { ScoreDistribution } from "./ScoreDistribution";
import { ResponseTimeAnalysis } from "./ResponseTimeAnalysis";
import { CostAnalysis } from "./CostAnalysis";
import { InterRaterReliability } from "./InterRaterReliability";
import { ImageDifficultyTable } from "./ImageDifficultyTable";
import { EvaluatorActivity } from "./EvaluatorActivity";
import { TeamManagement } from "./TeamManagement";
import { AssignmentsView } from "./AssignmentsView";
import { BlurFade } from "../../magicui/blur-fade";

type Tab = "resumen" | "modelos" | "costes" | "fiabilidad" | "evaluadores" | "gestion";

interface SampleAssignment {
  image_filename: string;
  evaluator_id: string;
  evaluator_name: string;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: "resumen",
    label: "Resumen",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
  },
  {
    id: "modelos",
    label: "Modelos",
    icon: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
  },
  {
    id: "costes",
    label: "Costes",
    icon: "M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    id: "fiabilidad",
    label: "Fiabilidad",
    icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  },
  {
    id: "evaluadores",
    label: "Evaluadores",
    icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  },
  {
    id: "gestion",
    label: "Gestión",
    icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  },
];

// ── Campaign banner (Resumen tab) ─────────────────────────────────────────────

interface CampaignStat {
  label: string;
  value: number;
  total: number;
  color: string;
  showBar: boolean;
}

function CampaignBanner({
  totalImages,
  assignedCount,
  evaluatedCount,
  evaluatorCount,
}: {
  totalImages: number;
  assignedCount: number;
  evaluatedCount: number;
  evaluatorCount: number;
}) {
  const stats: CampaignStat[] = [
    {
      label: "Imágenes totales",
      value: totalImages,
      total: totalImages,
      color: "bg-surface-500",
      showBar: false,
    },
    {
      label: "Asignadas",
      value: assignedCount,
      total: totalImages,
      color: "bg-amber-500",
      showBar: true,
    },
    {
      label: "Evaluadas",
      value: evaluatedCount,
      total: totalImages,
      color: "bg-teal-500",
      showBar: true,
    },
    {
      label: "Evaluadores activos",
      value: evaluatorCount,
      total: evaluatorCount,
      color: "bg-violet-500",
      showBar: false,
    },
  ];

  const overallPct =
    totalImages > 0 ? Math.round((evaluatedCount / totalImages) * 100) : 0;

  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: title + global progress */}
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className="w-4 h-4 text-amber-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <div>
            <p className="text-[10px] font-medium text-surface-500 uppercase tracking-widest mb-0.5">
              Estado de la campaña
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-semibold text-surface-100 tabular-nums leading-none">
                {overallPct}%
              </span>
              <span className="text-xs text-surface-500">completado</span>
            </div>
          </div>
        </div>

        {/* Right: 4 stat chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5">
              <p className="text-[10px] text-surface-500 uppercase tracking-widest leading-none">
                {s.label}
              </p>
              <p className="font-serif text-lg font-semibold text-surface-200 tabular-nums leading-none">
                {s.value}
                {s.showBar && (
                  <span className="text-xs font-sans font-normal text-surface-600 ml-1">
                    / {s.total}
                  </span>
                )}
              </p>
              {s.showBar && (
                <div className="h-1 bg-surface-800 rounded-full overflow-hidden w-20">
                  <div
                    className={`h-1 rounded-full transition-all duration-700 ${s.color}`}
                    style={{
                      width: `${s.total > 0 ? (s.value / s.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Evaluator progress mini-widget (Resumen tab right column) ─────────────────

function EvaluatorProgressWidget({
  evaluators,
  totalPerEvaluator,
}: {
  evaluators: AnalyticsData["evaluators"];
  totalPerEvaluator: number;
}) {
  if (evaluators.length === 0) return null;

  function timeSince(dateStr: string | null): string {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 card-elevated">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
          Progreso del equipo
        </h3>
      </div>
      <div className="space-y-3">
        {evaluators.map((ev) => {
          const pct =
            totalPerEvaluator > 0
              ? Math.round((ev.completed / totalPerEvaluator) * 100)
              : 0;
          return (
            <div key={ev.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-surface-300 font-medium truncate max-w-30">
                  {ev.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-surface-500 tabular-nums">
                    {timeSince(ev.lastActivity)}
                  </span>
                  <span className="text-[10px] text-surface-400 tabular-nums font-mono">
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [currentEvaluator, setCurrentEvaluator] = useState<Evaluator | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [responsesData, setResponsesData] = useState<ResponsesData | null>(null);
  const [totalPerEvaluator, setTotalPerEvaluator] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [selectedModel, setSelectedModel] = useState<ModelStats | null>(null);

  // Gestión state
  const [allEvaluators, setAllEvaluators] = useState<Evaluator[]>([]);
  const [allAssignments, setAllAssignments] = useState<SampleAssignment[]>([]);

  function handleLogout() {
    localStorage.removeItem("evaluator_key");
    window.location.href = "/login";
  }

  async function refreshGestion() {
    const [evs, assigns] = await Promise.all([
      getAllEvaluatorsWithKeys(),
      getAllSampleAssignments(),
    ]);
    setAllEvaluators(evs);
    setAllAssignments(assigns);
  }

  useEffect(() => {
    async function init() {
      const key = localStorage.getItem("evaluator_key");
      if (!key) {
        window.location.href = "/login";
        return;
      }

      const evaluator = await validateEvaluatorKey(key);
      if (!evaluator || !canAccessAdmin(evaluator)) {
        window.location.href = "/dashboard";
        return;
      }

      setCurrentEvaluator(evaluator);
      setAuthorized(true);

      try {
        const [responsesRes, allEvals, allEvs, allEvsFull, allAssigns] = await Promise.all([
          fetch("/api/responses").then((r) => r.json()) as Promise<ResponsesData>,
          getAllEvaluations(),
          getAllEvaluators(),
          getAllEvaluatorsWithKeys(),
          getAllSampleAssignments(),
        ]);

        setResponsesData(responsesRes);
        setTotalPerEvaluator(countTotalEvaluations(responsesRes));
        setAllEvaluators(allEvsFull);
        setAllAssignments(allAssigns);

        const evaluatorNames: Record<string, string> = {};
        for (const ev of allEvs) evaluatorNames[ev.id] = ev.name;

        setAnalyticsData(computeAnalytics(responsesRes, allEvals, evaluatorNames));
      } catch (e) {
        setError("Error al cargar los datos de análisis");
        console.error(e);
      }

      setLoading(false);
    }
    init();
  }, []);

  const costMap = useMemo<Record<string, number>>(() => {
    if (!analyticsData || !responsesData) return {};
    return Object.fromEntries(
      analyticsData.models.map((m) => [
        m.modelName,
        estimateTotalModelCost(m.modelName, responsesData),
      ])
    );
  }, [analyticsData, responsesData]);

  const efficiencyMap = useMemo<Record<string, number | null>>(() => {
    if (!analyticsData) return {};
    return Object.fromEntries(
      analyticsData.models.map((m) => [
        m.modelName,
        costEfficiency(m.compositeScore, costMap[m.modelName] ?? 0),
      ])
    );
  }, [analyticsData, costMap]);

  // Derived campaign stats for the banner
  const campaignStats = useMemo(() => {
    if (!responsesData || !analyticsData) return null;
    return {
      totalImages: Object.keys(responsesData).length,
      assignedCount: allAssignments.length,
      evaluatedCount: analyticsData.images.length,
      evaluatorCount: analyticsData.evaluators.length,
    };
  }, [responsesData, analyticsData, allAssignments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-surface-500 text-sm font-serif italic">Calculando métricas...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-6 py-4 text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!authorized || !analyticsData || !responsesData) return null;

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-900/95 backdrop-blur-sm border-b border-surface-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentEvaluator && canAccessDashboard(currentEvaluator) && (
                <a
                  href="/dashboard"
                  className="text-surface-500 hover:text-surface-300 transition-colors"
                  title="Volver al dashboard de evaluación"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </a>
              )}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <h1 className="font-serif text-[15px] font-semibold text-surface-100 tracking-tight">
                  Panel de Análisis
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1 text-xs text-surface-500 tabular-nums">
                <span>{analyticsData.totalEvaluations} evals</span>
                <span className="text-surface-700 mx-1">·</span>
                <span>{analyticsData.models.length} modelos</span>
                <span className="text-surface-700 mx-1">·</span>
                <span>{analyticsData.images.length} imgs</span>
              </div>
              {currentEvaluator && (
                <span className="text-sm text-surface-400 hidden sm:inline">{currentEvaluator.name}</span>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-surface-500 hover:text-surface-300 cursor-pointer uppercase tracking-widest transition-colors"
              >
                Salir
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-surface-500 hover:text-surface-300 hover:border-surface-600"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {activeTab === "resumen" && (
              <>
                {/* Campaign status banner */}
                {campaignStats && (
                  <BlurFade delay={0.02} duration={0.4} inView>
                    <CampaignBanner {...campaignStats} />
                  </BlurFade>
                )}

                <BlurFade delay={0.07} duration={0.4} inView>
                  <KPIGrid data={analyticsData} costMap={costMap} />
                </BlurFade>

                <BlurFade delay={0.12} duration={0.4} inView>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                      <ModelLeaderboard
                        models={analyticsData.models}
                        costMap={costMap}
                        onSelectModel={setSelectedModel}
                      />
                    </div>
                    <div className="flex flex-col gap-6">
                      <QuestionPerformance data={analyticsData} />
                      <EvaluatorProgressWidget
                        evaluators={analyticsData.evaluators}
                        totalPerEvaluator={totalPerEvaluator}
                      />
                    </div>
                  </div>
                </BlurFade>
              </>
            )}

            {activeTab === "modelos" && (
              <>
                <ModelLeaderboard
                  models={analyticsData.models}
                  costMap={costMap}
                  onSelectModel={setSelectedModel}
                />
                <ScoreDistribution data={analyticsData} />
                <ResponseTimeAnalysis data={analyticsData} />
                <QuestionPerformance data={analyticsData} />
              </>
            )}

            {activeTab === "costes" && (
              <CostAnalysis
                data={analyticsData}
                costMap={costMap}
                responsesData={responsesData}
              />
            )}

            {activeTab === "fiabilidad" && (
              <>
                <InterRaterReliability data={analyticsData} />
                <ImageDifficultyTable data={analyticsData} />
              </>
            )}

            {activeTab === "evaluadores" && (
              <EvaluatorActivity
                data={analyticsData}
                totalPerEvaluator={totalPerEvaluator}
              />
            )}

            {activeTab === "gestion" && (
              <>
                <BlurFade delay={0.05} duration={0.4} inView>
                  <TeamManagement
                    evaluators={allEvaluators}
                    onRefresh={refreshGestion}
                  />
                </BlurFade>
                <BlurFade delay={0.1} duration={0.4} inView>
                  <AssignmentsView
                    responsesData={responsesData}
                    assignments={allAssignments}
                    evaluators={allEvaluators}
                    onRefresh={refreshGestion}
                  />
                </BlurFade>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Model drilldown overlay */}
      {selectedModel && (
        <ModelDrilldown
          model={selectedModel}
          data={analyticsData}
          costData={{
            totalCost: costMap[selectedModel.modelName] ?? 0,
            efficiency: efficiencyMap[selectedModel.modelName] ?? null,
          }}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
}
