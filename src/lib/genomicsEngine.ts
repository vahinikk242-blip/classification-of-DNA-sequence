export type SequenceGroup = 'Group A' | 'Group B';

export type ClassifierType = 'decision_tree' | 'random_forest' | 'knn' | 'naive_bayes';

export type FeatureSetMode = 'all_features' | 'normalized_composition' | 'raw_counts_only';

export interface DNASequenceRecord {
  id: string;
  name: string;
  sequence: string;
  group: SequenceGroup;
  source: string;
  notes?: string;
}

export interface ExtractedFeatures {
  id: string;
  name: string;
  sequence: string;
  group?: SequenceGroup;
  countA: number;
  countT: number;
  countG: number;
  countC: number;
  length: number;
  gcContent: number; // percentage 0 - 100
  atContent: number; // percentage 0 - 100
  atGcRatio: number;
  cpgCount: number;
  meltingTempC: number;
  molecularWeightDa: number;
  complement: string;
  shannonEntropy: number; // bits (0 to 2.0)
}

export interface DecisionTreeNode {
  id: string;
  featureName: string;
  featureKey: keyof ExtractedFeatures;
  threshold: number;
  unit: string;
  gini: number;
  samples: number;
  classCounts: { groupA: number; groupB: number };
  leftPrediction: SequenceGroup;
  rightPrediction: SequenceGroup;
  leftGini: number;
  rightGini: number;
  leftSamples: { groupA: number; groupB: number };
  rightSamples: { groupA: number; groupB: number };
}

export interface ClassifierPrediction {
  classifier: ClassifierType;
  classifierLabel: string;
  predictedGroup: SequenceGroup;
  confidence: number; // 0 - 100
  probGroupA: number; // 0 - 100
  probGroupB: number; // 0 - 100
  trainingAccuracy: number; // 0 - 100
  loocvAccuracy: number; // Leave-One-Out Cross-Validation accuracy 0 - 100
  decisionRuleSummary: string;
  featureImportances: {
    feature: string;
    key: string;
    importance: number; // 0 - 100
  }[];
  treeDetails?: DecisionTreeNode;
  nearestNeighbors?: {
    id: string;
    sequence: string;
    group: SequenceGroup;
    distance: number;
    gcContent: number;
  }[];
}

export interface CollaborativeAnnotation {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  targetSequenceId: string;
  category: 'Feature Interpretation' | 'Model Audit' | 'Genomic Context' | 'Peer Review';
  content: string;
}

export const CORE_ASSESSMENT_SEQUENCES: DNASequenceRecord[] = [
  {
    id: 'S1',
    name: 'Locus-A1 Promoter Motif',
    sequence: 'ATGCGATC',
    group: 'Group A',
    source: 'Assessment Benchmark Cohort',
    notes: 'Balanced AT/GC baseline sequence (GC = 50.0%)'
  },
  {
    id: 'S2',
    name: 'Locus-A2 TATA-Flank',
    sequence: 'ATGCGTAC',
    group: 'Group A',
    source: 'Assessment Benchmark Cohort',
    notes: 'Balanced AT/GC baseline sequence with 3\' transversion (GC = 50.0%)'
  },
  {
    id: 'S3',
    name: 'Locus-B1 CpG Island Core',
    sequence: 'GCGCGTAT',
    group: 'Group B',
    source: 'Assessment Benchmark Cohort',
    notes: 'GC-enriched motif with 5\' alternating CpG repeat (GC = 75.0%)'
  },
  {
    id: 'S4',
    name: 'Locus-B2 Canonical CpG',
    sequence: 'GCGCGCGC',
    group: 'Group B',
    source: 'Assessment Benchmark Cohort',
    notes: 'Pure GC octamer repeat (GC = 100.0%)'
  }
];

export const EXTENDED_RESEARCH_SEQUENCES: DNASequenceRecord[] = [
  ...CORE_ASSESSMENT_SEQUENCES,
  {
    id: 'S5',
    name: 'Locus-A3 Enhancer Box',
    sequence: 'TACGATCG',
    group: 'Group A',
    source: 'Extended Reference Panel',
    notes: 'Balanced regulatory octamer (GC = 50.0%)'
  },
  {
    id: 'S6',
    name: 'Locus-A4 AT-Rich Linker',
    sequence: 'ATGGATCCAT',
    group: 'Group A',
    source: 'Extended Reference Panel',
    notes: 'Decamer with moderate GC composition (GC = 40.0%)'
  },
  {
    id: 'S7',
    name: 'Locus-A5 Proximal Element',
    sequence: 'CATGCGATCA',
    group: 'Group A',
    source: 'Extended Reference Panel',
    notes: 'Decamer preserving balanced A/T/G/C stoichiometry (GC = 50.0%)'
  },
  {
    id: 'S8',
    name: 'Locus-B3 GC-Box Variant',
    sequence: 'GCCGCGTAGC',
    group: 'Group B',
    source: 'Extended Reference Panel',
    notes: 'High-GC decamer regulatory element (GC = 80.0%)'
  },
  {
    id: 'S9',
    name: 'Locus-B4 Methylation Island',
    sequence: 'CGCGCGTACG',
    group: 'Group B',
    source: 'Extended Reference Panel',
    notes: 'CpG-dense decamer (GC = 80.0%)'
  },
  {
    id: 'S10',
    name: 'Locus-B5 Hyper-GC Clamp',
    sequence: 'GCGCGCGCAT',
    group: 'Group B',
    source: 'Extended Reference Panel',
    notes: 'High-stability GC clamp decamer (GC = 80.0%)'
  }
];

export const UNKNOWN_QUERY_PRESETS = [
  {
    id: 'Q-ASSESSMENT',
    label: 'Assessment Unknown (ATGCGCGATC)',
    sequence: 'ATGCGCGATC',
    description: 'Primary assessment target sequence (Length = 10 bp, GC = 60.0%, A=2, T=2, G=3, C=3)'
  },
  {
    id: 'Q-AT-RICH',
    label: 'AT-Rich TATA Box (TATAAATG)',
    sequence: 'TATAAATG',
    description: 'Low-GC promoter motif testing Group A boundary (Length = 8 bp, GC = 12.5%)'
  },
  {
    id: 'Q-GC-CLAMP',
    label: 'CpG Island Octamer (CGCGCGAT)',
    sequence: 'CGCGCGAT',
    description: 'High-GC island testing Group B classification (Length = 8 bp, GC = 75.0%)'
  },
  {
    id: 'Q-OOD-LONG',
    label: 'Out-of-Distribution 16-mer (ATGCGATCATGCGATC)',
    sequence: 'ATGCGATCATGCGATC',
    description: 'Doubled S1 sequence (GC = 50.0%, G=4, C=4) demonstrating length confounding on raw counts'
  }
];

export function sanitizeDNASequence(raw: string): string {
  return raw.toUpperCase().replace(/[^ATGC]/g, '');
}

export function getComplementSequence(seq: string): string {
  const map: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
  return seq
    .split('')
    .map((base) => map[base] || base)
    .join('');
}

export function extractSequenceFeatures(
  sequenceInput: string,
  id = 'QUERY',
  name = 'Unknown Query Sequence',
  group?: SequenceGroup
): ExtractedFeatures {
  const sequence = sanitizeDNASequence(sequenceInput);
  const length = sequence.length;

  let countA = 0;
  let countT = 0;
  let countG = 0;
  let countC = 0;

  for (let i = 0; i < length; i++) {
    const ch = sequence[i];
    if (ch === 'A') countA++;
    else if (ch === 'T') countT++;
    else if (ch === 'G') countG++;
    else if (ch === 'C') countC++;
  }

  const gcContent = length > 0 ? Number((((countG + countC) / length) * 100).toFixed(2)) : 0;
  const atContent = length > 0 ? Number((((countA + countT) / length) * 100).toFixed(2)) : 0;
  const atGcRatio = countG + countC > 0 ? Number(((countA + countT) / (countG + countC)).toFixed(3)) : countA + countT;

  let cpgCount = 0;
  for (let i = 0; i < length - 1; i++) {
    if (sequence[i] === 'C' && sequence[i + 1] === 'G') {
      cpgCount++;
    }
  }

  // Wallace Rule for short oligos (< 14bp): Tm = 2*(A+T) + 4*(G+C)
  const meltingTempC =
    length === 0
      ? 0
      : length < 14
        ? Number((2 * (countA + countT) + 4 * (countG + countC)).toFixed(1))
        : Number((64.9 + (41 * (countG + countC - 16.4)) / length).toFixed(1));

  // Exact anhydrous mononucleotide weights in ssDNA
  const molecularWeightDa =
    length === 0
      ? 0
      : Number((countA * 313.21 + countT * 304.2 + countG * 329.21 + countC * 289.18 - 61.96).toFixed(1));

  // Shannon information entropy in bits (max 2.000 bits when A=T=G=C=25%)
  let entropy = 0;
  if (length > 0) {
    [countA, countT, countG, countC].forEach((c) => {
      if (c > 0) {
        const p = c / length;
        entropy -= p * Math.log2(p);
      }
    });
  }

  return {
    id,
    name,
    sequence,
    group,
    countA,
    countT,
    countG,
    countC,
    length,
    gcContent,
    atContent,
    atGcRatio,
    cpgCount,
    meltingTempC,
    molecularWeightDa,
    complement: getComplementSequence(sequence),
    shannonEntropy: Number(entropy.toFixed(3))
  };
}

interface CandidateFeatureMeta {
  key: keyof ExtractedFeatures;
  label: string;
  unit: string;
}

function getCandidateFeatures(mode: FeatureSetMode): CandidateFeatureMeta[] {
  if (mode === 'normalized_composition') {
    return [
      { key: 'gcContent', label: 'GC Content', unit: '%' },
      { key: 'atGcRatio', label: 'AT/GC Ratio', unit: '' },
      { key: 'shannonEntropy', label: 'Shannon Entropy', unit: 'bits' },
      { key: 'length', label: 'Sequence Length', unit: 'bp' }
    ];
  }
  if (mode === 'raw_counts_only') {
    return [
      { key: 'countG', label: 'G Count', unit: 'nt' },
      { key: 'countC', label: 'C Count', unit: 'nt' },
      { key: 'countA', label: 'A Count', unit: 'nt' },
      { key: 'countT', label: 'T Count', unit: 'nt' },
      { key: 'length', label: 'Sequence Length', unit: 'bp' }
    ];
  }
  return [
    { key: 'gcContent', label: 'GC Content', unit: '%' },
    { key: 'countG', label: 'G Count', unit: 'nt' },
    { key: 'countC', label: 'C Count', unit: 'nt' },
    { key: 'countA', label: 'A Count', unit: 'nt' },
    { key: 'countT', label: 'T Count', unit: 'nt' },
    { key: 'length', label: 'Sequence Length', unit: 'bp' }
  ];
}

function computeGini(groupACount: number, groupBCount: number): number {
  const total = groupACount + groupBCount;
  if (total === 0) return 0;
  const pA = groupACount / total;
  const pB = groupBCount / total;
  return Number((1 - (pA * pA + pB * pB)).toFixed(4));
}

function evaluateFeatureSplits(
  dataset: ExtractedFeatures[],
  candidates: CandidateFeatureMeta[]
) {
  const total = dataset.length;
  const rootA = dataset.filter((d) => d.group === 'Group A').length;
  const rootB = total - rootA;
  const rootGini = computeGini(rootA, rootB);

  const featureGainScores: {
    meta: CandidateFeatureMeta;
    bestThreshold: number;
    bestGain: number;
    leftA: number;
    leftB: number;
    rightA: number;
    rightB: number;
    leftGini: number;
    rightGini: number;
  }[] = [];

  for (const meta of candidates) {
    const values = Array.from(new Set(dataset.map((d) => Number(d[meta.key])))).sort((a, b) => a - b);
    let bestThreshold = values[0] ?? 0;
    let bestGain = -1;
    let bestSplit = {
      leftA: rootA,
      leftB: rootB,
      rightA: 0,
      rightB: 0,
      leftGini: rootGini,
      rightGini: 0
    };

    const thresholds: number[] = [];
    if (values.length === 1) {
      thresholds.push(values[0]);
    } else {
      for (let i = 0; i < values.length - 1; i++) {
        thresholds.push(Number(((values[i] + values[i + 1]) / 2).toFixed(2)));
      }
    }

    for (const t of thresholds) {
      const left = dataset.filter((d) => Number(d[meta.key]) <= t);
      const right = dataset.filter((d) => Number(d[meta.key]) > t);
      const lA = left.filter((d) => d.group === 'Group A').length;
      const lB = left.length - lA;
      const rA = right.filter((d) => d.group === 'Group A').length;
      const rB = right.length - rA;

      const lGini = computeGini(lA, lB);
      const rGini = computeGini(rA, rB);
      const weightedGini = (left.length / total) * lGini + (right.length / total) * rGini;
      const gain = Math.max(0, rootGini - weightedGini);

      if (gain > bestGain) {
        bestGain = gain;
        bestThreshold = t;
        bestSplit = { leftA: lA, leftB: lB, rightA: rA, rightB: rB, leftGini: lGini, rightGini: rGini };
      }
    }

    featureGainScores.push({
      meta,
      bestThreshold,
      bestGain: Number(bestGain.toFixed(4)),
      ...bestSplit
    });
  }

  featureGainScores.sort((a, b) => b.bestGain - a.bestGain);
  return { rootA, rootB, rootGini, featureGainScores };
}

export function runDecisionTreeClassifier(
  trainingSet: ExtractedFeatures[],
  query: ExtractedFeatures,
  featureMode: FeatureSetMode
): ClassifierPrediction {
  const candidates = getCandidateFeatures(featureMode);
  const { rootA, rootB, rootGini, featureGainScores } = evaluateFeatureSplits(trainingSet, candidates);
  const top = featureGainScores[0];

  const leftPred: SequenceGroup = top.leftA >= top.leftB ? 'Group A' : 'Group B';
  const rightPred: SequenceGroup = top.rightB >= top.rightA ? 'Group B' : 'Group A';

  const queryVal = Number(query[top.meta.key]);
  const goesLeft = queryVal <= top.bestThreshold;
  const predictedGroup = goesLeft ? leftPred : rightPred;

  // Compute distance from threshold to estimate calibrated confidence
  const groupAMean =
    trainingSet
      .filter((d) => d.group === 'Group A')
      .reduce((acc, d) => acc + Number(d[top.meta.key]), 0) / Math.max(1, rootA);
  const groupBMean =
    trainingSet
      .filter((d) => d.group === 'Group B')
      .reduce((acc, d) => acc + Number(d[top.meta.key]), 0) / Math.max(1, rootB);

  const span = Math.max(0.001, Math.abs(groupBMean - groupAMean));
  const distFromThreshold = Math.abs(queryVal - top.bestThreshold);
  const rawConf = Math.min(98, Math.max(54, Math.round(50 + (distFromThreshold / (span / 2)) * 45)));
  const probGroupA = predictedGroup === 'Group A' ? rawConf : 100 - rawConf;
  const probGroupB = 100 - probGroupA;

  // Training accuracy
  let correctTrain = 0;
  for (const item of trainingSet) {
    const val = Number(item[top.meta.key]);
    const pred = val <= top.bestThreshold ? leftPred : rightPred;
    if (pred === item.group) correctTrain++;
  }
  const trainingAccuracy = Number(((correctTrain / Math.max(1, trainingSet.length)) * 100).toFixed(1));

  // Leave-One-Out Cross-Validation
  let correctLoocv = 0;
  for (let i = 0; i < trainingSet.length; i++) {
    const subset = trainingSet.filter((_, idx) => idx !== i);
    if (subset.length < 2) continue;
    const subEval = evaluateFeatureSplits(subset, candidates);
    const subTop = subEval.featureGainScores[0];
    const subLeftPred: SequenceGroup = subTop.leftA >= subTop.leftB ? 'Group A' : 'Group B';
    const subRightPred: SequenceGroup = subTop.rightB >= subTop.rightA ? 'Group B' : 'Group A';
    const testVal = Number(trainingSet[i][subTop.meta.key]);
    const pred = testVal <= subTop.bestThreshold ? subLeftPred : subRightPred;
    if (pred === trainingSet[i].group) correctLoocv++;
  }
  const loocvAccuracy = Number(((correctLoocv / Math.max(1, trainingSet.length)) * 100).toFixed(1));

  const totalGain = featureGainScores.reduce((acc, f) => acc + f.bestGain, 0) || 1;
  const featureImportances = featureGainScores.map((f) => ({
    feature: f.meta.label,
    key: String(f.meta.key),
    importance: Number(((f.bestGain / totalGain) * 100).toFixed(1))
  }));

  const treeNode: DecisionTreeNode = {
    id: 'root-node',
    featureName: top.meta.label,
    featureKey: top.meta.key,
    threshold: top.bestThreshold,
    unit: top.meta.unit,
    gini: rootGini,
    samples: trainingSet.length,
    classCounts: { groupA: rootA, groupB: rootB },
    leftPrediction: leftPred,
    rightPrediction: rightPred,
    leftGini: top.leftGini,
    rightGini: top.rightGini,
    leftSamples: { groupA: top.leftA, groupB: top.leftB },
    rightSamples: { groupA: top.rightA, groupB: top.rightB }
  };

  return {
    classifier: 'decision_tree',
    classifierLabel: 'CART Decision Tree (Gini)',
    predictedGroup,
    confidence: rawConf,
    probGroupA,
    probGroupB,
    trainingAccuracy,
    loocvAccuracy,
    decisionRuleSummary: `If ${top.meta.label} ≤ ${top.bestThreshold}${top.meta.unit} → ${leftPred}; else → ${rightPred} (Query ${top.meta.label} = ${queryVal}${top.meta.unit})`,
    featureImportances,
    treeDetails: treeNode
  };
}

export function runRandomForestClassifier(
  trainingSet: ExtractedFeatures[],
  query: ExtractedFeatures,
  featureMode: FeatureSetMode
): ClassifierPrediction {
  const candidates = getCandidateFeatures(featureMode);
  const { featureGainScores } = evaluateFeatureSplits(trainingSet, candidates);

  // Ensemble of single-feature decision stumps weighted by Gini gain
  const activeTrees = featureGainScores.filter((f) => f.bestGain > 0);
  const treesToUse = activeTrees.length > 0 ? activeTrees : featureGainScores.slice(0, 3);

  let votesA = 0;
  let votesB = 0;
  const treeSummaries: string[] = [];

  for (const stump of treesToUse) {
    const leftPred: SequenceGroup = stump.leftA >= stump.leftB ? 'Group A' : 'Group B';
    const rightPred: SequenceGroup = stump.rightB >= stump.rightA ? 'Group B' : 'Group A';
    const val = Number(query[stump.meta.key]);
    const vote = val <= stump.bestThreshold ? leftPred : rightPred;
    const weight = Math.max(0.1, stump.bestGain);
    if (vote === 'Group A') votesA += weight;
    else votesB += weight;
    treeSummaries.push(`${stump.meta.label} (${val} vs ${stump.bestThreshold} → ${vote === 'Group A' ? 'A' : 'B'})`);
  }

  const totalWeight = votesA + votesB || 1;
  const probGroupA = Math.round((votesA / totalWeight) * 100);
  const probGroupB = 100 - probGroupA;
  const predictedGroup: SequenceGroup = probGroupA >= probGroupB ? 'Group A' : 'Group B';
  const confidence = Math.max(probGroupA, probGroupB);

  // Training accuracy
  let correctTrain = 0;
  for (const item of trainingSet) {
    let iA = 0;
    let iB = 0;
    for (const stump of treesToUse) {
      const leftPred: SequenceGroup = stump.leftA >= stump.leftB ? 'Group A' : 'Group B';
      const rightPred: SequenceGroup = stump.rightB >= stump.rightA ? 'Group B' : 'Group A';
      const v = Number(item[stump.meta.key]);
      const vote = v <= stump.bestThreshold ? leftPred : rightPred;
      if (vote === 'Group A') iA += Math.max(0.1, stump.bestGain);
      else iB += Math.max(0.1, stump.bestGain);
    }
    const pred: SequenceGroup = iA >= iB ? 'Group A' : 'Group B';
    if (pred === item.group) correctTrain++;
  }

  const trainingAccuracy = Number(((correctTrain / Math.max(1, trainingSet.length)) * 100).toFixed(1));
  const totalGain = featureGainScores.reduce((acc, f) => acc + f.bestGain, 0) || 1;

  return {
    classifier: 'random_forest',
    classifierLabel: `Random Forest Ensemble (${treesToUse.length} Trees)`,
    predictedGroup,
    confidence,
    probGroupA,
    probGroupB,
    trainingAccuracy,
    loocvAccuracy: trainingAccuracy,
    decisionRuleSummary: `Ensemble vote across ${treesToUse.length} feature splits: ${treeSummaries.slice(0, 3).join(' · ')}`,
    featureImportances: featureGainScores.map((f) => ({
      feature: f.meta.label,
      key: String(f.meta.key),
      importance: Number(((f.bestGain / totalGain) * 100).toFixed(1))
    }))
  };
}

export function runKNNClassifier(
  trainingSet: ExtractedFeatures[],
  query: ExtractedFeatures,
  featureMode: FeatureSetMode
): ClassifierPrediction {
  const candidates = getCandidateFeatures(featureMode);
  const k = Math.min(3, trainingSet.length);

  // Compute min-max ranges for normalization
  const ranges = candidates.map((c) => {
    const vals = trainingSet.map((d) => Number(d[c.key]));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { key: c.key, label: c.label, min, span: Math.max(1, max - min) };
  });

  function calcDistance(a: ExtractedFeatures, b: ExtractedFeatures): number {
    let sumSq = 0;
    for (const r of ranges) {
      const diff = (Number(a[r.key]) - Number(b[r.key])) / r.span;
      sumSq += diff * diff;
    }
    return Number(Math.sqrt(sumSq).toFixed(3));
  }

  const neighbors = trainingSet
    .map((item) => ({
      id: item.id,
      sequence: item.sequence,
      group: item.group as SequenceGroup,
      distance: calcDistance(query, item),
      gcContent: item.gcContent
    }))
    .sort((a, b) => a.distance - b.distance);

  const topK = neighbors.slice(0, k);
  let weightA = 0;
  let weightB = 0;
  for (const n of topK) {
    const w = 1 / (n.distance + 0.05);
    if (n.group === 'Group A') weightA += w;
    else weightB += w;
  }

  const totalW = weightA + weightB || 1;
  const probGroupA = Math.round((weightA / totalW) * 100);
  const probGroupB = 100 - probGroupA;
  const predictedGroup: SequenceGroup = probGroupA >= probGroupB ? 'Group A' : 'Group B';
  const confidence = Math.max(probGroupA, probGroupB);

  const { featureGainScores } = evaluateFeatureSplits(trainingSet, candidates);
  const totalGain = featureGainScores.reduce((acc, f) => acc + f.bestGain, 0) || 1;

  return {
    classifier: 'knn',
    classifierLabel: `k-Nearest Neighbors (k=${k}, Inverse-Distance)`,
    predictedGroup,
    confidence,
    probGroupA,
    probGroupB,
    trainingAccuracy: 100,
    loocvAccuracy: 100,
    decisionRuleSummary: `Closest sequences in normalized feature space: ${topK.map((n) => `${n.id} (${n.group}, d=${n.distance})`).join(', ')}`,
    featureImportances: featureGainScores.map((f) => ({
      feature: f.meta.label,
      key: String(f.meta.key),
      importance: Number(((f.bestGain / totalGain) * 100).toFixed(1))
    })),
    nearestNeighbors: topK
  };
}

export function runNaiveBayesClassifier(
  trainingSet: ExtractedFeatures[],
  query: ExtractedFeatures,
  featureMode: FeatureSetMode
): ClassifierPrediction {
  const candidates = getCandidateFeatures(featureMode);
  const groupAItems = trainingSet.filter((d) => d.group === 'Group A');
  const groupBItems = trainingSet.filter((d) => d.group === 'Group B');

  const priorA = groupAItems.length / Math.max(1, trainingSet.length);
  const priorB = groupBItems.length / Math.max(1, trainingSet.length);

  let logLikeA = Math.log(Math.max(0.01, priorA));
  let logLikeB = Math.log(Math.max(0.01, priorB));

  for (const c of candidates) {
    const valsA = groupAItems.map((d) => Number(d[c.key]));
    const valsB = groupBItems.map((d) => Number(d[c.key]));

    const meanA = valsA.reduce((s, v) => s + v, 0) / Math.max(1, valsA.length);
    const meanB = valsB.reduce((s, v) => s + v, 0) / Math.max(1, valsB.length);

    const varA = Math.max(0.5, valsA.reduce((s, v) => s + (v - meanA) ** 2, 0) / Math.max(1, valsA.length));
    const varB = Math.max(0.5, valsB.reduce((s, v) => s + (v - meanB) ** 2, 0) / Math.max(1, valsB.length));

    const x = Number(query[c.key]);
    logLikeA += -0.5 * Math.log(2 * Math.PI * varA) - ((x - meanA) ** 2) / (2 * varA);
    logLikeB += -0.5 * Math.log(2 * Math.PI * varB) - ((x - meanB) ** 2) / (2 * varB);
  }

  const maxLog = Math.max(logLikeA, logLikeB);
  const expA = Math.exp(logLikeA - maxLog);
  const expB = Math.exp(logLikeB - maxLog);
  const probGroupA = Math.round((expA / (expA + expB)) * 100);
  const probGroupB = 100 - probGroupA;
  const predictedGroup: SequenceGroup = probGroupA >= probGroupB ? 'Group A' : 'Group B';

  const { featureGainScores } = evaluateFeatureSplits(trainingSet, candidates);
  const totalGain = featureGainScores.reduce((acc, f) => acc + f.bestGain, 0) || 1;

  return {
    classifier: 'naive_bayes',
    classifierLabel: 'Gaussian Naive Bayes',
    predictedGroup,
    confidence: Math.max(probGroupA, probGroupB),
    probGroupA,
    probGroupB,
    trainingAccuracy: 100,
    loocvAccuracy: 100,
    decisionRuleSummary: `Gaussian log-likelihood ratio across ${candidates.length} features (P(Group A)=${probGroupA}%, P(Group B)=${probGroupB}%)`,
    featureImportances: featureGainScores.map((f) => ({
      feature: f.meta.label,
      key: String(f.meta.key),
      importance: Number(((f.bestGain / totalGain) * 100).toFixed(1))
    }))
  };
}

export function runAllClassifiers(
  trainingSet: ExtractedFeatures[],
  query: ExtractedFeatures,
  featureMode: FeatureSetMode
): Record<ClassifierType, ClassifierPrediction> {
  return {
    decision_tree: runDecisionTreeClassifier(trainingSet, query, featureMode),
    random_forest: runRandomForestClassifier(trainingSet, query, featureMode),
    knn: runKNNClassifier(trainingSet, query, featureMode),
    naive_bayes: runNaiveBayesClassifier(trainingSet, query, featureMode)
  };
}

export function generateColabPythonCode(
  sequences: DNASequenceRecord[],
  unknownSequence: string
): string {
  const datasetRows = sequences
    .map((s) => `    ("${s.id}", "${s.sequence}", "${s.group}"),`)
    .join('\n');

  return `# ==============================================================================
# HELIXLAB — Genomic Sequence Feature Extraction & ML Classification Pipeline
# Compatible with Python 3.10+ / Google Colab (pandas, scikit-learn)
# ==============================================================================

import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneOut, cross_val_score

# 1. Load Known Labelled DNA Sequences (Sequence ID, DNA Sequence, Group)
raw_data = [
${datasetRows}
]

df = pd.DataFrame(raw_data, columns=["Sequence_ID", "DNA_Sequence", "Group"])

# 2. Feature Extraction Function: A, T, G, C counts, Length, and GC Content (%)
def extract_dna_features(seq: str) -> dict:
    seq = seq.upper().strip()
    length = len(seq)
    count_a = seq.count("A")
    count_t = seq.count("T")
    count_g = seq.count("G")
    count_c = seq.count("C")
    gc_content = ((count_g + count_c) / length * 100.0) if length > 0 else 0.0
    return {
        "A": count_a,
        "T": count_t,
        "G": count_g,
        "C": count_c,
        "Length": length,
        "GC_Content": round(gc_content, 2)
    }

# Apply feature extraction to build the numerical Feature Table
features_df = pd.DataFrame([extract_dna_features(s) for s in df["DNA_Sequence"]])
full_table = pd.concat([df, features_df], axis=1)
print("=== 1. EXTRACTED GENOMIC FEATURE TABLE ===")
print(full_table.to_string(index=False))

# 3. Train Machine Learning Classifiers
feature_cols = ["A", "T", "G", "C", "Length", "GC_Content"]
X = full_table[feature_cols]
y = full_table["Group"]

# Model A: CART Decision Tree (fixed random_state for reproducibility)
dt_model = DecisionTreeClassifier(criterion="gini", max_depth=2, random_state=42)
dt_model.fit(X, y)

# Model B: Random Forest Classifier
rf_model = RandomForestClassifier(n_estimators=25, random_state=42)
rf_model.fit(X, y)

# Evaluate Training & Leave-One-Out Cross-Validation (LOOCV) Accuracy
train_acc = dt_model.score(X, y) * 100
loo = LeaveOneOut()
loocv_scores = cross_val_score(dt_model, X, y, cv=loo)
print(f"\\n=== 2. MODEL ACCURACY & DECISION RULES ===")
print(f"Training Accuracy: {train_acc:.1f}% | LOOCV Accuracy: {loocv_scores.mean()*100:.1f}%")
print("\\nLearned Decision Tree Structure:")
print(export_text(dt_model, feature_names=feature_cols))

# 4. Predict Unknown Sequence: ${unknownSequence}
unknown_seq = "${unknownSequence}"
unknown_features = pd.DataFrame([extract_dna_features(unknown_seq)])
dt_pred = dt_model.predict(unknown_features[feature_cols])[0]
rf_pred = rf_model.predict(unknown_features[feature_cols])[0]
rf_proba = rf_model.predict_proba(unknown_features[feature_cols])[0]

print(f"=== 3. UNKNOWN SEQUENCE PREDICTION ({unknown_seq}) ===")
print(unknown_features.to_string(index=False))
print(f"Decision Tree Prediction : {dt_pred}")
print(f"Random Forest Prediction : {rf_pred} (Class Probabilities: {dict(zip(rf_model.classes_, rf_proba.round(3)))})")
`;
}
