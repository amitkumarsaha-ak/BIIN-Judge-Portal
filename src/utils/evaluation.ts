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
  if (type === 'Student') {
    return STUDENT_CRITERIA;
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

export const calculateAward = (finalScore: number, isHighestInCategory: boolean): AwardDesignation => {
  if (finalScore > 80 && isHighestInCategory) {
    return 'Champion';
  }
  if (finalScore > 70) {
    return 'Winner';
  }
  if (finalScore > 60) {
    return 'Merit';
  }
  return 'Participant';
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

  // Determine highest score in category (combination of ApplicationType and HeadCategory)
  const sameCategoryProjects = allProjects.filter(
    (p) => p.applicationType === project.applicationType && p.headCategory === project.headCategory
  );

  let categoryMaxScore = 0;
  for (const p of sameCategoryProjects) {
    const pEvals = allEvaluations.filter((e) => e.projectId === p.id);
    if (pEvals.length > 0) {
      const pMaxRaw = getMaxRawScoreForApplicationType(p.applicationType);
      const sumConverted = pEvals.reduce((acc, e) => {
        const raw = e.rawTotalScore ?? e.totalScore ?? 0;
        const conv = e.convertedScore ?? e.percentage ?? calculateConvertedScore(raw, pMaxRaw);
        return acc + conv;
      }, 0);
      const avgConverted = sumConverted / pEvals.length;
      if (avgConverted > categoryMaxScore) {
        categoryMaxScore = avgConverted;
      }
    }
  }

  const isHighestInCategory =
    finalAverageScore > 0 && Math.abs(finalAverageScore - categoryMaxScore) < 0.001;

  const award = calculateAward(finalAverageScore, isHighestInCategory);

  return {
    project,
    roomNumber: project.roomNumber || 'Room 01',
    applicationType: project.applicationType,
    judgesEvaluations,
    finalAverageScore,
    award,
    isHighestInCategory
  };
};
