import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateEvaluatorKey } from "../../lib/supabase";
import { useAppStore } from "../../lib/store";
import { canAccessDashboard } from "../../lib/types";
import { BlurFade } from "../magicui/blur-fade";
import { ShineBorder } from "../magicui/shine-border";

export function LoginForm() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setCurrentEvaluator = useAppStore((s) => s.setCurrentEvaluator);

  const handleLogin = useCallback(async () => {
    if (!key.trim()) {
      setError("Introduce tu clave de acceso");
      return;
    }

    setLoading(true);
    setError("");

    const evaluator = await validateEvaluatorKey(key.trim());
    if (evaluator) {
      setCurrentEvaluator(evaluator);
      localStorage.setItem("evaluator_key", key.trim());
      // Administradores van directo al panel de análisis; el resto al dashboard de evaluación
      window.location.href = canAccessDashboard(evaluator) ? "/dashboard" : "/admin";
    } else {
      setError("Clave no válida");
      setLoading(false);
    }
  }, [key, setCurrentEvaluator]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-surface-950 px-4 overflow-hidden">
      {/* Ambient glow behind card */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-amber-500/[0.06] blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm z-10">
        <BlurFade delay={0} duration={0.5}>
          <ShineBorder
            borderRadius={22}
            borderWidth={1}
            duration={20}
            shineColor={["rgba(200,168,90,0.15)", "rgba(200,168,90,0.05)", "rgba(200,168,90,0.15)"]}
          >
            <div className="card-glass rounded-[22px] p-10">

              {/* Branding */}
              <BlurFade delay={0.05} duration={0.45}>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl icon-badge-amber border shrink-0">
                      <svg
                        className="w-4.5 h-4.5"
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
                    </div>
                    <h1 className="font-serif text-[1.75rem] font-normal tracking-tight text-surface-100 leading-tight">
                      Music LLM Eval
                    </h1>
                  </div>
                  <p className="text-sm text-surface-400 font-serif italic pl-0.5">
                    Evaluación de modelos · OMR
                  </p>
                </div>
              </BlurFade>

              {/* Staff divider */}
              <BlurFade delay={0.1} duration={0.4}>
                <div className="staff-divider mb-8" />
              </BlurFade>

              {/* Form */}
              <BlurFade delay={0.15} duration={0.4}>
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="key-input"
                      className="block text-sm text-surface-400 mb-1.5"
                    >
                      Clave de acceso
                    </label>
                    <input
                      id="key-input"
                      type="password"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Introduce tu clave..."
                      disabled={loading}
                      className="w-full px-4 py-3 bg-surface-850 border border-surface-700 rounded-xl text-surface-200 placeholder-surface-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 disabled:opacity-50 text-sm transition-all font-mono"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="px-3.5 py-2.5 bg-red-950/50 border border-red-800/60 rounded-lg text-red-400 text-sm flex items-center gap-2"
                      >
                        <svg
                          className="w-3.5 h-3.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                          />
                        </svg>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-accent-500 hover:bg-accent-600 active:scale-[0.98] text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Verificando...
                      </span>
                    ) : (
                      "Acceder"
                    )}
                  </button>
                </div>
              </BlurFade>

              {/* Footer hint */}
              <BlurFade delay={0.25} duration={0.4}>
                <p className="mt-6 text-center text-[13px] text-surface-600">
                  Acceso restringido a evaluadores autorizados
                </p>
              </BlurFade>
            </div>
          </ShineBorder>
        </BlurFade>
      </div>
    </div>
  );
}
