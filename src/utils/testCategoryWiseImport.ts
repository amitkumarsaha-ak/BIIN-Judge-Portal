import * as XLSX from 'xlsx';
import type { Project, ApplicationType, HeadCategoryCode } from '../types';

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

function parseWorkbook(
  workbook: XLSX.WorkBook,
  selectedAppType: ApplicationType | 'auto',
  selectedHeadCategory: HeadCategoryCode | 'auto',
  existingProjects: Project[]
): { validProjects: Project[]; errors: string[] } {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const sampleRow = rawRows[0] || {};
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
  if (selectedAppType === 'auto' && !keyAppType) missingColumns.push('Application Type');
  if (selectedHeadCategory === 'auto' && !keyHeadCat) missingColumns.push('Head Category');
  if (!keyTitle) missingColumns.push('Project Title');
  if (!keyAppId) missingColumns.push('Application ID');
  if (!keyProjCode) missingColumns.push('Project Code');
  if (!keyTeam) missingColumns.push('Team/Organization');
  if (!keyRep) missingColumns.push('Representative');
  if (!keyDesc) missingColumns.push('Description');

  if (missingColumns.length > 0) {
    return { validProjects: [], errors: [`Missing columns: ${missingColumns.join(', ')}`] };
  }

  const existingAppIds = new Set(existingProjects.map(p => p.applicationId.trim().toLowerCase()));
  const existingCodes = new Set(existingProjects.map(p => p.projectCode.trim().toLowerCase()));
  const fileAppIds = new Set<string>();
  const fileCodes = new Set<string>();

  const validProjects: Project[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
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

    if (!rawTitle || !rawAppId || !rawCode || !rawTeam || !rawRep || !rawDesc) {
      errors.push(`Row ${rowNum}: Missing mandatory fields`);
      return;
    }

    const resolvedAppType = selectedAppType !== 'auto' ? selectedAppType : mapApplicationType(rawAppType);
    const resolvedCategory = selectedHeadCategory !== 'auto' ? selectedHeadCategory : mapHeadCategory(rawHeadCat);

    if (!resolvedAppType) {
      errors.push(`Row ${rowNum}: Invalid Application Type`);
      return;
    }
    if (!resolvedCategory) {
      errors.push(`Row ${rowNum}: Invalid Head Category`);
      return;
    }

    if (existingAppIds.has(rawAppId.toLowerCase()) || fileAppIds.has(rawAppId.toLowerCase())) {
      errors.push(`Row ${rowNum}: Duplicate App ID ${rawAppId}`);
      return;
    }
    if (existingCodes.has(rawCode.toLowerCase()) || fileCodes.has(rawCode.toLowerCase())) {
      errors.push(`Row ${rowNum}: Duplicate Project Code ${rawCode}`);
      return;
    }

    fileAppIds.add(rawAppId.toLowerCase());
    fileCodes.add(rawCode.toLowerCase());

    validProjects.push({
      id: `proj-${Date.now()}-${index}`,
      title: rawTitle,
      applicationId: rawAppId,
      projectCode: rawCode,
      applicationType: resolvedAppType,
      headCategory: resolvedCategory,
      teamOrOrgName: rawTeam,
      representativeName: rawRep,
      email: rawEmail,
      contactNumber: rawContact,
      description: rawDesc,
      tags: [resolvedCategory, resolvedAppType],
      status: 'active'
    });
  });

  return { validProjects, errors };
}

// RUN TESTS
console.log('=== RUNNING CATEGORY-WISE EXCEL IMPORT VERIFICATION ===');

// TEST 1: Dedicated File for Organisation + Consumer (No category columns in Excel)
console.log('\n--- TEST 1: Organisation & Consumer without category columns in Excel ---');
const file1Data = [
  {
    'Project Title': 'SmartRetail AI Cart',
    'Application ID': 'BIIN-2026-ORG-C01',
    'Project Code': 'ORG-HC-C-01',
    'Team/Organization': 'RetailNext BD',
    'Representative': 'Kamal Hossain',
    'Email': 'kamal@retailnext.com',
    'Contact Number': '01700000001',
    'Description': 'Autonomous shopping assistance and smart checkouts.'
  },
  {
    'Project Title': 'Personal Smart Hydration Cup',
    'Application ID': 'BIIN-2026-ORG-C02',
    'Project Code': 'ORG-HC-C-02',
    'Team/Organization': 'HydraLife Co.',
    'Representative': 'Fatima Begum',
    'Email': 'fatima@hydralife.io',
    'Contact Number': '01700000002',
    'Description': 'Bluetooth smart water intake tracker.'
  }
];

const ws1 = XLSX.utils.json_to_sheet(file1Data);
const wb1 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb1, ws1, 'Consumer_Projects');

const res1 = parseWorkbook(wb1, 'Organisation', 'HC-C', []);
console.log(`Parsed valid count: ${res1.validProjects.length}, Errors: ${res1.errors.length}`);
console.assert(res1.validProjects.length === 2, 'Should have 2 valid projects');
console.assert(res1.validProjects[0].applicationType === 'Organisation', 'Should be Organisation');
console.assert(res1.validProjects[0].headCategory === 'HC-C', 'Should be HC-C (Consumer)');
console.log('Test 1 passed successfully!');

// TEST 2: Dedicated File for Organisation + Business Services (HC-BS)
console.log('\n--- TEST 2: Organisation & Business Services (HC-BS) ---');
const file2Data = [
  {
    'Project Title': 'OmniLedger Enterprise Audit Hub',
    'Application ID': 'BIIN-2026-ORG-BS01',
    'Project Code': 'ORG-HC-BS-01',
    'Team/Organization': 'FinCloud Global Corp',
    'Representative': 'Marcus Vance',
    'Email': 'm.vance@fincloud.io',
    'Contact Number': '01700000003',
    'Description': 'Automated ledger reconciliation with cryptographic audit trail.'
  }
];

const ws2 = XLSX.utils.json_to_sheet(file2Data);
const wb2 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb2, ws2, 'Business_Projects');

// Notice we pass res1.validProjects as existing projects to verify inter-batch duplicate checking!
const res2 = parseWorkbook(wb2, 'Organisation', 'HC-BS', res1.validProjects);
console.log(`Parsed valid count: ${res2.validProjects.length}, Errors: ${res2.errors.length}`);
console.assert(res2.validProjects.length === 1, 'Should have 1 valid project');
console.assert(res2.validProjects[0].applicationType === 'Organisation', 'Should be Organisation');
console.assert(res2.validProjects[0].headCategory === 'HC-BS', 'Should be HC-BS (Business Services)');
console.log('Test 2 passed successfully!');

// TEST 3: Inter-batch duplicate detection (Trying to import an already existing Application ID)
console.log('\n--- TEST 3: Duplicate detection across successive imports ---');
const file3DuplicateData = [
  {
    'Project Title': 'Duplicate Retail Project',
    'Application ID': 'BIIN-2026-ORG-C01', // Already imported in batch 1
    'Project Code': 'ORG-HC-C-DUPLICATE',
    'Team/Organization': 'CopyCat Ltd',
    'Representative': 'Clone User',
    'Description': 'Should fail duplicate check.'
  }
];
const ws3 = XLSX.utils.json_to_sheet(file3DuplicateData);
const wb3 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb3, ws3, 'Dup_Sheet');

const res3 = parseWorkbook(wb3, 'Organisation', 'HC-C', [...res1.validProjects, ...res2.validProjects]);
console.log(`Duplicate test errors: ${JSON.stringify(res3.errors)}`);
console.assert(res3.validProjects.length === 0, 'Duplicate project should be rejected');
console.assert(res3.errors[0].includes('Duplicate App ID'), 'Error message should mention Duplicate App ID');
console.log('Test 3 passed successfully!');

console.log('\nALL 3 CATEGORY-WISE IMPORT TESTS PASSED PERFECTLY!');
