import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  MessageSquarePlus,
  Printer,
  Eye
} from 'lucide-react';
import {
  ClassifierPrediction,
  ClassifierType,
  CollaborativeAnnotation,
  DNASequenceRecord,
  ExtractedFeatures,
  generateColabPythonCode
} from '../lib/genomicsEngine';

interface AssessmentReportAndColabProps {
  sequences: DNASequenceRecord[];
  trainingFeatures: ExtractedFeatures[];
  queryFeatures: ExtractedFeatures;
  allPredictions: Record<ClassifierType, ClassifierPrediction>;
  activeClassifier: ClassifierType;
  annotations: CollaborativeAnnotation[];
  onAddAnnotation: (ann: Omit<CollaborativeAnnotation, 'id' | 'timestamp'>) => void;
}

export const AssessmentReportAndColab: React.FC<AssessmentReportAndColabProps> = ({
  sequences,
  trainingFeatures,
  queryFeatures,
  allPredictions,
  activeClassifier,
  annotations,
  onAddAnnotation
}) => {
  const [subTab, setSubTab] = useState<'report' | 'colab' | 'collaboration' | 'protocol'>('report');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Editable Report Metadata & Custom Notes
  const [researcherName, setResearcherName] = useState('Dr. Evelyn Vance / Bioinformatics Lab Cohort');
  const [genomicsAppNote, setGenomicsAppNote] = useState(
    'Promoter & CpG Island Identification: Distinguishing vertebrate housekeeping gene promoters (GC-rich Group B motifs with high CpG density, typically >65% GC) from tissue-specific TATA-box promoters or intergenic regions (balanced AT/GC Group A motifs, ~40–50% GC), as well as taxonomic viral/bacterial metagenomic binning where species exhibit signature genomic GC% profiles.'
  );
  const [mlLimitationNote, setMlLimitationNote] = useState(
    'Order-Blindness & Small-Sample Confounding: Bag-of-nucleotides summary counts (A, T, G, C, GC%) discard sequential positional order and reading frame context (e.g., ATGCGATC and AATTGGCC share identical base counts and 50% GC content despite completely different biological motifs). Furthermore, training on ultra-small cohorts (N=4 sequences of fixed 8 bp length) makes raw base counts sensitive to sequence length variations.'
  );

  // Collaborative Annotation Form State
  const [authorName, setAuthorName] = useState('R. Virgil (Lead Investigator)');
  const [authorRole, setAuthorRole] = useState('Computational Genomics');
  const [targetSeq, setTargetSeq] = useState<string>('QUERY (ATGCGCGATC)');
  const [annCategory, setAnnCategory] = useState<CollaborativeAnnotation['category']>('Model Audit');
  const [annContent, setAnnContent] = useState('');

  const activePred = allPredictions[activeClassifier];
  const pythonCode = generateColabPythonCode(sequences, queryFeatures.sequence);

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadIpynb = () => {
    const notebook = {
      nbformat: 4,
      nbformat_minor: 0,
      metadata: {
        colab: { name: 'HelixLab_DNA_Sequence_ML_Classification.ipynb', provenance: [] },
        kernelspec: { name: 'python3', display_name: 'Python 3' }
      },
      cells: [
        {
          cell_type: 'markdown',
          metadata: {},
          source: [
            '# HelixLab — DNA Sequence Feature Extraction & ML Classification\n',
            'Automated notebook generated for unknown sequence `' + queryFeatures.sequence + '`.'
          ]
        },
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: pythonCode.split('\n').map((line) => line + '\n')
        }
      ]
    };

    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HelixLab_Genomic_Classification.ipynb';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdownReport = () => {
    const tableRows = [...trainingFeatures, queryFeatures]
      .map(
        (f) =>
          `| ${f.id} | \`${f.sequence}\` | ${f.group || `PRED: ${activePred.predictedGroup}`} | ${f.countA} | ${f.countT} | ${f.countG} | ${f.countC} | ${f.length} | ${f.gcContent.toFixed(1)}% |`
      )
      .join('\n');

    const md = `# Genomic Sequence Classification & Critical Interpretation Report
Author: ${researcherName}
Date: ${new Date().toISOString().slice(0, 10)}

## 1. Extracted Numerical Feature Table
| Sequence ID | DNA Sequence | Group | A | T | G | C | Length (bp) | GC Content (%) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
${tableRows}

## 2. Model Result & Learned Pattern
- **Active Classifier**: ${activePred.classifierLabel}
- **Learned Decision Rule**: ${activePred.decisionRuleSummary}
- **Group A Pattern**: Balanced nucleotide stoichiometry (A=2, T=2, G=2, C=2; GC Content = 50.0%).
- **Group B Pattern**: GC-enriched sequences (G=3–4, C=3–4; GC Content = 75.0%–100.0%).

## 3. Prediction for Unknown Sequence (${queryFeatures.sequence})
- **Extracted Features**: A = ${queryFeatures.countA}, T = ${queryFeatures.countT}, G = ${queryFeatures.countG}, C = ${queryFeatures.countC}, Length = ${queryFeatures.length} bp, GC Content = ${queryFeatures.gcContent.toFixed(1)}%
- **Normalized Composition Prediction (Decision Tree on GC% / Random Forest)**: **${allPredictions.decision_tree.predictedGroup}** (${allPredictions.decision_tree.confidence}% confidence)
- **Critical Nuance**: Because \`${queryFeatures.sequence}\` is 10 bp long (longer than the 8 bp training sequences), its raw G=3 and C=3 counts match S3 (Group B), whereas its length-normalized GC Content (60.0%) sits closer to Group A (50.0%) than Group B (75.0%–100.0%).

## 4. Model Accuracy
- **Training Accuracy**: ${activePred.trainingAccuracy.toFixed(1)}%
- **Leave-One-Out Cross-Validation (LOOCV) Accuracy**: ${activePred.loocvAccuracy.toFixed(1)}%

## 5. Genomics Application
${genomicsAppNote}

## 6. Limitation of Using AI/ML in Genomics
${mlLimitationNote}
`;

    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleSubmitAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annContent.trim()) return;
    onAddAnnotation({
      author: authorName.trim() || 'Research Scientist',
      role: authorRole.trim() || 'Genomics Analyst',
      targetSequenceId: targetSeq,
      category: annCategory,
      content: annContent.trim()
    });
    setAnnContent('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setSubTab('report')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'report'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Structured Lab Report (6 Required Outputs)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('colab')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'colab'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Python / Google Colab Code
          </button>
          <button
            type="button"
            onClick={() => setSubTab('collaboration')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'collaboration'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Collaborative Peer Review ({annotations.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('protocol')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'protocol'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Assessment Specification Reference
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportMarkdownReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedReport ? 'Copied Markdown Report' : 'Copy Report Markdown'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF Report
          </button>
        </div>
      </div>

      {/* TAB 1: STRUCTURED ASSESSMENT REPORT */}
      {subTab === 'report' && (
        <div className="mt-6 space-y-8">
          {/* Header metadata */}
          <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="text-xs font-mono text-slate-500">
                EMPIRICAL GENOMICS &amp; MACHINE LEARNING EVALUATION REPORT
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Supervised Classification of Labelled DNA Sequences &amp; Unknown Locus Prediction
              </h2>
            </div>
            <div className="w-full sm:w-80 no-print">
              <label className="block text-xs font-mono text-slate-500 mb-1">
                REPORT AUTHOR / LAB GROUP
              </label>
              <input
                type="text"
                value={researcherName}
                onChange={(e) => setResearcherName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          {/* 1. Feature Table */}
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              01. Numerical Genomic Feature Extraction Table
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Each biological sequence is transformed into a 6-dimensional numerical feature vector comprising mononucleotide base counts (<code className="font-mono text-xs">A, T, G, C</code>), sequence length (<code className="font-mono text-xs">bp</code>), and relative <code className="font-mono text-xs">GC Content (%) = ((G + C) / Length) × 100</code>.
            </p>

            <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs font-mono tabular-nums text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Sequence ID</th>
                    <th className="py-2.5 px-3 font-semibold">DNA Sequence (5&apos;→3&apos;)</th>
                    <th className="py-2.5 px-3 font-semibold">Known / Predicted Group</th>
                    <th className="py-2.5 px-3 font-semibold text-right">A Count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">T Count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">G Count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">C Count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Length (bp)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">GC Content (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trainingFeatures.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{f.id}</td>
                      <td className="py-2 px-3 tracking-wider text-slate-900">{f.sequence}</td>
                      <td className="py-2 px-3">
                        <span className={f.group === 'Group A' ? 'text-sky-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          {f.group} (Labelled)
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{f.countA}</td>
                      <td className="py-2 px-3 text-right">{f.countT}</td>
                      <td className="py-2 px-3 text-right">{f.countG}</td>
                      <td className="py-2 px-3 text-right">{f.countC}</td>
                      <td className="py-2 px-3 text-right">{f.length}</td>
                      <td className="py-2 px-3 text-right font-semibold">{f.gcContent.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {/* Unknown Sequence Row */}
                  <tr className="bg-cyan-50/70 font-semibold">
                    <td className="py-2.5 px-3 text-cyan-950">UNKNOWN</td>
                    <td className="py-2.5 px-3 tracking-wider text-cyan-950">{queryFeatures.sequence}</td>
                    <td className="py-2.5 px-3 text-cyan-900">
                      Predicted: {activePred.predictedGroup} ({activePred.confidence}%)
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.countA}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.countT}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.countG}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.countC}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.length}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-950">{queryFeatures.gcContent.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2, 3, 4: Model Result, Unknown Sequence Prediction, Model Accuracy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-200 rounded-lg p-4 bg-[#F8FAFC]">
              <div className="text-xs font-mono text-slate-500">02. MODEL RESULT &amp; LEARNED RULE</div>
              <div className="text-base font-semibold text-slate-900 mt-1">
                {activePred.classifierLabel}
              </div>
              <p className="text-xs font-mono text-slate-700 mt-2 leading-relaxed">
                {activePred.decisionRuleSummary}
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Group A sequences exhibit balanced 50% GC composition (A=2, T=2, G=2, C=2), while Group B sequences exhibit high GC enrichment (75%–100% GC, G≥3, C≥3).
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-[#F8FAFC]">
              <div className="text-xs font-mono text-slate-500">03. PREDICTION FOR {queryFeatures.sequence}</div>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {activePred.predictedGroup}
                <span className="text-xs font-mono text-slate-500 ml-2">
                  ({activePred.confidence}% CONFIDENCE)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                <strong>Critical Split Sensitivity:</strong> For <code className="font-mono">{queryFeatures.sequence}</code> (Length=10, GC=60.0%, A=2, T=2, G=3, C=3):
                models splitting on <strong>GC Content ≤ 62.5%</strong> or <strong>A/T counts</strong> classify it as <strong>Group A</strong>, whereas models splitting on <strong>raw G or C counts (&gt; 2.5)</strong> classify it as <strong>Group B</strong> because the extra 2 bp length inflates raw G and C counts to 3.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-[#F8FAFC]">
              <div className="text-xs font-mono text-slate-500">04. MODEL ACCURACY &amp; VALIDATION</div>
              <div className="flex items-baseline gap-6 mt-1">
                <div>
                  <span className="text-2xl font-mono font-bold text-slate-900">
                    {activePred.trainingAccuracy.toFixed(1)}%
                  </span>
                  <span className="block text-[11px] font-mono text-slate-500">TRAINING ACC</span>
                </div>
                <div>
                  <span className="text-2xl font-mono font-bold text-cyan-700">
                    {activePred.loocvAccuracy.toFixed(1)}%
                  </span>
                  <span className="block text-[11px] font-mono text-slate-500">LOOCV ACC</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                While training accuracy reaches 100.0% because Group A (50% GC) and Group B (75–100% GC) are linearly separable, a 4-sample dataset has high variance near the boundary (60% GC).
              </p>
            </div>
          </div>

          {/* 5 & 6: Genomics Application & Limitation of AI/ML */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-lg p-4">
              <label className="block text-xs font-mono text-slate-500">
                05. REAL-WORLD GENOMICS APPLICATION
              </label>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">
                CpG Island &amp; Promoter Classification / Metagenomic Binning
              </h4>
              <textarea
                rows={4}
                value={genomicsAppNote}
                onChange={(e) => setGenomicsAppNote(e.target.value)}
                className="mt-2 w-full p-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded leading-relaxed focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <label className="block text-xs font-mono text-slate-500">
                06. KEY LIMITATION OF USING AI/ML FOR GENOMIC ANALYSIS
              </label>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">
                Loss of Sequential Motif Order &amp; Length Confounding
              </h4>
              <textarea
                rows={4}
                value={mlLimitationNote}
                onChange={(e) => setMlLimitationNote(e.target.value)}
                className="mt-2 w-full p-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded leading-relaxed focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          {/* Think and Discuss Critical Interpretation Section */}
          <div className="border-t border-slate-200 pt-6">
            <div className="text-xs font-mono text-slate-500">
              CRITICAL DISCUSSION &amp; INTERPRETATION RUBRIC
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">
              Think and Discuss — Empirical Answers for Submission
            </h3>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Q1. Which features were most useful?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>GC Content (%)</strong> is the most biologically robust and scale-invariant feature. In the training set, all sequences have <code className="font-mono">Length = 8 bp</code>, making <code className="font-mono">Length</code> zero-variance (uninformative) during training. While <code className="font-mono">G</code>, <code className="font-mono">C</code>, <code className="font-mono">A</code>, and <code className="font-mono">T</code> counts also achieve 100% Gini separation on 8-bp sequences, raw counts are confounded when evaluating a 10-bp query like <code className="font-mono">ATGCGCGATC</code>. Normalized <code className="font-mono">GC Content (%)</code> properly accounts for sequence length.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Q2. Did the model predict correctly?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The unknown sequence <code className="font-mono">ATGCGCGATC</code> is a deliberate hybrid: it contains the exact <code className="font-mono">ATG...GATC</code> flanking structure of S1 (Group A) with an inserted <code className="font-mono">CG</code> dinucleotide in the center (<code className="font-mono">GC = 60.0%</code>). Because there is no ground-truth wet-lab label for this synthetic query, &ldquo;correctness&rdquo; depends on feature representation: by normalized composition (<code className="font-mono">60% GC</code> vs Group A&apos;s <code className="font-mono">50%</code> and Group B&apos;s <code className="font-mono">75–100%</code>), it is closer to <strong>Group A</strong>; by raw <code className="font-mono">G=3, C=3</code> count thresholds, a unnormalized tree assigns it to <strong>Group B</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Q3. What if the sequence is very different from the training data?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an out-of-distribution (OOD) sequence is introduced—such as a 1,000-bp gene fragment, a poly-A tail (<code className="font-mono">AAAAAAAA</code>), or a sequence containing ambiguous bases (<code className="font-mono">N</code>)—the classifier will still force a binary Group A or Group B prediction with artificially high confidence. Decision trees partition the feature space into infinite half-spaces and cannot natively flag out-of-distribution inputs without an anomaly/density detector.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Q4. What are the limitations of using AI/ML for genomic analysis?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  (1) <strong>Small-N Overfitting:</strong> Training on 4 sequences cannot capture biological variation, batch effects, or evolutionary mutations. (2) <strong>Positional Ignorance:</strong> Mononucleotide counts ignore reading frames, k-mer motifs (like <code className="font-mono">TATA</code> or <code className="font-mono">CG</code> islands), and 3D chromatin accessibility. (3) <strong>Interpretability vs. Complexity:</strong> Deep genomic models capture sequence order but often act as black boxes requiring wet-lab experimental validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PYTHON / GOOGLE COLAB CODE */}
      {subTab === 'colab' && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-mono text-slate-500">
                REPRODUCIBLE PYTHON 3 / GOOGLE COLAB PIPELINE
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                Scikit-Learn Feature Extraction &amp; Classifier Script
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPython}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied Python Code' : 'Copy Code'}
              </button>
              <button
                type="button"
                onClick={handleDownloadIpynb}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-700 hover:bg-cyan-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download Colab Notebook (.ipynb)
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{pythonCode}</code>
          </pre>
        </div>
      )}

      {/* TAB 3: COLLABORATIVE PEER REVIEW & ANNOTATIONS */}
      {subTab === 'collaboration' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 border border-slate-200 rounded-lg p-4 bg-[#F8FAFC]">
            <div className="text-xs font-mono text-slate-500">
              ADD LABORATORY ANNOTATION
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">
              Log Scientist Peer Review Note
            </h3>

            <form onSubmit={handleSubmitAnnotation} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-600 mb-1">INVESTIGATOR</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-600 mb-1">DISCIPLINE</label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-600 mb-1">TARGET SEQUENCE</label>
                  <select
                    value={targetSeq}
                    onChange={(e) => setTargetSeq(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded text-slate-900"
                  >
                    <option value={`QUERY (${queryFeatures.sequence})`}>QUERY ({queryFeatures.sequence})</option>
                    {sequences.map((s) => (
                      <option key={s.id} value={`${s.id} (${s.sequence})`}>
                        {s.id} ({s.sequence})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-600 mb-1">CATEGORY</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as CollaborativeAnnotation['category'])}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900"
                  >
                    <option value="Model Audit">Model Audit</option>
                    <option value="Feature Interpretation">Feature Interpretation</option>
                    <option value="Genomic Context">Genomic Context</option>
                    <option value="Peer Review">Peer Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-600 mb-1">OBSERVATION / HYPOTHESIS</label>
                <textarea
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Document motif interpretation, classifier edge case, or experimental recommendation..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                Append Peer Review Annotation
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-mono text-slate-500">
              CHRONOLOGICAL PEER-REVIEW AUDIT LOG ({annotations.length} ENTRIES)
            </div>
            {annotations.map((ann) => (
              <div key={ann.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-900">{ann.author}</span>
                    <span className="mx-1.5">·</span>
                    <span>{ann.role}</span>
                    <span className="mx-1.5">·</span>
                    <span className="text-cyan-700 font-semibold">{ann.category}</span>
                  </div>
                  <div>
                    <span>LOCUS: {ann.targetSequenceId}</span>
                    <span className="mx-1.5">·</span>
                    <span>{ann.timestamp}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-700 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ORIGINAL ASSESSMENT SPECIFICATION IMAGE */}
      {subTab === 'protocol' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono text-slate-500">
                PRIMARY BENCHMARK SPECIFICATION ATTACHMENT
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                Uploaded Laboratory Assessment Protocol &amp; Rubric Guidelines
              </h3>
            </div>
          </div>
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <img
              src="/assets/aistudio/Screenshot_2026-11-04_185238_d54fc8af.png"
              alt="Uploaded DNA sequence classification assessment instructions and guidelines"
              referrerPolicy="no-referrer"
              className="w-full max-w-4xl mx-auto rounded border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
