// Physical Activity Chart component.
// Renders an SVG line chart with two views: daily inactivity hours and MVPA (moderate + vigorous activity).
// If the user's activity band is provided, an orange marker is plotted on the MVPA view.
import { useMemo, useState } from 'react'
import './Charts.css'

// Population distribution data for each activity view.
// 'inactivity' shows sedentary time bands; 'mvpa' shows active time bands.
const SERIES = {
  inactivity: {
    label: 'Daily inactivity',
    eyebrow: 'Movement Benchmark',
    title: 'How much time your age group spends inactive',
    description:
      'Based on physical-activity data for ages 18-24. This view shows how many young adults fall into each inactivity band.',
    color: '#D97855',
    points: [
      { key: 'lt8', label: '<8 h', fullLabel: 'Less than 8 hours', value: 11.3 },
      { key: '8to9', label: '8-<9 h', fullLabel: '8 to less than 9 hours', value: 13.4 },
      { key: '9to10', label: '9-<10 h', fullLabel: '9 to less than 10 hours', value: 18.9 },
      { key: '10to11', label: '10-<11 h', fullLabel: '10 to less than 11 hours', value: 21.7 },
      { key: '11to12', label: '11-<12 h', fullLabel: '11 to less than 12 hours', value: 20.9 },
      { key: '12plus', label: '12+ h', fullLabel: '12 hours or more', value: 13.8 },
    ],
    benchmarkLabel: 'Estimated average inactivity',
    benchmarkValue: '11.38 h/day',
    averagePosition: 3.38,
    strongestLabel: 'Most common band',
  },
  mvpa: {
    label: 'Moderate + vigorous activity',
    eyebrow: 'Movement Benchmark',
    title: 'How active your age group tends to be',
    description:
      'This view focuses on moderate and vigorous physical activity for ages 18-24 across daily duration bands.',
    color: '#1D9E75',
    points: [
      { key: 'lt30', label: 'Under 30 min', fullLabel: 'Less than 30 minutes', value: 1.8 },
      { key: '30to60', label: '30 min-1 hr', fullLabel: '30 minutes to less than 1 hour', value: 9.8 },
      { key: '1to1_5', label: '1-1.5 hrs', fullLabel: '1 to less than 1.5 hours', value: 17.2 },
      { key: '1_5to2', label: '1.5-2 hrs', fullLabel: '1.5 to less than 2 hours', value: 16.8 },
      { key: '2to2_5', label: '2-2.5 hrs', fullLabel: '2 to less than 2.5 hours', value: 25.9 },
      { key: '2_5to3', label: '2.5-3 hrs', fullLabel: '2.5 to less than 3 hours', value: 15.3 },
      { key: '3plus', label: '3+ hrs', fullLabel: '3 hours or more', value: 13.2 },
    ],
    benchmarkLabel: 'Most common activity range',
    benchmarkValue: '2.10 h/day',
    averagePosition: 4.2,
    strongestLabel: 'Largest share',
  },
}

// SVG canvas dimensions and margins
const CHART_WIDTH  = 640
const CHART_HEIGHT = 320
const MARGIN = { top: 20, right: 24, bottom: 52, left: 42 }
const INNER_WIDTH  = CHART_WIDTH  - MARGIN.left - MARGIN.right
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top  - MARGIN.bottom
const MAX_Y = 45  // y-axis cap at 45%

// Maps a data point index to an SVG x pixel position (evenly spaced)
function xScale(index, total) {
  if (total <= 1) return MARGIN.left
  return MARGIN.left + (index / (total - 1)) * INNER_WIDTH
}

// Same as xScale but accepts a fractional position — used for the average line
function xScaleContinuous(position, total) {
  if (total <= 1) return MARGIN.left
  return MARGIN.left + (position / (total - 1)) * INNER_WIDTH
}

// Maps a percentage value to an SVG y pixel position (y increases downward in SVG)
function yScale(value) {
  return MARGIN.top + INNER_HEIGHT - (value / MAX_Y) * INNER_HEIGHT
}

// Builds the SVG path string for the line itself
function getLinePath(points) {
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${xScale(index, points.length)} ${yScale(point.value)}`
    })
    .join(' ')
}

// Builds the SVG path string for the filled area under the line
function getAreaPath(points) {
  const line = points.map((point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${command} ${xScale(index, points.length)} ${yScale(point.value)}`
  })

  return [
    ...line,
    `L ${xScale(points.length - 1, points.length)} ${MARGIN.top + INNER_HEIGHT}`,
    `L ${xScale(0, points.length)} ${MARGIN.top + INNER_HEIGHT}`,
    'Z',
  ].join(' ')
}

// Finds the user's marker position on the MVPA view.
// Returns null for the inactivity view since Q2 answers don't map to inactivity bands.
function getUserPlotPoint(seriesKey, userActivityBand) {
  if (!userActivityBand || seriesKey !== 'mvpa') return null

  const point = SERIES.mvpa.points.find((entry) => entry.key === userActivityBand.key)
  if (!point) return null

  return { label: userActivityBand.label, fullLabel: point.fullLabel, value: point.value }
}

// userActivityBand — the band object for the user's Q2 answer (from Dashboard ACTIVITY_BANDS map)
function PhysicalActivityChart({ userActivityBand }) {
  const [activeSeries, setActiveSeries] = useState('mvpa') // which dataset tab is shown
  const [hoveredPoint, setHoveredPoint] = useState(null)   // point the mouse is over
  const [showUserPopup, setShowUserPopup] = useState(false) // whether the user marker popup is open
  const current = SERIES[activeSeries]

  // Memoise paths so they're only recalculated when the series changes
  const linePath = useMemo(() => getLinePath(current.points), [current.points])
  const areaPath = useMemo(() => getAreaPath(current.points), [current.points])
  const highestPoint   = [...current.points].sort((left, right) => right.value - left.value)[0]
  const userPoint      = getUserPlotPoint(activeSeries, userActivityBand)
  // Index of the user's band in the current series array (used to calculate x position)
  const userPointIndex = userPoint ? current.points.findIndex((point) => point.fullLabel === userPoint.fullLabel) : -1
  const averageX       = xScaleContinuous(current.averagePosition, current.points.length)

  return (
    <div className="physical-chart-card">
      <div className="sleep-chart-top">
        <div>
          <div className="sleep-chart-eyebrow">{current.eyebrow}</div>
          <div className="sleep-chart-title">{current.title}</div>
          <div className="sleep-chart-copy">{current.description}</div>
        </div>
        <div className="sleep-chart-toggle" role="tablist" aria-label="Movement view">
          {Object.entries(SERIES).map(([key, series]) => (
            <button
              key={key}
              type="button"
              className={`sleep-chart-tab ${activeSeries === key ? 'active' : ''}`}
              onClick={() => {
                setActiveSeries(key)
                setShowUserPopup(false)
              }}
            >
              {series.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sleep-chart-highlight">
        <div className="sleep-highlight-stat">
          <span className="sleep-highlight-label">{current.benchmarkLabel}</span>
          <span className="sleep-highlight-value">{current.benchmarkValue}</span>
        </div>
        <div className="sleep-highlight-stat">
          <span className="sleep-highlight-label">{current.strongestLabel}</span>
          <span className="sleep-highlight-value">{highestPoint.fullLabel}</span>
        </div>
      </div>

      <div className="sleep-chart-shell">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="sleep-chart-svg" role="img">
          <defs>
            <linearGradient id="physical-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={current.color} stopOpacity="0.24" />
              <stop offset="100%" stopColor={current.color} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 10, 20, 30, 40].map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + INNER_WIDTH}
                y1={yScale(tick)}
                y2={yScale(tick)}
                className="sleep-grid-line"
              />
              <text x={MARGIN.left - 10} y={yScale(tick) + 4} className="sleep-axis-text left">
                {tick}%
              </text>
            </g>
          ))}

          {current.points.map((point, index) => (
            <g key={point.label} transform={`translate(${xScale(index, current.points.length)} ${MARGIN.top + INNER_HEIGHT + 24})`}>
              <rect x="-34" y="-12" width="68" height="24" rx="12" className="sleep-axis-pill" />
              <text y="4" textAnchor="middle" className="sleep-axis-text">
                {point.label}
              </text>
            </g>
          ))}

          <line
            x1={averageX}
            x2={averageX}
            y1={MARGIN.top}
            y2={MARGIN.top + INNER_HEIGHT}
            className="sleep-average-line"
          />
          <text x={averageX + 8} y={MARGIN.top + 14} className="sleep-average-label">
            Avg {current.benchmarkValue}
          </text>

          <path d={areaPath} fill="url(#physical-area-gradient)" />
          <path d={linePath} fill="none" stroke={current.color} strokeWidth="3.5" strokeLinecap="round" />

          {current.points.map((point, index) => {
            const isHovered = hoveredPoint?.label === point.label

            return (
              <g
                key={point.fullLabel}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={xScale(index, current.points.length)}
                  cy={yScale(point.value)}
                  r={isHovered ? 8 : 6}
                  fill="#ffffff"
                  stroke={current.color}
                  strokeWidth="3"
                />
                <circle
                  cx={xScale(index, current.points.length)}
                  cy={yScale(point.value)}
                  r="16"
                  fill="transparent"
                />
              </g>
            )
          })}

          {userPoint && userPointIndex >= 0 && (
            <g
              className="sleep-user-marker-group"
              onClick={() => setShowUserPopup((currentValue) => !currentValue)}
            >
              <circle
                cx={xScale(userPointIndex, current.points.length)}
                cy={yScale(userPoint.value)}
                r="9"
                className="sleep-user-marker-ring"
              />
              <circle
                cx={xScale(userPointIndex, current.points.length)}
                cy={yScale(userPoint.value)}
                r="5"
                className="sleep-user-marker-dot"
              />
            </g>
          )}
        </svg>

        {showUserPopup && userPoint && (
          <button
            type="button"
            className="sleep-user-popup"
            onClick={() => setShowUserPopup(false)}
          >
            <div className="sleep-user-popup-label">Your movement band</div>
            <div className="sleep-user-popup-title">{userPoint.label}</div>
            <div className="sleep-user-popup-copy">
              Around {userPoint.value.toFixed(1)}% of people aged 18-24 are in this range.
            </div>
          </button>
        )}

        {hoveredPoint && (
          <div className="sleep-tooltip">
            <div className="sleep-tooltip-label">{current.label}</div>
            <div className="sleep-tooltip-title">{hoveredPoint.fullLabel}</div>
            <div className="sleep-tooltip-value">{hoveredPoint.value.toFixed(1)}% of people</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PhysicalActivityChart
