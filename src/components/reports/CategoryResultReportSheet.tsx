import React, { useState, useMemo } from 'react';
import { Printer, X, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { CombinedProjectResult, JudgeScoreBreakdown } from '../../types';
import { formatScoreNumber, canonicalAppType, type CategoryResultGroup } from '../../utils/evaluation';

interface CategoryResultReportSheetProps {
  categoryGroups: CategoryResultGroup[];
  initialCategoryKey?: string;
  onClose: () => void;
}

const getPositionDisplay = (res: CombinedProjectResult): string => {
  if (res.awardBase === 'Champion' || res.award === 'Champion' || res.award.includes('Champion')) {
    return 'Champion';
  }
  if (res.awardBase === 'Winner' || res.award === 'Winner' || res.award.includes('Winner')) {
    return 'Winner';
  }
  if (res.awardBase === 'Merit' || res.award.includes('Merit')) {
    return 'Merit';
  }
  return 'N/A';
};

const getPositionBadgeClass = (pos: string): string => {
  switch (pos) {
    case 'Champion':
      return 'bg-amber-100 text-amber-950 font-black border border-amber-300';
    case 'Winner':
      return 'bg-indigo-100 text-indigo-950 font-black border border-indigo-300';
    case 'Merit':
      return 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300';
    default:
      return 'text-slate-500 font-semibold';
  }
};

export const CategoryResultReportSheet: React.FC<CategoryResultReportSheetProps> = ({
  categoryGroups,
  initialCategoryKey,
  onClose
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(
    initialCategoryKey || categoryGroups[0]?.categoryKey || 'ALL'
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const displayedGroups = useMemo(() => {
    if (selectedKey === 'ALL') {
      return categoryGroups;
    }
    const found = categoryGroups.find(g => g.categoryKey === selectedKey);
    return found ? [found] : categoryGroups.slice(0, 1);
  }, [categoryGroups, selectedKey]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const container = document.getElementById('print-sheets-root');
      if (!container) return;

      const sheetElements = container.querySelectorAll<HTMLElement>('.category-page-break');
      if (sheetElements.length === 0) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < sheetElements.length; i++) {
        const sheet = sheetElements[i];
        const canvas = await html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
      }

      const fileSuffix = selectedKey === 'ALL' ? 'All_Categories' : selectedKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`BIIN_Result_Report_${fileSuffix}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to print if canvas fails
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 flex justify-center animate-in fade-in duration-200">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .category-page-break {
            page-break-after: always;
            break-after: page;
          }
          .category-page-break:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #334155 !important;
            padding: 7px 10px !important;
            color: #000000 !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
          }
          .print-signature-block {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl space-y-4">
        {/* Floating Top Control Bar (Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center space-x-2">
            <Printer className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <h2 className="font-heading font-bold text-sm text-white">Official Result Report Sheet (A4)</h2>
              <p className="text-[11px] text-slate-400">Print or export official competition result sheets with judge signatures</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Switcher Dropdown */}
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories (12 Pages Batch Print)</option>
              {categoryGroups.map((grp) => (
                <option key={grp.categoryKey} value={grp.categoryKey}>
                  {grp.appTypeTitle} — {grp.headCategoryName} ({grp.allResults.length})
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="inline-flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-lg transition-transform hover:scale-105"
              title="Download official result sheet directly as PDF file"
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary inline-flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
              title="Open browser print dialog"
            >
              <Printer className="h-4 w-4" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={onClose}
              title="Close"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white border border-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheets Layout */}
        <div className="print-sheet-container space-y-8" id="print-sheets-root">
          {displayedGroups.map((group) => {
            // Sort all projects in descending order of final average score
            const sortedResults = [...group.allResults].sort(
              (a, b) => b.finalAverageScore - a.finalAverageScore
            );

            // Collect up to 5 unique judges from this category pool
            const judgesMap = new Map<string, string>();
            sortedResults.forEach(r => {
              r.judgesEvaluations?.forEach((j: JudgeScoreBreakdown) => {
                const name = j.judgeName?.replace(/\s*[\(\[-]?\s*judge\s*\d+\s*[\)\]]?/gi, '').trim();
                if (name && !judgesMap.has(name)) {
                  judgesMap.set(name, name);
                }
              });
            });
            const detectedJudges = Array.from(judgesMap.values());
            const judgeSlots = Array.from({ length: 5 }, (_, idx) => {
              return {
                number: idx + 1,
                name: detectedJudges[idx] || ''
              };
            });

            const isNoHeadCat =
              canonicalAppType(group.appType) === 'Student-Secondary' ||
              canonicalAppType(group.appType) === 'Individual or Group';

            return (
              <div
                key={group.categoryKey}
                className="category-page-break rounded-3xl bg-white p-6 sm:p-10 md:p-12 text-slate-900 shadow-2xl border border-slate-200 space-y-6"
              >
                {/* 1. Header Section */}
                <div className="text-center space-y-1.5 pb-4 border-b-2 border-slate-900">
                  <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
                    Bangladesh ICT &amp; Innovation Network
                  </h1>

                  <div className="text-sm sm:text-base font-bold text-slate-700 uppercase tracking-normal">
                    <span>Application Type: <span className="text-slate-950 font-extrabold">{group.appTypeTitle}</span></span>
                    <span className="mx-2 text-slate-400">•</span>
                    <span>
                      Category Name: <span className="text-slate-950 font-extrabold">
                        {isNoHeadCat ? 'General (No Head Category)' : group.headCategoryName}
                      </span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    Official Competition Result Sheet · Award Designation &amp; Scoring Evaluation
                  </p>
                </div>

                {/* 2. Results Table */}
                <div className="overflow-x-auto">
                  <table className="print-table w-full text-left text-xs border border-slate-400">
                    <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px]">
                      <tr>
                        <th className="p-2.5 border border-slate-400 text-center w-12">SL</th>
                        <th className="p-2.5 border border-slate-400">
                          <div>Solution Name</div>
                          <div className="text-[10px] text-slate-600 font-medium lowercase">team lead name</div>
                        </th>
                        <th className="p-2.5 border border-slate-400 text-center w-28">Score</th>
                        <th className="p-2.5 border border-slate-400 text-center w-36">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {sortedResults.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                            No evaluated projects in this category.
                          </td>
                        </tr>
                      ) : (
                        sortedResults.map((item, idx) => {
                          const sl = idx + 1;
                          const solutionName = item.project.solutionName || item.project.title;
                          const teamLead =
                            item.project.teamLeadName ||
                            item.project.representativeName ||
                            item.project.teamOrOrgName ||
                            'N/A';
                          const position = getPositionDisplay(item);

                          return (
                            <tr key={item.project.id} className="hover:bg-slate-50">
                              <td className="p-2.5 border border-slate-400 text-center font-mono font-bold text-slate-700">
                                {sl}
                              </td>

                              <td className="p-2.5 border border-slate-400">
                                <div className="font-bold text-slate-950 text-[13px] leading-snug">
                                  {solutionName}
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                                  Team Lead: <span className="text-slate-900 font-semibold">{teamLead}</span>
                                  {item.project.teamOrOrgName && item.project.teamOrOrgName !== teamLead && (
                                    <span className="text-slate-500 font-normal"> ({item.project.teamOrOrgName})</span>
                                  )}
                                </div>
                              </td>

                              <td className="p-2.5 border border-slate-400 text-center font-mono font-black text-sm text-slate-900">
                                {formatScoreNumber(item.finalAverageScore)}%
                              </td>

                              <td className="p-2.5 border border-slate-400 text-center">
                                <span className={`inline-block px-3 py-1 rounded-md text-xs uppercase tracking-wide ${getPositionBadgeClass(position)}`}>
                                  {position}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Summary / Rules Footer Note */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-2 font-medium">
                  <span>
                    Total Projects: <strong className="text-slate-800 font-mono">{sortedResults.length}</strong>
                  </span>
                  <span>
                    Criteria: Champion (≥85%), Winner (≥70%), Merit (≥65%, Max 2), N/A (&lt;65%)
                  </span>
                  <span>
                    Generated: {new Date().toLocaleDateString()}
                  </span>
                </div>

                {/* 4. 5 Judge Signatures Section */}
                <div className="print-signature-block pt-10 mt-8 border-t-2 border-slate-900 space-y-4">
                  <div className="text-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
                      Judges Committee Signatures &amp; Verification
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 pt-4 text-center">
                    {judgeSlots.map((slot) => (
                      <div key={slot.number} className="flex flex-col justify-end space-y-1">
                        {/* Signature Line */}
                        <div className="h-12 border-b-2 border-slate-800 mb-1 flex items-end justify-center">
                          {/* Blank area for physical or digital pen signature */}
                        </div>

                        <span className="text-[11px] font-bold text-slate-900 block truncate" title={slot.name || `Judge ${slot.number}`}>
                          {slot.name || 'Judge Name'}
                        </span>

                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Judge {slot.number}
                        </span>

                        <span className="text-[9px] text-slate-400 block">
                          Signature
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
