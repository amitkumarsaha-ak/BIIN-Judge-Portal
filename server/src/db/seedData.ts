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
  },
  {
    id: 'judge-1',
    fullName: 'Dr. Sarah Jenkins (Judge 1)',
    email: 'judge@biin.org',
    password: 'password123',
    role: 'judge',
    status: 'approved',
    createdAt: '2026-08-01T09:00:00Z',
    roomNumber: 'Room 01'
  },
  {
    id: 'judge-2',
    fullName: 'Prof. Alex Mercer (Judge 2)',
    email: 'alex.mercer@biin.org',
    password: 'password123',
    role: 'judge',
    status: 'approved',
    createdAt: '2026-08-05T10:30:00Z',
    roomNumber: 'Room 01'
  },
  {
    id: 'judge-3',
    fullName: 'Eng. Farhan Ahmed (Judge 3)',
    email: 'farhan.ahmed@biin.org',
    password: 'password123',
    role: 'judge',
    status: 'approved',
    createdAt: '2026-08-08T11:00:00Z',
    roomNumber: 'Room 01'
  },
  {
    id: 'judge-4',
    fullName: 'Dr. Nusrat Jahan (Judge 1)',
    email: 'nusrat.jahan@biin.org',
    password: 'password123',
    role: 'judge',
    status: 'approved',
    createdAt: '2026-08-10T09:00:00Z',
    roomNumber: 'Room 02'
  },
  {
    id: 'judge-5',
    fullName: 'Mr. Tanvir Hasan (Judge 2)',
    email: 'tanvir.hasan@biin.org',
    password: 'password123',
    role: 'judge',
    status: 'approved',
    createdAt: '2026-08-12T10:00:00Z',
    roomNumber: 'Room 02'
  },
  {
    id: 'judge-6',
    fullName: 'Ms. Sabrina Yeasmin (Judge 3)',
    email: 'sabrina.y@biin.org',
    password: 'password123',
    role: 'judge',
    status: 'approved',
    createdAt: '2026-08-15T11:00:00Z',
    roomNumber: 'Room 02'
  }
];

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: 'proj-stu-hcc-1',
    title: 'Smart AgriSense - Portable Soil Scanner',
    applicationId: 'BIIN-2026-001',
    projectCode: 'STU-HC-C-001',
    applicationType: 'Student',
    headCategory: 'HC-C',
    teamOrOrgName: 'Team AgriPulse',
    representativeName: 'Aria Chen',
    members: ['Aria Chen', 'Liam Vance', 'Sophia Patel'],
    email: 'aria.chen@student.university.edu',
    contactNumber: '+1 (555) 019-2834',
    institutionOrOrg: 'National Institute of Technology',
    description: 'A pocket-sized Bluetooth sensor and mobile app that instantly analyzes soil nitrogen, pH, and moisture levels for urban gardeners and smallholder farmers.',
    problemStatement: 'Smallholder farmers lack affordable real-time soil diagnosis, leading to fertilizer overuse and poor crop yield.',
    solutionSummary: 'Combines optical spectroscopy and low-power BLE hardware linked to a Flutter app with AI crop recommendations.',
    tags: ['IoT', 'Agriculture', 'Mobile App', 'AI'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-stu-hci-1',
    title: 'RoboInspect - Autonomous Pipeline Drone',
    applicationId: 'BIIN-2026-002',
    projectCode: 'STU-HC-I-001',
    applicationType: 'Student',
    headCategory: 'HC-I',
    teamOrOrgName: 'AeroRobotics Lab',
    representativeName: 'Marcus Vance',
    members: ['Marcus Vance', 'Elena Rostova'],
    email: 'marcus.v@polytechnic.edu',
    contactNumber: '+1 (555) 014-9982',
    institutionOrOrg: 'Polytechnic Engineering College',
    description: 'Miniaturized crawler drone equipped with ultrasonic thickness gauges to detect internal pipe micro-cracks without refinery shutdowns.',
    problemStatement: 'Manual refinery inspection poses extreme chemical safety hazards and causes multi-million dollar plant downtimes.',
    solutionSummary: 'Magnetic wall-crawling drone with live LiDAR mapping and thermal defect detection algorithm.',
    tags: ['Robotics', 'Industrial IoT', 'Computer Vision'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-stu-hcbs-1',
    title: 'ContractFlow - Automated SME Legal Validator',
    applicationId: 'BIIN-2026-003',
    projectCode: 'STU-HC-BS-001',
    applicationType: 'Student',
    headCategory: 'HC-BS',
    teamOrOrgName: 'LexTech Innovators',
    representativeName: 'David K. Miller',
    members: ['David K. Miller', 'Nadia Al-Mansoor'],
    email: 'david.miller@law.tech.edu',
    contactNumber: '+1 (555) 017-4411',
    institutionOrOrg: 'Faculty of Law & Tech',
    description: 'AI-driven contract audit platform designed for small businesses to highlight compliance risks, hidden clauses, and missing indemnities.',
    problemStatement: 'Early-stage founders spend prohibitive legal retainers reviewing basic vendor contracts.',
    solutionSummary: 'Fine-tuned LLM engine parsing PDF contracts in seconds with clause risk scoring and redline suggestions.',
    tags: ['LegalTech', 'SaaS', 'NLP'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-stu-hcics-1',
    title: 'SignBridge - Real-Time Sign Language Translator',
    applicationId: 'BIIN-2026-004',
    projectCode: 'STU-HC-ICS-001',
    applicationType: 'Student',
    headCategory: 'HC-ICS',
    teamOrOrgName: 'Inclusive Tech Collective',
    representativeName: 'Tariq Hassan',
    members: ['Tariq Hassan', 'Chloe Dubois', 'Kenji Sato'],
    email: 'tariq.h@inclusive.edu',
    contactNumber: '+1 (555) 012-3390',
    institutionOrOrg: 'School of Computer Science',
    description: 'A webcam-based computer vision tool translating Sign Language to voice and text bi-directionally during video calls.',
    problemStatement: 'Deaf and hard-of-hearing individuals face continuous communication barriers in online education and remote work.',
    solutionSummary: 'MediaPipe hand landmark detection paired with lightweight Transformer models running locally in-browser.',
    tags: ['Accessibility', 'Computer Vision', 'Deep Learning'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-stu-hcpsg-1',
    title: 'CivicPulse - Hyperlocal Citizen Reporting Hub',
    applicationId: 'BIIN-2026-005',
    projectCode: 'STU-HC-PSG-001',
    applicationType: 'Student',
    headCategory: 'HC-PSG',
    teamOrOrgName: 'Civic Hackers United',
    representativeName: 'Samantha Reed',
    members: ['Samantha Reed', 'Julian Ortiz'],
    email: 'sam.reed@urban.edu',
    contactNumber: '+1 (555) 018-7723',
    institutionOrOrg: 'Urban Affairs Institute',
    description: 'Geo-tagged mobile platform for citizens to report municipal hazards (potholes, broken streetlights) directly to city maintenance units.',
    problemStatement: 'Municipal call centers suffer from slow response times, duplicated complaints, and lack of transparency.',
    solutionSummary: 'Progressive Web App with automated image tagging, automated priority routing, and transparent status timeline.',
    tags: ['CivicTech', 'Smart City', 'PWA'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-org-hcc-1',
    title: 'VibeHealth - Continuous Blood Glucose Wearable',
    applicationId: 'BIIN-2026-006',
    projectCode: 'ORG-HC-C-001',
    applicationType: 'Organisation',
    headCategory: 'HC-C',
    teamOrOrgName: 'BioVibe MedTech Corp',
    representativeName: 'Dr. Robert Sterling',
    email: 'r.sterling@biovibemed.com',
    contactNumber: '+1 (800) 555-9012',
    institutionOrOrg: 'BioVibe MedTech Corp (Reg: #88294-US)',
    description: 'Non-invasive continuous glucose monitoring smart ring utilizing transdermal optical sensors and predictive glycemic trend alerts.',
    problemStatement: 'Diabetic patients endure invasive finger-pricks multiple times daily to monitor glucose levels.',
    solutionSummary: 'Patented multi-wavelength optical sensor combined with low-power edge machine learning algorithm.',
    tags: ['MedTech', 'Wearable', 'Health'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-org-hci-1',
    title: 'GridGuard - AI Predictive Substation Maintenance',
    applicationId: 'BIIN-2026-007',
    projectCode: 'ORG-HC-I-001',
    applicationType: 'Organisation',
    headCategory: 'HC-I',
    teamOrOrgName: 'PowerGrid Solutions Inc',
    representativeName: 'Karen Zhao',
    email: 'kzhao@powergridsolutions.com',
    contactNumber: '+1 (800) 555-3410',
    institutionOrOrg: 'PowerGrid Solutions Inc',
    description: 'Enterprise grid surveillance engine utilizing infrared IoT cameras and acoustic sensors to prevent power transformer catastrophic failures.',
    problemStatement: 'Aging power transformers fail unpredictably, triggering regional blackouts and tens of millions in damages.',
    solutionSummary: 'Continuous acoustic spectrum anomaly analysis paired with automated emergency trip warning triggers.',
    tags: ['CleanTech', 'Energy Grid', 'Industrial IoT'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-org-hcbs-1',
    title: 'OmniLedger - Cross-Border B2B Settlement Protocol',
    applicationId: 'BIIN-2026-008',
    projectCode: 'ORG-HC-BS-001',
    applicationType: 'Organisation',
    headCategory: 'HC-BS',
    teamOrOrgName: 'FinNova Global Technologies',
    representativeName: 'Vikram Mehta',
    email: 'vmehta@finnovaglobal.com',
    contactNumber: '+1 (888) 555-6677',
    institutionOrOrg: 'FinNova Global Corp',
    description: 'Zero-knowledge cryptographic payment gateway enabling instant multi-currency enterprise clearing with automated tax compliance.',
    problemStatement: 'Cross-border supplier payments take 3-5 business days with 4-7% intermediary FX fees.',
    solutionSummary: 'Distributed ledger technology layer integrated into standard ERP systems (SAP, NetSuite) for T+0 settlement.',
    tags: ['FinTech', 'Enterprise SaaS', 'Blockchain'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-org-hcics-1',
    title: 'EcoReach - Rural Tele-Medicine Diagnostic Kiosk',
    applicationId: 'BIIN-2026-009',
    projectCode: 'ORG-HC-ICS-001',
    applicationType: 'Organisation',
    headCategory: 'HC-ICS',
    teamOrOrgName: 'Global Health Outreach Alliance',
    representativeName: 'Maria Fernandez',
    email: 'm.fernandez@ghoalliance.org',
    contactNumber: '+1 (800) 555-1122',
    institutionOrOrg: 'Global Health Alliance NGO',
    description: 'Solar-powered telemedicine booth equipped with basic blood analyzers, ECG, and satellite link for remote rural healthcare.',
    problemStatement: 'Over 2 billion people in rural villages live more than 50 miles from the nearest qualified physician.',
    solutionSummary: 'Ruggedized all-weather kiosk with remote AI-assisted triaging guided by urban specialist doctors.',
    tags: ['TeleHealth', 'Social Impact', 'Solar IoT'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-org-hcpsg-1',
    title: 'AquaShield - Municipal Flood Early Warning System',
    applicationId: 'BIIN-2026-010',
    projectCode: 'ORG-HC-PSG-001',
    applicationType: 'Organisation',
    headCategory: 'HC-PSG',
    teamOrOrgName: 'HydroMetrics Systems',
    representativeName: 'Dr. Jonathan Vance',
    email: 'jvance@hydrometricssystems.com',
    contactNumber: '+1 (800) 555-8833',
    institutionOrOrg: 'HydroMetrics Systems Ltd',
    description: 'City-wide river and storm drain sensor grid predicting urban flash flooding up to 6 hours before water rises.',
    problemStatement: 'Rapid climate changes cause localized flash flooding that devastates city infrastructure before emergency services respond.',
    solutionSummary: 'Radar water level monitors linked to hydrodynamic flood forecasting digital twin simulation.',
    tags: ['Smart City', 'Disaster Tech', 'Public Safety'],
    roomNumber: 'Room 01',
    status: 'active'
  },
  {
    id: 'proj-ind-hcc-1',
    title: 'NeuroFocus - EEG Meditation & Deep Work Headband',
    applicationId: 'BIIN-2026-011',
    projectCode: 'IND-HC-C-001',
    applicationType: 'Individual or Group',
    headCategory: 'HC-C',
    teamOrOrgName: 'BioHackers Collective',
    representativeName: 'Alex Thorne',
    members: ['Alex Thorne', 'Maya Lin'],
    email: 'alex.thorne@neurohacks.io',
    contactNumber: '+1 (555) 016-8821',
    institutionOrOrg: 'Open Science Movement',
    description: 'Lightweight 4-channel EEG headband paired with adaptive ambient binaural audio that trains focus state and combats burnout.',
    problemStatement: 'Knowledge workers suffer from constant digital distractions and chronic cognitive fatigue.',
    solutionSummary: 'Consumer hardware with real-time biofeedback loops dynamically modulating audio frequencies.',
    tags: ['NeuroTech', 'Wearable', 'Consumer Device'],
    roomNumber: 'Room 02',
    status: 'active'
  },
  {
    id: 'proj-ind-hci-1',
    title: 'SolarTrack - Self-Cleaning Dual-Axis Solar Panel Mount',
    applicationId: 'BIIN-2026-012',
    projectCode: 'IND-HC-I-001',
    applicationType: 'Individual or Group',
    headCategory: 'HC-I',
    teamOrOrgName: 'GreenForge Labs',
    representativeName: 'Siddharth Rao',
    members: ['Siddharth Rao'],
    email: 'siddharth@greenforge.dev',
    contactNumber: '+1 (555) 019-3344',
    institutionOrOrg: 'Independent Maker',
    description: 'Low-cost open-hardware solar tracker with integrated electrostatic dust repulsion mechanism boosting energy capture by 38%.',
    problemStatement: 'Dust accumulation and fixed solar panel angles cause up to 40% efficiency loss in desert environments.',
    solutionSummary: 'Micro-actuator dual axis mount with autonomous cleaning sweep driven by ambient light sensors.',
    tags: ['Renewable Energy', 'Hardware', 'Open Source'],
    roomNumber: 'Room 02',
    status: 'active'
  },
  {
    id: 'proj-ind-hcbs-1',
    title: 'InvoiceShield - Freelancer Payment Escrow & Audit',
    applicationId: 'BIIN-2026-013',
    projectCode: 'IND-HC-BS-001',
    applicationType: 'Individual or Group',
    headCategory: 'HC-BS',
    teamOrOrgName: 'SoloStack Team',
    representativeName: 'Elena Rostova',
    members: ['Elena Rostova', 'Lucas Meyer'],
    email: 'elena@solostack.net',
    contactNumber: '+1 (555) 013-5566',
    institutionOrOrg: 'Independent Developers',
    description: 'Automated milestone escrow platform using smart contracts to guarantee timely payments for freelance developers and designers.',
    problemStatement: 'Freelancers spend weeks chasing unpaid invoices and risk complete non-payment on completed work.',
    solutionSummary: 'Git-commit linked milestone release escrow with automated dispute mediation protocol.',
    tags: ['Gig Economy', 'FinTech', 'Web Apps'],
    roomNumber: 'Room 02',
    status: 'active'
  },
  {
    id: 'proj-ind-hcics-1',
    title: 'BraillePad - Tactile E-Reader for the Visually Impaired',
    applicationId: 'BIIN-2026-014',
    projectCode: 'IND-HC-ICS-001',
    applicationType: 'Individual or Group',
    headCategory: 'HC-ICS',
    teamOrOrgName: 'HapticVision Group',
    representativeName: 'Mateo Rossi',
    members: ['Mateo Rossi', 'Anita Kumar', 'Zaid Al-Hassan'],
    email: 'mateo@hapticvision.org',
    contactNumber: '+1 (555) 017-9900',
    institutionOrOrg: 'Accessibility Hackers',
    description: 'Refreshable 40-cell Braille display engineered with micro-fluidic actuators costing 80% less than traditional piezoelectric pads.',
    problemStatement: 'Commercial Braille displays cost over $3,000, making digital literacy inaccessible to millions of visually impaired individuals.',
    solutionSummary: 'Novel pneumatic micro-pin matrix controller powered by open-source firmware.',
    tags: ['Assistive Tech', 'Hardware', 'Accessibility'],
    roomNumber: 'Room 02',
    status: 'active'
  },
  {
    id: 'proj-ind-hcpsg-1',
    title: 'OpenPermit - Transparent Citizen Zoning Portal',
    applicationId: 'BIIN-2026-015',
    projectCode: 'IND-HC-PSG-001',
    applicationType: 'Individual or Group',
    headCategory: 'HC-PSG',
    teamOrOrgName: 'Civic Tech Foundry',
    representativeName: 'Claire Bennet',
    members: ['Claire Bennet'],
    email: 'claire@civicfoundry.org',
    contactNumber: '+1 (555) 011-2288',
    institutionOrOrg: 'Open Government Fellow',
    description: 'Public web platform making municipal building permits, zoning variances, and urban planning meetings searchable and accessible to all citizens.',
    problemStatement: 'City zoning decisions occur behind opaque bureaucracy, hindering community engagement.',
    solutionSummary: 'Scrapes municipal public data feeds and generates interactive GIS heatmaps and notification alerts.',
    tags: ['Open Data', 'CivicTech', 'GovTech'],
    roomNumber: 'Room 02',
    status: 'active'
  },
  {
    id: 'proj-stert-hcc-1',
    title: 'UniCart - AI Campus Grocery Optimizer',
    applicationId: 'BIIN-2026-019',
    projectCode: 'STERT-HC-C-001',
    applicationType: 'Student-Tertiary',
    headCategory: 'HC-C',
    teamOrOrgName: 'Team UniCart',
    representativeName: 'Priya Sharma',
    members: ['Priya Sharma', 'Liam Nakamura', 'Sofia Reyes'],
    email: 'priya.s@unicart.ac.bd',
    contactNumber: '+880 1711-001122',
    institutionOrOrg: 'Dhaka University of Engineering & Technology',
    description: 'Campus-wide grocery price and nutrition optimizer tailored for university students living on tight budgets.',
    problemStatement: 'Students struggle with poor nutrition and soaring living costs during university years.',
    solutionSummary: 'Aggregates grocery price indices and builds bulk group-purchasing discounts.',
    tags: ['EdTech', 'FinTech', 'Nutrition'],
    roomNumber: 'Room 01',
    status: 'active'
  }
];

export const SEED_EVALUATIONS: SeedEvaluation[] = [
  {
    id: 'eval-org-1',
    projectId: 'proj-org-hcc-1',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Dr. Sarah Jenkins (Judge 1)',
    roomNumber: 'Room 01',
    scores: { uniqueness: 8, publicOrGovValue: 9, features: 8, qualityTech: 7 },
    feedback: 'Strong healthcare product with broad public value.',
    rawTotalScore: 32,
    maxRawScore: 40,
    convertedScore: 80,
    totalScore: 32,
    percentage: 80,
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'eval-org-2',
    projectId: 'proj-org-hcc-1',
    judgeEmail: 'alex.mercer@biin.org',
    judgeName: 'Prof. Alex Mercer (Judge 2)',
    roomNumber: 'Room 01',
    scores: { uniqueness: 9, publicOrGovValue: 8, features: 9, qualityTech: 8 },
    feedback: 'Very solid hardware & sensor integration.',
    rawTotalScore: 34,
    maxRawScore: 40,
    convertedScore: 85,
    totalScore: 34,
    percentage: 85,
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'eval-org-3',
    projectId: 'proj-org-hcc-1',
    judgeEmail: 'farhan.ahmed@biin.org',
    judgeName: 'Eng. Farhan Ahmed (Judge 3)',
    roomNumber: 'Room 01',
    scores: { uniqueness: 7, publicOrGovValue: 8, features: 9, qualityTech: 8 },
    feedback: 'Great execution, ready for clinical trial phase.',
    rawTotalScore: 32,
    maxRawScore: 40,
    convertedScore: 80,
    totalScore: 32,
    percentage: 80,
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'eval-stu-1',
    projectId: 'proj-stu-hcc-1',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Dr. Sarah Jenkins (Judge 1)',
    roomNumber: 'Room 01',
    scores: { uniqueness: 8, proofOfConcept: 9, features: 8, quality: 9, presentation: 8 },
    feedback: 'Excellent prototype execution with clear real-world agricultural impact potential.',
    rawTotalScore: 42,
    maxRawScore: 50,
    convertedScore: 84,
    totalScore: 42,
    percentage: 84,
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const SEED_SETTINGS = {
  id: 'global',
  evaluationsLocked: false,
  finalResultsLocked: false,
  lockedProjects: [] as string[],
  autoRankingEnabled: true
};

export const SEED_AUDIT_LOGS = [
  {
    id: 'audit-init-1',
    actorEmail: process.env.ADMIN_EMAIL || 'admin@biin.org',
    actorName: process.env.ADMIN_NAME || 'BIIN Administrator',
    action: 'SYSTEM_INITIALIZE',
    targetType: 'settings',
    details: 'System initialized with default rooms, nominated projects, and judges.',
    timestamp: '2026-08-15T09:00:00Z'
  }
];
