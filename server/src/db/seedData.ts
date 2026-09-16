// Initial seed data for BIIN Judge Portal backend

export interface SeedUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: 'judge' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  roomNumber?: string;
  createdAt: string;
}

export interface SeedRoom {
  id: string;
  roomNumber: string;
  name: string;
  location?: string;
  capacity?: number;
  description?: string;
  createdAt: string;
}

export interface SeedProject {
  id: string;
  title: string;
  applicationId: string;
  projectCode: string;
  applicationType: string;
  headCategory: string;
  teamOrOrgName: string;
  representativeName: string;
  teamLeadName?: string;
  members?: string[];
  email: string;
  contactNumber: string;
  institutionOrOrg?: string;
  description: string;
  problemStatement?: string;
  solutionSummary?: string;
  tags: string[];
  roomNumber?: string;
  status: 'active' | 'inactive';
}

export interface SeedAssignment {
  id: string;
  judgeId: string;
  judgeEmail: string;
  judgeName: string;
  applicationType: string;
  headCategory?: string | null;
  projectIds?: string[];
  createdAt: string;
}

export interface SeedEvaluation {
  id: string;
  projectId: string;
  judgeEmail: string;
  judgeName: string;
  scores: Record<string, number>;
  feedback?: string;
  rawTotalScore: number;
  maxRawScore: number;
  convertedScore: number;
  roomNumber?: string;
  totalScore: number;
  percentage: number;
  submittedAt: string;
}

export const SEED_ROOMS: SeedRoom[] = [
  {
    id: 'room-1',
    roomNumber: 'Room 01',
    name: 'Room 01 — Consumer & Smart Tech',
    location: 'Building A, 2nd Floor',
    capacity: 10,
    description: 'Judging room for Consumer solutions, smart devices, and mobile apps.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-2',
    roomNumber: 'Room 02',
    name: 'Room 02 — Industrial & Robotics',
    location: 'Building A, 3rd Floor',
    capacity: 10,
    description: 'Judging room for Industrial automation, IoT sensors, and robotics.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-3',
    roomNumber: 'Room 03',
    name: 'Room 03 — Enterprise & Cloud Systems',
    location: 'Building B, 1st Floor',
    capacity: 10,
    description: 'Judging room for B2B SaaS, fintech, and enterprise workflows.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-4',
    roomNumber: 'Room 04',
    name: 'Room 04 — Community & Accessibility',
    location: 'Building B, 2nd Floor',
    capacity: 10,
    description: 'Judging room for Social impact, assistive technologies, and healthcare.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-5',
    roomNumber: 'Room 05',
    name: 'Room 05 — Public Sector & Civic Tech',
    location: 'Building C, Auditorium Hall',
    capacity: 15,
    description: 'Judging room for Smart city governance, public health, and e-gov services.',
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const SEED_USERS: SeedUser[] = [
  {
    id: 'admin-fixed-1',
    fullName: process.env.ADMIN_NAME || 'BIIN Administrator',
    email: (process.env.ADMIN_EMAIL || 'admin@biin.org').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    status: 'approved',
    createdAt: '2026-07-01T08:00:00Z'
  }
];

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: 'proj-seed-sec-01',
    title: 'Solar Irrigation & Crop Health Monitor',
    applicationId: 'BIIN-2026-001',
    projectCode: 'SEC-001',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'Green Innovators Dhaka',
    representativeName: 'Rahim Chowdhury',
    teamLeadName: 'Rahim Chowdhury',
    members: ['Rahim Chowdhury', 'Tahmina Akhter'],
    email: 'contact.sec01@biin.org',
    contactNumber: '+880 1711 001001',
    institutionOrOrg: 'Dhaka Residential Model College',
    description: 'Autonomous micro-irrigation system driven by solar power with automated soil moisture sensing for rural farmlands.',
    problemStatement: 'Excessive water wastage and high diesel cost in rural irrigation.',
    solutionSummary: 'Automated solar water pump regulation controlled by embedded soil moisture telemetry.',
    tags: ['IoT', 'Agriculture', 'Solar Energy'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-seed-sec-02',
    title: 'BrailleSmart: Low-Cost Haptic Text Reader',
    applicationId: 'BIIN-2026-002',
    projectCode: 'SEC-002',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'VisionForward Team',
    representativeName: 'Samira Hossain',
    teamLeadName: 'Samira Hossain',
    members: ['Samira Hossain', 'Arif Mahmud'],
    email: 'contact.sec02@biin.org',
    contactNumber: '+880 1819 002002',
    institutionOrOrg: 'Viqarunnisa Noon School & College',
    description: 'Affordable refreshable Braille display for visually impaired students translating digital textbooks in real time.',
    problemStatement: 'High cost of imported Braille displays prevents access for underprivileged students.',
    solutionSummary: '3D-printed micro-solenoid actuator array interfacing with mobile e-reader apps via Bluetooth.',
    tags: ['Accessibility', 'Assistive Tech', 'Hardware'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-seed-tert-01',
    title: 'MediScan AI: Point-of-Care Retina Pathology',
    applicationId: 'BIIN-2026-003',
    projectCode: 'TERT-001',
    applicationType: 'Student -Tertiary (University Level)',
    headCategory: 'HC-C',
    teamOrOrgName: 'NeuralVision Lab',
    representativeName: 'Tanvir Ahmed',
    teamLeadName: 'Tanvir Ahmed',
    members: ['Tanvir Ahmed', 'Nafisa Islam', 'Kazi Farhan'],
    email: 'contact.tert01@biin.org',
    contactNumber: '+880 1912 003003',
    institutionOrOrg: 'BUET - Dept of CSE',
    description: 'Smartphone-mounted fundus ophthalmoscope with on-device computer vision screening for diabetic retinopathy.',
    problemStatement: 'Scarcity of certified ophthalmologists in remote rural upazilas.',
    solutionSummary: 'Edge-optimized convolutional neural network providing rapid retinal grading in 15 seconds.',
    tags: ['HealthTech', 'Computer Vision', 'AI'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-seed-tert-02',
    title: 'RiverWatch: IoT Flood & Water Quality Network',
    applicationId: 'BIIN-2026-004',
    projectCode: 'TERT-002',
    applicationType: 'Student -Tertiary (University Level)',
    headCategory: 'HC-I',
    teamOrOrgName: 'HydroSense Consortium',
    representativeName: 'Farhana Yeasmin',
    teamLeadName: 'Farhana Yeasmin',
    members: ['Farhana Yeasmin', 'Shakil Hasan'],
    email: 'contact.tert02@biin.org',
    contactNumber: '+880 1613 004004',
    institutionOrOrg: 'University of Dhaka - Dept of EEE',
    description: 'Solar-powered floating sensor nodes measuring river height, turbidity, and chemical runoffs for early flood warnings.',
    problemStatement: 'Delayed flood warnings cause catastrophic seasonal losses in coastal delta zones.',
    solutionSummary: 'LoRaWAN meshed telemetry network feeding predictive hydrological models in cloud dashboards.',
    tags: ['IoT', 'Disaster Management', 'Sensors'],
    roomNumber: 'Room 02',
    status: 'active'
  },
  {
    id: 'proj-seed-org-01',
    title: 'FinShield: Real-Time Fraud Prevention Engine',
    applicationId: 'BIIN-2026-005',
    projectCode: 'ORG-001',
    applicationType: 'Organization',
    headCategory: 'HC-BS',
    teamOrOrgName: 'FinCognition Ltd.',
    representativeName: 'Masud Parvez',
    teamLeadName: 'Masud Parvez',
    members: ['Masud Parvez', 'Ayesha Siddiqua', 'Mahmudul Hasan'],
    email: 'contact.org01@biin.org',
    contactNumber: '+880 1714 005005',
    institutionOrOrg: 'FinCognition Technologies Ltd.',
    description: 'Sub-second anomaly detection engine protecting mobile financial services from unauthorized syndicates and identity theft.',
    problemStatement: 'Rapid rise of social engineering and transactional fraud in mobile banking.',
    solutionSummary: 'Graph neural network analyzing behavioural transaction graphs in under 40 milliseconds.',
    tags: ['Fintech', 'Cybersecurity', 'Machine Learning'],
    roomNumber: 'Room 03',
    status: 'active'
  },
  {
    id: 'proj-seed-ind-01',
    title: 'OpenCivic: Citizen Civic Grievance Tracker',
    applicationId: 'BIIN-2026-006',
    projectCode: 'IND-001',
    applicationType: 'Individual or Group',
    headCategory: 'N/A',
    teamOrOrgName: 'CivicTech Collective',
    representativeName: 'Imran Kabir',
    teamLeadName: 'Imran Kabir',
    members: ['Imran Kabir', 'Tasnim Ferdous'],
    email: 'contact.ind01@biin.org',
    contactNumber: '+880 1815 006006',
    institutionOrOrg: 'Independent Developers Collective',
    description: 'Community-driven crowdsourced public utility reporting platform bridging citizens and municipal service wards.',
    problemStatement: 'Lack of accountability and slow turnaround for municipal utility maintenance complaints.',
    solutionSummary: 'Open-source geo-tagged ticketing mobile app with public resolution progress tracking.',
    tags: ['CivicTech', 'Open Source', 'Community'],
    roomNumber: 'Room 04',
    status: 'active'
  }
];


export const SEED_EVALUATIONS: SeedEvaluation[] = [];

export const SEED_SETTINGS = {
  id: 'global',
  evaluationsLocked: false,
  finalResultsLocked: false,
  lockedProjects: [] as string[],
  categoryLocks: {} as Record<string, boolean>,
  autoRankingEnabled: true
};

export const SEED_AUDIT_LOGS = [
  {
    id: 'audit-init-1',
    actorEmail: process.env.ADMIN_EMAIL || 'admin@biin.org',
    actorName: process.env.ADMIN_NAME || 'BIIN Administrator',
    action: 'SYSTEM_INITIALIZE',
    targetType: 'settings',
    details: 'System initialized with default settings and admin account.',
    timestamp: '2026-08-15T09:00:00Z'
  }
];
