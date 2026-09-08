import React from 'react';
import { Printer, X } from 'lucide-react';
import type { CombinedProjectResult } from '../../types';
import { getCriteriaForApplicationType, formatScoreNumber } from '../../utils/evaluation';

interface PrintResultReportSheetProps {
  result: CombinedProjectResult;
  onClose: () => void;
}

export const PrintResultReportSheet: React.FC<PrintResultReportSheetProps> = ({
  result,
  onClose
}) => {
  const { project, applicationType, judgesEvaluations, finalAverageScore, award } = result;

  const criteria = getCriteriaForApplicationType(applicationType);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 flex justify-center animate-in fade-in duration-200">
      
      {/* CSS Print Styles override */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: inherit;
          }
          .no-print {
            display: none !important;
          }
          .print-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print-header {
            border-bottom: 2px solid #0f172a !important;
          }
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #94a3b8 !important;
            padding: 8px 12px !important;
            color: black !important;
          }
          .print-badge {
            border: 2px solid #000 !important;
            color: black !important;
            background: #f8fafc !important;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl space-y-4">
        
        {/* Floating Top Bar (No Print) */}
        <div className="no-print flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-2">
            <Printer className="h-5 w-5 text-cyan-400" />
            <span className="font-heading font-bold text-sm">Print Result Report Sheet Preview (A4)</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="btn-primary inline-flex items-center space-x-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white border border-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet Layout */}
        <div className="print-wrapper print-card rounded-3xl bg-white p-8 sm:p-12 text-slate-900 shadow-2xl border border-slate-200 space-y-6">
          
          {/* Organization / Header Section */}
          <div className="print-header flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-extrabold text-white uppercase tracking-wider">
                  BIIN Competition Portal
                </span>
                <span className="font-mono text-xs font-bold text-slate-600 uppercase border border-slate-300 px-2 py-0.5 rounded">
                  Official Evaluation Audit Sheet
                </span>
              </div>
              <h1 className="font-heading text-3xl font-black text-slate-900 uppercase tracking-tight">
                Project Evaluation Result Sheet
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Multi-Judge Consolidated Scoring Report & Final Award Designation
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block border-2 border-slate-900 rounded-xl px-4 py-2 bg-slate-50 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Category</span>
                <span className="font-mono text-base font-black text-slate-900">{project.headCategory || 'General'}</span>
              </div>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Project Name</span>
              <span className="font-bold text-slate-900 text-sm block leading-tight">{project.title}</span>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Application Type</span>
              <span className="font-semibold text-slate-900 block mt-0.5">{applicationType}</span>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Head Category</span>
              <span className="font-semibold text-slate-900 block mt-0.5">{project.headCategory}</span>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Participant / Team</span>
              <span className="font-semibold text-slate-900 block mt-0.5">{project.teamOrOrgName}</span>
              <span className="text-[11px] text-slate-600 block">{project.representativeName}</span>
            </div>
          </div>

          {/* Detailed Criteria Matrix Table */}
          <div className="space-y-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-900">
              Judges Criteria Breakdown & Marks Matrix:
            </h3>

            <table className="print-table w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase text-slate-800 text-[11px]">
                <tr>
                  <th className="p-2 border border-slate-300">Criteria</th>
                  <th className="p-2 border border-slate-300 text-center">Max Mark</th>
                  {judgesEvaluations.map((j, idx) => (
                    <th key={j.judgeEmail} className="p-2 border border-slate-300 text-center">
                      Judge {idx + 1}<br/>
                      <span className="text-[9px] font-normal text-slate-600">({j.judgeName.split(' ')[0]})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {criteria.map((crit) => (
                  <tr key={crit.key} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 font-medium">
                      {crit.label}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-semibold">10</td>
                    {judgesEvaluations.map((j) => {
                      const scoreVal = j.scores[crit.key] ?? 0;
                      return (
                        <td key={j.judgeEmail} className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">
                          {formatScoreNumber(scoreVal)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              {/* Raw Total Row */}
              <tfoot className="bg-slate-50 font-bold">
                <tr className="border-t-2 border-slate-400">
                  <td className="p-2.5 border border-slate-300 uppercase tracking-wider text-[11px]">
                    Raw Score Total
                  </td>
                  <td className="p-2.5 border border-slate-300 text-center font-mono">
                    {criteria.length * 10}
                  </td>
                  {judgesEvaluations.map((j) => (
                    <td key={j.judgeEmail} className="p-2.5 border border-slate-300 text-center font-mono text-sm text-slate-900">
                      {formatScoreNumber(j.rawScore)} / {j.maxRawScore}
                    </td>
                  ))}
                </tr>

                {/* Converted Score Row */}
                <tr className="bg-slate-100">
                  <td className="p-2.5 border border-slate-300 uppercase tracking-wider text-[11px] text-indigo-900">
                    Converted Score / 100
                  </td>
                  <td className="p-2.5 border border-slate-300 text-center font-mono">100</td>
                  {judgesEvaluations.map((j) => (
                    <td key={j.judgeEmail} className="p-2.5 border border-slate-300 text-center font-mono text-sm font-extrabold text-indigo-900">
                      {formatScoreNumber(j.convertedScore)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Prominent Final Score & Award Summary */}
          <div className="print-badge border-2 border-slate-900 rounded-2xl p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
                CONSOLIDATED FINAL PROJECT SCORE
              </span>
              <div className="font-mono text-4xl font-black text-slate-900 mt-0.5">
                FINAL SCORE: {formatScoreNumber(finalAverageScore)} / 100
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l-2 border-slate-300 pt-3 sm:pt-0 sm:pl-6 text-center sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
                OFFICIAL AWARD DESIGNATION
              </span>
              <div className="font-heading text-2xl font-black uppercase text-indigo-900 tracking-wider mt-0.5">
                AWARD: {award.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Signature Lines for Official Records */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div>
              <div className="h-10 border-b border-slate-400 mb-1" />
              <span className="font-semibold text-slate-900">Judge 1 Signature</span>
              <span className="block text-[10px] text-slate-500">{judgesEvaluations[0]?.judgeName || 'Judge 1'}</span>
            </div>

            <div>
              <div className="h-10 border-b border-slate-400 mb-1" />
              <span className="font-semibold text-slate-900">Judge 2 Signature</span>
              <span className="block text-[10px] text-slate-500">{judgesEvaluations[1]?.judgeName || 'Judge 2'}</span>
            </div>

            <div>
              <div className="h-10 border-b border-slate-400 mb-1" />
              <span className="font-semibold text-slate-900">Judge 3 Signature</span>
              <span className="block text-[10px] text-slate-500">{judgesEvaluations[2]?.judgeName || 'Judge 3'}</span>
            </div>
          </div>

          {/* Footer stamp */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-200">
            <span>BIIN Evaluation Portal • Official Document</span>
            <span>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
