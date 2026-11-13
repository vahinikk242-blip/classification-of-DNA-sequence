import React, { useState } from 'react';
import { ExtractedFeatures } from '../lib/genomicsEngine';

interface HelixSequenceVisualizerProps {
  features: ExtractedFeatures;
  predictedGroup: 'Group A' | 'Group B';
  confidence: number;
}

const BASE_COLORS: Record<string, { stroke: string; fill: string; text: string; name: string; pair: string; hBonds: number }> = {
  A: {
    stroke: '#0284C7',
    fill: '#E0F2FE',
    text: '#0369A1',
    name: 'Adenine (Purine)',
    pair: 'T',
    hBonds: 2
  },
  T: {
    stroke: '#4F46E5',
    fill: '#E0E7FF',
    text: '#3730A3',
    name: 'Thymine (Pyrimidine)',
    pair: 'A',
    hBonds: 2
  },
  G: {
    stroke: '#0891B2',
    fill: '#CFFAFE',
    text: '#0E7490',
    name: 'Guanine (Purine)',
    pair: 'C',
    hBonds: 3
  },
  C: {
    stroke: '#D97706',
    fill: '#FEF3C7',
    text: '#B45309',
    name: 'Cytosine (Pyrimidine)',
    pair: 'G',
    hBonds: 3
  }
};

export const HelixSequenceVisualizer: React.FC<HelixSequenceVisualizerProps> = ({
  features,
  predictedGroup,
  confidence
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const bases = features.sequence.split('');
  const totalHBonds = bases.reduce((acc, b) => acc + (BASE_COLORS[b]?.hBonds || 2), 0);

  // Detect CpG dinucleotide indices
  const cpgPositions = new Set<number>();
  for (let i = 0; i < bases.length - 1; i++) {
    if (bases[i] === 'C' && bases[i + 1] === 'G') {
      cpgPositions.add(i);
    }
  }

  const colSpacing = Math.max(46, Math.min(68, Math.floor(680 / Math.max(1, bases.length))));
  const svgWidth = Math.max(660, bases.length * colSpacing + 100);
  const svgHeight = 200;

  const activeBase = hoveredIndex !== null ? bases[hoveredIndex] : null;
  const activeMeta = activeBase ? BASE_COLORS[activeBase] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-mono text-slate-500">
            <span>STRUCTURAL DUPLEX TOPOLOGY</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>LOCUS: {features.id}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>{features.length} BP</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mt-0.5">
            5&apos;→3&apos; Nucleotide Base-Pair &amp; Hydrogen Bond Stoichiometry
          </h3>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono tabular-nums text-slate-600">
          <div>
            <span className="text-slate-400">H-BONDS:</span>{' '}
            <span className="font-semibold text-slate-900">{totalHBonds}</span>
          </div>
          <div>
            <span className="text-slate-400">CpG DINUCLEOTIDES:</span>{' '}
            <span className="font-semibold text-slate-900">{features.cpgCount}</span>
          </div>
          <div>
            <span className="text-slate-400">WALLACE Tm:</span>{' '}
            <span className="font-semibold text-slate-900">{features.meltingTempC.toFixed(1)} °C</span>
          </div>
          <div>
            <span className="text-slate-400">CLASSIFICATION:</span>{' '}
            <span className={predictedGroup === 'Group A' ? 'font-semibold text-sky-700' : 'font-semibold text-amber-700'}>
              {predictedGroup} ({confidence}%)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Duplex Canvas */}
      <div className="mt-4 overflow-x-auto bg-[#F8FAFC] border border-slate-200 rounded p-3 cursor-crosshair">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 min-w-[620px]"
          role="img"
          aria-label={`DNA duplex diagram for sequence ${features.sequence}`}
        >
          {/* Coordinate grid lines */}
          <line x1={36} y1={52} x2={svgWidth - 36} y2={52} stroke="#CBD5E1" strokeWidth="2" />
          <line x1={36} y1={148} x2={svgWidth - 36} y2={148} stroke="#CBD5E1" strokeWidth="2" />

          {/* 5' and 3' terminal markers */}
          <text x={14} y={56} className="text-[11px] font-mono fill-slate-500 font-semibold">
            5&apos;
          </text>
          <text x={svgWidth - 26} y={56} className="text-[11px] font-mono fill-slate-500 font-semibold">
            3&apos;
          </text>
          <text x={14} y={152} className="text-[11px] font-mono fill-slate-500 font-semibold">
            3&apos;
          </text>
          <text x={svgWidth - 26} y={152} className="text-[11px] font-mono fill-slate-500 font-semibold">
            5&apos;
          </text>

          {/* Helical backbone wave curve */}
          {bases.map((base, idx) => {
            const x = 58 + idx * colSpacing;
            const compBase = BASE_COLORS[base]?.pair || 'N';
            const topColor = BASE_COLORS[base] || BASE_COLORS.A;
            const botColor = BASE_COLORS[compBase] || BASE_COLORS.T;
            const isHovered = hoveredIndex === idx;
            const isCpGStart = cpgPositions.has(idx);

            return (
              <g
                key={`${idx}-${base}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="transition-opacity duration-150"
              >
                {/* Hover highlight column */}
                {isHovered && (
                  <rect
                    x={x - colSpacing / 2 + 4}
                    y={12}
                    width={colSpacing - 8}
                    height={176}
                    rx={4}
                    fill="#06B6D4"
                    fillOpacity="0.08"
                    stroke="#06B6D4"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
                )}

                {/* CpG island motif bracket */}
                {isCpGStart && (
                  <g>
                    <rect
                      x={x - 16}
                      y={14}
                      width={colSpacing + 32}
                      height={16}
                      rx={2}
                      fill="#FEF3C7"
                      stroke="#F59E0B"
                      strokeWidth="1"
                    />
                    <text
                      x={x + colSpacing / 2}
                      y={25}
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-amber-800 font-semibold"
                    >
                      CpG MOTIF
                    </text>
                  </g>
                )}

                {/* Hydrogen bond rungs (2 for AT, 3 for GC) */}
                {topColor.hBonds === 2 ? (
                  <>
                    <line
                      x1={x - 4}
                      y1={68}
                      x2={x - 4}
                      y2={132}
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={x + 4}
                      y1={68}
                      x2={x + 4}
                      y2={132}
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  </>
                ) : (
                  <>
                    <line
                      x1={x - 6}
                      y1={68}
                      x2={x - 6}
                      y2={132}
                      stroke="#0891B2"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                    <line
                      x1={x}
                      y1={68}
                      x2={x}
                      y2={132}
                      stroke="#0891B2"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                    <line
                      x1={x + 6}
                      y1={68}
                      x2={x + 6}
                      y2={132}
                      stroke="#0891B2"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  </>
                )}

                {/* H-bond count label in center */}
                <rect
                  x={x - 11}
                  y={92}
                  width={22}
                  height={15}
                  rx={2}
                  fill="#FFFFFF"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={102.5}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-slate-500"
                >
                  {topColor.hBonds}H
                </text>

                {/* Top Strand Base Node (5' -> 3') */}
                <rect
                  x={x - 16}
                  y={36}
                  width={32}
                  height={32}
                  rx={4}
                  fill={topColor.fill}
                  stroke={topColor.stroke}
                  strokeWidth={isHovered ? '2' : '1.25'}
                />
                <text
                  x={x}
                  y={56}
                  textAnchor="middle"
                  fill={topColor.text}
                  className="text-xs font-mono font-bold"
                >
                  {base}
                </text>

                {/* Bottom Complement Strand Base Node (3' -> 5') */}
                <rect
                  x={x - 16}
                  y={132}
                  width={32}
                  height={32}
                  rx={4}
                  fill={botColor.fill}
                  stroke={botColor.stroke}
                  strokeWidth={isHovered ? '2' : '1.25'}
                />
                <text
                  x={x}
                  y={152}
                  textAnchor="middle"
                  fill={botColor.text}
                  className="text-xs font-mono font-bold"
                >
                  {compBase}
                </text>

                {/* Base Position Index */}
                <text
                  x={x}
                  y={182}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-400"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Telemetry Readout Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-600 pt-2">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-sky-700">A</strong>={features.countA}
          </span>
          <span>·</span>
          <span>
            <strong className="text-indigo-700">T</strong>={features.countT}
          </span>
          <span>·</span>
          <span>
            <strong className="text-cyan-700">G</strong>={features.countG}
          </span>
          <span>·</span>
          <span>
            <strong className="text-amber-700">C</strong>={features.countC}
          </span>
          <span>·</span>
          <span>
            GC={features.gcContent.toFixed(1)}%
          </span>
          <span>·</span>
          <span>
            MW={features.molecularWeightDa.toLocaleString()} Da
          </span>
          <span>·</span>
          <span>
            ENTROPY={features.shannonEntropy.toFixed(3)} bits
          </span>
        </div>

        <div className="text-slate-500">
          {hoveredIndex !== null && activeMeta ? (
            <span>
              POS #{hoveredIndex + 1}: 5&apos;-{activeBase} ({activeMeta.name}) ≡ 3&apos;-{activeMeta.pair} ·{' '}
              {activeMeta.hBonds} Hydrogen Bonds
            </span>
          ) : (
            <span>Hover any base pair along the duplex to inspect nucleotide hydrogen bonding</span>
          )}
        </div>
      </div>
    </div>
  );
};
