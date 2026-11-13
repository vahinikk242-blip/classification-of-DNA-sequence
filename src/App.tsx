/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Download,
  Plus,
  RotateCcw,
  Trash2
} from 'lucide-react';
import {
  ClassifierType,
  CollaborativeAnnotation,
  CORE_ASSESSMENT_SEQUENCES,
  DNASequenceRecord,
  EXTENDED_RESEARCH_SEQUENCES,
  ExtractedFeatures,
  extractSequenceFeatures,
  FeatureSetMode,
  runAllClassifiers,
  sanitizeDNASequence,
  SequenceGroup,
  UNKNOWN_QUERY_PRESETS
} from './lib/genomicsEngine';
import { HelixSequenceVisualizer } from './components/HelixSequenceVisualizer';
import { ScientificChartsPanel } from './components/ScientificChartsPanel';
import { AssessmentReportAndColab } from './components/AssessmentReportAndColab';

const INITIAL_ANNOTATIONS: CollaborativeAnnotation[] = [
  {
    id: 'ann-1',
    author: 'Dr. Evelyn Vance',
    role: 'Principal Bioinformatics Investigator',
    timestamp: '2026-11-12 09:42 UTC',
    targetSequenceId: 'QUERY (ATGCGCGATC)',
    category: 'Model Audit',
    content:
      'Critical observation on unknown sequence ATGCGCGATC (10 bp): A=2, T=2, G=3, C=3, GC=60.0%. Because all training sequences S1–S4 are 8 bp, raw G=3 and C=3 counts are confounded by the +2 bp length increase. When splitting on length-normalized GC Content (threshold ≤ 62.5%), CART Decision Tree classifies ATGCGCGATC as Group A; when splitting on unnormalized G count (> 2.5), it classifies as Group B.'
  },
  {
    id: 'ann-2',
    author: 'Marcus Chen',
    role: 'Computational Genomics Fellow',
    timestamp: '2026-11-12 10:15 UTC',
    targetSequenceId: 'S1 (ATGCGATC)',
    category: 'Feature Interpretation',
    content:
      'Verified baseline feature extraction on S1 (ATGCGATC): A = 2, T = 2, G = 2, C = 2, Length = 8 bp, GC Content = 50.0%. Matches empirical assessment specification.'
  },
  {
    id: 'ann-3',
    author: 'Dr. Priya Nair',
    role: 'Epigenetics & Promoter Biology',
    timestamp: '2026-11-12 11:04 UTC',
    targetSequenceId: 'S4 (GCGCGCGC)',
    category: 'Genomic Context',
    content:
      'Group B sequences (S3: GCGCGTAT at 75% GC; S4: GCGCGCGC at 100% GC) mirror canonical vertebrate CpG island promoter repeats with high thermal stability (Wallace Tm = 28–32 °C).'
  }
];

export default function App() {
  // Training Cohort State
  const [sequences, setSequences] = useState<DNASequenceRecord[]>(CORE_ASSESSMENT_SEQUENCES);
  const [cohortPreset, setCohortPreset] = useState<'core' | 'extended'>('core');

  // Unknown Sequence Input State (Default: ATGCGCGATC from assessment prompt)
  const [unknownInput, setUnknownInput] = useState<string>('ATGCGCGATC');

  // Active ML Classifier & Feature Representation Mode
  const [activeClassifier, setActiveClassifier] = useState<ClassifierType>('decision_tree');
  const [featureMode, setFeatureMode] = useState<FeatureSetMode>('all_features');

  // Currently inspected sequence in the 2D Duplex Visualizer (defaults to null = show unknown query)
  const [selectedDuplexSeq, setSelectedDuplexSeq] = useState<ExtractedFeatures | null>(null);

  // Add New Sequence Form State
  const [newSeqId, setNewSeqId] = useState<string>('S5');
  const [newSeqBases, setNewSeqBases] = useState<string>('ATGCGGAT');
  const [newSeqGroup, setNewSeqGroup] = useState<SequenceGroup>('Group A');

  // Collaborative Annotations
  const [annotations, setAnnotations] = useState<CollaborativeAnnotation[]>(INITIAL_ANNOTATIONS);

  // Extract features for all training sequences
  const trainingFeatures = useMemo(
    () =>
      sequences.map((s) =>
        extractSequenceFeatures(s.sequence, s.id, s.name, s.group)
      ),
    [sequences]
  );

  // Extract features for the unknown query sequence
  const queryFeatures = useMemo(() => {
    const clean = sanitizeDNASequence(unknownInput);
    const fallback = clean.length > 0 ? clean : 'ATGCGCGATC';
    return extractSequenceFeatures(fallback, 'UNKNOWN', 'Unknown Target Sequence');
  }, [unknownInput]);

  // Run all 4 ML classifiers live
  const allPredictions = useMemo(
    () => runAllClassifiers(trainingFeatures, queryFeatures, featureMode),
    [trainingFeatures, queryFeatures, featureMode]
  );

  const activePrediction = allPredictions[activeClassifier];
  const duplexTarget = selectedDuplexSeq || queryFeatures;

  const handleSwitchCohort = (mode: 'core' | 'extended') => {
    setCohortPreset(mode);
    const nextList = mode === 'core' ? CORE_ASSESSMENT_SEQUENCES : EXTENDED_RESEARCH_SEQUENCES;
    setSequences(nextList);
    setNewSeqId(`S${nextList.length + 1}`);
    setSelectedDuplexSeq(null);
  };

  const handleAddSequence = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeDNASequence(newSeqBases);
    if (!cleaned) return;
    const id = newSeqId.trim() || `S${sequences.length + 1}`;
    const record: DNASequenceRecord = {
      id,
      name: `Custom Locus ${id}`,
      sequence: cleaned,
      group: newSeqGroup,
      source: 'Investigator Entry'
    };
    const updated = [...sequences, record];
    setSequences(updated);
    setNewSeqId(`S${updated.length + 1}`);
    setNewSeqBases('');
  };

  const handleDeleteSequence = (id: string) => {
    if (sequences.length <= 2) return;
    setSequences(sequences.filter((s) => s.id !== id));
  };

  const handleDownloadCSV = () => {
    const headers = ['Sequence_ID', 'DNA_Sequence', 'Group', 'A', 'T', 'G', 'C', 'Length_bp', 'GC_Content_Pct', 'Tm_C'];
    const rows = [
      ...trainingFeatures.map((f) => [
        f.id,
        f.sequence,
        f.group || '',
        f.countA,
        f.countT,
        f.countG,
        f.countC,
        f.length,
        f.gcContent.toFixed(2),
        f.meltingTempC.toFixed(1)
      ]),
      [
        'UNKNOWN_QUERY',
        queryFeatures.sequence,
        `PREDICTED_${activePrediction.predictedGroup.replace(' ', '_')}`,
        queryFeatures.countA,
        queryFeatures.countT,
        queryFeatures.countG,
        queryFeatures.countC,
        queryFeatures.length,
        queryFeatures.gcContent.toFixed(2),
        queryFeatures.meltingTempC.toFixed(1)
      ]
    ];

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HelixLab_Genomic_Features_${queryFeatures.sequence}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddAnnotation = (ann: Omit<CollaborativeAnnotation, 'id' | 'timestamp'>) => {
    const newEntry: CollaborativeAnnotation = {
      ...ann,
      id: `ann-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
    };
    setAnnotations([newEntry, ...annotations]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 no-print">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          HelixLab Genomics
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#classifier-workspace" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Sequence Classifier
          </a>
          <a href="#duplex-topology" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Duplex Topology
          </a>
          <a href="#feature-table" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Feature Matrix
          </a>
          <a href="#assessment-report" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Lab Report &amp; Colab
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Export Feature CSV
          </button>
        </div>
      </header>

      {/* Top Scientific Telemetry Ribbon */}
      <div className="bg-slate-900 text-slate-200 px-6 py-2 border-b border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-emerald-400 font-semibold">● PIPELINE NOMINAL</span>
          <span className="text-slate-600">|</span>
          <span>COHORT SIZE: N={sequences.length} SEQUENCES</span>
          <span className="text-slate-600">|</span>
          <span>QUERY LOCUS: 5&apos;-{queryFeatures.sequence}-3&apos; ({queryFeatures.length} BP)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>ACTIVE CLASSIFIER: {activePrediction.classifierLabel.toUpperCase()}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-semibold">
            PREDICTION: {activePrediction.predictedGroup.toUpperCase()} ({activePrediction.confidence}%)
          </span>
        </div>
      </div>

      {/* Main Asymmetric Split Console */}
      <main id="classifier-workspace" className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT CONTROL & PARAMETER COLUMN (4 cols on lg = ~380px) */}
          <aside className="lg:col-span-4 space-y-5 no-print">
            {/* Control Block 1: Unknown Sequence Query Input */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs font-mono text-slate-500">
                STEP 01 · UNKNOWN SEQUENCE QUERY
              </div>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                Target DNA Sequence Predictor
              </h2>

              <div className="mt-3">
                <label className="block text-xs font-mono text-slate-600 mb-1">
                  ENTER 5&apos;→3&apos; NUCLEOTIDE SEQUENCE (A, T, G, C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={unknownInput}
                    onChange={(e) => {
                      setUnknownInput(e.target.value.toUpperCase());
                      setSelectedDuplexSeq(null);
                    }}
                    placeholder="ATGCGCGATC"
                    className="w-full px-3 py-2 text-sm font-mono font-semibold tracking-wider bg-slate-50 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUnknownInput('ATGCGCGATC');
                      setSelectedDuplexSeq(null);
                    }}
                    title="Reset to Assessment Unknown Sequence (ATGCGCGATC)"
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Sequence Presets */}
              <div className="mt-3">
                <div className="text-[11px] font-mono text-slate-500 mb-1.5">
                  BENCHMARK TEST SEQUENCES:
                </div>
                <div className="space-y-1.5">
                  {UNKNOWN_QUERY_PRESETS.map((preset) => {
                    const isSelected = queryFeatures.sequence === preset.sequence;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setUnknownInput(preset.sequence);
                          setSelectedDuplexSeq(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
                          isSelected
                            ? 'bg-cyan-50/80 border-cyan-600 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-semibold">
                          <span>{preset.label}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Extracted Feature Summary for Query */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-[11px] font-mono text-slate-500 mb-2">
                  LIVE EXTRACTED VECTOR FOR &ldquo;{queryFeatures.sequence}&rdquo;:
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-[10px] text-slate-500">A / T COUNT</div>
                    <div className="text-sm font-bold text-slate-900">
                      {queryFeatures.countA} / {queryFeatures.countT}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-[10px] text-slate-500">G / C COUNT</div>
                    <div className="text-sm font-bold text-slate-900">
                      {queryFeatures.countG} / {queryFeatures.countC}
                    </div>
                  </div>
                  <div className="p-2 bg-cyan-50 border border-cyan-200 rounded">
                    <div className="text-[10px] text-cyan-800">GC % · LEN</div>
                    <div className="text-sm font-bold text-cyan-950">
                      {queryFeatures.gcContent.toFixed(0)}% · {queryFeatures.length}bp
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Block 2: Classifier & Feature Space Configuration */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs font-mono text-slate-500">
                STEP 02 · MODEL &amp; FEATURE REPRESENTATION
              </div>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                Classifier &amp; Feature Space Controls
              </h2>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-600 mb-1">
                    PRIMARY CLASSIFIER ARCHITECTURE
                  </label>
                  <select
                    value={activeClassifier}
                    onChange={(e) => setActiveClassifier(e.target.value as ClassifierType)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="decision_tree">CART Decision Tree (Gini Criterion)</option>
                    <option value="random_forest">Random Forest Ensemble (Multi-Split)</option>
                    <option value="knn">k-Nearest Neighbors (k=3 Euclidean)</option>
                    <option value="naive_bayes">Gaussian Naive Bayes Classifier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-600 mb-1">
                    FEATURE VECTOR SELECTION (CRITICAL SPLIT TEST)
                  </label>
                  <div className="space-y-1.5">
                    {[
                      {
                        id: 'all_features' as FeatureSetMode,
                        title: 'Full Assessment Vector (GC%, G, C, A, T, Length)',
                        desc: 'Prioritizes scale-invariant GC% (60.0% ≤ 62.5% → Group A)'
                      },
                      {
                        id: 'raw_counts_only' as FeatureSetMode,
                        title: 'Raw Base Counts Only (G, C, A, T, Length)',
                        desc: 'Splits on raw G > 2.5 nt (G=3 in 10bp query → Group B)'
                      },
                      {
                        id: 'normalized_composition' as FeatureSetMode,
                        title: 'Normalized Ratios (GC%, AT/GC Ratio, Entropy)',
                        desc: 'Eliminates sequence length bias across variable-length reads'
                      }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFeatureMode(opt.id)}
                        className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
                          featureMode === opt.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-semibold">{opt.title}</div>
                        <div className={`text-[11px] mt-0.5 ${featureMode === opt.id ? 'text-slate-300' : 'text-slate-500'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature Importance Bars */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-[11px] font-mono text-slate-500 mb-2">
                  RELATIVE FEATURE DISCRIMINATIVE IMPORTANCE:
                </div>
                <div className="space-y-2">
                  {activePrediction.featureImportances.map((fi) => (
                    <div key={fi.key} className="text-xs font-mono">
                      <div className="flex justify-between text-slate-700 mb-0.5">
                        <span>{fi.feature}</span>
                        <span className="tabular-nums">{fi.importance.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-600 transition-transform duration-150 origin-left"
                          style={{ transform: `scaleX(${Math.min(1, fi.importance / 100)})` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Control Block 3: Training Cohort Dataset Manager */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    STEP 03 · TRAINING COHORT ({sequences.length} SEQUENCES)
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                    Labelled Reference Dataset
                  </h2>
                </div>
              </div>

              {/* Cohort Switcher */}
              <div className="mt-3 grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => handleSwitchCohort('core')}
                  className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    cohortPreset === 'core'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Assessment (S1–S4)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchCohort('extended')}
                  className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    cohortPreset === 'extended'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Extended (S1–S10)
                </button>
              </div>

              {/* Add Sequence Form */}
              <form onSubmit={handleAddSequence} className="mt-4 pt-3 border-t border-slate-200 space-y-2.5">
                <div className="text-[11px] font-mono text-slate-500">
                  APPEND CUSTOM LABELLED SEQUENCE TO TRAINING SET:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newSeqId}
                    onChange={(e) => setNewSeqId(e.target.value)}
                    placeholder="ID (e.g. S5)"
                    className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
                  />
                  <select
                    value={newSeqGroup}
                    onChange={(e) => setNewSeqGroup(e.target.value as SequenceGroup)}
                    className="col-span-2 px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
                  >
                    <option value="Group A">Group A (Balanced)</option>
                    <option value="Group B">Group B (GC-Enriched)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSeqBases}
                    onChange={(e) => setNewSeqBases(e.target.value.toUpperCase())}
                    placeholder="Sequence (e.g. ATGCGGAT)"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </form>
            </div>
          </aside>

          {/* RIGHT MAIN VIEWPORT / SCIENTIFIC STAGE (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top 4-Card Precision Telemetry & Classification Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs tracking-wider uppercase font-mono text-slate-400">
                  PREDICTED GROUP ({queryFeatures.sequence})
                </div>
                <div className="mt-1 flex items-baseline">
                  <span
                    className={`text-2xl font-mono font-bold tabular-nums ${
                      activePrediction.predictedGroup === 'Group A' ? 'text-sky-700' : 'text-amber-700'
                    }`}
                  >
                    {activePrediction.predictedGroup}
                  </span>
                  <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
                    {activePrediction.confidence}% CONF
                  </span>
                </div>
                <div className="mt-1 text-xs font-mono text-slate-500">
                  P(A)={activePrediction.probGroupA}% · P(B)={activePrediction.probGroupB}%
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs tracking-wider uppercase font-mono text-slate-400">
                  QUERY GC COMPOSITION
                </div>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                    {queryFeatures.gcContent.toFixed(1)}
                  </span>
                  <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
                    % GC ({queryFeatures.length} BP)
                  </span>
                </div>
                <div className="mt-1 text-xs font-mono text-slate-500">
                  A={queryFeatures.countA} · T={queryFeatures.countT} · G={queryFeatures.countG} · C={queryFeatures.countC}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs tracking-wider uppercase font-mono text-slate-400">
                  CLASSIFIER ACCURACY
                </div>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                    {activePrediction.trainingAccuracy.toFixed(1)}
                  </span>
                  <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
                    % TRAIN
                  </span>
                </div>
                <div className="mt-1 text-xs font-mono text-emerald-700">
                  LOOCV VALIDATION: {activePrediction.loocvAccuracy.toFixed(1)}%
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs tracking-wider uppercase font-mono text-slate-400">
                  PRIMARY SPLIT FEATURE
                </div>
                <div className="mt-1 flex items-baseline">
                  <span className="text-lg font-mono font-bold text-slate-900 truncate">
                    {activePrediction.featureImportances[0]?.feature || 'GC Content'}
                  </span>
                </div>
                <div className="mt-1 text-xs font-mono text-slate-500 truncate">
                  {activePrediction.treeDetails
                    ? `Threshold ≤ ${activePrediction.treeDetails.threshold}${activePrediction.treeDetails.unit}`
                    : 'Multivariate Ensemble'}
                </div>
              </div>
            </div>

            {/* Multi-Model Consensus Comparison Matrix */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    MULTI-CLASSIFIER BENCHMARK CONSENSUS · TARGET: 5&apos;-{queryFeatures.sequence}-3&apos;
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    Cross-Model Prediction &amp; Decision Rule Comparison
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Click any model row to inspect its active decision surface
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs font-mono tabular-nums text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3 font-medium">MODEL ARCHITECTURE</th>
                      <th className="py-2 px-3 font-medium">PREDICTED CLASS</th>
                      <th className="py-2 px-3 font-medium">CLASS PROBABILITY (A vs B)</th>
                      <th className="py-2 pl-3 font-medium">DECISION RULE / MATHEMATICAL RATIONALE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(Object.keys(allPredictions) as ClassifierType[]).map((key) => {
                      const pred = allPredictions[key];
                      const isSelected = key === activeClassifier;
                      return (
                        <tr
                          key={key}
                          onClick={() => setActiveClassifier(key)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-cyan-50/70 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 pr-3 text-slate-900 whitespace-nowrap">
                            {isSelected ? '▸ ' : ''}
                            {pred.classifierLabel}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={
                                pred.predictedGroup === 'Group A'
                                  ? 'text-sky-700 font-bold'
                                  : 'text-amber-700 font-bold'
                              }
                            >
                              {pred.predictedGroup} ({pred.confidence}%)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 w-44">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-sky-700 w-8">{pred.probGroupA}%</span>
                              <div className="flex-1 h-2 bg-amber-200 rounded-xs overflow-hidden flex">
                                <div
                                  className="h-full bg-sky-600"
                                  style={{ width: `${pred.probGroupA}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-amber-700 w-8 text-right">{pred.probGroupB}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 pl-3 text-slate-600 font-normal">
                            {pred.decisionRuleSummary}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2D Helical Duplex Base-Pair & Hydrogen Bond Visualizer */}
            <section id="duplex-topology">
              <HelixSequenceVisualizer
                features={duplexTarget}
                predictedGroup={duplexTarget.group || activePrediction.predictedGroup}
                confidence={duplexTarget.group ? 100 : activePrediction.confidence}
              />
            </section>

            {/* Interactive Scientific Charts Panel */}
            <ScientificChartsPanel
              trainingFeatures={trainingFeatures}
              queryFeatures={queryFeatures}
              activePrediction={activePrediction}
              onSelectSequence={(seq) => setSelectedDuplexSeq(seq)}
            />

            {/* Extracted Feature Matrix Table */}
            <section id="feature-table" className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    COMPLETE NUMERICAL FEATURE EXTRACTION TABLE
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    Cohort &amp; Unknown Sequence Stoichiometric Matrix
                  </h3>
                </div>
                {selectedDuplexSeq && (
                  <button
                    type="button"
                    onClick={() => setSelectedDuplexSeq(null)}
                    className="px-2.5 py-1 text-xs font-mono text-cyan-800 bg-cyan-50 border border-cyan-200 rounded hover:bg-cyan-100 transition-colors"
                  >
                    Return Duplex Inspector to Unknown Query ({queryFeatures.sequence})
                  </button>
                )}
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs font-mono tabular-nums text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3 font-medium">ID</th>
                      <th className="py-2 px-3 font-medium">SEQUENCE (5&apos;→3&apos;)</th>
                      <th className="py-2 px-3 font-medium">GROUP</th>
                      <th className="py-2 px-2 font-medium text-right">A</th>
                      <th className="py-2 px-2 font-medium text-right">T</th>
                      <th className="py-2 px-2 font-medium text-right">G</th>
                      <th className="py-2 px-2 font-medium text-right">C</th>
                      <th className="py-2 px-3 font-medium text-right">LENGTH</th>
                      <th className="py-2 px-3 font-medium text-right">GC (%)</th>
                      <th className="py-2 px-3 font-medium text-right">CpG</th>
                      <th className="py-2 pl-3 font-medium text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {trainingFeatures.map((f) => (
                      <tr
                        key={f.id}
                        onClick={() => setSelectedDuplexSeq(f)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-2 pr-3 font-semibold text-slate-900">{f.id}</td>
                        <td className="py-2 px-3 tracking-wider text-slate-900">{f.sequence}</td>
                        <td className="py-2 px-3">
                          <span className={f.group === 'Group A' ? 'text-sky-700 font-semibold' : 'text-amber-700 font-semibold'}>
                            {f.group}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">{f.countA}</td>
                        <td className="py-2 px-2 text-right">{f.countT}</td>
                        <td className="py-2 px-2 text-right">{f.countG}</td>
                        <td className="py-2 px-2 text-right">{f.countC}</td>
                        <td className="py-2 px-3 text-right">{f.length} bp</td>
                        <td className="py-2 px-3 text-right font-semibold">{f.gcContent.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right">{f.cpgCount}</td>
                        <td className="py-2 pl-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSequence(f.id);
                            }}
                            disabled={sequences.length <= 2}
                            title="Remove sequence from training cohort"
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Active Unknown Query Row */}
                    <tr
                      onClick={() => setSelectedDuplexSeq(null)}
                      className="bg-cyan-50/80 font-semibold cursor-pointer"
                    >
                      <td className="py-2.5 pr-3 text-cyan-950">UNKNOWN</td>
                      <td className="py-2.5 px-3 tracking-wider text-cyan-950">{queryFeatures.sequence}</td>
                      <td className="py-2.5 px-3 text-cyan-900">
                        → {activePrediction.predictedGroup} ({activePrediction.confidence}%)
                      </td>
                      <td className="py-2.5 px-2 text-right text-cyan-950">{queryFeatures.countA}</td>
                      <td className="py-2.5 px-2 text-right text-cyan-950">{queryFeatures.countT}</td>
                      <td className="py-2.5 px-2 text-right text-cyan-950">{queryFeatures.countG}</td>
                      <td className="py-2.5 px-2 text-right text-cyan-950">{queryFeatures.countC}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.length} bp</td>
                      <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.gcContent.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.cpgCount}</td>
                      <td className="py-2.5 pl-3 text-right text-cyan-800 text-[10px]">TARGET</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* Full-Width Bottom Section: Structured Assessment Report, Colab Code & Peer Review */}
        <section id="assessment-report" className="mt-8">
          <AssessmentReportAndColab
            sequences={sequences}
            trainingFeatures={trainingFeatures}
            queryFeatures={queryFeatures}
            allPredictions={allPredictions}
            activeClassifier={activeClassifier}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
          />
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 no-print">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            HelixLab — Computational Genomics &amp; Supervised Sequence Classification Platform
          </div>
          <div className="font-mono">
            <span>Reference Benchmark: S1–S4 (Group A / Group B)</span>
            <span className="mx-2">·</span>
            <span>Query Locus: ATGCGCGATC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
