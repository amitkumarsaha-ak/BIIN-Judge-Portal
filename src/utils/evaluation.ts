import type {
  ApplicationType,
  CriteriaInfo,
  EvaluationScores,
  Evaluation,
  Project,
  AwardDesignation,
  CombinedProjectResult,
  JudgeScoreBreakdown
} from '../types';

export const STUDENT_CRITERIA: CriteriaInfo[] = [
  {
    key: 'uniqueness',
    label: 'Uniqueness',
    maxScore: 10,
    description: 'Evaluates novelty, innovative architecture, intellectual property, and original differentiation.',
    iconName: 'Sparkles'
  },
  {
    key: 'proofOfConcept',
    label: 'Proof of Concept',
    maxScore: 10,
    description: 'Assesses working prototype maturity, technical execution, benchmark validation, and functional viability.',
    iconName: 'Cpu'
  },
  {
    key: 'features',
    label: 'Functionalities and Features',
    maxScore: 10,
    description: 'Measures breadth, depth, usability, and effectiveness of implemented feature sets.',
    iconName: 'Layers'
  },
  {
    key: 'quality',
    label: 'Quality',
    maxScore: 10,
    description: 'Inspects code standards, systemic stability, security protocols, modern design elegance, and user experience.',
    iconName: 'ShieldCheck'
  },
  {
    key: 'presentation',
    label: 'Presentation',
    maxScore: 10,
    description: 'Rates clarity of demonstration, technical documentation completeness, pitch delivery, and team Q&A accuracy.',
    iconName: 'Presentation'
  }
];

export const STUDENT_TERTIARY_CRITERIA: CriteriaInfo[] = [
  {
    key: 'uniqueness',
    label: 'Uniqueness',
    maxScore: 10,
    description: 'Evaluates novelty, innovative architecture, intellectual property, and original differentiation.',
    iconName: 'Sparkles'
  },
  {
    key: 'proofOfConcept',
    label: 'Proof of Concept',
    maxScore: 10,
    description: 'Assesses working prototype maturity, technical execution, benchmark validation, and functional viability.',
    iconName: 'Cpu'
  },
  {
    key: 'features',
    label: 'Functionalities and Features',
    maxScore: 10,
    description: 'Measures breadth, depth, usability, and effectiveness of implemented feature sets.',
    iconName: 'Layers'
  },
  {
    key: 'quality',
    label: 'Quality',
    maxScore: 10,
    description: 'Inspects code standards, systemic stability, security protocols, modern design elegance, and user experience.',
    iconName: 'ShieldCheck'
  },
  {
    key: 'presentation',
    label: 'Presentation',
    maxScore: 10,
    description: 'Rates clarity of demonstration, technical documentation completeness, pitch delivery, and team Q&A accuracy.',
    iconName: 'Presentation'
  }
];

export const ORGANISATION_AND_INDIVIDUAL_CRITERIA: CriteriaInfo[] = [
  {
    key: 'uniqueness',
    label: 'Uniqueness',
    maxScore: 10,
    description: 'Evaluates novelty, innovative architecture, intellectual property, and original differentiation.',
    iconName: 'Sparkles'
  },
  {
    key: 'publicOrGovValue',
    label: 'Public or Government Value',
    maxScore: 10,
    description: 'Assesses public utility, government policy alignment, citizen benefits, social impact, and public sector value.',
    iconName: 'Landmark'
  },
  {
    key: 'features',
    label: 'Functionalities and Features',
    maxScore: 10,
    description: 'Measures breadth, depth, usability, and effectiveness of implemented feature sets.',
    iconName: 'Layers'
  },
  {
    key: 'qualityTech',
    label: 'Quality & Application of Technology',
    maxScore: 10,
    description: 'Inspects tech stack quality, code standards, systemic stability, security protocols, and engineering execution.',
    iconName: 'ShieldCheck'
  }
];

export const getCriteriaForApplicationType = (type: ApplicationType): CriteriaInfo[] => {
  if (type === 'Student' || type === 'Student-Secondary') {
    return STUDENT_CRITERIA;
  }
  if (type === 'Student-Tertiary' || type === 'Student -Tertiary (University Level)') {
    return STUDENT_TERTIARY_CRITERIA;
  }
  return ORGANISATION_AND_INDIVIDUAL_CRITERIA;
};

export const getMaxRawScoreForApplicationType = (type: ApplicationType): number => {
  const criteria = getCriteriaForApplicationType(type);
  return criteria.reduce((sum, item) => sum + item.maxScore, 0);
};

export const validateCriterionScore = (score: number): { valid: boolean; error?: string } => {
  if (typeof score !== 'number' || isNaN(score)) {
    return { valid: false, error: 'Score must be a valid number.' };
  }
  if (score <= 0) {
    return { valid: false, error: 'Score of 0 or negative is not permitted. Minimum score is 1.' };
  }
  if (score < 1) {
    return { valid: false, error: 'Score must be at least 1 (values < 1 like 0.5 are invalid).' };
  }
  if (score > 10) {
    return { valid: false, error: 'Score cannot exceed maximum limit of 10.' };
  }
  return { valid: true };
};

export const formatScoreNumber = (val: number, maxDecimals: number = 3): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val.toFixed(maxDecimals)).toString();
};

export const calculateRawTotal = (scores: EvaluationScores, criteria: CriteriaInfo[]): number => {
  let sum = 0;
  for (const item of criteria) {
    const val = scores[item.key] ?? 0;
    sum += val;
  }
  return Number((Math.round(sum * 1000) / 1000).toFixed(3));
};

export const calculateConvertedScore = (rawTotal: number, maxRawScore: number): number => {
  if (maxRawScore <= 0) return 0;
  const rawRatio = rawTotal / maxRawScore;
  const converted = rawRatio * 100;
  return Number((Math.round(converted * 1000) / 1000).toFixed(3));
};

import type { HeadCategoryCode } from '../types';

export const RESULT_APPLICATION_TYPES: { id: ApplicationType; title: string; shortTitle: string }[] = [
  { id: 'Student-Secondary', title: 'Student-Secondary', shortTitle: 'Student-Secondary' },
  { id: 'Individual or Group', title: 'Individual/Group', shortTitle: 'Individual/Group' },
  { id: 'Organisation', title: 'Organization', shortTitle: 'Organization' },
  { id: 'Student-Tertiary', title: 'Student-Tertiary (University Level)', shortTitle: 'Student-Tertiary' }
];

export const RESULT_HEAD_CATEGORIES: { code: HeadCategoryCode; name: string }[] = [
  { code: 'HC-C', name: 'Consumer' },
  { code: 'HC-BS', name: 'Business Services' },
  { code: 'HC-I', name: 'Industrial' },
  { code: 'HC-PSG', name: 'Public Sector and Government' },
  { code: 'HC-ICS', name: 'Inclusions & Community' }
];

export const ORG_COMBINED_HEAD_CATEGORY_CODE: HeadCategoryCode = 'HC-PSG-I-C';
export const ORG_COMBINED_HEAD_CATEGORY_NAME = '(Public Sector and Government , Industrial, Consumer)';

export const ORG_HEAD_CATEGORIES: { code: HeadCategoryCode; name: string }[] = [
  { code: 'HC-BS', name: 'Business Services' },
  { code: 'HC-ICS', name: 'Inclusions & Community' },
  { code: ORG_COMBINED_HEAD_CATEGORY_CODE, name: ORG_COMBINED_HEAD_CATEGORY_NAME }
];

export const isOrgCombinedHeadCategory = (cat?: string): boolean => {
  if (!cat) return false;
  const c = cat.toLowerCase().trim();
  if (
    c === 'hc-psg-i-c' ||
    c === 'hc-psg_i_c' ||
    c === 'hc-combined' ||
    c === '(public sector and government , industrial, consumer)' ||
    c === '(public sector and government, industrial, consumer)' ||
    c === 'public sector and government , industrial, consumer' ||
    c === 'public sector and government, industrial, consumer' ||
    c.includes('psg-i-c')
  ) {
    return true;
  }
  if (c.includes('public') && (c.includes('industrial') || c.includes('consumer'))) {
    return true;
  }
  return false;
};

export const isOrgMergedHeadCategory = (cat?: string): boolean => {
  if (!cat) return false;
  if (isOrgCombinedHeadCategory(cat)) return true;
  const canon = canonicalHeadCategory(cat);
  return canon === 'HC-PSG' || canon === 'HC-I' || canon === 'HC-C' || canon === 'HC-PSG-I-C';
};

export const getHeadCategoryDisplayName = (headCategory?: string | null, appType?: string): string => {
  if (!headCategory || headCategory === 'N/A') return 'N/A';
  if (canonicalAppType(appType) === 'Organisation') {
    if (isOrgMergedHeadCategory(headCategory)) {
      return ORG_COMBINED_HEAD_CATEGORY_NAME;
    }
    if (canonicalHeadCategory(headCategory) === 'HC-BS') return 'Business Services';
    if (canonicalHeadCategory(headCategory) === 'HC-ICS') return 'Inclusions & Community';
  }
  const found = RESULT_HEAD_CATEGORIES.find(
    h => h.code === headCategory || h.name.toLowerCase() === headCategory.toLowerCase()
  );
  return found ? found.name : headCategory;
};

export const getHeadCategoriesForAppType = (appType?: string): { code: HeadCategoryCode; name: string }[] => {
  const norm = canonicalAppType(appType);
  if (norm === 'Student-Secondary' || norm === 'Individual or Group') {
    return [];
  }
  if (norm === 'Organisation') {
    return ORG_HEAD_CATEGORIES;
  }
  return RESULT_HEAD_CATEGORIES;
};

export const canonicalAppType = (type?: string): ApplicationType => {
  const t = (type || '').toLowerCase().trim();
  if (t.includes('tertiary') || t === 'student-tertiary') {
    return 'Student-Tertiary';
  }
  if (t === 'student' || t === 'student-secondary' || t.includes('secondary')) {
    return 'Student-Secondary';
  }
  if (t.includes('org')) {
    return 'Organisation';
  }
  if (t.includes('individual') || t.includes('group')) {
    return 'Individual or Group';
  }
  return 'Student-Secondary';
};

export const canonicalHeadCategory = (cat?: string): HeadCategoryCode => {
  const c = (cat || '').toLowerCase().trim();
  if (!c || c === 'n/a' || c === 'none' || c === 'null') return 'N/A';
  if (
    c === 'hc-psg-i-c' ||
    c.includes('psg-i-c') ||
    (c.includes('public') && (c.includes('industrial') || c.includes('consumer')))
  ) {
    return 'HC-PSG-I-C';
  }
  if (c === 'hc-c' || c === 'hc-01' || c === 'hc-1' || c.includes('consumer')) return 'HC-C';
  if (c === 'hc-bs' || c === 'hc-02' || c === 'hc-2' || c.includes('business')) return 'HC-BS';
  if (c === 'hc-i' || c === 'hc-03' || c === 'hc-3' || c.includes('industrial') || c.includes('robot')) return 'HC-I';
  if (c === 'hc-psg' || c === 'hc-04' || c === 'hc-4' || c.includes('public') || c.includes('government') || c.includes('smart city') || c.includes('civic')) return 'HC-PSG';
  if (c === 'hc-ics' || c === 'hc-05' || c === 'hc-5' || c.includes('communication') || c.includes('inclusion') || c.includes('community')) return 'HC-ICS';
  return cat ? (cat.trim() as HeadCategoryCode) : 'HC-C';
};

export const matchesAppType = (projectType?: string, filterType?: string): boolean => {
  if (!filterType || filterType === 'All' || filterType === 'All Application Types') return true;
  if (!projectType || projectType === 'All' || projectType === 'All Application Types') return true;
  if (projectType === filterType) return true;
  return canonicalAppType(projectType) === canonicalAppType(filterType);
};

export const matchesCategory = (
  projectCategory?: string,
  filterCategory?: string,
  projectAppType?: string
): boolean => {
  if (!filterCategory || filterCategory === 'All' || filterCategory === 'All Head Category' || filterCategory === 'All Head Categories') {
    return true;
  }
  const appType = canonicalAppType(projectAppType);
  if (appType === 'Student-Secondary' || appType === 'Individual or Group') {
    return true;
  }
  const pc = (projectCategory || '').toLowerCase().trim();
  const fc = filterCategory.toLowerCase().trim();
  if (!pc || pc === 'all' || pc === 'all head category' || pc === 'all head categories' || pc === 'all categories' || pc === 'all category' || pc === 'n/a' || pc === 'null' || pc === 'none') {
    return true;
  }
  if (pc === fc) return true;

  // Organization unified category matching
  if (appType === 'Organisation') {
    const isFilterMerged = isOrgMergedHeadCategory(filterCategory);
    const isProjMerged = isOrgMergedHeadCategory(projectCategory);
    if (isFilterMerged && isProjMerged) {
      return true;
    }
  }

  return canonicalHeadCategory(projectCategory) === canonicalHeadCategory(filterCategory);
};

/**
 * Base award threshold calculation:
 * - Champion: >= 85%
 * - Winner:   >= 70% (and < 85%)
 * - Merit:    >= 65% (and < 70%)
 * - No Award: < 65%
 */
export const calculateBaseAward = (finalScore: number): 'Champion' | 'Winner' | 'Merit' | 'No Award' => {
  if (finalScore >= 85) {
    return 'Champion';
  }
  if (finalScore >= 70) {
    return 'Winner';
  }
  if (finalScore >= 65) {
    return 'Merit';
  }
  return 'No Award';
};

export const calculateAward = (finalScore: number, _isHighestInCategory?: boolean): AwardDesignation => {
  return calculateBaseAward(finalScore);
};

export const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const getOrdinalWord = (n: number): string => {
  const words = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  return words[n - 1] || `${getOrdinal(n)}`;
};

export const getProjectCombinedResult = (
  project: Project,
  allProjects: Project[],
  allEvaluations: Evaluation[]
): CombinedProjectResult => {
  const projectEvals = allEvaluations.filter((e) => e.projectId === project.id);
  const maxRawScore = getMaxRawScoreForApplicationType(project.applicationType);

  const judgesEvaluations: JudgeScoreBreakdown[] = projectEvals.map((e) => {
    const rawScore = e.rawTotalScore ?? e.totalScore ?? 0;
    const converted = e.convertedScore ?? e.percentage ?? calculateConvertedScore(rawScore, maxRawScore);
    return {
      judgeEmail: e.judgeEmail,
      judgeName: e.judgeName,
      rawScore,
      maxRawScore: e.maxRawScore || maxRawScore,
      convertedScore: converted,
      scores: e.scores,
      feedback: e.feedback,
      submittedAt: e.submittedAt
    };
  });

  let finalAverageScore = 0;
  if (judgesEvaluations.length > 0) {
    const totalConvertedSum = judgesEvaluations.reduce((acc, j) => acc + j.convertedScore, 0);
    finalAverageScore = Number((totalConvertedSum / judgesEvaluations.length).toFixed(2));
  }

  // Determine category pool
  const projectAppType = canonicalAppType(project.applicationType);
  const projectHeadCat = canonicalHeadCategory(project.headCategory);
  const isNoHeadCategory = projectAppType === 'Student-Secondary' || projectAppType === 'Individual or Group';
  const isOrgMerged = projectAppType === 'Organisation' && isOrgMergedHeadCategory(project.headCategory);

  const sameCategoryProjects = allProjects.filter((p) => {
    if (canonicalAppType(p.applicationType) !== projectAppType) return false;
    if (isNoHeadCategory) return true;
    if (isOrgMerged) {
      return isOrgMergedHeadCategory(p.headCategory);
    }
    return canonicalHeadCategory(p.headCategory) === projectHeadCat;
  });

  // Score all projects in the same category to determine rankings and sequenced designations
  const scoredCategoryProjects = sameCategoryProjects.map((p) => {
    const pEvals = allEvaluations.filter((e) => e.projectId === p.id);
    let avg = 0;
    if (pEvals.length > 0) {
      const pMaxRaw = getMaxRawScoreForApplicationType(p.applicationType);
      const sumConverted = pEvals.reduce((acc, e) => {
        const raw = e.rawTotalScore ?? e.totalScore ?? 0;
        const conv = e.convertedScore ?? e.percentage ?? calculateConvertedScore(raw, pMaxRaw);
        return acc + conv;
      }, 0);
      avg = Number((sumConverted / pEvals.length).toFixed(2));
    }
    return { id: p.id, score: avg, evalCount: pEvals.length };
  });

  scoredCategoryProjects.sort((a, b) => b.score - a.score);

  const categoryMaxScore = scoredCategoryProjects[0]?.score ?? 0;
  const isHighestInCategory = finalAverageScore > 0 && Math.abs(finalAverageScore - categoryMaxScore) < 0.001;

  // Exact Award Allocation Logic per Category Pool (12 pools):
  // 1. Exactly 1 Champion max: Highest scorer in category pool, MUST be >= 85%
  // 2. Exactly 1 Winner max: 2nd highest scorer (or 1st if no Champion), MUST be >= 70%
  // 3. Up to 2 Merits max: Next highest scorers with score >= 65% (maximum 2 Merits)
  // 4. No Award: Score < 65% or beyond the top 2 merits
  let championId: string | null = null;
  let winnerId: string | null = null;
  const meritIds: string[] = [];

  for (const item of scoredCategoryProjects) {
    if (item.score <= 0 || item.evalCount === 0) continue;

    // 1 Champion slot: Must be >= 85% and highest in category
    if (!championId && item.score >= 85) {
      championId = item.id;
      continue;
    }

    // 1 Winner slot: 2nd highest (or highest if no Champion), must be >= 70%
    if (!winnerId && item.score >= 70) {
      winnerId = item.id;
      continue;
    }

    // Up to 2 Merits: Next highest with >= 65%
    if (meritIds.length < 2 && item.score >= 65) {
      meritIds.push(item.id);
      continue;
    }
  }

  let baseAward: 'Champion' | 'Winner' | 'Merit' | 'No Award' = 'No Award';
  let awardRank = 'No Award';
  let awardFullTitle = 'No Award';
  let awardSequence = 0;

  if (project.id === championId) {
    baseAward = 'Champion';
    awardRank = 'Champion';
    awardFullTitle = 'Champion';
    awardSequence = 1;
  } else if (project.id === winnerId) {
    baseAward = 'Winner';
    awardRank = 'Winner';
    awardFullTitle = 'Winner';
    awardSequence = 1;
  } else if (meritIds.includes(project.id)) {
    baseAward = 'Merit';
    const meritRank = meritIds.indexOf(project.id) + 1;
    awardSequence = meritRank;
    awardRank = 'Eligible for Merit';
    awardFullTitle = 'Eligible for Merit';
  } else {
    baseAward = 'No Award';
    awardRank = 'No Award';
    awardFullTitle = 'No Award';
    awardSequence = 0;
  }

  const award: AwardDesignation = awardRank as AwardDesignation;

  return {
    project,
    applicationType: project.applicationType,
    judgesEvaluations,
    finalAverageScore,
    award,
    awardRank,
    awardFullTitle,
    awardBase: baseAward,
    awardSequence,
    isHighestInCategory
  };
};

export interface CategoryResultGroup {
  appType: ApplicationType;
  appTypeTitle: string;
  headCategoryCode: HeadCategoryCode;
  headCategoryName: string;
  categoryKey: string;
  totalApplicants: number;
  champions: CombinedProjectResult[];
  winners: CombinedProjectResult[];
  merits: CombinedProjectResult[];
  noAwards: CombinedProjectResult[];
  allResults: CombinedProjectResult[];
}

export const calculateCategorizedResults = (
  allProjects: Project[],
  allEvaluations: Evaluation[]
): CategoryResultGroup[] => {
  const groups: CategoryResultGroup[] = [];

  for (const app of RESULT_APPLICATION_TYPES) {
    if (app.id === 'Student-Secondary' || app.id === 'Individual or Group') {
      const categoryProjects = allProjects.filter((p) => {
        return canonicalAppType(p.applicationType) === app.id;
      });

      const results: CombinedProjectResult[] = categoryProjects.map((p) =>
        getProjectCombinedResult(p, allProjects, allEvaluations)
      );

      results.sort((a, b) => b.finalAverageScore - a.finalAverageScore);

      const champions = results.filter((r) => r.awardBase === 'Champion' || r.award.includes('Champion'));
      const winners = results.filter((r) => r.awardBase === 'Winner' || r.award.includes('Winner'));
      const merits = results.filter((r) => r.awardBase === 'Merit' || r.award.includes('Merit'));
      const noAwards = results.filter((r) => (!r.awardBase || r.awardBase === 'No Award') && !r.award.includes('Champion') && !r.award.includes('Winner') && !r.award.includes('Merit'));

      groups.push({
        appType: app.id,
        appTypeTitle: app.title,
        headCategoryCode: 'N/A' as HeadCategoryCode,
        headCategoryName: 'General (No Head Category)',
        categoryKey: `${app.id}__NA`,
        totalApplicants: results.length,
        champions,
        winners,
        merits,
        noAwards,
        allResults: results
      });
      continue;
    }

    const headCatsToIterate = app.id === 'Organisation' ? ORG_HEAD_CATEGORIES : RESULT_HEAD_CATEGORIES;

    for (const hc of headCatsToIterate) {
      // Get all applications matching this applicationType and headCategory
      const categoryProjects = allProjects.filter((p) => {
        const appMatch = p.applicationType === 'All Application Types' || canonicalAppType(p.applicationType) === app.id;
        if (!appMatch) return false;

        if (app.id === 'Organisation') {
          if (hc.code === ORG_COMBINED_HEAD_CATEGORY_CODE) {
            return isOrgMergedHeadCategory(p.headCategory) || p.headCategory === 'All Head Category';
          }
          return p.headCategory === 'All Head Category' || canonicalHeadCategory(p.headCategory) === hc.code;
        }

        const hcMatch = p.headCategory === 'All Head Category' || canonicalHeadCategory(p.headCategory) === hc.code;
        return hcMatch;
      });

      // Compute results for each project
      const results: CombinedProjectResult[] = categoryProjects.map((p) =>
        getProjectCombinedResult(p, allProjects, allEvaluations)
      );

      // Sort results highest to lowest for display
      results.sort((a, b) => b.finalAverageScore - a.finalAverageScore);

      const champions = results.filter((r) => r.awardBase === 'Champion' || r.award.includes('Champion'));
      const winners = results.filter((r) => r.awardBase === 'Winner' || r.award.includes('Winner'));
      const merits = results.filter((r) => r.awardBase === 'Merit' || r.award.includes('Merit'));
      const noAwards = results.filter((r) => (!r.awardBase || r.awardBase === 'No Award') && !r.award.includes('Champion') && !r.award.includes('Winner') && !r.award.includes('Merit'));

      groups.push({
        appType: app.id,
        appTypeTitle: app.title,
        headCategoryCode: hc.code,
        headCategoryName: hc.name,
        categoryKey: `${app.id}__${hc.code}`,
        totalApplicants: results.length,
        champions,
        winners,
        merits,
        noAwards,
        allResults: results
      });
    }
  }

  return groups;
};
