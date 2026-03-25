<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  interface Props {
    type: string;
    data: any;
    options?: any;
    height?: string;
  }

  let { type, data, options = {}, height = '300px' }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#64748B',
          font: { family: "'Atkinson Hyperlegible', sans-serif", size: 11 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#0F172A',
        bodyColor: '#334155',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        cornerRadius: 6,
        padding: 10,
        titleFont: { family: "'Atkinson Hyperlegible', sans-serif", weight: '600' as const, size: 12 },
        bodyFont: { family: "'Atkinson Hyperlegible', sans-serif", size: 11 },
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { size: 11 } },
        grid: { color: 'rgba(203, 213, 225, 0.4)' },
        border: { color: '#CBD5E1' },
      },
      y: {
        ticks: { color: '#64748B', font: { size: 11 } },
        grid: { color: 'rgba(203, 213, 225, 0.4)' },
        border: { color: '#CBD5E1' },
      },
    },
  };

  function deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  onMount(() => {
    const mergedOptions = deepMerge(defaultOptions, options);
    chart = new Chart(canvas, {
      type: type as any,
      data,
      options: mergedOptions,
    });
  });

  $effect(() => {
    if (chart) {
      chart.data = data;
      const mergedOptions = deepMerge(defaultOptions, options);
      chart.options = mergedOptions as any;
      chart.update();
    }
  });

  onDestroy(() => {
    chart?.destroy();
  });
</script>

<div style="height: {height}; position: relative;">
  <canvas bind:this={canvas}></canvas>
</div>
