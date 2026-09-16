import React, { useState, useMemo } from 'react';
import { Printer, X, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

const getPositionClass = (pos: string): string => {
  if (pos === 'Champion' || pos === 'Winner' || pos === 'Merit') {
    return 'font-extrabold text-slate-950';
  }
  return 'text-slate-500 font-normal';
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

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      displayedGroups.forEach((group, gIdx) => {
        if (gIdx > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const sortedResults = [...group.allResults].sort(
          (a, b) => b.finalAverageScore - a.finalAverageScore
        );

        const isNoHeadCat =
          canonicalAppType(group.appType) === 'Student-Secondary' ||
          canonicalAppType(group.appType) === 'Individual or Group';

        const catTitle = isNoHeadCat ? 'General (No Head Category)' : group.headCategoryName;

        // 1. Top Header (clearing pre-printed top letterhead region)
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(15);
        pdf.setTextColor(15, 23, 42); // slate-900
        pdf.text('BANGLADESH ICT AND INNOVATION AWARDS 2026', 105, 45, { align: 'center' });

        // 2. Subheading
        pdf.setFontSize(10);
        pdf.setTextColor(51, 65, 85); // slate-700
        const subTitle = `Application Type: ${group.appTypeTitle}   •   Category Name: ${catTitle}`;
        pdf.text(subTitle, 105, 51.5, { align: 'center' });

        // Header bottom divider
        pdf.setDrawColor(15, 23, 42);
        pdf.setLineWidth(0.6);
        pdf.line(14, 55, 196, 55);

        // 3. Table Rows
        const tableBody = sortedResults.map((item, idx) => {
          const sl = (idx + 1).toString();
          const solutionName = item.project.solutionName || item.project.title;
          const teamLead = item.project.teamLeadName || item.project.representativeName || item.project.teamOrOrgName || 'N/A';
          const org = item.project.teamOrOrgName;
          const leadInfo = org && org !== teamLead ? `Team Lead: ${teamLead} (${org})` : `Team Lead: ${teamLead}`;
          const score = `${formatScoreNumber(item.finalAverageScore)}%`;
          const position = getPositionDisplay(item);
          return [sl, `${solutionName}\n${leadInfo}`, score, position];
        });

        if (tableBody.length === 0) {
          tableBody.push(['-', 'No evaluated projects in this category', '-', 'N/A']);
        }

        // Table Rendering with autoTable (safe margins for pre-printed letterhead)
        autoTable(pdf, {
          startY: 58,
          head: [['SL', 'Solution Name & Team Lead', 'Score', 'Position']],
          body: tableBody,
          theme: 'grid',
          margin: { left: 14, right: 14, top: 44, bottom: 32 },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 9,
            lineWidth: 0.2,
            lineColor: [100, 116, 139]
          },
          bodyStyles: {
            fontSize: 8.5,
            textColor: [15, 23, 42],
            lineWidth: 0.2,
            lineColor: [203, 213, 225],
            cellPadding: 3.5
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 9 },
            3: { cellWidth: 32, halign: 'center', fontStyle: 'bold', fontSize: 9 }
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
              const val = String(data.cell.raw);
              if (val === 'Champion' || val === 'Winner' || val === 'Merit') {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [15, 23, 42]; // solid black
              } else {
                data.cell.styles.fontStyle = 'normal';
                data.cell.styles.textColor = [100, 116, 139]; // slate-500
              }
            }
          }
        });

        // 4. Judges Committee Signatures Section (Dynamic based on evaluating judges)
        const judgesMap = new Map<string, string>();
        sortedResults.forEach(r => {
          r.judgesEvaluations?.forEach((j: JudgeScoreBreakdown) => {
            const rawName = j.judgeName?.trim();
            const cleaned = rawName?.replace(/\s*[\(\[-]?\s*judge\s*\d+\s*[\)\]]?/gi, '').trim();
            const finalName = cleaned || rawName;
            if (finalName && !judgesMap.has(finalName)) {
              judgesMap.set(finalName, finalName);
            }
          });
        });
        const detectedJudges = Array.from(judgesMap.values());
        const judgeList = detectedJudges.length > 0 ? detectedJudges : ['Judge Name'];
        const numJudges = judgeList.length;

        const isTwoRows = numJudges > 6;
        const totalHeightNeeded = isTwoRows ? 95 : 75;

        const lastTable = (pdf as any).lastAutoTable;
        let sigY = lastTable ? lastTable.finalY + 12 : 160;

        // If signatures (judges + 2 authorized signatures) would collide with bottom footer (at ~265mm)
        if (sigY + totalHeightNeeded > 255) {
          pdf.addPage('a4', 'portrait');
          sigY = 50; // below top letterhead on the new page
        }

        pdf.setDrawColor(15, 23, 42);
        pdf.setLineWidth(0.4);
        pdf.line(14, sigY, 196, sigY);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(51, 65, 85);
        pdf.text('JUDGES COMMITTEE SIGNATURES & VERIFICATION', 105, sigY + 6, { align: 'center' });

        // Extra space between heading and judge signature line (sigY + 42 gives 36mm clearance)
        const judgeLineOffset = 42;
        let endOfJudgesY = sigY + judgeLineOffset;

        if (!isTwoRows) {
          const startX = 14;
          const totalW = 182;
          const colW = totalW / numJudges;
          const lineY = sigY + judgeLineOffset;
          endOfJudgesY = lineY;

          const nameFont = numJudges >= 6 ? 6.5 : 7.5;
          const desigFont = numJudges >= 6 ? 6 : 7;

          for (let j = 0; j < numJudges; j++) {
            const slotX = startX + j * colW;
            const midX = slotX + colW / 2;
            const judgeName = judgeList[j];

            // Line
            pdf.setDrawColor(51, 65, 85);
            pdf.setLineWidth(0.3);
            pdf.line(slotX + 2, lineY, slotX + colW - 2, lineY);

            // Name
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(nameFont);
            pdf.setTextColor(15, 23, 42);
            pdf.text(judgeName, midX, lineY + 4, { align: 'center', maxWidth: colW - 4 });

            // Designation
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(desigFont);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`Judge ${j + 1}`, midX, lineY + 7.5, { align: 'center' });
            pdf.text('Signature', midX, lineY + 11, { align: 'center' });
          }
        } else {
          // Two rows for more than 6 judges
          const perRow = Math.ceil(numJudges / 2);
          const colW = 182 / perRow;
          const startX = 14;

          // Row 1
          const lineY1 = sigY + judgeLineOffset;
          for (let j = 0; j < perRow; j++) {
            const slotX = startX + j * colW;
            const midX = slotX + colW / 2;
            const judgeName = judgeList[j];

            pdf.setDrawColor(51, 65, 85);
            pdf.setLineWidth(0.3);
            pdf.line(slotX + 2, lineY1, slotX + colW - 2, lineY1);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(15, 23, 42);
            pdf.text(judgeName, midX, lineY1 + 4, { align: 'center', maxWidth: colW - 4 });

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`Judge ${j + 1}`, midX, lineY1 + 7.5, { align: 'center' });
            pdf.text('Signature', midX, lineY1 + 11, { align: 'center' });
          }

          // Row 2
          const lineY2 = lineY1 + 22;
          endOfJudgesY = lineY2;
          for (let j = perRow; j < numJudges; j++) {
            const idxInRow = j - perRow;
            const slotX = startX + idxInRow * colW;
            const midX = slotX + colW / 2;
            const judgeName = judgeList[j];

            pdf.setDrawColor(51, 65, 85);
            pdf.setLineWidth(0.3);
            pdf.line(slotX + 2, lineY2, slotX + colW - 2, lineY2);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(15, 23, 42);
            pdf.text(judgeName, midX, lineY2 + 4, { align: 'center', maxWidth: colW - 4 });

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`Judge ${j + 1}`, midX, lineY2 + 7.5, { align: 'center' });
            pdf.text('Signature', midX, lineY2 + 11, { align: 'center' });
          }
        }

        // 5. Authorized Signatures Section (Pinned to the very bottom of the page before footer)
        const authY = Math.max(endOfJudgesY + 34, 252);

        // Left Authorized Signature
        const leftAuthX1 = 20;
        const leftAuthX2 = 75;
        const leftMidX = (leftAuthX1 + leftAuthX2) / 2;
        pdf.setDrawColor(51, 65, 85);
        pdf.setLineWidth(0.35);
        pdf.line(leftAuthX1, authY, leftAuthX2, authY);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Authorized Signature', leftMidX, authY + 4.5, { align: 'center' });

        // Right Authorized Signature
        const rightAuthX1 = 135;
        const rightAuthX2 = 190;
        const rightMidX = (rightAuthX1 + rightAuthX2) / 2;
        pdf.line(rightAuthX1, authY, rightAuthX2, authY);

        pdf.text('Authorized Signature', rightMidX, authY + 4.5, { align: 'center' });
      });

      const fileSuffix = selectedKey === 'ALL' ? 'All_Categories' : selectedKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`BIIN_Awards_2026_Result_${fileSuffix}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="category-print-modal-wrapper fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 flex justify-center animate-in fade-in duration-200">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 44mm 14mm 32mm 14mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .category-print-modal-wrapper {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          .category-print-modal-inner {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .print-sheet-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          .category-page-break {
            page-break-after: always;
            break-after: page;
            min-height: 220mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            background: transparent !important;
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
            border: 1px solid #64748b !important;
            padding: 6px 8px !important;
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

      <div className="category-print-modal-inner w-full max-w-4xl space-y-4">
        {/* Floating Top Control Bar (Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center space-x-2">
            <Printer className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <h2 className="font-heading font-bold text-sm text-white">Letterhead Result Report Sheet (A4)</h2>
              <p className="text-[11px] text-slate-400">Pre-adjusted for official BIIN letterhead paper (Top 44mm &amp; Bottom 32mm clearance)</p>
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

            // Collect all unique judges who evaluated projects in this category
            const judgesMap = new Map<string, string>();
            sortedResults.forEach(r => {
              r.judgesEvaluations?.forEach((j: JudgeScoreBreakdown) => {
                const rawName = j.judgeName?.trim();
                const cleaned = rawName?.replace(/\s*[\(\[-]?\s*judge\s*\d+\s*[\)\]]?/gi, '').trim();
                const finalName = cleaned || rawName;
                if (finalName && !judgesMap.has(finalName)) {
                  judgesMap.set(finalName, finalName);
                }
              });
            });
            const detectedJudges = Array.from(judgesMap.values());
            const judgeSlots = (detectedJudges.length > 0 ? detectedJudges : ['Judge Name']).map((name, idx) => ({
              number: idx + 1,
              name: name
            }));

            const isNoHeadCat =
              canonicalAppType(group.appType) === 'Student-Secondary' ||
              canonicalAppType(group.appType) === 'Individual or Group';

            return (
              <div
                key={group.categoryKey}
                className="category-page-break rounded-3xl bg-white p-6 sm:p-10 md:p-12 text-slate-900 shadow-2xl border border-slate-200 flex flex-col justify-between min-h-[900px] sm:min-h-[1050px] space-y-8"
              >
                {/* Upper Content: Header + Results Table + Summary Note */}
                <div className="space-y-6 flex-1">
                  {/* 1. Header Section */}
                  <div className="text-center space-y-1.5 pb-4 border-b-2 border-slate-900">
                    <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
                      Bangladesh ICT and Innovation Awards 2026
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
                                  <span className={`text-xs uppercase tracking-wider ${getPositionClass(position)}`}>
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
                </div>

                {/* 4. Judges Committee & Authorized Signatures Section (Pinned to the very bottom) */}
                <div className="print-signature-block pt-10 mt-auto border-t-2 border-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="text-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
                        Judges Committee Signatures &amp; Verification
                      </span>
                    </div>

                    {/* Extra space between heading and judge signatures */}
                    <div
                      className="grid gap-4 text-center pt-14 sm:pt-16"
                      style={{
                        gridTemplateColumns: `repeat(${judgeSlots.length > 6 ? Math.ceil(judgeSlots.length / 2) : judgeSlots.length}, minmax(0, 1fr))`
                      }}
                    >
                      {judgeSlots.map((slot) => (
                        <div key={slot.number} className="flex flex-col justify-end space-y-1">
                          {/* Signature Line with generous height */}
                          <div className="h-16 sm:h-20 border-b-2 border-slate-800 mb-1 flex items-end justify-center">
                            {/* Blank area for physical signature */}
                          </div>

                          <span className="text-[11px] font-bold text-slate-900 block truncate" title={slot.name || `Judge ${slot.number}`}>
                            {slot.name || `Judge ${slot.number}`}
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

                  {/* 5. 2 Authorized Signatures Section - Pinned to the very bottom of the page */}
                  <div className="pt-20 sm:pt-28 pb-1 flex items-end justify-between px-6 sm:px-14">
                    <div className="w-52 sm:w-60 text-center">
                      <div className="h-14 border-b-2 border-slate-800 mb-1"></div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                        Authorized Signature
                      </span>
                    </div>

                    <div className="w-52 sm:w-60 text-center">
                      <div className="h-14 border-b-2 border-slate-800 mb-1"></div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                        Authorized Signature
                      </span>
                    </div>
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
