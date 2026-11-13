import React, { useState } from 'react';
import {
  ClassifierPrediction,
  ExtractedFeatures
} from '../lib/genomicsEngine';

interface ScientificChartsPanelProps {
  trainingFeatures: ExtractedFeatures[];
  queryFeatures: ExtractedFeatures;
  activePrediction: ClassifierPrediction;
  onSelectSequence: (seq: ExtractedFeatures) => void;
}

export const ScientificChartsPanel: React.FC<ScientificChartsPanelProps> = ({
  trainingFeatures,
  queryFeatures,
  activePrediction,
  onSelectSequence
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ExtractedFeatures | null>(null);
  const [scatterAxes, setScatterAxes] = useState<'gc_vs_len' | 'g_vs_a'>('gc_vs_len');

  // Compute Group A and Group B centroids for Radar Chart
  const groupA = trainingFeatures.filter((f) => f.group === 'Group A');
  const groupB = trainingFeatures.filter((f) => f.group === 'Group B');

  const avgMetric = (items: ExtractedFeatures[], fn: (f: ExtractedFeatures) => number) =>
    items.length > 0 ? items.reduce((acc, x) => acc + fn(x), 0) / items.length : 0;

  const radarAxes = [
    {
      label: 'GC %',
      getA: avgMetric(groupA, (f) => f.gcContent),
      getB: avgMetric(groupB, (f) => f.gcContent),
      getQ: queryFeatures.gcContent
    },
    {
      label: 'G FRAC %',
      getA: avgMetric(groupA, (f) => (f.countG / Math.max(1, f.length)) * 100),
      getB: avgMetric(groupB, (f) => (f.countG / Math.max(1, f.length)) * 100),
      getQ: (queryFeatures.countG / Math.max(1, queryFeatures.length)) * 100
    },
    {
      label: 'C FRAC %',
      getA: avgMetric(groupA, (f) => (f.countC / Math.max(1, f.length)) * 100),
      getB: avgMetric(groupB, (f) => (f.countC / Math.max(1, f.length)) * 100),
      getQ: (queryFeatures.countC / Math.max(1, queryFeatures.length)) * 100
    },
    {
      label: 'A FRAC %',
      getA: avgMetric(groupA, (f) => (f.countA / Math.max(1, f.length)) * 100),
      getB: avgMetric(groupB, (f) => (f.countA / Math.max(1, f.length)) * 100),
      getQ: (queryFeatures.countA / Math.max(1, queryFeatures.length)) * 100
    },
    {
      label: 'T FRAC %',
      getA: avgMetric(groupA, (f) => (f.countT / Math.max(1, f.length)) * 100),
      getB: avgMetric(groupB, (f) => (f.countT / Math.max(1, f.length)) * 100),
      getQ: (queryFeatures.countT / Math.max(1, queryFeatures.length)) * 100
    },
    {
      label: 'ENTROPY %',
      getA: avgMetric(groupA, (f) => (f.shannonEntropy / 2.0) * 100),
      getB: avgMetric(groupB, (f) => (f.shannonEntropy / 2.0) * 100),
      getQ: (queryFeatures.shannonEntropy / 2.0) * 100
    }
  ];

  // Radar polygon helper
  const radarCenter = { x: 150, y: 135 };
  const radarRadius = 88;
  const buildRadarPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
        const norm = Math.min(1, Math.max(0.05, v / 100));
        const r = norm * radarRadius;
        const x = radarCenter.x + r * Math.cos(angle);
        const y = radarCenter.y + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  // Scatter plot coordinate helper
  const scatterW = 460;
  const scatterH = 260;
  const padL = 48;
  const padR = 24;
  const padT = 24;
  const padB = 38;
  const plotW = scatterW - padL - padR;
  const plotH = scatterH - padT - padB;

  const xMin = scatterAxes === 'gc_vs_len' ? 0 : 0;
  const xMax = scatterAxes === 'gc_vs_len' ? 105 : 6;
  const yMin = scatterAxes === 'gc_vs_len' ? 4 : 0;
  const yMax = scatterAxes === 'gc_vs_len' ? 18 : 6;

  const toPlotX = (val: number) => padL + ((Math.min(xMax, Math.max(xMin, val)) - xMin) / (xMax - xMin)) * plotW;
  const toPlotY = (val: number) => padT + plotH - ((Math.min(yMax, Math.max(yMin, val)) - yMin) / (yMax - yMin)) * plotH;

  const splitLineX =
    scatterAxes === 'gc_vs_len' ? toPlotX(62.5) : toPlotX(2.5);

  const allSequencesWithQuery = [...trainingFeatures, queryFeatures];

  const getHeatColor = (pct: number) => {
    if (pct >= 75) return 'bg-amber-600 text-white';
    if (pct >= 55) return 'bg-cyan-700 text-white';
    if (pct >= 35) return 'bg-cyan-500/30 text-slate-900';
    if (pct >= 20) return 'bg-sky-100 text-slate-800';
    if (pct > 0) return 'bg-slate-100 text-slate-700';
    return 'bg-slate-50 text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Row 1: 2D Feature Decision Boundary Scatter + Multivariate Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 1: 2D Feature Space Decision Boundary & Crosshair Canvas */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  DECISION BOUNDARY TOPOLOGY · LIVE CLASSIFIER SPACE
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  2D Feature Partition &amp; Query Sequence Projection
                </h3>
              </div>

              {/* Axis mode selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setScatterAxes('gc_vs_len')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    scatterAxes === 'gc_vs_len'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  GC % vs Length
                </button>
                <button
                  type="button"
                  onClick={() => setScatterAxes('g_vs_a')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    scatterAxes === 'g_vs_a'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  G Count vs A Count
                </button>
              </div>
            </div>

            <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded p-2 relative">
              <svg
                viewBox={`0 0 ${scatterW} ${scatterH}`}
                className="w-full h-64 cursor-crosshair"
                role="img"
                aria-label="2D Feature space decision boundary chart"
              >
                {/* Decision Region Shading */}
                <rect
                  x={padL}
                  y={padT}
                  width={Math.max(0, splitLineX - padL)}
                  height={plotH}
                  fill="#0284C7"
                  fillOpacity="0.06"
                />
                <rect
                  x={splitLineX}
                  y={padT}
                  width={Math.max(0, padL + plotW - splitLineX)}
                  height={plotH}
                  fill="#D97706"
                  fillOpacity="0.06"
                />

                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((frac) => (
                  <g key={frac}>
                    <line
                      x1={padL}
                      y1={padT + plotH * frac}
                      x2={padL + plotW}
                      y2={padT + plotH * frac}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                    <line
                      x1={padL + plotW * frac}
                      y1={padT}
                      x2={padL + plotW * frac}
                      y2={padT + plotH}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Axes */}
                <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#64748B" strokeWidth="1.25" />
                <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#64748B" strokeWidth="1.25" />

                {/* Decision threshold vertical line */}
                <line
                  x1={splitLineX}
                  y1={padT}
                  x2={splitLineX}
                  y2={padT + plotH}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={splitLineX + 5}
                  y={padT + 14}
                  className="text-[10px] font-mono fill-slate-700 font-semibold"
                >
                  {scatterAxes === 'gc_vs_len' ? 'SPLIT: GC = 62.5%' : 'SPLIT: G = 2.5 nt'}
                </text>

                {/* Region Labels */}
                <text x={padL + 10} y={padT + 16} className="text-[10px] font-mono fill-sky-700 font-semibold">
                  GROUP A REGION
                </text>
                <text
                  x={padL + plotW - 10}
                  y={padT + 16}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-amber-700 font-semibold"
                >
                  GROUP B REGION
                </text>

                {/* Axis Titles */}
                <text
                  x={padL + plotW / 2}
                  y={scatterH - 8}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-500"
                >
                  {scatterAxes === 'gc_vs_len' ? 'X-AXIS: GC CONTENT (%)' : 'X-AXIS: GUANINE (G) COUNT'}
                </text>
                <text
                  x={14}
                  y={padT + plotH / 2}
                  textAnchor="middle"
                  transform={`rotate(-90, 14, ${padT + plotH / 2})`}
                  className="text-[10px] font-mono fill-slate-500"
                >
                  {scatterAxes === 'gc_vs_len' ? 'Y: LENGTH (BP)' : 'Y: ADENINE (A) COUNT'}
                </text>

                {/* Plot Training Points */}
                {trainingFeatures.map((seq, idx) => {
                  const xVal = scatterAxes === 'gc_vs_len' ? seq.gcContent : seq.countG;
                  const yVal = scatterAxes === 'gc_vs_len' ? seq.length : seq.countA;
                  // Slight jitter for overlapping S1/S2 coordinates so both points are clearly clickable
                  const jitterY = idx % 2 === 0 ? -4 : 4;
                  const cx = toPlotX(xVal);
                  const cy = toPlotY(yVal) + jitterY;
                  const isGroupA = seq.group === 'Group A';

                  return (
                    <g
                      key={seq.id}
                      onMouseEnter={() => setHoveredPoint(seq)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => onSelectSequence(seq)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6.5}
                        fill={isGroupA ? '#0284C7' : '#D97706'}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx + 9}
                        y={cy + 3.5}
                        className="text-[10px] font-mono fill-slate-700 font-semibold"
                      >
                        {seq.id}
                      </text>
                    </g>
                  );
                })}

                {/* Plot Active Unknown Query Sequence */}
                {(() => {
                  const qXVal = scatterAxes === 'gc_vs_len' ? queryFeatures.gcContent : queryFeatures.countG;
                  const qYVal = scatterAxes === 'gc_vs_len' ? queryFeatures.length : queryFeatures.countA;
                  const qx = toPlotX(qXVal);
                  const qy = toPlotY(qYVal);

                  return (
                    <g
                      onMouseEnter={() => setHoveredPoint(queryFeatures)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Crosshair lines for query point */}
                      <line
                        x1={qx}
                        y1={padT}
                        x2={qx}
                        y2={padT + plotH}
                        stroke="#06B6D4"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <line
                        x1={padL}
                        y1={qy}
                        x2={padL + plotW}
                        y2={qy}
                        stroke="#06B6D4"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <polygon
                        points={`${qx},${qy - 8} ${qx + 8},${qy} ${qx},${qy + 8} ${qx - 8},${qy}`}
                        fill="#06B6D4"
                        stroke="#0F172A"
                        strokeWidth="1.5"
                      />
                      <text
                        x={qx + 10}
                        y={qy - 6}
                        className="text-[10px] font-mono fill-slate-900 font-bold"
                      >
                        UNKNOWN ({queryFeatures.sequence.slice(0, 10)})
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-4">
              <span>● Group A (Sky)</span>
              <span>·</span>
              <span>● Group B (Amber)</span>
              <span>·</span>
              <span>◆ Query Sequence (Cyan Diamond)</span>
            </div>
            <div className="text-slate-500">
              {hoveredPoint ? (
                <span>
                  {hoveredPoint.id}: {hoveredPoint.sequence} · GC={hoveredPoint.gcContent}% · G={hoveredPoint.countG} · L={hoveredPoint.length}bp
                </span>
              ) : (
                <span>Click any point to load into Duplex Inspector</span>
              )}
            </div>
          </div>
        </div>

        {/* Chart 2: Spider / Radar Multivariate Calibration */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-200">
              <div className="text-xs font-mono text-slate-500">
                MULTIVARIATE PARAMETER CALIBRATION
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                6-Axis Centroid vs. Unknown Sequence Radar
              </h3>
            </div>

            <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded p-2 flex items-center justify-center">
              <svg
                viewBox="0 0 300 270"
                className="w-full h-64"
                role="img"
                aria-label="6-axis radar parameter chart"
              >
                {/* Concentric hexagonal grid rings */}
                {[0.25, 0.5, 0.75, 1.0].map((level) => {
                  const pts = radarAxes
                    .map((_, i) => {
                      const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                      const r = radarRadius * level;
                      return `${(radarCenter.x + r * Math.cos(angle)).toFixed(1)},${(
                        radarCenter.y + r * Math.sin(angle)
                      ).toFixed(1)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={level}
                      points={pts}
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Radial spokes & vertex labels */}
                {radarAxes.map((axis, i) => {
                  const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                  const xEnd = radarCenter.x + radarRadius * Math.cos(angle);
                  const yEnd = radarCenter.y + radarRadius * Math.sin(angle);
                  const lx = radarCenter.x + (radarRadius + 24) * Math.cos(angle);
                  const ly = radarCenter.y + (radarRadius + 18) * Math.sin(angle);
                  return (
                    <g key={axis.label}>
                      <line
                        x1={radarCenter.x}
                        y1={radarCenter.y}
                        x2={xEnd}
                        y2={yEnd}
                        stroke="#CBD5E1"
                        strokeWidth="1"
                      />
                      <text
                        x={lx}
                        y={ly + 3}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-slate-600 font-semibold"
                      >
                        {axis.label}
                      </text>
                    </g>
                  );
                })}

                {/* Group A Mean Polygon */}
                <polygon
                  points={buildRadarPoints(radarAxes.map((a) => a.getA))}
                  fill="#0284C7"
                  fillOpacity="0.14"
                  stroke="#0284C7"
                  strokeWidth="1.5"
                />

                {/* Group B Mean Polygon */}
                <polygon
                  points={buildRadarPoints(radarAxes.map((a) => a.getB))}
                  fill="#D97706"
                  fillOpacity="0.14"
                  stroke="#D97706"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />

                {/* Unknown Query Polygon */}
                <polygon
                  points={buildRadarPoints(radarAxes.map((a) => a.getQ))}
                  fill="#06B6D4"
                  fillOpacity="0.22"
                  stroke="#0F172A"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600">
            <span>― Group A Mean</span>
            <span>·</span>
            <span>-- Group B Mean</span>
            <span>·</span>
            <span className="font-semibold text-slate-900">▬ Query ({queryFeatures.id})</span>
          </div>
        </div>
      </div>

      {/* Row 2: CART Decision Tree Split Visualizer + Genomic Composition Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Learned CART Decision Tree Diagram */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-200">
              <div className="text-xs font-mono text-slate-500">
                LEARNED SYMBOLIC RULE · GINI IMPURITY CRITERION
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                CART Decision Tree Partition Graph
              </h3>
            </div>

            {activePrediction.treeDetails ? (
              <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded p-3">
                <svg viewBox="0 0 360 210" className="w-full h-52" role="img" aria-label="Decision tree split diagram">
                  {/* Edges */}
                  <line x1={180} y1={68} x2={95} y2={132} stroke="#0284C7" strokeWidth="2" />
                  <line x1={180} y1={68} x2={265} y2={132} stroke="#D97706" strokeWidth="2" />

                  <text x={115} y={102} textAnchor="middle" className="text-[10px] font-mono fill-sky-700 font-semibold">
                    TRUE (≤ {activePrediction.treeDetails.threshold}{activePrediction.treeDetails.unit})
                  </text>
                  <text x={245} y={102} textAnchor="middle" className="text-[10px] font-mono fill-amber-700 font-semibold">
                    FALSE (&gt; {activePrediction.treeDetails.threshold}{activePrediction.treeDetails.unit})
                  </text>

                  {/* Root Node */}
                  <rect x={90} y={14} width={180} height={54} rx={4} fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                  <text x={180} y={32} textAnchor="middle" className="text-[11px] font-mono fill-slate-900 font-bold">
                    {activePrediction.treeDetails.featureName} ≤ {activePrediction.treeDetails.threshold}
                    {activePrediction.treeDetails.unit}
                  </text>
                  <text x={180} y={47} textAnchor="middle" className="text-[9.5px] font-mono fill-slate-500">
                    gini = {activePrediction.treeDetails.gini.toFixed(3)} · samples = {activePrediction.treeDetails.samples}
                  </text>
                  <text x={180} y={60} textAnchor="middle" className="text-[9.5px] font-mono fill-slate-600">
                    value = [A: {activePrediction.treeDetails.classCounts.groupA}, B: {activePrediction.treeDetails.classCounts.groupB}]
                  </text>

                  {/* Left Child Leaf */}
                  <rect
                    x={22}
                    y={132}
                    width={146}
                    height={62}
                    rx={4}
                    fill="#E0F2FE"
                    stroke="#0284C7"
                    strokeWidth={activePrediction.predictedGroup === activePrediction.treeDetails.leftPrediction ? '2.5' : '1.25'}
                  />
                  <text x={95} y={150} textAnchor="middle" className="text-[11px] font-mono fill-sky-900 font-bold">
                    Predict: {activePrediction.treeDetails.leftPrediction}
                  </text>
                  <text x={95} y={166} textAnchor="middle" className="text-[9.5px] font-mono fill-sky-800">
                    gini = {activePrediction.treeDetails.leftGini.toFixed(3)}
                  </text>
                  <text x={95} y={181} textAnchor="middle" className="text-[9.5px] font-mono fill-sky-800">
                    samples = [A:{activePrediction.treeDetails.leftSamples.groupA}, B:{activePrediction.treeDetails.leftSamples.groupB}]
                  </text>

                  {/* Right Child Leaf */}
                  <rect
                    x={192}
                    y={132}
                    width={146}
                    height={62}
                    rx={4}
                    fill="#FEF3C7"
                    stroke="#D97706"
                    strokeWidth={activePrediction.predictedGroup === activePrediction.treeDetails.rightPrediction ? '2.5' : '1.25'}
                  />
                  <text x={265} y={150} textAnchor="middle" className="text-[11px] font-mono fill-amber-900 font-bold">
                    Predict: {activePrediction.treeDetails.rightPrediction}
                  </text>
                  <text x={265} y={166} textAnchor="middle" className="text-[9.5px] font-mono fill-amber-800">
                    gini = {activePrediction.treeDetails.rightGini.toFixed(3)}
                  </text>
                  <text x={265} y={181} textAnchor="middle" className="text-[9.5px] font-mono fill-amber-800">
                    samples = [A:{activePrediction.treeDetails.rightSamples.groupA}, B:{activePrediction.treeDetails.rightSamples.groupB}]
                  </text>
                </svg>
              </div>
            ) : (
              <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded p-4 text-xs font-mono text-slate-700 space-y-2">
                <div className="font-semibold text-slate-900">{activePrediction.classifierLabel} Decision Summary:</div>
                <p>{activePrediction.decisionRuleSummary}</p>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs font-mono text-slate-600">
            Active Rule: {activePrediction.decisionRuleSummary}
          </div>
        </div>

        {/* Chart 3: Genomic Base Composition & Feature Heatmap */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  SPECTROGRAPHIC &amp; STOICHIOMETRIC MATRIX
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  Cohort Nucleotide Frequency &amp; GC Density Heatmap
                </h3>
              </div>
              <div className="text-xs font-mono text-slate-500">
                 SCALE: 0% (Low) → 50% (Mid) → 100% (Max)
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs font-mono tabular-nums border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-left">
                    <th className="py-2 pr-3 font-medium">ID</th>
                    <th className="py-2 pr-3 font-medium">CLASS</th>
                    <th className="py-2 px-2 font-medium text-center">A %</th>
                    <th className="py-2 px-2 font-medium text-center">T %</th>
                    <th className="py-2 px-2 font-medium text-center">G %</th>
                    <th className="py-2 px-2 font-medium text-center">C %</th>
                    <th className="py-2 px-2 font-medium text-center">GC %</th>
                    <th className="py-2 pl-3 font-medium text-right">Tm (°C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allSequencesWithQuery.map((item) => {
                    const isQuery = item.id === queryFeatures.id;
                    const aPct = Math.round((item.countA / Math.max(1, item.length)) * 100);
                    const tPct = Math.round((item.countT / Math.max(1, item.length)) * 100);
                    const gPct = Math.round((item.countG / Math.max(1, item.length)) * 100);
                    const cPct = Math.round((item.countC / Math.max(1, item.length)) * 100);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelectSequence(item)}
                        className={`cursor-pointer transition-colors ${
                          isQuery ? 'bg-cyan-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-1.5 pr-3 text-slate-900">
                          {item.id} {isQuery ? '(QUERY)' : ''}
                        </td>
                        <td className="py-1.5 pr-3">
                          <span
                            className={
                              isQuery
                                ? 'text-cyan-800 font-semibold'
                                : item.group === 'Group A'
                                  ? 'text-sky-700'
                                  : 'text-amber-700'
                            }
                          >
                            {isQuery ? `→ ${activePrediction.predictedGroup}` : item.group}
                          </span>
                        </td>
                        <td className="p-0.5">
                          <div className={`py-1 px-2 text-center rounded-xs ${getHeatColor(aPct)}`}>
                            {aPct}%
                          </div>
                        </td>
                        <td className="p-0.5">
                          <div className={`py-1 px-2 text-center rounded-xs ${getHeatColor(tPct)}`}>
                            {tPct}%
                          </div>
                        </td>
                        <td className="p-0.5">
                          <div className={`py-1 px-2 text-center rounded-xs ${getHeatColor(gPct)}`}>
                            {gPct}%
                          </div>
                        </td>
                        <td className="p-0.5">
                          <div className={`py-1 px-2 text-center rounded-xs ${getHeatColor(cPct)}`}>
                            {cPct}%
                          </div>
                        </td>
                        <td className="p-0.5">
                          <div className={`py-1 px-2 text-center rounded-xs font-semibold ${getHeatColor(item.gcContent)}`}>
                            {item.gcContent.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-1.5 pl-3 text-right text-slate-700">
                          {item.meltingTempC.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-xs font-mono text-slate-500">
            Notice how S1 &amp; S2 exhibit uniform 25% A/T/G/C balance (GC=50.0%), whereas S3 &amp; S4 concentrate G+C density (75.0%–100.0%).
          </div>
        </div>
      </div>
    </div>
  );
};
