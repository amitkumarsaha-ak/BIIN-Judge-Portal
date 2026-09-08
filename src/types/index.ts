export type ApplicationType = 'Student' | 'Organisation' | 'Individual or Group' | 'Student-Tertiary';

export type HeadCategoryCode = 'HC-C' | 'HC-I' | 'HC-BS' | 'HC-ICS' | 'HC-PSG';

export type ProjectStatus = 'active' | 'inactive';

export interface HeadCategory {
  code: HeadCategoryCode;
  name: string;
  shortCode: string;
  description: string;
  iconName: string;
  accentColor: string;
}

export type JudgeStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: 'judge' | 'admin';
  createdAt: string;
  status?: JudgeStatus;
  roomNumber?: string;
  isActive?: boolean;
}

export interface Room {
  id: string;
  roomNumber: string; // e.g. 'Room 01'
  name: string;       // e.g. 'Room 01 - Smart Systems'
  location?: string;  // e.g. 'Hall A, 2nd Floor'
  capacity?: number;
  description?: string;
  createdAt: string;
}

export interface SystemSettings {
  evaluationsLocked: boolean;
  finalResultsLocked: boolean;
  lockedProjects: string[]; // project IDs locked individually
  autoRankingEnabled: boolean;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  actorName: string;
  action: string;
  targetType: 'project' | 'judge' | 'room' | 'evaluation' | 'settings' | 'auth';
  details: string;
  timestamp: string;
}

export interface Project {
  id: string;
  title: string;
  applicationId: string;        // e.g. BIIN-2026-001
  projectCode: string;          // Serial/project code
  applicationType: ApplicationType;
  headCategory: HeadCategoryCode;
  teamOrOrgName: string;        // Participant/Organization Name
  representativeName: string;   // Member Name / Student Name / Representative Name
  members?: string[];
  email: string;
  contactNumber: string;
  institutionOrOrg?: string;    // University Name or Company Name
  description: string;
  problemStatement?: string;
  solutionSummary?: string;
  tags: string[];
  roomNumber?: string;          // Optional/deprecated
  status: ProjectStatus;        // active | inactive
}

export type CriteriaKey =
  | 'uniqueness'
  | 'proofOfConcept'
  | 'features'
  | 'quality'
  | 'presentation'
  | 'publicOrGovValue'
  | 'qualityTech';

export interface CriteriaInfo {
  key: CriteriaKey;
  label: string;
  maxScore: number;
  description: string;
  iconName: string;
}

export interface EvaluationScores {
  uniqueness?: number;
  proofOfConcept?: number;
  features?: number;
  quality?: number;
  presentation?: number;
  publicOrGovValue?: number;
  qualityTech?: number;
  [key: string]: number | undefined;
}

export interface Evaluation {
  id: string;
  projectId: string;
  judgeEmail: string;
  judgeName: string;
  scores: EvaluationScores;
  feedback?: string;
  rawTotalScore: number;
  maxRawScore: number;
  convertedScore: number;
  roomNumber?: string;
  totalScore: number; // backward compatibility (rawTotalScore)
  percentage: number; // backward compatibility (convertedScore)
  submittedAt: string;
  updatedAt?: string;
}

export type AwardDesignation = 'Champion' | 'Winner' | 'Merit' | 'Participant';

export interface JudgeScoreBreakdown {
  judgeEmail: string;
  judgeName: string;
  rawScore: number;
  maxRawScore: number;
  convertedScore: number;
  scores: EvaluationScores;
  feedback?: string;
  submittedAt: string;
}

export interface CombinedProjectResult {
  project: Project;
  roomNumber?: string;
  applicationType: ApplicationType;
  judgesEvaluations: JudgeScoreBreakdown[];
  finalAverageScore: number;
  award: AwardDesignation;
  isHighestInCategory: boolean;
}

export interface DashboardStats {
  totalProjects: number;
  evaluatedProjectsCount: number;
  remainingProjectsCount: number;
  averageScore: number;
}
