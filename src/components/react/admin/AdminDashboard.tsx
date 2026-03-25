import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateEvaluatorKey, getAllEvaluations, getAllEvaluators } from "../../../lib/supabase";
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
import { BlurFade } from "../../magicui/blur-fade";

type Tab = "resumen" | "modelos" | "costes" | "fiabilidad" | "evaluadores";

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
];

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [responsesData, setResponsesData] = useState<ResponsesData | null>(null);
  const [totalPerEvaluator, setTotalPerEvaluator] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [selectedModel, setSelectedModel] = useState<ModelStats | null>(null);

  useEffect(() => {
    async function init() {
      const key = localStorage.getItem("evaluator_key");
      if (!key) {
        window.location.href = "/login";
        return;
      }

      const evaluator = await validateEvaluatorKey(key);
      if (!evaluator || !evaluator.is_admin) {
        window.location.href = "/dashboard";
        return;
      }

      setAuthorized(true);

      try {
        const [responsesRes, allEvals, allEvs] = await Promise.all([
          fetch("/api/responses").then((r) => r.json()) as Promise<ResponsesData>,
          getAllEvaluations(),
          getAllEvaluators(),
        ]);

        setResponsesData(responsesRes);
        setTotalPerEvaluator(countTotalEvaluations(responsesRes));

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
              <a
                href="/dashboard"
                className="text-surface-500 hover:text-surface-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </a>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <h1 className="font-serif text-[15px] font-semibold text-surface-100 tracking-tight">
                  Panel de Análisis
                </h1>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs text-surface-500 tabular-nums">
              <span>{analyticsData.totalEvaluations} evals</span>
              <span className="text-surface-700 mx-1">·</span>
              <span>{analyticsData.models.length} modelos</span>
              <span className="text-surface-700 mx-1">·</span>
              <span>{analyticsData.images.length} imgs</span>
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
                <BlurFade delay={0.05} duration={0.4} inView>
                  <KPIGrid data={analyticsData} costMap={costMap} />
                </BlurFade>
                <BlurFade delay={0.1} duration={0.4} inView>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                      <ModelLeaderboard
                        models={analyticsData.models}
                        costMap={costMap}
                        onSelectModel={setSelectedModel}
                      />
                    </div>
                    <div>
                      <QuestionPerformance data={analyticsData} />
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
