import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export function provideChartConfiguration() {
  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial';
  
  return [];
}

export function updateChartTheme(isDark: boolean) {
  if (isDark) {
    Chart.defaults.color = '#A0A0A0'; // dark-text-secondary
    Chart.defaults.borderColor = 'rgba(45, 55, 72, 0.2)'; // dark border
    Chart.defaults.backgroundColor = 'rgba(59, 130, 246, 0.5)';
  } else {
    Chart.defaults.color = '#6B7280'; // gray-500
    Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
    Chart.defaults.backgroundColor = 'rgba(59, 130, 246, 0.5)';
  }
}
