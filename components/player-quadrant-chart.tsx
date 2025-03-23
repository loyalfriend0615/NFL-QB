"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Info } from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
  ReferenceArea,
  ReferenceLine,
  Label as RechartsLabel,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

export function PlayerQuadrantChart({
  players,
  position,
  xMetric,
  yMetric,
  getMetricName,
  selectedPlayer,
  setSelectedPlayer,
}) {
  const [showLabels, setShowLabels] = useState(true)
  const [labelSize, setLabelSize] = useState([12])
  const [highlightElite, setHighlightElite] = useState(true)
  const [iconSize, setIconSize] = useState([6])
  const [labelMode, setLabelMode] = useState("all") // "all", "selected", "initials", "elite"

  // Calculate median values for the selected metrics to place reference lines
  const xValues = players.map((player) => player[xMetric])
  const yValues = players.map((player) => player[yMetric])
  const xMedian = xValues.sort((a, b) => a - b)[Math.floor(xValues.length / 2)]
  const yMedian = yValues.sort((a, b) => a - b)[Math.floor(yValues.length / 2)]

  // Get quadrant labels based on selected metrics
  const getQuadrantLabels = () => {
    if (position === "QB") {
      if (xMetric === "avgDepthOfTarget" && yMetric === "shortCompletionPct") {
        return {
          topLeft: "Short Game Specialists",
          topRight: "Balanced Passers",
          bottomLeft: "Limited Passers",
          bottomRight: "Deep Ball Specialists",
        }
      } else if (xMetric === "rushYardsPerAttempt" && yMetric === "rushTdPct") {
        return {
          topLeft: "Goal Line Rushers",
          topRight: "Dual Threats",
          bottomLeft: "Pocket Passers",
          bottomRight: "Scrambling QBs",
        }
      }
    } else if (position === "WR") {
      if (xMetric === "manSeparation" && yMetric === "zoneSeparation") {
        return {
          topLeft: "Zone Beaters",
          topRight: "Elite Separators",
          bottomLeft: "Contested Catchers",
          bottomRight: "Man Beaters",
        }
      }
    }

    return {
      topLeft: "High Y, Low X",
      topRight: "High Y, High X",
      bottomLeft: "Low Y, Low X",
      bottomRight: "Low Y, High X",
    }
  }

  const quadrantLabels = getQuadrantLabels()

  // Update the handleDotClick function
  const handleDotClick = useCallback(
    (event) => {
      if (event && event.id) {
        setSelectedPlayer(event.id === selectedPlayer ? null : event.id)
      }
    },
    [selectedPlayer, setSelectedPlayer],
  )

  // Create a map of player positions to detect and avoid overlaps
  const playerPositions = useMemo(() => {
    const positions = new Map()

    players.forEach((player) => {
      const x = player[xMetric]
      const y = player[yMetric]
      // Round to 2 decimal places to group nearby players
      const key = `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`

      if (!positions.has(key)) {
        positions.set(key, [])
      }
      positions.get(key).push(player.id)
    })

    return positions
  }, [players, xMetric, yMetric])

  // Get label display mode options
  const labelModeOptions = [
    { value: "all", label: "All Names" },
    { value: "selected", label: "Selected Only" },
    { value: "initials", label: "Initials" },
    { value: "elite", label: "Elite Only" },
  ]

  // Add CSS variables for theme-aware reference lines
  const referenceLineStyle = {
    "--reference-line": "rgba(100, 100, 100, 0.8)",
    "--quadrant-top-left": "#f0f9ff",
    "--quadrant-top-right": "#dcfce7",
    "--quadrant-bottom-left": "#fee2e2",
    "--quadrant-bottom-right": "#fef9c3",
  } as React.CSSProperties

  // In dark mode, use a brighter color
  if (typeof window !== "undefined" && document.documentElement.classList.contains("dark")) {
    referenceLineStyle["--reference-line"] = "rgba(200, 200, 200, 0.8)"
    referenceLineStyle["--quadrant-top-left"] = "#a7c9ff"
    referenceLineStyle["--quadrant-top-right"] = "#a7f3d0"
    referenceLineStyle["--quadrant-bottom-left"] = "#fecaca"
    referenceLineStyle["--quadrant-bottom-right"] = "#fde68a"
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">2024 {position} Performance Quadrant</CardTitle>
        <CardDescription>
          Comparing {getMetricName(xMetric)} vs. {getMetricName(yMetric)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} />
              <Label htmlFor="labels">Show Names</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="elite" checked={highlightElite} onCheckedChange={setHighlightElite} />
              <Label htmlFor="elite">Highlight Elite</Label>
            </div>

            {showLabels && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="labelSize" className="min-w-20">
                    Label: {labelSize}
                  </Label>
                  <Slider
                    id="labelSize"
                    min={8}
                    max={16}
                    step={1}
                    value={labelSize}
                    onValueChange={setLabelSize}
                    className="w-[100px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="labelMode" className="min-w-20">
                    Mode:
                  </Label>
                  <select
                    id="labelMode"
                    value={labelMode}
                    onChange={(e) => setLabelMode(e.target.value)}
                    className="h-9 w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    {labelModeOptions.map((option) => (
                      <option key={option.value} value={option.value} className="py-1">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Label htmlFor="iconSize" className="min-w-20">
                Icon: {iconSize}
              </Label>
              <Slider
                id="iconSize"
                min={3}
                max={12}
                step={1}
                value={iconSize}
                onValueChange={setIconSize}
                className="w-[100px]"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0" onClick={() => setSelectedPlayer(null)}>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 30, right: 30, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey={xMetric} name={getMetricName(xMetric)} domain={["auto", "auto"]}>
                  <RechartsLabel value={getMetricName(xMetric)} position="bottom" offset={20} />
                </XAxis>
                <YAxis type="number" dataKey={yMetric} name={getMetricName(yMetric)} domain={["auto", "auto"]}>
                  <RechartsLabel
                    value={getMetricName(yMetric)}
                    angle={-90}
                    position="insideLeft"
                    offset={-20}
                    style={{ textAnchor: "middle" }}
                  />
                </YAxis>
                <ZAxis range={[iconSize[0] * 10, iconSize[0] * 10]} />

                {/* Enhanced reference lines - theme aware */}
                <ReferenceLine x={xMedian} stroke="var(--reference-line)" strokeWidth={2} />
                <ReferenceLine y={yMedian} stroke="var(--reference-line)" strokeWidth={2} />

                <ReferenceArea
                  x1={0}
                  x2={xMedian}
                  y1={yMedian}
                  y2={1}
                  fill="var(--quadrant-top-left)"
                  fillOpacity={0.4}
                />
                <ReferenceArea
                  x1={xMedian}
                  x2={1}
                  y1={yMedian}
                  y2={1}
                  fill="var(--quadrant-top-right)"
                  fillOpacity={0.4}
                />
                <ReferenceArea
                  x1={0}
                  x2={xMedian}
                  y1={0}
                  y2={yMedian}
                  fill="var(--quadrant-bottom-left)"
                  fillOpacity={0.4}
                />
                <ReferenceArea
                  x1={xMedian}
                  x2={1}
                  y1={0}
                  y2={yMedian}
                  fill="var(--quadrant-bottom-right)"
                  fillOpacity={0.4}
                />

                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />

                <Scatter
                  name="Players"
                  data={players}
                  fill="#8884d8"
                  shape={(props) =>
                    renderShape(
                      props,
                      showLabels,
                      labelSize[0],
                      highlightElite,
                      selectedPlayer,
                      iconSize[0],
                      handleDotClick,
                      playerPositions,
                      labelMode,
                    )
                  }
                />

              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <h3 className="font-medium mb-1 flex items-center gap-2 text-sm">
              <Info className="h-4 w-4" />
              Analysis Insights
            </h3>
            <p className="text-xs text-muted-foreground">
              This quadrant chart divides players into four categories. Elite performers (top-right) excel in both
              metrics and are the most valuable for fantasy. Players in top-left and bottom-right may offer situational
              value.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Custom tooltip component
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const player = payload[0].payload

  return (
    <div className="bg-white p-3 border rounded-md shadow-md">
      <p className="font-bold">{player.name}</p>
      <p className="text-sm">Team: {player.team}</p>
      <div className="mt-2">
        {payload.map((entry, index) => (
          <p key={index} className="text-sm">
            {entry.name}: {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{player.note}</p>
    </div>
  )
}

// Helper function to get initials from a name
function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
}

// Update the renderShape function to include the click handler and stop propagation
function renderShape(
  props,
  showLabels,
  labelSize,
  highlightElite,
  selectedPlayerId,
  baseIconSize,
  onClick,
  playerPositions,
  labelMode,
) {
  const { cx, cy, payload } = props

  // Determine if player is "elite" (in top 25% for both metrics)
  const isElite = payload.isElite
  const isSelected = selectedPlayerId === payload.id

  // Calculate point size
  const size = isSelected ? baseIconSize * 1.67 : isElite && highlightElite ? baseIconSize * 1.33 : baseIconSize

  const handleClick = (e) => {
    e.stopPropagation() // Stop event propagation
    onClick(payload)
  }

  // Determine if this player's position has overlapping players
  const positionKey = `${Math.round(payload[props.xKey] * 100) / 100},${Math.round(payload[props.yKey] * 100) / 100}`
  const overlappingPlayers = playerPositions.get(positionKey) || []
  const hasOverlap = overlappingPlayers.length > 1

  // Determine if we should show the label based on the selected mode
  let shouldShowLabel = false
  if (showLabels) {
    switch (labelMode) {
      case "all":
        shouldShowLabel = true
        break
      case "selected":
        shouldShowLabel = isSelected
        break
      case "elite":
        shouldShowLabel = isElite
        break
      case "initials":
        shouldShowLabel = true
        break
    }
  }

  // Apply a slight jitter to overlapping labels
  let labelX = cx
  let labelY = cy - size - 2

  if (hasOverlap && shouldShowLabel) {
    // Find the index of this player in the overlapping group
    const index = overlappingPlayers.indexOf(payload.id)
    if (index > 0) {
      // Apply an offset based on the player's position in the group
      labelX += (index % 2 === 0 ? 1 : -1) * (index + 1) * 5
      labelY -= index * 3
    }
  }

  // Determine what text to display
  let labelText = payload.name
  if (labelMode === "initials") {
    labelText = getInitials(payload.name)
  }

  return (
    <g style={{ cursor: "pointer" }} onClick={handleClick}>
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={isSelected ? "#10b981" : isElite && highlightElite ? "#f97316" : "#6366f1"}
        stroke={isSelected ? "#065f46" : isElite && highlightElite ? "#7c2d12" : "#4338ca"}
        strokeWidth={isSelected ? 2 : 1}
      />
      {shouldShowLabel && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fill={isSelected ? "#065f46" : "#000"}
          fontSize={isSelected ? labelSize + 1 : labelSize}
          fontWeight={isSelected || (isElite && highlightElite) ? "bold" : "normal"}
          style={{
            filter: "drop-shadow(0px 0px 2px white) drop-shadow(0px 0px 1px white)",
            textShadow: "0 0 3px white, 0 0 2px white",
          }}
        >
          {labelText}
        </text>
      )}
    </g>
  )
}

