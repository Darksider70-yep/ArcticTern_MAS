// ArcticTern ATC — Metrics Panel
// Real-time KPI gauges + trend charts using Chart.js


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { COLORS } from '../utils/colors.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

export default function MetricsPanel({ snapshot }) {
  if (!snapshot) return null;

  const { metricsHistory } = snapshot;
  const activeFlights = snapshot.flights?.filter(f =>
    f.status !== 'DEPARTED' && f.status !== 'DIVERTED'
  ) || [];

  // Calculate current KPIs
  const avgDelay = activeFlights.length > 0
    ? Math.round(activeFlights.reduce((s, f) => s + (f.delay || 0), 0) / activeFlights.length)
    : 0;
  const avgFuel = activeFlights.length > 0
    ? Math.round(activeFlights.reduce((s, f) => s + (f.fuel || 100), 0) / activeFlights.length)
    : 100;
  const runwayUtil = snapshot.runway?.utilization || 0;
  const gateUtil = snapshot.gate?.utilization || 0;

  return (
    <div className="metrics-panel" id="metrics-panel">
      <h3 className="panel-title">Performance Metrics</h3>

      {/* KPI Gauges */}
      <div className="kpi-row">
        <KPIGauge label="Avg Delay" value={`${avgDelay}s`} percent={Math.min(100, avgDelay * 2)} color={avgDelay < 20 ? COLORS.success : avgDelay < 50 ? COLORS.warning : COLORS.danger} inverted />
        <KPIGauge label="Fuel Eff." value={`${avgFuel}%`} percent={avgFuel} color={avgFuel > 70 ? COLORS.success : avgFuel > 40 ? COLORS.warning : COLORS.danger} />
        <KPIGauge label="Runway" value={`${runwayUtil}%`} percent={runwayUtil} color={COLORS.agentRunway} />
        <KPIGauge label="Gates" value={`${gateUtil}%`} percent={gateUtil} color={COLORS.agentGate} />
      </div>

      {/* Trend Chart */}
      {metricsHistory && metricsHistory.timestamps?.length > 1 && (
        <div className="metrics-chart-container">
          <Line
            data={{
              labels: metricsHistory.timestamps,
              datasets: [
                {
                  label: 'Efficiency Score',
                  data: metricsHistory.score,
                  borderColor: COLORS.success,
                  backgroundColor: COLORS.success + '20',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  borderWidth: 2,
                },
                {
                  label: 'Avg Delay',
                  data: metricsHistory.delays,
                  borderColor: COLORS.warning,
                  backgroundColor: 'transparent',
                  tension: 0.4,
                  pointRadius: 0,
                  borderWidth: 1.5,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { intersect: false, mode: 'index' },
              plugins: {
                tooltip: {
                  backgroundColor: 'rgba(10, 14, 23, 0.9)',
                  titleColor: COLORS.textPrimary,
                  bodyColor: COLORS.textSecondary,
                  borderColor: COLORS.separator,
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  display: true,
                  grid: { color: COLORS.gridLine },
                  ticks: { color: COLORS.textMuted, font: { size: 9 }, maxTicksLimit: 6 },
                },
                y: {
                  display: true,
                  grid: { color: COLORS.gridLine },
                  ticks: { color: COLORS.textMuted, font: { size: 9 } },
                  min: 0,
                  max: 100,
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

function KPIGauge({ label, value, percent, color, inverted }) {
  const displayPercent = inverted ? Math.max(0, 100 - percent) : percent;

  return (
    <div className="kpi-gauge">
      <div className="kpi-bar-bg">
        <div
          className="kpi-bar-fill"
          style={{
            width: `${Math.min(100, displayPercent)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="kpi-info">
        <span className="kpi-value" style={{ color }}>{value}</span>
        <span className="kpi-label">{label}</span>
      </div>
    </div>
  );
}
