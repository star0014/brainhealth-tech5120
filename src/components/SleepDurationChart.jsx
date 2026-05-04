// Sleep Duration Chart component.
// Renders an SVG line chart comparing how the 18-24 age group distributes sleep duration.
// Supports three views: weeknight, weekend, and overall.
// If the user's sleep band is provided, an orange marker is plotted on the chart.
import { useMemo, useState } from 'react'
import './Charts.css'

// Population distribution data for each sleep view.
// Each point contains a sleep duration band (hours) and its share of the 18-24 population (%).
const SERIES = {
  weeknight: {
    label: 'Weeknight',
    average: 7.51,
    color: '#4A9EDB',
    points: [
      { label: 'Under 6 hours', fullLabel: 'Less than 6 hours', hours: 5.5, value: 10.3 },
      { label: '6 hours', fullLabel: '6 to less than 7 hours', hours: 6.5, value: 18.9 },
      { label: '7 hours', fullLabel: '7 to less than 8 hours', hours: 7.5, value: 33.3 },
      { label: '8 hours', fullLabel: '8 to less than 9 hours', hours: 8.5, value: 27.3 },
      { label: '9 hours', fullLabel: '9 to less than 10 hours', hours: 9.5, value: 9.8 },
      { label: '10+ hours', fullLabel: '10 hours or more', hours: 10.5, value: 0.4 },
    ],
  },
  weekend: {
    label: 'Weekend night',
    average: 7.59,
    color: '#76B9E8',
    points: [
      { label: 'Under 6 hours', fullLabel: 'Less than 6 hours', hours: 5.5, value: 17.7 },
      { label: '6 hours', fullLabel: '6 to less than 7 hours', hours: 6.5, value: 9.0 },
      { label: '7 hours', fullLabel: '7 to less than 8 hours', hours: 7.5, value: 25.7 },
      { label: '8 hours', fullLabel: '8 to less than 9 hours', hours: 8.5, value: 25.7 },
      { label: '9 hours', fullLabel: '9 to less than 10 hours', hours: 9.5, value: 9.7 },
      { label: '10+ hours', fullLabel: '10 hours or more', hours: 10.5, value: 12.2 },
    ],
  },
  overall: {
    label: 'Overall night',
    average: 7.6,
    color: '#1D9E75',
    points: [
      { label: 'Under 6 hours', fullLabel: 'Less than 6 hours', hours: 5.5, value: 9.5 },
      { label: '6 hours', fullLabel: '6 to less than 7 hours', hours: 6.5, value: 18.0 },
      { label: '7 hours', fullLabel: '7 to less than 8 hours', hours: 7.5, value: 31.0 },
      { label: '8 hours', fullLabel: '8 to less than 9 hours', hours: 8.5, value: 35.8 },
      { label: '9 hours', fullLabel: '9 to less than 10 hours', hours: 9.5, value: 5.1 },
      { label: '10+ hours', fullLabel: '10 hours or more', hours: 10.5, value: 0.5 },
    ],
  },
}

// SVG canvas dimensions and margins
const CHART_WIDTH  = 640
const CHART_HEIGHT = 320
const MARGIN = { top: 20, right: 24, bottom: 52, left: 42 }
const INNER_WIDTH  = CHART_WIDTH  - MARGIN.left - MARGIN.right
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top  - MARGIN.bottom
const MAX_Y = 40   // y-axis cap at 40%
const X_MIN = 5.5  // leftmost x value (hours)
const X_MAX = 10.5 // rightmost x value (hours)

// Maps a sleep duration (hours) to an SVG x pixel position
function xScale(hours) {
  return MARGIN.left + ((hours - X_MIN) / (X_MAX - X_MIN)) * INNER_WIDTH
}

// Maps a percentage value to an SVG y pixel position (y increases downward in SVG)
function yScale(value) {
  return MARGIN.top + INNER_HEIGHT - (value / MAX_Y) * INNER_HEIGHT
}

// Finds where to plot the user's marker on the chart.
// Band code 5 ("9 hours or more") spans two chart points, so it uses a weighted average position.
function getUserPlotPoint(series, userSleepBand) {
  if (!userSleepBand) return null

  if (userSleepBand.code === 5) {
    const nineToTen = series.points.find((point) => point.label === '9 hours')
    const tenPlus   = series.points.find((point) => point.label === '10+ hours')

    if (!nineToTen || !tenPlus) return null

    const combinedShare  = nineToTen.value + tenPlus.value
    const weightedHours  =
      (nineToTen.hours * nineToTen.value + tenPlus.hours * tenPlus.value) / combinedShare

    return { label: userSleepBand.label, hours: weightedHours, value: combinedShare }
  }

  const match = series.points.find((point) => point.hours === userSleepBand.midpoint)
  if (!match) return null

  return { label: userSleepBand.label, hours: match.hours, value: match.value }
}

// Builds the SVG path string for the filled area under the line
function getAreaPath(points) {
  const line = points.map((point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${command} ${xScale(point.hours)} ${yScale(point.value)}`
  })

  return [
    ...line,
    `L ${xScale(points[points.length - 1].hours)} ${MARGIN.top + INNER_HEIGHT}`,
    `L ${xScale(points[0].hours)} ${MARGIN.top + INNER_HEIGHT}`,
    'Z',
  ].join(' ')
}

// Builds the SVG path string for the line itself (no fill)
function getLinePath(points) {
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${xScale(point.hours)} ${yScale(point.value)}`
    })
    .join(' ')
}

// userSleepBand — the band object for the user's Q1 answer (from Dashboard SLEEP_BANDS map)
function SleepDurationChart({ userSleepBand }) {
  const [activeSeries, setActiveSeries] = useState('overall') // which dataset tab is shown
  const [hoveredPoint, setHoveredPoint] = useState(null)      // point the mouse is over
  const [showUserPopup, setShowUserPopup] = useState(false)   // whether the user marker popup is open
  const current = SERIES[activeSeries]

  // Memoise paths so they're only recalculated when the series changes
  const areaPath = useMemo(() => getAreaPath(current.points), [current.points])
  const linePath = useMemo(() => getLinePath(current.points), [current.points])
  const averageX     = xScale(current.average)
  const highestPoint = [...current.points].sort((left, right) => right.value - left.value)[0]
  const userPoint    = getUserPlotPoint(current, userSleepBand)
  const userPointX   = userPoint ? xScale(userPoint.hours) : null
  const userPointY   = userPoint ? yScale(userPoint.value) : null

  return (
    <div className="sleep-chart-card">
      <div className="sleep-chart-top">
        <div>
          <div className="sleep-chart-eyebrow">Sleep Benchmark</div>
          <div className="sleep-chart-title">How your age group sleeps</div>
          <div className="sleep-chart-copy">
            Based on `18-24` sleep-duration data. This chart shows the population pattern for the
            selected view, the dashed line marks the average, and the orange marker shows where your
            selected sleep band sits in that distribution.
          </div>
        </div>
        <div className="sleep-chart-toggle" role="tablist" aria-label="Sleep type">
          {Object.entries(SERIES).map(([key, series]) => (
            <button
              key={key}
              type="button"
              className={`sleep-chart-tab ${activeSeries === key ? 'active' : ''}`}
              onClick={() => setActiveSeries(key)}
            >
              {series.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sleep-chart-highlight">
        <div className="sleep-highlight-stat">
          <span className="sleep-highlight-label">Estimated average</span>
          <span className="sleep-highlight-value">{current.average.toFixed(2)} h</span>
        </div>
          <div className="sleep-highlight-stat">
            <span className="sleep-highlight-label">Most common band</span>
            <span className="sleep-highlight-value">{highestPoint.fullLabel}</span>
          </div>
        </div>

      <div className="sleep-chart-shell">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="sleep-chart-svg" role="img">
          <defs>
            <linearGradient id="sleep-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={current.color} stopOpacity="0.28" />
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

          {current.points.map((point) => (
            <g key={`label-${point.hours}`} transform={`translate(${xScale(point.hours)} ${MARGIN.top + INNER_HEIGHT + 24})`}>
              <rect
                x="-32"
                y="-13"
                width="64"
                height="26"
                rx="13"
                className="sleep-axis-pill"
              />
              <text
                y="4"
                textAnchor="middle"
                className="sleep-axis-text"
              >
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
            Avg {current.average.toFixed(2)} h
          </text>

          <path d={areaPath} fill="url(#sleep-area-gradient)" />
          <path d={linePath} fill="none" stroke={current.color} strokeWidth="3.5" strokeLinecap="round" />

          {current.points.map((point) => {
            const isHovered = hoveredPoint?.hours === point.hours

            return (
              <g
                key={point.hours}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={xScale(point.hours)}
                  cy={yScale(point.value)}
                  r={isHovered ? 8 : 6}
                  fill="#ffffff"
                  stroke={current.color}
                  strokeWidth="3"
                />
                <circle
                  cx={xScale(point.hours)}
                  cy={yScale(point.value)}
                  r="16"
                  fill="transparent"
                />
              </g>
            )
          })}

          {userPoint && (
            <g
              className="sleep-user-marker-group"
              onClick={() => setShowUserPopup((currentValue) => !currentValue)}
            >
              <circle
                cx={userPointX}
                cy={userPointY}
                r="9"
                className="sleep-user-marker-ring"
              />
              <circle
                cx={userPointX}
                cy={userPointY}
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
            <div className="sleep-user-popup-label">Your usual sleep</div>
            <div className="sleep-user-popup-title">{userPoint.fullLabel ?? userPoint.label}</div>
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

export default SleepDurationChart
