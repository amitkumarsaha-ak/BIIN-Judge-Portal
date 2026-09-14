import type { ApplicationType, HeadCategory, CriteriaInfo, Project, User } from '../types';

export const APPLICATION_TYPES: { id: ApplicationType; title: string; description: string; badge: string; icon: string }[] = [
  {
    id: 'Student-Secondary',
    title: 'Student-Secondary',
    description: 'Projects developed by secondary & school level students and academic teams.',
    badge: 'Secondary',
    icon: 'GraduationCap'
  },
  {
    id: 'Student-Tertiary',
    title: 'Student-Tertiary Categories (University Level)',
    description: 'University-level student projects competing under the five head categories: Consumer, Business Services, Industrial, Community & Social, and Public Sector.',
    badge: 'University',
    icon: 'University'
  },
  {
    id: 'Organisation',
    title: 'Organisation',
    description: 'Corporate initiatives, enterprise technology solutions, registered companies & startups.',
    badge: 'Enterprise',
    icon: 'Building2'
  },
  {
    id: 'Individual or Group',
    title: 'Individual or Group',
    description: 'Independent creators, open-source contributors, researchers, and freelance developer teams.',
    badge: 'Independent',
    icon: 'Users'
  }
];

export const HEAD_CATEGORIES: HeadCategory[] = [
  {
    code: 'HC-C',
    name: 'Consumer',
    shortCode: 'HC-C',
    description: 'Consumer tech, mobile apps, personal smart devices, lifestyle & entertainment solutions.',
    iconName: 'Smartphone',
    accentColor: 'from-blue-500 to-cyan-500'
  },
  {
    code: 'HC-I',
    name: 'Industrial',
    shortCode: 'HC-I',
    description: 'IoT sensors, smart manufacturing, supply chain robotics, energy & industrial automation.',
    iconName: 'Factory',
    accentColor: 'from-amber-500 to-orange-500'
  },
  {
    code: 'HC-BS',
    name: 'Business Services',
    shortCode: 'HC-BS',
    description: 'B2B SaaS, enterprise analytics, fintech payment systems & workflow automation tools.',
    iconName: 'Briefcase',
    accentColor: 'from-purple-500 to-indigo-500'
  },
  {
    code: 'HC-ICS',
    name: 'Inclusions & Community',
    shortCode: 'HC-ICS',
    description: 'Assistive tech, digital accessibility, social impact platforms & community welfare solutions.',
    iconName: 'HeartHandshake',
    accentColor: 'from-emerald-500 to-teal-500'
  },
  {
    code: 'HC-PSG',
    name: 'Public Sector and Government',
    shortCode: 'HC-PSG',
    description: 'Civic tech, smart city governance, public health platforms & e-government services.',
    iconName: 'Landmark',
    accentColor: 'from-rose-500 to-pink-500'
  }
];

import { STUDENT_CRITERIA, ORGANISATION_AND_INDIVIDUAL_CRITERIA, STUDENT_TERTIARY_CRITERIA } from '../utils/evaluation';

export const EVALUATION_CRITERIA: CriteriaInfo[] = STUDENT_CRITERIA;
export { STUDENT_CRITERIA, ORGANISATION_AND_INDIVIDUAL_CRITERIA, STUDENT_TERTIARY_CRITERIA };

export const PRESEEDED_JUDGES: User[] = [];

export const SAMPLE_PROJECTS: Project[] = [];
