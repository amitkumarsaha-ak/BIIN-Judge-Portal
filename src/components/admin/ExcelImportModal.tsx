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
  { match: ['student'], target: 'Student' },
  { match: ['student-tertiary', 'student tertiary', 'student-tertiary categories (university level)', 'university level', 'tertiary'], target: 'Student-Tertiary' },
  { match: ['organisation', 'organization', 'org'], target: 'Organisation' },
  { match: ['individual or group', 'individual/group', 'individual', 'group'], target: 'Individual or Group' }
];

const VALID_HEAD_CATEGORIES: { match: string[]; code: HeadCategoryCode }[] = [
  { match: ['hc-c', 'consumer', 'consumer tech', 'consumer solutions'], code: 'HC-C' },
  { match: ['hc-i', 'industrial', 'industrial tech', 'robotics'], code: 'HC-I' },
  { match: ['hc-bs', 'business service', 'business services', 'business'], code: 'HC-BS' },
  { match: ['hc-ics', 'inclusion & community service', 'community & social', 'inclusion', 'community', 'social'], code: 'HC-ICS' },
  { match: ['hc-psg', 'public sector and government', 'public sector', 'government'], code: 'HC-PSG' }
];

const APPLICATION_TYPE_OPTIONS: { id: ApplicationType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'Organisation', label: 'Organisation', icon: Building2 },
  { id: 'Individual or Group', label: 'Individual or Group', icon: Users },
  { id: 'Student', label: 'Student', icon: GraduationCap },
  { id: 'Student-Tertiary', label: 'Student-Tertiary Categories (University Level)', icon: University },
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
  return null;
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
  // Default to initial props if passed, else default to 'Organisation' and 'HC-C'
  const [selectedAppType, setSelectedAppType] = useState<ApplicationType | 'auto'>(
    initialAppType || 'Organisation'
  );
  const [selectedHeadCategory, setSelectedHeadCategory] = useState<HeadCategoryCode | 'auto'>(
    initialCategory || 'HC-C'
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
    const appTypeLabel = selectedAppType === 'auto'
      ? 'Organisation'
      : (selectedAppType === 'Student-Tertiary' ? 'Student-Tertiary Categories (University Level)' : selectedAppType);
    
    const headCatName = selectedHeadCategory === 'auto'
      ? 'Consumer'
      : (activeCategoryObj?.name || 'Consumer');

    const headCatCode = selectedHeadCategory === 'auto' ? 'HC-C' : selectedHeadCategory;

    const sampleData = [
      {
        'Application Type': appTypeLabel,
        'Head Category': headCatName,
        'Project Title': selectedHeadCategory === 'HC-BS'
          ? 'OmniLedger Enterprise Audit Hub'
          : selectedHeadCategory === 'HC-I'
          ? 'VibraGuard Predictive Machinery Monitor'
          : selectedHeadCategory === 'HC-ICS'
          ? 'VoiceBridge Assistive Sign Communicator'
          : selectedHeadCategory === 'HC-PSG'
          ? 'SmartMunicipality Citizen Service Portal'
          : 'Smart AgriSense - Portable Soil Scanner',
        'Application ID': `BIIN-2026-${headCatCode.replace('HC-', '')}-101`,
        'Project Code': `${appTypeLabel.slice(0, 3).toUpperCase()}-${headCatCode}-101`,
        'Team/Organization': 'NextGen Innovators Ltd.',
        'Representative': 'Aria Chen',
        'Email': 'contact@innovators.org',
        'Contact Number': '+1 555-0192',
        'Description': `An innovative ${headCatName} solution engineered for high impact and scalable deployment.`
      },
      {
        'Application Type': appTypeLabel,
        'Head Category': headCatName,
        'Project Title': selectedHeadCategory === 'HC-BS'
          ? 'SynapseHR Automated Payroll & Tax Engine'
          : selectedHeadCategory === 'HC-I'
          ? 'RoboWeld Autonomous Quality Inspection'
          : selectedHeadCategory === 'HC-ICS'
          ? 'BrailleFlow Digital Reader for Visually Impaired'
          : selectedHeadCategory === 'HC-PSG'
          ? 'GovVerify Secure Identity Verification Gateway'
          : 'EcoTrack Smart Urban Waste Management',
        'Application ID': `BIIN-2026-${headCatCode.replace('HC-', '')}-102`,
        'Project Code': `${appTypeLabel.slice(0, 3).toUpperCase()}-${headCatCode}-102`,
        'Team/Organization': 'Alpha Matrix Tech',
        'Representative': 'Marcus Vance',
        'Email': 'm.vance@alphamatrix.io',
        'Contact Number': '+1 555-0144',
        'Description': `Comprehensive AI-driven system operating in the ${headCatName} domain.`
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 38 }, // Application Type
      { wch: 26 }, // Head Category
      { wch: 38 }, // Project Title
      { wch: 18 }, // Application ID
      { wch: 18 }, // Project Code
      { wch: 28 }, // Team/Organization
      { wch: 22 }, // Representative
      { wch: 26 }, // Email
      { wch: 18 }, // Contact Number
      { wch: 55 }  // Description
    ];

    const workbook = XLSX.utils.book_new();
    const sheetTitle = selectedHeadCategory !== 'auto' ? headCatCode : 'Projects_Template';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

    const safeTypeName = selectedAppType === 'auto' ? 'General' : selectedAppType.replace(/[^a-zA-Z0-9]/g, '_');
    const safeCatName = selectedHeadCategory === 'auto' ? 'All_Categories' : headCatName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileNameDownload = `BIIN_Template_${safeTypeName}_${safeCatName}.xlsx`;

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
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        setColumnErrors(['The uploaded sheet contains no data rows.']);
        setIsProcessing(false);
        setProcessed(true);
        return;
      }

      setTotalRows(rawRows.length);

      // Verify and normalize headers
      const sampleRow = rawRows[0];
      const headerKeys = Object.keys(sampleRow);

      const findKey = (possibleNames: string[]) => {
        return headerKeys.find(k => {
          const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return possibleNames.some(p => clean === p.toLowerCase().replace(/[^a-z0-9]/g, ''));
        });
      };

      const keyAppType = findKey(['Application Type', 'ApplicationType', 'App Type', 'Type', 'AppType']);
      const keyHeadCat = findKey(['Head Category', 'HeadCategory', 'Category', 'Category Code', 'Category Name', 'HeadCat']);
      const keyTitle = findKey(['Project Title', 'Title', 'Project Name', 'Project', 'Application Name', 'Name']);
      const keyAppId = findKey(['Application ID', 'ApplicationId', 'App ID', 'AppId', 'Application No', 'App No', 'ID']);
      const keyProjCode = findKey(['Project Code', 'ProjectCode', 'Code', 'Serial', 'Serial No', 'SL']);
      const keyTeam = findKey(['Team/Organization', 'Team / Organization', 'Team', 'Organization', 'Company', 'Institution', 'TeamOrOrgName', 'Participant', 'Participant Name']);
      const keyRep = findKey(['Representative', 'Representative Name', 'Lead', 'Leader', 'Member Name', 'Student Name', 'Contact Person']);
      const keyEmail = findKey(['Email', 'Email Address', 'Contact Email', 'E-mail']);
      const keyContact = findKey(['Contact Number', 'Contact', 'Phone', 'Phone Number', 'Mobile', 'Mobile Number']);
      const keyDesc = findKey(['Description', 'Project Description', 'Summary', 'Details', 'About', 'Abstract']);

      const missingColumns: string[] = [];

      // If Application Type is not forced via dropdown, it must be present in the sheet
      if (selectedAppType === 'auto' && !keyAppType) {
        missingColumns.push('Application Type (or select one in the Target dropdown)');
      }

      // If Head Category is not forced via dropdown, it must be present in the sheet
      if (selectedHeadCategory === 'auto' && !keyHeadCat) {
        missingColumns.push('Head Category (or select one in the Target dropdown)');
      }

      if (!keyTitle) missingColumns.push('Project Title');
      if (!keyAppId) missingColumns.push('Application ID');
      if (!keyProjCode) missingColumns.push('Project Code');
      if (!keyTeam) missingColumns.push('Team/Organization');
      if (!keyRep) missingColumns.push('Representative');
      if (!keyDesc) missingColumns.push('Description');

      if (missingColumns.length > 0) {
        setColumnErrors([
          `Missing required columns: ${missingColumns.join(', ')}. You can either pre-select the category above or ensure these column headers exist in your Excel file.`
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

      rawRows.forEach((row, index) => {
        const rowNumber = index + 2; // +2 for 1-based index and header row
        const rowErrList: string[] = [];

        const rawTitle = normalizeStr(row[keyTitle!]);
        const rawAppId = normalizeStr(row[keyAppId!]);
        const rawCode = normalizeStr(row[keyProjCode!]);
        const rawAppType = keyAppType ? normalizeStr(row[keyAppType]) : '';
        const rawHeadCat = keyHeadCat ? normalizeStr(row[keyHeadCat]) : '';
        const rawTeam = normalizeStr(row[keyTeam!]);
        const rawRep = normalizeStr(row[keyRep!]);
        const rawEmail = keyEmail ? normalizeStr(row[keyEmail]) : '';
        const rawContact = keyContact ? normalizeStr(row[keyContact]) : '';
        const rawDesc = normalizeStr(row[keyDesc!]);

        // Required text checks
        if (!rawTitle) {
          rowErrList.push('Project Title is required.');
          errors.push({ rowNumber, field: 'Project Title', message: 'Title is missing or empty' });
        }
        if (!rawAppId) {
          rowErrList.push('Application ID is required.');
          errors.push({ rowNumber, field: 'Application ID', message: 'Application ID is missing or empty' });
        }
        if (!rawCode) {
          rowErrList.push('Project Code is required.');
          errors.push({ rowNumber, field: 'Project Code', message: 'Project Code is missing or empty' });
        }
        if (!rawTeam) {
          rowErrList.push('Team/Organization is required.');
          errors.push({ rowNumber, field: 'Team/Organization', message: 'Team or organization name is missing' });
        }
        if (!rawRep) {
          rowErrList.push('Representative is required.');
          errors.push({ rowNumber, field: 'Representative', message: 'Representative name is missing' });
        }
        if (!rawDesc) {
          rowErrList.push('Description is required.');
          errors.push({ rowNumber, field: 'Description', message: 'Project description is missing' });
        }

        // Determine Application Type (Selected dropdown overrides or defaults, otherwise detect from row)
        let resolvedAppType: ApplicationType | null = null;
        if (selectedAppType !== 'auto') {
          resolvedAppType = selectedAppType;
        } else if (rawAppType) {
          resolvedAppType = mapApplicationType(rawAppType);
        }

        if (!resolvedAppType) {
          rowErrList.push(`Invalid or missing Application Type "${rawAppType}". Expected: Student, Student-Tertiary, Organisation, or Individual or Group.`);
          errors.push({
            rowNumber,
            field: 'Application Type',
            message: `Unrecognized or missing type "${rawAppType}"`
          });
        }

        // Determine Head Category (Selected dropdown overrides or defaults, otherwise detect from row)
        let resolvedCategory: HeadCategoryCode | null = null;
        if (selectedHeadCategory !== 'auto') {
          resolvedCategory = selectedHeadCategory;
        } else if (rawHeadCat) {
          resolvedCategory = mapHeadCategory(rawHeadCat);
        }

        if (!resolvedCategory) {
          rowErrList.push(`Invalid or missing Head Category "${rawHeadCat}". Expected: Consumer, Industrial, Business Service, Inclusion & Community Service, or Public Sector.`);
          errors.push({
            rowNumber,
            field: 'Head Category',
            message: `Unrecognized or missing category "${rawHeadCat}"`
          });
        }

        // Duplicate Check against Database
        if (rawAppId && existingAppIds.has(rawAppId.toLowerCase())) {
          rowErrList.push(`Application ID "${rawAppId}" already exists in the system database.`);
          errors.push({
            rowNumber,
            field: 'Application ID',
            message: `Duplicate ID "${rawAppId}" already exists in system`
          });
        }
        if (rawCode && existingCodes.has(rawCode.toLowerCase())) {
          rowErrList.push(`Project Code "${rawCode}" already exists in the system database.`);
          errors.push({
            rowNumber,
            field: 'Project Code',
            message: `Duplicate Code "${rawCode}" already exists in system`
          });
        }

        // Duplicate Check within the File
        if (rawAppId) {
          if (fileAppIds.has(rawAppId.toLowerCase())) {
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

        if (rawCode) {
          if (fileCodes.has(rawCode.toLowerCase())) {
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
        if (rowErrList.length === 0 && resolvedAppType && resolvedCategory) {
          const newProject: Project = {
            id: `proj-import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: rawTitle,
            applicationId: rawAppId,
            projectCode: rawCode,
            applicationType: resolvedAppType,
            headCategory: resolvedCategory,
            teamOrOrgName: rawTeam,
            representativeName: rawRep,
            email: rawEmail || '',
            contactNumber: rawContact || '',
            description: rawDesc,
            tags: [resolvedCategory, resolvedAppType],
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

      const targetLabel = `${selectedAppType === 'auto' ? 'Mixed' : selectedAppType} — ${
        selectedHeadCategory === 'auto' ? 'Mixed' : (activeCategoryObj?.name || selectedHeadCategory)
      }`;

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
              onClick={onClose}
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
                  onChange={e => setSelectedAppType(e.target.value as ApplicationType | 'auto')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Organisation">Organisation (Corporate & Startups)</option>
                  <option value="Individual or Group">Individual or Group (Independent)</option>
                  <option value="Student">Student (Academic)</option>
                  <option value="Student-Tertiary">Student-Tertiary Categories (University Level)</option>
                  <option value="auto">Auto-detect from file column</option>
                </select>
              </div>

              {/* Head Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Head Category
                </label>
                <select
                  value={selectedHeadCategory}
                  onChange={e => setSelectedHeadCategory(e.target.value as HeadCategoryCode | 'auto')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  {HEAD_CATEGORIES.map(cat => (
                    <option key={cat.code} value={cat.code}>
                      {cat.code} — {cat.name}
                    </option>
                  ))}
                  <option value="auto">Auto-detect from file column</option>
                </select>
              </div>
            </div>

            {/* Target Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Active Import Target:</span>
                <span className="inline-flex items-center space-x-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {activeTypeObj && React.createElement(activeTypeObj.icon, { className: 'h-3.5 w-3.5' })}
                  <span>{selectedAppType === 'auto' ? 'Auto-Detect Type' : selectedAppType}</span>
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="inline-flex items-center space-x-1 font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{selectedHeadCategory === 'auto' ? 'Auto-Detect Category' : `${selectedHeadCategory} (${activeCategoryObj?.name})`}</span>
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
                className="hidden"
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2.5">
                <Upload className="h-6 w-6" />
              </div>
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                {fileName ? fileName : 'Choose your category Excel spreadsheet or drag and drop here'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Required columns: <span className="font-medium text-slate-700 dark:text-slate-300">Project Title, Application ID, Project Code, Team/Organization, Representative, Description</span>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {selectedAppType !== 'auto' && selectedHeadCategory !== 'auto'
                  ? `(Category columns are optional — all projects will be assigned to ${selectedAppType} / ${activeCategoryObj?.name})`
                  : '(Spreadsheet must include columns for Application Type and Head Category)'}
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

              {/* Ready Projects Preview */}
              {validProjects.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Valid Projects Ready For Ingestion ({validProjects.length})</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Destination: {selectedAppType} · {selectedHeadCategory}
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {validProjects.slice(0, 5).map((p, idx) => (
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
                            {p.headCategory}
                          </span>
                        </div>
                      </div>
                    ))}
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
            onClick={onClose}
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

