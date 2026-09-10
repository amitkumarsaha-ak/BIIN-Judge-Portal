import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, Download, Check, AlertTriangle,
  X, CheckCircle2, XCircle, RefreshCw, Layers,
  ArrowRight, PlusCircle, Building2, GraduationCap, Users, University
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Project, ApplicationType, HeadCategoryCode } from '../../types';
import { HEAD_CATEGORIES } from '../../data/mockData';
import { getProjects } from '../../services/storage';
import { canonicalAppType, canonicalHeadCategory } from '../../utils/evaluation';

interface ExcelImportModalProps {
  existingProjects: Project[];
  initialAppType?: ApplicationType;
  initialCategory?: HeadCategoryCode;
  onClose: () => void;
  onImport: (newProjects: Project[]) => void;
}

interface RowValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

const VALID_APP_TYPES: { match: string[]; target: ApplicationType }[] = [
  { match: ['all application types', 'all application type', 'all types', 'all'], target: 'All Application Types' },
  { match: ['student -tertiary (university level)', 'student tertiary', 'student-tertiary', 'university level', 'university', 'tertiary', 'undergraduate', 'postgraduate', 'higher education'], target: 'Student -Tertiary (University Level)' },
  { match: ['student', 'school', 'college', 'secondary', 'k-12'], target: 'Student' },
  { match: ['organization', 'organisation', 'org', 'company', 'startup', 'corporate', 'institution', 'ngo', 'firm'], target: 'Organization' },
  { match: ['individual/group', 'individual or group', 'individual', 'group', 'team', 'solo', 'general'], target: 'Individual/Group' }
];

const VALID_HEAD_CATEGORIES: { match: string[]; code: HeadCategoryCode }[] = [
  { match: ['all head category', 'all head categories', 'all categories', 'all category', 'all'], code: 'All Head Category' },
  { match: ['hc-c', 'hc-01', 'hc-1', 'consumer', 'consumer tech', 'consumer solutions', 'b2c', 'retail'], code: 'HC-C' },
  { match: ['hc-bs', 'hc-02', 'hc-2', 'business service', 'business services', 'business', 'b2b', 'enterprise', 'fintech', 'saas'], code: 'HC-BS' },
  { match: ['hc-i', 'hc-03', 'hc-3', 'industrial', 'industrial tech', 'robotics', 'iot', 'hardware', 'agritech', 'manufacturing'], code: 'HC-I' },
  { match: ['hc-psg', 'hc-04', 'hc-4', 'public sector and government', 'public sector & government', 'public sector', 'government', 'gov', 'smart city', 'civic', 'e-gov'], code: 'HC-PSG' },
  { match: ['hc-ics', 'hc-05', 'hc-5', 'individual & communication services', 'individual and communication services', 'individual & communication', 'individual and communication', 'communication services', 'communication', 'inclusion & community service', 'inclusion & community', 'community & social', 'inclusion', 'community', 'social', 'media', 'telecom'], code: 'HC-ICS' }
];

const APPLICATION_TYPE_OPTIONS: { id: ApplicationType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'All Application Types', label: 'All Application Types', icon: Layers },
  { id: 'Student', label: 'Student', icon: GraduationCap },
  { id: 'Student -Tertiary (University Level)', label: 'Student -Tertiary (University Level)', icon: University },
  { id: 'Organization', label: 'Organization', icon: Building2 },
  { id: 'Individual/Group', label: 'Individual/Group', icon: Users },
];

const normalizeStr = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

const mapApplicationType = (val: string): ApplicationType | null => {
  const clean = val.trim().toLowerCase();
  for (const item of VALID_APP_TYPES) {
    if (item.match.some(m => clean === m || clean.includes(m))) {
      return item.target;
    }
  }
  return null;
};

const mapHeadCategory = (val: string): HeadCategoryCode | null => {
  const clean = val.trim().toLowerCase();
  for (const item of VALID_HEAD_CATEGORIES) {
    if (item.match.some(m => clean === m || clean.includes(m))) {
      return item.code;
    }
  }
  return canonicalHeadCategory(val);
};

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  existingProjects: initialExistingProjects,
  initialAppType,
  initialCategory,
  onClose,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category and Application Type Selection Mode
  // Default to "All Application Types" and "All Head Category"
  const [selectedAppType, setSelectedAppType] = useState<ApplicationType>(
    initialAppType || 'All Application Types'
  );
  const [selectedHeadCategory, setSelectedHeadCategory] = useState<HeadCategoryCode>(
    initialCategory || 'All Head Category'
  );

  const [fileName, setFileName] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [totalRows, setTotalRows] = useState(0);
  const [validProjects, setValidProjects] = useState<Project[]>([]);
  const [rowErrors, setRowErrors] = useState<RowValidationError[]>([]);
  const [columnErrors, setColumnErrors] = useState<string[]>([]);

  // Session-accumulated imported count and success screen
  const [lastImportedCount, setLastImportedCount] = useState<number | null>(null);
  const [lastImportedTarget, setLastImportedTarget] = useState<string>('');
  const [sessionImportedTotal, setSessionImportedTotal] = useState(0);

  // Dynamic projects list to prevent duplicate collisions across repeated imports in same modal session
  const [sessionProjects, setSessionProjects] = useState<Project[]>(() => {
    const live = getProjects();
    return live.length > 0 ? live : initialExistingProjects;
  });

  // Re-process if user changes target category while a file is already loaded
  useEffect(() => {
    if (currentFile && !isProcessing && lastImportedCount === null) {
      processFile(currentFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppType, selectedHeadCategory]);

  const activeCategoryObj = HEAD_CATEGORIES.find(c => c.code === selectedHeadCategory);
  const activeTypeObj = APPLICATION_TYPE_OPTIONS.find(t => t.id === selectedAppType);

  // 1. Download Sample Excel Template (Customized for selected Application Type & Head Category)
  const handleDownloadTemplate = () => {
    const appTypeLabel = selectedAppType !== 'All Application Types' ? selectedAppType : 'Student';
    const headCatLabel = selectedHeadCategory !== 'All Head Category' ? selectedHeadCategory : 'Consumer';

    const sampleData = [
      {
        'Solution Name': 'Smart AgriSense - Portable Soil Scanner',
        'Project Overview': 'An innovative IoT and AI-driven soil quality scanning device for real-time agricultural telemetry.',
        'Problem Statement': 'Farmers lack accessible, instantaneous, low-cost soil nutrient analysis tools before planting crops.',
        'Solution Summary': 'Portable handheld optical spectrometer paired with a cloud-assisted micro-ML diagnostic application.',
        'Application Type': appTypeLabel,
        'Head Category': headCatLabel
      },
      {
        'Solution Name': 'OmniLedger Enterprise Audit Hub',
        'Project Overview': 'Next-generation compliance and internal audit automation platform for enterprise financial workflows.',
        'Problem Statement': 'Manual audit reviews cause severe delays, data discrepancies, and regulatory vulnerability.',
        'Solution Summary': 'Distributed ledger and smart validation pipeline providing continuous immutable audit trails.',
        'Application Type': selectedAppType !== 'All Application Types' ? selectedAppType : 'Organization',
        'Head Category': selectedHeadCategory !== 'All Head Category' ? selectedHeadCategory : 'Business Services'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 38 }, // Solution Name
      { wch: 55 }, // Project Overview
      { wch: 45 }, // Problem Statement
      { wch: 45 }, // Solution Summary
      { wch: 34 }, // Application Type
      { wch: 34 }, // Head Category
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects_Template');

    const fileNameDownload = `BIIN_Project_Import_Template.xlsx`;
    XLSX.writeFile(workbook, fileNameDownload);
  };

  // 2. Process File
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setCurrentFile(file);
    setColumnErrors([]);
    setRowErrors([]);
    setValidProjects([]);
    setTotalRows(0);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        setColumnErrors(['The uploaded spreadsheet is empty or has no sheets.']);
        setIsProcessing(false);
        setProcessed(true);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];

      // Extract raw 2D array to detect the true header row (in case row 1 is a title or blank)
      const rawRows2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (!rawRows2D || rawRows2D.length === 0) {
        setColumnErrors(['The uploaded sheet contains no data rows.']);
        setIsProcessing(false);
        setProcessed(true);
        return;
      }

      const KNOWN_HEADER_KEYWORDS = [
        'solution', 'project', 'title', 'name', 'overview', 'problem', 'statement',
        'summary', 'type', 'category', 'id', 'serial', 'sl', 'team', 'organization',
        'representative', 'lead', 'email', 'contact', 'phone', 'app'
      ];

      // Scan the first 10 rows to find which row contains the actual headers
      let headerRowIndex = 0;
      let maxMatches = 0;
      for (let r = 0; r < Math.min(10, rawRows2D.length); r++) {
        const rowVals = rawRows2D[r];
        if (!Array.isArray(rowVals)) continue;
        const matches = rowVals.filter(cell => {
          const s = String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return KNOWN_HEADER_KEYWORDS.some(k => s.includes(k));
        }).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          headerRowIndex = r;
        }
      }

      // Read sheet starting from detected header row
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        defval: ''
      });

      // Filter out completely blank rows
      const dataRows = rawRows.filter(r => {
        return Object.values(r).some(val => normalizeStr(val).length > 0);
      });

      if (dataRows.length === 0) {
        setColumnErrors(['The uploaded sheet contains no valid data rows.']);
        setIsProcessing(false);
        setProcessed(true);
        return;
      }

      setTotalRows(dataRows.length);

      // Verify and normalize headers
      const sampleRow = dataRows[0];
      const headerKeys = Object.keys(sampleRow);

      const findKey = (possibleNames: string[]) => {
        // 1. Exact normalized match
        const exact = headerKeys.find(k => {
          const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return possibleNames.some(p => clean === p.toLowerCase().replace(/[^a-z0-9]/g, ''));
        });
        if (exact) return exact;

        // 2. Substring match
        return headerKeys.find(k => {
          const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!clean) return false;
          return possibleNames.some(p => {
            const pClean = p.toLowerCase().replace(/[^a-z0-9]/g, '');
            return pClean.length >= 3 && (clean.includes(pClean) || pClean.includes(clean));
          });
        });
      };

      const keySolutionName = findKey([
        'Solution Name', 'SolutionName', 'Solution', 'Project Title', 'ProjectTitle',
        'Title', 'Project Name', 'ProjectName', 'Project', 'Application Name', 'ApplicationName',
        'App Name', 'AppName', 'Name', 'Idea Name', 'Idea', 'Product Name', 'Submission Name',
        'Proposal Name', 'Topic', 'প্রজেক্টের নাম', 'প্রজেক্ট নাম', 'প্রকল্পের নাম', 'নাম'
      ]);
      const keyOverview = findKey([
        'Project Overview', 'ProjectOverview', 'Overview', 'Description', 'Project Description',
        'ProjectDescription', 'Details', 'About', 'Abstract', 'Summary', 'বিবরণ', 'ওভারভিউ', 'সারসংক্ষেপ'
      ]);
      const keyProblem = findKey([
        'Problem Statement', 'ProblemStatement', 'Problem', 'Statement', 'Issue', 'Challenge',
        'সমস্যা', 'প্রবলেম'
      ]);
      const keySolutionSummary = findKey([
        'Solution Summary', 'SolutionSummary', 'Summary', 'Solution', 'Proposed Solution',
        'Innovation', 'সমাধান'
      ]);
      const keyAppType = findKey([
        'Application Type', 'ApplicationType', 'App Type', 'Type', 'AppType', 'Category Type',
        'ধরন', 'টাইপ'
      ]);
      const keyHeadCat = findKey([
        'Head Category', 'HeadCategory', 'Category', 'Category Code', 'Category Name',
        'HeadCat', 'Sector', 'ক্যাটাগরি'
      ]);

      // Legacy fallback keys (if present in file)
      const keyAppId = findKey(['Application ID', 'ApplicationId', 'App ID', 'AppId', 'Application No', 'App No', 'ID']);
      const keyProjCode = findKey(['Project Code', 'ProjectCode', 'Code', 'Serial', 'Serial No', 'SL', 'Sl No']);
      const keyTeam = findKey(['Team/Organization', 'Team / Organization', 'Team', 'Organization', 'Company', 'Institution', 'TeamOrOrgName', 'Participant', 'Participant Name', 'University', 'College']);
      const keyRep = findKey(['Representative', 'Representative Name', 'Lead', 'Leader', 'Member Name', 'Student Name', 'Contact Person', 'Applicant']);
      const keyEmail = findKey(['Email', 'Email Address', 'Contact Email', 'E-mail']);
      const keyContact = findKey(['Contact Number', 'Contact', 'Phone', 'Phone Number', 'Mobile', 'Mobile Number']);

      // Only Solution Name is strictly required
      if (!keySolutionName) {
        setColumnErrors([
          'Could not find a Project or Solution Name column. Please ensure your Excel file includes a header like "Solution Name", "Project Name", or "Title".'
        ]);
        setIsProcessing(false);
        setProcessed(true);
        return;
      }

      // Validate each row
      const errors: RowValidationError[] = [];
      const parsedValid: Project[] = [];

      // Existing identifiers in database for duplicate checks
      const existingAppIds = new Set(sessionProjects.map(p => p.applicationId.trim().toLowerCase()));
      const existingCodes = new Set(sessionProjects.map(p => p.projectCode.trim().toLowerCase()));

      // In-file duplicate tracking
      const fileAppIds = new Set<string>();
      const fileCodes = new Set<string>();

      // Safe auto-generator counters that never collide with database or in-file IDs
      let autoAppIdCounter = sessionProjects.length + 1;
      const generateUniqueAppId = () => {
        while (true) {
          const candidate = `BIIN-2026-${String(autoAppIdCounter).padStart(3, '0')}`;
          if (!existingAppIds.has(candidate.toLowerCase()) && !fileAppIds.has(candidate.toLowerCase())) {
            fileAppIds.add(candidate.toLowerCase());
            return candidate;
          }
          autoAppIdCounter++;
        }
      };

      let autoCodeCounter = sessionProjects.length + 1;
      const generateUniqueCode = () => {
        while (true) {
          const candidate = `PROJ-${String(autoCodeCounter).padStart(3, '0')}`;
          if (!existingCodes.has(candidate.toLowerCase()) && !fileCodes.has(candidate.toLowerCase())) {
            fileCodes.add(candidate.toLowerCase());
            return candidate;
          }
          autoCodeCounter++;
        }
      };

      dataRows.forEach((row, index) => {
        const rowNumber = headerRowIndex + index + 2; // Exact 1-based row number in spreadsheet
        const rowErrList: string[] = [];

        const rawSolutionName = normalizeStr(row[keySolutionName]);
        let rawOverview = keyOverview ? normalizeStr(row[keyOverview]) : '';
        const rawProblem = keyProblem ? normalizeStr(row[keyProblem]) : '';
        const rawSolution = keySolutionSummary ? normalizeStr(row[keySolutionSummary]) : '';
        const rawAppType = keyAppType ? normalizeStr(row[keyAppType]) : '';
        const rawHeadCat = keyHeadCat ? normalizeStr(row[keyHeadCat]) : '';

        // If overview is empty, populate fallback so database NOT NULL is always satisfied
        if (!rawOverview) {
          rawOverview = rawSolution || rawProblem || (rawSolutionName ? `Project overview for ${rawSolutionName}.` : 'No overview provided.');
        }

        // Legacy fields or auto-generated
        let rawAppId = keyAppId ? normalizeStr(row[keyAppId]) : '';
        let rawCode = keyProjCode ? normalizeStr(row[keyProjCode]) : '';
        let rawTeam = keyTeam ? normalizeStr(row[keyTeam]) : '';
        let rawRep = keyRep ? normalizeStr(row[keyRep]) : '';
        const rawEmail = keyEmail ? normalizeStr(row[keyEmail]) : '';
        const rawContact = keyContact ? normalizeStr(row[keyContact]) : '';

        const wasAppIdAuto = !rawAppId;
        const wasCodeAuto = !rawCode;

        if (wasAppIdAuto) {
          rawAppId = generateUniqueAppId();
        }
        if (wasCodeAuto) {
          rawCode = generateUniqueCode();
        }

        if (!rawTeam) {
          rawTeam = rawSolutionName || 'Independent';
        }
        if (!rawRep) {
          rawRep = 'Lead Contact';
        }

        // Required text check: Solution Name
        if (!rawSolutionName) {
          rowErrList.push('Solution Name is required.');
          errors.push({ rowNumber, field: 'Solution Name', message: 'Solution Name is missing or empty' });
        }

        // Determine Application Type
        let resolvedAppType: ApplicationType | null = null;
        if (rawAppType) {
          resolvedAppType = mapApplicationType(rawAppType);
        }
        if (!resolvedAppType || resolvedAppType === 'All Application Types') {
          resolvedAppType = selectedAppType !== 'All Application Types' ? selectedAppType : 'Student';
        }
        const finalAppType = canonicalAppType(resolvedAppType);

        // Determine Head Category
        let resolvedCategory: HeadCategoryCode | null = null;
        if (rawHeadCat) {
          resolvedCategory = mapHeadCategory(rawHeadCat);
        }
        if (!resolvedCategory || resolvedCategory === 'All Head Category') {
          resolvedCategory = selectedHeadCategory !== 'All Head Category' ? selectedHeadCategory : 'HC-C';
        }
        const finalCategory = canonicalHeadCategory(resolvedCategory);

        // Duplicate Check against Database (only for user-specified IDs from file)
        if (!wasAppIdAuto) {
          if (existingAppIds.has(rawAppId.toLowerCase())) {
            rowErrList.push(`Application ID "${rawAppId}" already exists in the system database.`);
            errors.push({
              rowNumber,
              field: 'Application ID',
              message: `Duplicate ID "${rawAppId}" already exists in system`
            });
          } else if (fileAppIds.has(rawAppId.toLowerCase())) {
            rowErrList.push(`Duplicate Application ID "${rawAppId}" found multiple times in this file.`);
            errors.push({
              rowNumber,
              field: 'Application ID',
              message: `Duplicate ID "${rawAppId}" repeated in file`
            });
          } else {
            fileAppIds.add(rawAppId.toLowerCase());
          }
        }

        if (!wasCodeAuto) {
          if (existingCodes.has(rawCode.toLowerCase())) {
            rowErrList.push(`Project Code "${rawCode}" already exists in the system database.`);
            errors.push({
              rowNumber,
              field: 'Project Code',
              message: `Duplicate Code "${rawCode}" already exists in system`
            });
          } else if (fileCodes.has(rawCode.toLowerCase())) {
            rowErrList.push(`Duplicate Project Code "${rawCode}" found multiple times in this file.`);
            errors.push({
              rowNumber,
              field: 'Project Code',
              message: `Duplicate Code "${rawCode}" repeated in file`
            });
          } else {
            fileCodes.add(rawCode.toLowerCase());
          }
        }

        // If no errors, create Project model
        if (rowErrList.length === 0) {
          const newProject: Project = {
            id: `proj-import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${index}`,
            title: rawSolutionName,
            solutionName: rawSolutionName,
            description: rawOverview,
            projectOverview: rawOverview,
            problemStatement: rawProblem,
            solutionSummary: rawSolution,
            applicationId: rawAppId,
            projectCode: rawCode,
            applicationType: finalAppType,
            headCategory: finalCategory,
            teamOrOrgName: rawTeam,
            representativeName: rawRep,
            email: rawEmail || 'contact@biin.org',
            contactNumber: rawContact || 'N/A',
            tags: [finalCategory, finalAppType].filter(Boolean),
            status: 'active'
          };
          parsedValid.push(newProject);
        }
      });

      setValidProjects(parsedValid);
      setRowErrors(errors);
      setProcessed(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setColumnErrors([`Failed to read Excel file: ${msg}`]);
      setProcessed(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (validProjects.length > 0) {
      onImport(validProjects);

      // Keep local session projects updated so subsequent imports in this modal detect duplicates accurately
      setSessionProjects(prev => [...prev, ...validProjects]);
      setSessionImportedTotal(prev => prev + validProjects.length);

      const targetLabel = `${selectedAppType} — ${activeCategoryObj?.name || selectedHeadCategory}`;

      setLastImportedCount(validProjects.length);
      setLastImportedTarget(targetLabel);

      // Clear current file processing states
      setValidProjects([]);
      setTotalRows(0);
      setRowErrors([]);
      setColumnErrors([]);
      setProcessed(false);
      setFileName(null);
      setCurrentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrepareNextImport = () => {
    setLastImportedCount(null);
    setLastImportedTarget('');
    setProcessed(false);
    setFileName(null);
    setCurrentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSafeClose = () => {
    if (validProjects.length > 0) {
      handleConfirmImport();
    }
    onClose();
  };

  const failedRowCount = new Set(rowErrors.map(e => e.rowNumber)).size;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Category-Wise Excel Import</span>
                {sessionImportedTotal > 0 && (
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                    {sessionImportedTotal} imported
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import dedicated Excel files per Application Type & Head Category
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="hidden sm:inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Download tailored sample spreadsheet for this category"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Template</span>
            </button>
            <button
              onClick={handleSafeClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 touch-scroll">

          {/* Success Screen after an import */}
          {lastImportedCount !== null && (
            <div className="rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-6 space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  Successfully Imported {lastImportedCount} Project{lastImportedCount !== 1 ? 's' : ''}!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Assigned to <strong className="text-emerald-700 dark:text-emerald-400">{lastImportedTarget}</strong> and saved to database.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handlePrepareNextImport}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Import Another Category / File</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 px-5 py-2.5 text-xs font-semibold transition-colors"
                >
                  <span>Done & View All Projects</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Select Application Type & Head Category */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">1</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Application Type & Head Category
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Matches your category-specific Excel sheet
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Application Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Application Type
                </label>
                <select
                  value={selectedAppType}
                  onChange={e => setSelectedAppType(e.target.value as ApplicationType)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="All Application Types">All Application Types</option>
                  <option value="Student">Student</option>
                  <option value="Student -Tertiary (University Level)">Student -Tertiary (University Level)</option>
                  <option value="Organization">Organization</option>
                  <option value="Individual/Group">Individual/Group</option>
                </select>
              </div>

              {/* Head Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Head Category
                </label>
                <select
                  value={selectedHeadCategory}
                  onChange={e => setSelectedHeadCategory(e.target.value as HeadCategoryCode)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="All Head Category">All Head Category (Auto-detect from file)</option>
                  <option value="HC-C">Consumer</option>
                  <option value="HC-BS">Business Services</option>
                  <option value="HC-I">Industrial</option>
                  <option value="HC-PSG">Public Sector and Government</option>
                  <option value="HC-ICS">Individual & Communication Services</option>
                </select>
              </div>
            </div>

            {/* Target Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Active Import Target:</span>
                <span className="inline-flex items-center space-x-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {activeTypeObj && React.createElement(activeTypeObj.icon, { className: 'h-3.5 w-3.5' })}
                  <span>{selectedAppType}</span>
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="inline-flex items-center space-x-1 font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{activeCategoryObj?.name || selectedHeadCategory}</span>
                </span>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Download className="h-3 w-3" />
                <span>Download Sample Template</span>
              </button>
            </div>
          </div>

          {/* STEP 2: Upload Excel File */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">2</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Upload Category Spreadsheet (.xlsx, .xls, .csv)
              </span>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-7 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-950/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                onClick={e => { (e.currentTarget as HTMLInputElement).value = ''; }}
                className="hidden"
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2.5">
                <Upload className="h-6 w-6" />
              </div>
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                {fileName ? fileName : 'Choose your category Excel spreadsheet or drag and drop here'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Required: <span className="font-semibold text-slate-800 dark:text-slate-200">Solution Name (or Project Name / Title)</span> · Optional: <span className="font-medium text-slate-600 dark:text-slate-300">Project Overview, Problem Statement, Solution Summary, Application Type, Head Category</span>
              </p>
              <button
                type="button"
                className="mt-3 inline-flex items-center space-x-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
              >
                <span>Browse File</span>
              </button>
            </div>
          </div>

          {/* Spinner during processing */}
          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 py-4 text-xs text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
              <span>Parsing and validating spreadsheet data...</span>
            </div>
          )}

          {/* Column Errors (Missing Header Block) */}
          {columnErrors.length > 0 && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 space-y-2">
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Column Validation Failed</span>
              </div>
              {columnErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-300 leading-relaxed pl-6">
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Import Summary Results */}
          {processed && columnErrors.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">3</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Validation & Review
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Target: <strong className="text-slate-700 dark:text-slate-300">{selectedAppType}</strong> / <strong className="text-slate-700 dark:text-slate-300">{activeCategoryObj?.name || selectedHeadCategory}</strong>
                </span>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3.5 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Rows</p>
                  <p className="font-heading text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalRows}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-3.5 border border-emerald-200 dark:border-emerald-700/60 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ready to Import</p>
                  <p className="font-heading text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{validProjects.length}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3.5 border border-rose-200 dark:border-rose-700/60 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Failed Rows</p>
                  <p className="font-heading text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{failedRowCount}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3.5 border border-amber-200 dark:border-amber-700/60 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Total Issues</p>
                  <p className="font-heading text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{rowErrors.length}</p>
                </div>
              </div>

              {/* Validation Errors Box */}
              {rowErrors.length > 0 && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-2.5">
                  <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>Row Validation Errors ({rowErrors.length} issues found)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    The rows listed below contain errors or duplicate identifiers and will be skipped. Valid rows can still be imported.
                  </p>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-2 pt-1 font-mono text-[11px]">
                    {rowErrors.map((err, idx) => (
                      <div key={idx} className="flex items-start space-x-2 rounded-lg bg-white dark:bg-slate-900 p-2 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-300">
                        <span className="font-bold shrink-0 text-slate-500">Row {err.rowNumber}:</span>
                        <span className="font-semibold shrink-0 text-slate-700 dark:text-slate-300">[{err.field}]</span>
                        <span className="truncate">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready Projects Preview & Immediate Action */}
              {validProjects.length > 0 && (
                <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-600 dark:bg-emerald-700 p-3.5 rounded-xl text-white">
                    <div>
                      <div className="flex items-center space-x-2 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>{validProjects.length} Project{validProjects.length !== 1 ? 's' : ''} Ready to Import</span>
                      </div>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        Target: {selectedAppType} · {activeCategoryObj?.name || selectedHeadCategory}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="inline-flex items-center justify-center space-x-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-2.5 font-extrabold text-xs shadow-lg transition-transform hover:scale-105 shrink-0"
                    >
                      <Check className="h-4 w-4" />
                      <span>Import Now</span>
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {validProjects.slice(0, 5).map((p, idx) => {
                      const hcName = HEAD_CATEGORIES.find(h => h.code === p.headCategory)?.name || p.headCategory;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-emerald-100 dark:border-emerald-900/30">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{p.applicationId} · {p.projectCode} · {p.teamOrOrgName}</p>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0 text-[10px] font-bold">
                            <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 border border-indigo-200 dark:border-indigo-800">
                              {p.applicationType}
                            </span>
                            <span className="rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 border border-cyan-200 dark:border-cyan-800">
                              {hcName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {validProjects.length > 5 && (
                      <p className="text-center text-[11px] text-slate-500 pt-1 italic">
                        + {validProjects.length - 5} more valid projects
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleSafeClose}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 min-h-[40px] text-center"
          >
            {sessionImportedTotal > 0 ? 'Close & View Projects' : 'Cancel'}
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {validProjects.length > 0 && (
              <button
                onClick={handleConfirmImport}
                className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform min-h-[40px]"
              >
                <Check className="h-4 w-4" />
                <span>Import {validProjects.length} Valid Project{validProjects.length !== 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

