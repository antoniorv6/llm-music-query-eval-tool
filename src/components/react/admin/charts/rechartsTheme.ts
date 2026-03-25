export const CHART_COLORS = [
  '#C8A85A', // accent gold
  '#4ECDC4', // teal
  '#818CF8', // indigo
  '#F59E0B', // amber
  '#10B981', // emerald
  '#F43F5E', // rose
  '#06B6D4', // cyan
  '#8B5CF6', // violet
];

export const GRID_COLOR = 'rgba(255,255,255,0.06)';
export const AXIS_TICK_COLOR = '#64748B';
export const AXIS_LINE_COLOR = '#252A3A';

export const TOOLTIP_STYLE = {
  backgroundColor: '#0F1117',
  border: '1px solid #1E2435',
  borderRadius: 8,
  fontSize: 12,
};

export const TOOLTIP_LABEL_STYLE = { color: '#F3F4F6', fontWeight: 600 };
export const TOOLTIP_ITEM_STYLE = { color: '#9CA3AF' };

export const LEGEND_STYLE = { color: '#64748B', fontSize: 12 };

export const COMMON_AXIS_PROPS = {
  tick: { fill: AXIS_TICK_COLOR, fontSize: 11 },
  axisLine: { stroke: AXIS_LINE_COLOR },
  tickLine: { stroke: AXIS_LINE_COLOR },
} as const;

export const COMMON_CARTESIAN_GRID = {
  stroke: GRID_COLOR,
  strokeDasharray: '3 3',
} as const;
