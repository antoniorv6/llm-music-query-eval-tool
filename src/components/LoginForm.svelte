<script lang="ts">
  import { validateEvaluatorKey } from '../lib/supabase';
  import { currentEvaluator } from '../lib/stores';

  let key = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleLogin() {
    if (!key.trim()) {
      error = 'Introduce tu clave de acceso';
      return;
    }

    loading = true;
    error = '';

    const evaluator = await validateEvaluatorKey(key.trim());
    if (evaluator) {
      currentEvaluator.set(evaluator);
      localStorage.setItem('evaluator_key', key.trim());
      window.location.href = '/dashboard';
    } else {
      error = 'Clave no válida';
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-surface-950 px-4">
  <div class="w-full max-w-sm">
    <!-- Card container -->
    <div class="bg-surface-900 border border-surface-700 rounded-xl p-8 card-elevated">
      <!-- Branding -->
      <div class="mb-6">
        <h1 class="font-serif text-3xl font-semibold text-surface-100 tracking-tight mb-1.5">
          Music LLM Eval
        </h1>
        <p class="text-sm text-surface-500 font-serif italic">
          Evaluación de modelos · OMR
        </p>
      </div>

      <!-- Staff divider signature -->
      <div class="staff-divider mb-7"></div>

      <!-- Form -->
      <div class="space-y-4">
        <div>
          <label for="key-input" class="block text-xs font-medium text-surface-500 uppercase tracking-widest mb-2">
            Clave de acceso
          </label>
          <input
            id="key-input"
            type="password"
            bind:value={key}
            onkeydown={handleKeydown}
            placeholder="Introduce tu clave..."
            disabled={loading}
            class="w-full px-3.5 py-2.5 bg-surface-850 border border-surface-700 rounded-lg text-surface-200 placeholder-surface-600 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 disabled:opacity-50 text-sm"
          />
        </div>

        {#if error}
          <div class="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        {/if}

        <button
          onclick={handleLogin}
          disabled={loading}
          class="w-full py-2.5 px-4 bg-accent-600 hover:bg-accent-700 disabled:bg-accent-300 text-white font-semibold text-sm rounded-lg cursor-pointer disabled:cursor-not-allowed"
        >
          {#if loading}
            <span class="inline-flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verificando...
            </span>
          {:else}
            Acceder
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
