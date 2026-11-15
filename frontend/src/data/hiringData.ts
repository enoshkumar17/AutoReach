export interface CompanyHiringCycle {
  id: string;
  name: string;
  category: 'Big Tech' | 'Finance & Banking' | 'Quant & HFT' | 'Product & Enterprise' | 'Semiconductors' | 'Indian Unicorns';
  locations: string[];
  logoBg: string;
  logoColor: string;
  initials: string;
  // Clear Plain-English Timeline
  currentStatus: 'OPEN_NOW' | 'UPCOMING_SOON' | 'CLOSED_WAIT_NEXT';
  statusLabel: string;
  lastCycleDone: string; // "Done in Aug–Oct (Summer 2027 Cohort)"
  nextCycleReopens: string; // "Reopens in June–July 2027 (Summer) & Jan 2027 (Off-Campus)"
  activeMonths: number[]; // 1-12
  upcomingMonths: number[]; // 1-12
  primaryIntakeMonths: string; // "August – October"
  internshipPeriod: string; // "May – July (Summer 2M) or Jan – June (6M)"
  targetBatches: string[]; // ["Batch 2026", "Batch 2027", "Batch 2028 (STEP)"]
  accessType: 'Off-Campus Friendly' | 'Both (Campus + Portal)' | 'Heavily On-Campus';
  quickSummary: string; // Plain-English TL;DR for juniors
  stipend: string;
  // Round-by-Round Breakdown for "Box Opening" Modal
  rounds: {
    title: string;
    description: string;
    durationOrFormat: string;
  }[];
  insiderTip: string;
  portalUrl: string;
}

export interface HackathonItem {
  id: string;
  name: string;
  company: string;
  expectedMonth: string; // e.g. "June – August"
  expectedMonthNum: number[]; // e.g. [6, 7, 8]
  status: 'OPEN_NOW' | 'UPCOMING_SOON' | 'ANNUAL_CLOSED';
  statusLabel: string;
  category: 'Hiring & PPI Challenge' | 'Diversity (Women in Tech)' | 'Ideation & Prototyping' | 'Global Cup';
  targetBatches: string; // "1st, 2nd, 3rd, 4th Year Engineering"
  rewards: string; // "Direct PPI / Interview + Cash Prizes"
  format: string; // "Round 1: OA -> Round 2: Hackathon Prototype -> Finale"
  overview: string;
  officialUrl: string;
  rounds?: string[];
  tips?: string;
}

export interface StudentProgramItem {
  id: string;
  name: string;
  company: string;
  type: 'Early Career & Diversity' | 'Open Source & Research' | 'Community & Leadership';
  expectedMonth: string;
  status: 'OPEN_NOW' | 'UPCOMING_SOON' | 'ANNUAL';
  targetBatches: string;
  stipendOrBenefit: string;
  overview: string;
  officialUrl: string;
  selectionProcess: string;
  keyRequirements: string[];
}

// ------------------------------------------------------------------------------------------------
// 1. TOP 34 TECH COMPANIES HIRING CYCLES (Crystal Clear Timeline: When it happens, when it reopens)
// ------------------------------------------------------------------------------------------------
export const COMPANY_HIRING_CYCLES: CompanyHiringCycle[] = [
  {
    id: 'google',
    name: 'Google India',
    category: 'Big Tech',
    locations: ['Bangalore', 'Hyderabad', 'Pune'],
    logoBg: '#4285F4',
    logoColor: '#ffffff',
    initials: 'G',
    currentStatus: 'OPEN_NOW',
    statusLabel: 'STEP Program Open Now (SWE Primary Closed)',
    lastCycleDone: 'SWE Summer Intern applications closed in Oct (started June)',
    nextCycleReopens: 'Google STEP reopens Nov–Dec; Next Summer SWE opens June 2027',
    activeMonths: [11, 12, 6, 7, 8],
    upcomingMonths: [1, 2],
    primaryIntakeMonths: 'June – August (SWE); Nov – Dec (STEP)',
    internshipPeriod: 'May – July (10–12 weeks Summer)',
    targetBatches: ['1st & 2nd Year (STEP)', '3rd Year (Summer 2026/2027)', '4th Year (FTE)'],
    accessType: 'Both (Campus + Portal)',
    quickSummary: 'Google opens summer SWE applications very early (June–Aug). If you missed it, the STEP program for 1st & 2nd years opens right now in Nov–Dec. Next summer SWE opens next June.',
    stipend: '₹1,00,000 – ₹1,25,000 / month + free food & travel allowance',
    rounds: [
      { title: 'Round 1: Resume Screen', description: 'Keyword matching on projects, GPA, and competitive programming credentials.', durationOrFormat: 'Automated + Recruiter Screen' },
      { title: 'Round 2: Online Assessment (OA)', description: '2 DSA problems (Graphs, Dynamic Programming) on Google testing platform.', durationOrFormat: '60–90 mins' },
      { title: 'Round 3: Technical Interviews (1-2 Rounds)', description: 'Google Meet coding on Google Docs/Sandbox. Core DSA, algorithms, space/time complexity.', durationOrFormat: '45 mins each' },
      { title: 'Round 4: Host Matching & Offer', description: 'Matching with specific Google product engineering teams (Maps, Search, Cloud, Ads).', durationOrFormat: 'Team discussion' }
    ],
    insiderTip: 'Early application is a hard requirement. The window shifted from historic Jan to June–Aug. Apply on day 1 with a clean 1-page LaTeX resume.',
    portalUrl: 'https://careers.google.com/jobs/results/?location=India'
  },
  {
    id: 'microsoft',
    name: 'Microsoft India',
    category: 'Big Tech',
    locations: ['Hyderabad', 'Bangalore', 'Noida'],
    logoBg: '#00A4EF',
    logoColor: '#ffffff',
    initials: 'MS',
    currentStatus: 'OPEN_NOW',
    statusLabel: 'Active Season (Campus Waves + MS Explore/Engage)',
    lastCycleDone: 'Primary campus drives ran Aug–Oct',
    nextCycleReopens: 'Off-campus supplementary drives & Engage Program open Nov–Feb',
    activeMonths: [8, 9, 10, 11, 12],
    upcomingMonths: [1, 2],
    primaryIntakeMonths: 'August – October & January – February',
    internshipPeriod: 'May – July (~12 weeks Summer)',
    targetBatches: ['Freshmen/Sophomores (Explore)', '3rd Year Summer', '4th Year (FTE)'],
    accessType: 'Both (Campus + Portal)',
    quickSummary: 'Recruits heavily from Aug–Dec. If off-campus portal is slow, Microsoft Engage hackathon in Jan–Feb acts as a parallel direct interview pipeline.',
    stipend: '₹80,000 – ₹1,00,000 / month',
    rounds: [
      { title: 'Round 1: HackerRank/Mettl OA', description: '2–3 coding questions (Trees, Arrays, DP, Strings) + CS fundamentals MCQs.', durationOrFormat: '90 mins' },
      { title: 'Round 2: Technical Interview 1', description: 'Problem-solving, algorithmic optimization, OS/DBMS basics.', durationOrFormat: '45–60 mins' },
      { title: 'Round 3: Technical Interview 2', description: 'Advanced DSA problem solving + deep dive into resume project architecture.', durationOrFormat: '45–60 mins' },
      { title: 'Round 4: AA / Director Round', description: 'Behavioral, culture fit, system scalability, and leadership scenarios.', durationOrFormat: '30–45 mins' }
    ],
    insiderTip: 'For off-campus applicants, getting an employee referral through LinkedIn engineers dramatically increases the chances of receiving an OA link.',
    portalUrl: 'https://careers.microsoft.com/us/en/search-results?qcountry=India'
  },
  {
    id: 'amazon',
    name: 'Amazon India',
    category: 'Big Tech',
    locations: ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Gurgaon'],
    logoBg: '#FF9900',
    logoColor: '#111111',
    initials: 'AMZN',
    currentStatus: 'OPEN_NOW',
    statusLabel: 'Active Hiring Waves (Summer + 6-Month Batches)',
    lastCycleDone: 'Batch 1 recruiting ran July–October',
    nextCycleReopens: 'Continuous rolling drops; Amazon WoW waves active in Feb–April',
    activeMonths: [7, 8, 9, 10, 11],
    upcomingMonths: [1, 2, 3],
    primaryIntakeMonths: 'July – September (Recruits both 6-month & summer batches)',
    internshipPeriod: 'Batch 1: Jul–Dec (6M) · Batch 2: Jan–Jun (6M) · Summer: May–Jul',
    targetBatches: ['2nd/3rd Year (Summer)', '4th Year (6-Month Semester)'],
    accessType: 'Both (Campus + Portal)',
    quickSummary: 'Amazon is unique: it hires TWO full 6-month batches every year plus summer interns. Multiple OA waves happen between August and February.',
    stipend: '₹40,000 – ₹55,000 / month (Summer) | ₹80,000+ (Full-time PPO conversion)',
    rounds: [
      { title: 'Round 1: OA Part 1 (Code & Debug)', description: '2 coding problems + 7 debugging questions + CS fundamentals.', durationOrFormat: '90 mins' },
      { title: 'Round 2: OA Part 2 (Work Style Assessment)', description: 'Simulated workplace scenarios testing Amazon 16 Leadership Principles.', durationOrFormat: '60 mins' },
      { title: 'Round 3: Virtual Technical Interview', description: 'Live coding (DSA: Trees, Graphs, HashMaps) + Leadership Principle behavioral questions.', durationOrFormat: '60 mins' }
    ],
    insiderTip: 'Amazon rejects candidates who fail the Leadership Principles even if their code works! Prepare 2 STAR-method stories for Customer Obsession and Ownership.',
    portalUrl: 'https://amazon.jobs/en/locations/bangalore-india'
  },
  {
    id: 'apple',
    name: 'Apple India',
    category: 'Big Tech',
    locations: ['Hyderabad', 'Bangalore'],
    logoBg: '#000000',
    logoColor: '#ffffff',
    initials: 'AAPL',
    currentStatus: 'OPEN_NOW',
    statusLabel: 'Rolling Official Portal Postings',
    lastCycleDone: 'No fixed calendar — postings drop continuously throughout the year',
    nextCycleReopens: 'Postings refresh every 2–4 weeks on jobs.apple.com',
    activeMonths: [7, 8, 9, 10, 11, 12, 1, 2],
    upcomingMonths: [1, 2, 3, 4],
    primaryIntakeMonths: 'Year-Round Rolling (Peaks Aug–Oct and Jan–March)',
    internshipPeriod: 'May – August or 3–6 Month Rolling',
    targetBatches: ['Pre-Final Year (3rd Year)', 'Final Year (4th Year)', 'Masters/PhD'],
    accessType: 'Off-Campus Friendly',
    quickSummary: 'Apple has NO structured campus calendar in India. 95% of hires come through direct portal applications on jobs.apple.com. Check every week.',
    stipend: '₹60,000 – ₹90,000 / month',
    rounds: [
      { title: 'Round 1: Recruiter Screen', description: 'Resume review, background check, domain fit (iOS, Systems, ML, or Web).', durationOrFormat: '30 mins' },
      { title: 'Round 2: Technical Screen', description: 'Live coding problem solving + computer architecture/CS fundamentals.', durationOrFormat: '60 mins' },
      { title: 'Round 3: Onsite / Panel Rounds (2-3)', description: 'Deep technical interviews with team managers. Heavy focus on code quality, testing, and edge cases.', durationOrFormat: '45 mins each' }
    ],
    insiderTip: 'Hyderabad roles are IS&T, QA/SDET, and Data Operations; Bangalore roles are Core iOS, macOS, and Cloud Services engineering.',
    portalUrl: 'https://jobs.apple.com/en-in/search?search=intern&sort=relevance'
  },
  {
    id: 'juspay',
    name: 'Juspay',
    category: 'Indian Unicorns',
    locations: ['Bangalore'],
    logoBg: '#0A0A0A',
    logoColor: '#00FF66',
    initials: 'JUS',
    currentStatus: 'OPEN_NOW',
    statusLabel: 'Live Active Openings (API Track)',
    lastCycleDone: 'Hiring Challenge runs every 2–3 months',
    nextCycleReopens: 'Live ATS is accepting applications RIGHT NOW for Backend Interns',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    upcomingMonths: [1, 2],
    primaryIntakeMonths: 'Continuous Quarterly Drives + Unstop Hiring Challenge',
    internshipPeriod: '3–6 Months Internship with direct PPO conversion',
    targetBatches: ['Batch 2025', 'Batch 2026', 'Batch 2027'],
    accessType: 'Off-Campus Friendly',
    quickSummary: 'Juspay is one of the highest paying Indian startups (₹27 LPA PPO). They hire continuously via their direct career API and Unstop challenges.',
    stipend: '₹40,000 / month (Intern) → ₹27 LPA Full-Time PPO',
    rounds: [
      { title: 'Round 1: Online Assessment (Trees & Graphs)', description: '3 difficult algorithmic problems (Tree operations, BFS/DFS, Dijkstra, Shortest Path).', durationOrFormat: '90 mins' },
      { title: 'Round 2: Machine Coding (Part A/B)', description: 'Build a concurrent, thread-safe data structure or distributed lock in Java/C++/Rust.', durationOrFormat: '2–3 hours' },
      { title: 'Round 3: Technical Architecture Interview', description: 'System design, FP concepts, concurrency, memory management.', durationOrFormat: '60 mins' }
    ],
    insiderTip: 'Practice multithreading, concurrency locks, and tree traversal algorithms. Functional programming (Haskell/PureScript/Rust) knowledge gives you massive brownie points.',
    portalUrl: 'https://joinus.juspay.in/careers'
  },
  {
    id: 'goldman-sachs',
    name: 'Goldman Sachs India',
    category: 'Finance & Banking',
    locations: ['Bangalore', 'Hyderabad'],
    logoBg: '#7399C6',
    logoColor: '#ffffff',
    initials: 'GS',
    currentStatus: 'CLOSED_WAIT_NEXT',
    statusLabel: 'Primary Window Closed · Reopens June–July 2027',
    lastCycleDone: 'Engineering Campus Hiring Program closed in Oct (Summer 2027 cohort selected)',
    nextCycleReopens: 'Reopens June–July 2027 for next summer cycle',
    activeMonths: [7, 8, 9, 10],
    upcomingMonths: [6, 7],
    primaryIntakeMonths: 'July – September (Engineering Campus Hiring Program)',
    internshipPeriod: 'May – July (Summer 8–10 weeks)',
    targetBatches: ['Pre-Final Year (3rd Year B.Tech)'],
    accessType: 'Both (Campus + Portal)',
    quickSummary: 'GS conducts its Engineering Campus Hiring Program (ECHP) strictly in July–October. Once the Oct aptitude/coding test concludes, intake is closed until next June.',
    stipend: '₹1,00,000 / month',
    rounds: [
      { title: 'Round 1: Aptitude & Coding OA', description: 'Aptitude (Math, Probability) + 2 Medium DSA problems + CS MCQs.', durationOrFormat: '90 mins' },
      { title: 'Round 2: Technical Interview 1', description: 'Core DSA (Trees, DP, Binary Search), OOP design patterns, SQL.', durationOrFormat: '45 mins' },
      { title: 'Round 3: Technical Interview 2', description: 'Complex problem solving, OS, concurrency, and resume project architecture.', durationOrFormat: '45 mins' },
      { title: 'Round 4: Senior Executive / MD Round', description: 'Finance interest, leadership scenarios, behavioral and culture fit.', durationOrFormat: '30 mins' }
    ],
    insiderTip: 'Goldman Sachs cares deeply about Math and Probability alongside DSA. Brush up on permutation, probability distributions, and time complexity proofs.',
    portalUrl: 'https://www.goldmansachs.com/careers/students/programs/'
  },
  {
    id: 'nvidia',
    name: 'Nvidia India',
    category: 'Big Tech',
    locations: ['Bangalore', 'Pune', 'Hyderabad'],
    logoBg: '#76B900',
    logoColor: '#ffffff',
    initials: 'NVDA',
    currentStatus: 'OPEN_NOW',
    statusLabel: 'Rolling Drops for AI, Systems & Silicon',
    lastCycleDone: 'Summer cycle began August',
    nextCycleReopens: '6-Month spring internship openings currently dropping on Workday',
    activeMonths: [8, 9, 10, 11, 12, 1],
    upcomingMonths: [1, 2],
    primaryIntakeMonths: 'August – October (Summer) & November – January (6-Month Spring)',
    internshipPeriod: 'May – July (Summer) & Jan – June (6-Month)',
    targetBatches: ['3rd Year (Summer)', '4th Year (6-Month)', 'M.Tech / PhD'],
    accessType: 'Both (Campus + Portal)',
    quickSummary: 'Nvidia hires both Software/AI and Hardware/Silicon interns. 6-month internships for 4th years are currently open on their Workday portal.',
    stipend: '₹60,000 – ₹90,000 / month',
    rounds: [
      { title: 'Round 1: Online Assessment', description: 'C/C++, Computer Architecture, OS, and 2 algorithmic questions.', durationOrFormat: '75 mins' },
      { title: 'Round 2: Systems Coding Round', description: 'Pointers, memory management, multithreading, cache memory behavior.', durationOrFormat: '60 mins' },
      { title: 'Round 3: Deep Technical / Architecture Round', description: 'CUDA, GPU architecture, low-level optimization, or ML model deployment.', durationOrFormat: '60 mins' }
    ],
    insiderTip: 'Master C++, modern C++ memory models, pointers, and operating systems. Python alone is usually not enough for Nvidia software engineering.',
    portalUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite'
  },
  {
    id: 'uber',
    name: 'Uber India',
    category: 'Big Tech',
    locations: ['Bangalore', 'Hyderabad'],
    logoBg: '#000000',
    logoColor: '#ffffff',
    initials: 'UBER',
    currentStatus: 'UPCOMING_SOON',
    statusLabel: 'Uber STAR & She++ Open Dec–February',
    lastCycleDone: 'Summer SWE primary cycle closed in Oct',
    nextCycleReopens: 'Uber STAR (2nd years) & She++ diversity pipelines open Dec–Feb',
    activeMonths: [8, 9, 10],
    upcomingMonths: [12, 1, 2],
    primaryIntakeMonths: 'August – September (Summer) & Dec – Feb (STAR & She++)',
    internshipPeriod: 'May – July (Summer)',
    targetBatches: ['2nd Year (STAR)', '3rd Year (Summer)', '4th Year (FTE)'],
    accessType: 'Both (Campus + Portal)',
    quickSummary: 'Uber is known for high-difficulty DSA and system design. 2nd-year students should look out for Uber STAR opening in winter.',
    stipend: '₹1,20,000 – ₹1,60,000 / month (Top tier in India)',
    rounds: [
      { title: 'Round 1: CodeSignal OA', description: '4 algorithmic questions (General Coding Assessment) with strict speed scoring.', durationOrFormat: '70 mins' },
      { title: 'Round 2: Technical Interview 1', description: 'Live coding on CodeSignal/CoderPad (Graph algorithms, Dynamic Programming).', durationOrFormat: '60 mins' },
      { title: 'Round 3: Technical Interview 2', description: 'Machine coding, clean OOP design, edge-case testing, and data modeling.', durationOrFormat: '60 mins' }
    ],
    insiderTip: 'Uber uses CodeSignal OA heavily. Practice on CodeSignal to get familiar with their framework scoring and speed multipliers.',
    portalUrl: 'https://www.uber.com/in/en/careers/'
  }
];

// ------------------------------------------------------------------------------------------------
// 2. COMPLETE 27 TOP HACKATHONS & CHALLENGES (Direct From User's Reference Images)
// ------------------------------------------------------------------------------------------------
export const ALL_FLAGSHIP_HACKATHONS: HackathonItem[] = [
  {
    id: 'walmart-sparkathon',
    name: 'Walmart Sparkathon',
    company: 'Walmart Global Tech India',
    expectedMonth: 'June – July',
    expectedMonthNum: [6, 7],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens in June (Annual)',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'All Engineering Students (Batches 2025, 2026, 2027, 2028)',
    rewards: 'Direct SDE Summer Intern & Full-Time PPIs (CTC ₹24–32 LPA) + ₹6 Lakh Cash Prizes',
    format: 'Round 1: Tech MCQs → Round 2: Prototype Submission → Round 3: Live Presentation at Bangalore HQ',
    overview: 'Walmart’s open hackathon for all students to build novel retail, supply chain, and generative AI solutions with direct hiring fast-tracks.',
    officialUrl: 'https://unstop.com/hackathons/walmart-sparkathon'
  },
  {
    id: 'juspay-hiring-challenge',
    name: 'Juspay Hiring Challenge',
    company: 'Juspay',
    expectedMonth: 'Quarterly (Next: Dec–Jan)',
    expectedMonthNum: [12, 1, 4, 7],
    status: 'OPEN_NOW',
    statusLabel: 'Active / Frequent Cohorts',
    category: 'Hiring & PPI Challenge',
    targetBatches: '1st, 2nd, 3rd, 4th Year B.Tech/Dual Degree',
    rewards: 'Direct SDE Backend Intern Offer (₹40,000/mo) + ₹27 LPA Full-Time PPO',
    format: 'Round 1: DSA Coding OA (Trees/Graphs) → Round 2: Machine Coding (Concurrency) → Technical Interview',
    overview: 'One of the best off-campus pathways into fintech engineering. Focuses on concurrency, multithreading, and systems.',
    officialUrl: 'https://unstop.com'
  },
  {
    id: 'adobe-india-hackathon',
    name: 'Adobe India Hackathon',
    company: 'Adobe',
    expectedMonth: 'August – September',
    expectedMonthNum: [8, 9],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens in August',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'Pre-final & Final Year Students',
    rewards: 'Direct PPIs for Adobe Product Intern (₹1,00,000/mo) & FTE (CTC ₹40+ LPA)',
    format: 'Round 1: Online Coding & Creative Tech Challenge → Round 2: Hackathon Prototype Sprint',
    overview: 'Adobe recruits for creative cloud, document cloud, and AI engineering teams through competitive prototyping.',
    officialUrl: 'https://adobe.com/careers'
  },
  {
    id: 'walmart-codehers',
    name: 'Walmart CodeHers',
    company: 'Walmart Global Tech India',
    expectedMonth: 'February – April',
    expectedMonthNum: [2, 3, 4],
    status: 'UPCOMING_SOON',
    statusLabel: 'Next Wave in Feb 2027',
    category: 'Diversity (Women in Tech)',
    targetBatches: 'Female Engineering Students (2nd, 3rd, 4th Year)',
    rewards: 'Over 250+ Direct SDE Intern & FTE Job Offers (Stipend ₹80k–1L/mo, FTE ₹24–27 LPA)',
    format: 'Round 1: CS Fundamentals MCQ → Round 2: 2 Algorithmic Coding Questions → Direct Interviews',
    overview: 'India’s largest female-only tech competition, offering hundreds of summer internship and placement offers directly.',
    officialUrl: 'https://unstop.com/hackathons/walmart-codehers'
  },
  {
    id: 'bny-mellon-code-divas',
    name: 'BNY Mellon Code Divas',
    company: 'BNY Mellon',
    expectedMonth: 'October – November',
    expectedMonthNum: [10, 11],
    status: 'OPEN_NOW',
    statusLabel: 'Active Cohort / Recent Waves',
    category: 'Diversity (Women in Tech)',
    targetBatches: 'Women in Engineering (Batches 2025, 2026, 2027)',
    rewards: 'Direct Summer Internships & FTE Offers at BNY Mellon Pune & Chennai Tech Centers',
    format: 'Online Algorithmic Coding Challenge (2 Problems) → Hackathon Phase → Virtual Interviews',
    overview: 'Premier diversity hiring initiative by the global investment banking giant.',
    officialUrl: 'https://unstop.com'
  },
  {
    id: 'jpmc-code-for-good',
    name: 'JPMC Code for Good Hackathon',
    company: 'JPMorgan Chase & Co.',
    expectedMonth: 'March – May',
    expectedMonthNum: [3, 4, 5],
    status: 'UPCOMING_SOON',
    statusLabel: 'Registration Opens March',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'Pre-final Year (3rd Year B.Tech)',
    rewards: 'Summer Internship Offers at JPMC (Stipend ₹75,000/mo) with 90%+ PPO conversion rate',
    format: 'HireVue Video/Coding Screen → 24-Hour Non-Profit Hackathon with JPMC Mentors → Direct Offers',
    overview: 'Participants collaborate with non-profits to build real software. JPMC recruiters observe teams live and extend summer intern offers.',
    officialUrl: 'https://careers.jpmorgan.com/global/en/students/programs/code-for-good'
  },
  {
    id: 'morgan-stanley-code-to-give',
    name: 'Morgan Stanley Code to Give Hackathon',
    company: 'Morgan Stanley India',
    expectedMonth: 'August – September',
    expectedMonthNum: [8, 9],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens in August',
    category: 'Hiring & PPI Challenge',
    targetBatches: '3rd & 4th Year Engineering Students',
    rewards: 'Pre-Placement Interviews (PPI) for Summer Intern & FTE Roles + Mentorship',
    format: 'Idea Proposal → Virtual Hackathon Sprint → Presentation to Morgan Stanley Technology Leaders',
    overview: 'Teams build applications for social good. Top teams receive direct interview fast-tracks.',
    officialUrl: 'https://www.morganstanley.com/careers'
  },
  {
    id: 'meesho-dice-challenge',
    name: 'Meesho Dice Challenge',
    company: 'Meesho',
    expectedMonth: 'May – June',
    expectedMonthNum: [5, 6],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens May',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'All Engineering Batches',
    rewards: 'Direct SDE-1 and Intern Offers + ₹3.5 Lakh Prize Pool',
    format: 'Round 1: Online Quiz → Round 2: Coding Assessment → Round 3: Final Tech Pitch',
    overview: 'Meesho’s flagship annual tech challenge for high-growth e-commerce systems engineering.',
    officialUrl: 'https://unstop.com'
  },
  {
    id: 'amazon-ml-challenge',
    name: 'Amazon ML Challenge India',
    company: 'Amazon India',
    expectedMonth: 'July – August',
    expectedMonthNum: [7, 8],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Annual July Cycle',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'All College Students (B.Tech, M.Tech, PhD)',
    rewards: 'Direct Applied Scientist / ML Intern PPIs + Cash Awards',
    format: 'Real-World E-Commerce ML Dataset Challenge (Computer Vision, NLP, Multimodal Classification)',
    overview: 'India’s biggest machine learning competition for college students, directly evaluated on leaderboards by Amazon scientists.',
    officialUrl: 'https://www.amazon.jobs/en/landing_pages/ml-challenge'
  },
  {
    id: 'hackon-with-amazon',
    name: 'HackOn with Amazon',
    company: 'Amazon India',
    expectedMonth: 'July – August',
    expectedMonthNum: [7, 8],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens July',
    category: 'Hiring & PPI Challenge',
    targetBatches: '3rd & 4th Year Students',
    rewards: 'Direct SDE Intern & FTE Pre-Placement Interviews',
    format: 'Round 1: Coding & Aptitude → Round 2: Prototype Submission → Round 3: National Grand Finale',
    overview: 'Amazon’s flagship nationwide campus hackathon offering direct interview paths.',
    officialUrl: 'https://amazon.jobs'
  },
  {
    id: 'microsoft-imagine-cup',
    name: 'Microsoft Imagine Cup',
    company: 'Microsoft',
    expectedMonth: 'October – January',
    expectedMonthNum: [10, 11, 12, 1],
    status: 'OPEN_NOW',
    statusLabel: 'Open for 2027 Season',
    category: 'Global Cup',
    targetBatches: 'All College Students Worldwide',
    rewards: '$100,000 USD Grand Prize + Mentorship from Microsoft CEO Satya Nadella + Azure Grants',
    format: 'Global Student Tech Startup Competition: Build an AI-powered MVP using Microsoft Azure.',
    overview: 'The Olympics of student technology. Immense prestige and unmatched career leverage.',
    officialUrl: 'https://imaginecup.microsoft.com/'
  },
  {
    id: 'oracle-cloud-challenge',
    name: 'Oracle Cloud Developer Challenges',
    company: 'Oracle',
    expectedMonth: 'September – November',
    expectedMonthNum: [9, 10, 11],
    status: 'OPEN_NOW',
    statusLabel: 'Active Autumn Cohorts',
    category: 'Ideation & Prototyping',
    targetBatches: '2nd, 3rd, 4th Year Engineering',
    rewards: 'Oracle Cloud Certification Vouchers + Direct Recruiter Fast-Tracks',
    format: 'Build Cloud-native solutions on OCI (Autonomous DB, Cloud Functions, AI Services).',
    overview: 'Designed to identify skilled cloud and backend architects for Oracle India centers.',
    officialUrl: 'https://developer.oracle.com/'
  },
  {
    id: 'tata-crucible-campus',
    name: 'Tata Crucible Campus Quiz & Tech Challenges',
    company: 'Tata Group',
    expectedMonth: 'February – April',
    expectedMonthNum: [2, 3, 4],
    status: 'UPCOMING_SOON',
    statusLabel: 'Coming in Feb',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'All Undergraduate & Postgraduate Students',
    rewards: '₹2.5 Lakh Cash Prize per Region + Direct Fast-Track Hiring at Tata Companies (TCS, Tata Elxsi)',
    format: 'Preliminary Online Rounds → Regional Cluster Finals → National Grand Finale',
    overview: 'India’s largest inter-collegiate corporate challenge with enormous national visibility.',
    officialUrl: 'https://tatacrucible.com/'
  },
  {
    id: 'google-girl-hackathon',
    name: 'Google Girl Hackathon India',
    company: 'Google India',
    expectedMonth: 'January – March',
    expectedMonthNum: [1, 2, 3],
    status: 'UPCOMING_SOON',
    statusLabel: 'Opens in January 2027',
    category: 'Diversity (Women in Tech)',
    targetBatches: 'Female Students in CS/Circuit Branches (Batches 2026, 2027, 2028)',
    rewards: 'Direct Interview Shortlists for Google SWE Intern and Full-Time Positions',
    format: 'Round 1: Google Online Challenge (DSA) → Round 2: Design Hackathon Sprint → Virtual Onsite',
    overview: 'One of the most prestigious diversity programs in India, fast-tracking women engineers to Google SWE interviews.',
    officialUrl: 'https://buildyourfuture.withgoogle.com/events/girl-hackathon'
  },
  {
    id: 'flipkart-grid',
    name: 'Flipkart GRiD (Software Track)',
    company: 'Flipkart',
    expectedMonth: 'June – August',
    expectedMonthNum: [6, 7, 8],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens in June',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'All Engineering Batches (1st to 4th Year)',
    rewards: 'Direct SDE-1 / Intern PPIs (CTC ₹32+ LPA, Intern ₹1 Lakh/month) + ₹10 Lakh Cash Pool',
    format: 'Level 1: MCQ & Coding Test → Level 2: Hackathon Prototype → Grand Finale at Bangalore HQ',
    overview: 'The benchmark hiring hackathon in India. Top finalists regularly convert to 32 LPA Flipkart SDE offers.',
    officialUrl: 'https://unstop.com/hackathons/flipkart-grid'
  },
  {
    id: 'flipkart-runway',
    name: 'Flipkart Runway',
    company: 'Flipkart',
    expectedMonth: 'March – April',
    expectedMonthNum: [3, 4],
    status: 'UPCOMING_SOON',
    statusLabel: 'Opens March 2027',
    category: 'Diversity (Women in Tech)',
    targetBatches: '2nd Year Women Engineering Students (Batch 2028)',
    rewards: 'Summer Internship at Flipkart (₹1,00,000/mo) at end of 2nd year!',
    format: 'Round 1: Online Quiz → Round 2: Coding Test → Round 3: Technical Interviews',
    overview: 'Provides early 2nd-year women engineers with a paid summer internship at Flipkart, paving the way for PPO.',
    officialUrl: 'https://unstop.com/hackathons/flipkart-runway'
  },
  {
    id: 'myntra-hackerramp',
    name: 'Myntra HackerRamp (Campus Edition)',
    company: 'Myntra',
    expectedMonth: 'July – August',
    expectedMonthNum: [7, 8],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens July',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'Pre-final (3rd) & Final Year (4th)',
    rewards: 'Direct SDE Intern & FTE Interviews + Cash Rewards',
    format: 'Theme-Based Ideation → Functional Prototype Sprint → Bangalore Finale',
    overview: 'Solve real-world customer journey, logistics, and visual search problems for India’s top fashion platform.',
    officialUrl: 'https://unstop.com/hackathons/myntra-hackerramp'
  },
  {
    id: 'sih-hackathon',
    name: 'Smart India Hackathon (SIH)',
    company: 'Govt. of India & AICTE',
    expectedMonth: 'August – December',
    expectedMonthNum: [8, 9, 10, 11, 12],
    status: 'OPEN_NOW',
    statusLabel: 'Grand Finale Season',
    category: 'Ideation & Prototyping',
    targetBatches: 'All Undergraduate & Postgraduate Students',
    rewards: 'National Recognition, ₹1 Lakh per Problem Statement, Direct Govt & Corporate Hiring Attention',
    format: 'College Internal Hackathon → Problem Statement Selection → 36-Hour Non-stop National Finale',
    overview: 'World’s biggest open innovation hackathon. Winning SIH is a golden credential on any software engineer resume.',
    officialUrl: 'https://www.sih.gov.in/'
  },
  {
    id: 'goldman-sachs-hackathon',
    name: 'Goldman Sachs India Hackathon',
    company: 'Goldman Sachs',
    expectedMonth: 'September – October',
    expectedMonthNum: [9, 10],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Annual Autumn Cycle',
    category: 'Hiring & PPI Challenge',
    targetBatches: 'Pre-final & Final Year Students',
    rewards: 'Pre-Placement Interviews for GS Bangalore & Hyderabad Engineering Hubs',
    format: 'Online Algorithmic Coding → FinTech Prototype Sprint → Virtual Onsite Presentation',
    overview: 'Direct problem-solving challenge in algorithmic trading, distributed ledgers, and financial infrastructure.',
    officialUrl: 'https://www.goldmansachs.com/careers'
  },
  {
    id: 'samsung-solve-for-tomorrow',
    name: 'Samsung Solve for Tomorrow',
    company: 'Samsung India',
    expectedMonth: 'April – June',
    expectedMonthNum: [4, 5, 6],
    status: 'ANNUAL_CLOSED',
    statusLabel: 'Opens in April',
    category: 'Ideation & Prototyping',
    targetBatches: 'Ages 16–22 (All College Students)',
    rewards: '₹1.5 Crore Prize Pool + Incubation at IIT Delhi + Mentorship by Samsung R&D Engineers',
    format: 'Ideation Submission → Prototype Development Phase → Final Pitch to Samsung Leadership',
    overview: 'National flagship innovation challenge focused on Environmental Tech, Healthcare, and Education.',
    officialUrl: 'https://www.samsung.com/in/solvefortomorrow/'
  }
];

// ------------------------------------------------------------------------------------------------
// 3. COMPLETE STUDENT PROGRAMS & FELLOWSHIPS (Direct From User's Reference Images 1 & 4)
// ------------------------------------------------------------------------------------------------
export const ALL_STUDENT_PROGRAMS: StudentProgramItem[] = [
  // --- Early Career & Diversity ---
  {
    id: 'google-step',
    name: 'Google STEP Internship (Student Training in Engineering)',
    company: 'Google India',
    type: 'Early Career & Diversity',
    expectedMonth: 'November – December',
    status: 'OPEN_NOW',
    targetBatches: '1st & 2nd Year CS Students (Batches 2027 & 2028)',
    stipendOrBenefit: '₹1,00,000 / month + Full Google Mentorship',
    overview: 'Google’s flagship internship specifically for 1st and 2nd-year undergraduate students, focusing on personal development and hands-on coding.',
    selectionProcess: 'Resume Screening → Online Coding Challenge → 2 Technical DSA Interviews → Offer',
    keyRequirements: ['Strong coding fundamentals in C++, Java, or Python', 'Currently in 1st or 2nd year of B.Tech/BE', 'Good academic standing'],
    officialUrl: 'https://buildyourfuture.withgoogle.com/programs/step'
  },
  {
    id: 'microsoft-explore',
    name: 'Microsoft Explore Program',
    company: 'Microsoft India',
    type: 'Early Career & Diversity',
    expectedMonth: 'December – February',
    status: 'UPCOMING_SOON',
    targetBatches: '1st & 2nd Year Students',
    stipendOrBenefit: '₹80,000 / month + Mentorship from MS Engineers',
    overview: 'A 12-week summer internship for freshmen and sophomores that rotates between Software Engineering (SWE) and Product Management (PM).',
    selectionProcess: 'Resume Review → Online Assessment → 2 Technical & Behavioral Rounds',
    keyRequirements: ['1st or 2nd year standing in Computer Science', 'Passion for tech and software design'],
    officialUrl: 'https://careers.microsoft.com/students/us/en/usexploreprogram'
  },
  {
    id: 'uber-star',
    name: 'Uber STAR Internship',
    company: 'Uber India',
    type: 'Early Career & Diversity',
    expectedMonth: 'January – February',
    status: 'UPCOMING_SOON',
    targetBatches: '2nd Year Students (Batch 2028)',
    stipendOrBenefit: '₹1,20,000 / month',
    overview: 'Dedicated paid summer internship at Uber for sophomore students to build scalable distributed systems and backend infrastructure.',
    selectionProcess: 'CodeSignal Assessment → Technical Interviews',
    keyRequirements: ['Sophomore / 2nd-year student', 'Data structures and problem-solving skills'],
    officialUrl: 'https://www.uber.com/in/en/careers/'
  },
  {
    id: 'amazon-wow',
    name: 'Amazon WoW Program (Women in Technology)',
    company: 'Amazon India',
    type: 'Early Career & Diversity',
    expectedMonth: 'Year-Round (Key Waves Feb–April)',
    status: 'OPEN_NOW',
    targetBatches: 'Women Engineering Students (All Years)',
    stipendOrBenefit: 'Fast-Track Pathway to Amazon SDE Intern & FTE Offers',
    overview: 'Mentorship, live tech sessions, and direct interview assessment cohorts for women in tech across India.',
    selectionProcess: 'Registration → Technical Assessments → Interview Shortlists',
    keyRequirements: ['Female student enrolled in BE/B.Tech/MCA/M.Tech'],
    officialUrl: 'https://amazonwowindia.splashthat.com/'
  },
  {
    id: 'linkedin-coachin',
    name: 'LinkedIn CoachIN Program',
    company: 'LinkedIn India',
    type: 'Early Career & Diversity',
    expectedMonth: 'January – February',
    status: 'UPCOMING_SOON',
    targetBatches: '2nd Year Female Engineering Students',
    stipendOrBenefit: 'Exclusive Mentorship + Fast-Track to LinkedIn Summer Internship',
    overview: 'A 4-month mentorship program paired with LinkedIn senior engineers covering coding, system design, and soft skills.',
    selectionProcess: 'Online Coding Test (DSA) → Shortlisting',
    keyRequirements: ['2nd-year female student', 'Solid grasp of algorithms'],
    officialUrl: 'https://careers.linkedin.com/'
  },
  {
    id: 'desis-ascend',
    name: 'DE Shaw DESIS Ascend & Educare',
    company: 'D. E. Shaw India',
    type: 'Early Career & Diversity',
    expectedMonth: 'November – December',
    status: 'OPEN_NOW',
    targetBatches: 'Women in Tech (2nd & 3rd Year)',
    stipendOrBenefit: 'Direct PPI Opportunities at DE Shaw (₹1,50,000/mo) + Cash Fellowship',
    overview: 'Flagship diversity cohort by top quantitative investment firm D. E. Shaw, offering rigorous masterclasses and internship pathways.',
    selectionProcess: 'Online Aptitude & Coding Test → Technical Interviews',
    keyRequirements: ['Top academic record', 'Strong problem solving and mathematical ability'],
    officialUrl: 'https://www.deshawindia.com/'
  },
  {
    id: 'amazon-afe',
    name: 'Amazon Future Engineer (AFE) Scholarship & Internship',
    company: 'Amazon India',
    type: 'Early Career & Diversity',
    expectedMonth: 'August – October',
    status: 'ANNUAL',
    targetBatches: '1st Year Female Students',
    stipendOrBenefit: '₹50,000/year Scholarship + Guaranteed Amazon Mentorship & Intern Track',
    overview: 'Supports high-potential women in engineering from underserved backgrounds throughout their college degrees.',
    selectionProcess: 'Application Review → Aptitude Test → Family Income & Merit Verification',
    keyRequirements: ['First-year female student pursuing B.Tech/BE in CS or allied fields'],
    officialUrl: 'https://www.amazonfutureengineer.in/'
  },
  {
    id: 'amazon-ml-summer-school',
    name: 'Amazon ML Summer School',
    company: 'Amazon India',
    type: 'Early Career & Diversity',
    expectedMonth: 'June – July',
    status: 'ANNUAL',
    targetBatches: 'Pre-final & Final Year Students',
    stipendOrBenefit: 'Free Intensive Training by Amazon Scientists + Fast-Track ML Interviews',
    overview: 'Deep dive into Supervised Learning, Deep Neural Networks, Dimensionality Reduction, and Reinforcement Learning.',
    selectionProcess: 'Math & Coding Assessment (Linear Algebra, Calculus, Python, Basic ML)',
    keyRequirements: ['Solid mathematical foundations', 'Prior exposure to Python and ML libraries'],
    officialUrl: 'https://www.amazon.science/'
  },

  // --- Open Source & Research Fellowships ---
  {
    id: 'gsoc',
    name: 'Google Summer of Code (GSoC)',
    company: 'Google / Open Source Organizations',
    type: 'Open Source & Research',
    expectedMonth: 'January – April',
    status: 'UPCOMING_SOON',
    targetBatches: 'All College Students (18+)',
    stipendOrBenefit: 'Stipend ~$1,500 – $3,000 USD + Elite Open Source Credential',
    overview: 'Work with major open source foundations (Linux, Apache, Mozilla, Chromium, Python) on 12-week coding projects.',
    selectionProcess: 'Contribute to Org Repos → Submit Project Proposal → Org Selection',
    keyRequirements: ['Git & GitHub proficiency', 'Ability to communicate with open source maintainers'],
    officialUrl: 'https://summerofcode.withgoogle.com/'
  },
  {
    id: 'outreachy',
    name: 'Outreachy Remote Internships',
    company: 'Outreachy / Software Freedom Conservancy',
    type: 'Open Source & Research',
    expectedMonth: 'January (May Cohort) & August (Dec Cohort)',
    status: 'UPCOMING_SOON',
    targetBatches: 'Open to Underrepresented Groups in Tech',
    stipendOrBenefit: '$7,000 USD Total Stipend (Remote)',
    overview: 'Paid, remote open-source internships with mentorship for people facing systemic bias or discrimination.',
    selectionProcess: 'Initial Application Essay → Contribution Period (1 Month) → Final Selection',
    keyRequirements: ['Submit valid open-source PR during contribution window'],
    officialUrl: 'https://www.outreachy.org/'
  },
  {
    id: 'drdo-isro',
    name: 'DRDO & ISRO Student Research Internships',
    company: 'Govt. of India Defense & Space Centers',
    type: 'Open Source & Research',
    expectedMonth: 'October – November & March – April',
    status: 'OPEN_NOW',
    targetBatches: '3rd & 4th Year B.Tech / M.Tech Students',
    stipendOrBenefit: 'Official Research Experience + Security Clearance Access',
    overview: 'Hands-on research internships at DRDO labs and ISRO centers (VSSC, SAC, URSC) in embedded systems, aerospace software, and radar processing.',
    selectionProcess: 'NOC from College Head / TPO → Portal Application → Scientific Committee Review',
    keyRequirements: ['Minimum 65–70% or 7.5+ CGPA', 'Indian Citizenship', 'Formal NOC from College Principal'],
    officialUrl: 'https://www.isro.gov.in/Internship.html'
  },

  // --- Leadership & Community Programs ---
  {
    id: 'github-campus-expert',
    name: 'GitHub Campus Expert Program',
    company: 'GitHub',
    type: 'Community & Leadership',
    expectedMonth: 'February & August',
    status: 'UPCOMING_SOON',
    targetBatches: 'All College Students',
    stipendOrBenefit: 'Official GitHub Swag + Event Sponsorship + Global Network',
    overview: 'Student leaders trained by GitHub to build and grow technology communities, organize hackathons, and mentor peers on campus.',
    selectionProcess: 'Application Form → Video Submission → Community Training Modules',
    keyRequirements: ['Passion for open source and community building', 'At least 1 year left before graduation'],
    officialUrl: 'https://githubcampus.expert/'
  },
  {
    id: 'mlsa',
    name: 'Microsoft Learn Student Ambassador (MLSA)',
    company: 'Microsoft',
    type: 'Community & Leadership',
    expectedMonth: 'Rolling (Applications Reviewed Quarterly)',
    status: 'OPEN_NOW',
    targetBatches: 'All College Students',
    stipendOrBenefit: '$150/mo Azure Credits + Free Certifications (AZ-900, AI-900) + Swag',
    overview: 'Global group of campus ambassadors who lead technical workshops, masterclasses, and mentor peers on Microsoft technologies.',
    selectionProcess: 'Online Application + Short Video Essay explaining how you teach technology to others.',
    keyRequirements: ['Active college student', 'Desire to host technical workshops'],
    officialUrl: 'https://studentambassadors.microsoft.com/'
  },
  {
    id: 'gcp-facilitator',
    name: 'Google Cloud Facilitator & GDSC Lead Program',
    company: 'Google Developers',
    type: 'Community & Leadership',
    expectedMonth: 'April – June (GDSC) & Sep – Nov (Facilitator)',
    status: 'OPEN_NOW',
    targetBatches: 'All Undergraduate Students',
    stipendOrBenefit: 'Google Cloud Skill Badges + Official Swag Packs + Direct Google Mentorship',
    overview: 'Campus programs empowering students to learn Cloud Computing, Kubernetes, and Generative AI on Google Cloud Skills Boost.',
    selectionProcess: 'Campus Nomination / Application → Video Interview → Selection',
    keyRequirements: ['Leadership track record', 'Interest in Google Cloud technologies'],
    officialUrl: 'https://developers.google.com/community/gdsc'
  },
  {
    id: 'aws-community-builder',
    name: 'AWS Community Builder & Cloud Ambassador',
    company: 'Amazon Web Services',
    type: 'Community & Leadership',
    expectedMonth: 'January & July',
    status: 'UPCOMING_SOON',
    targetBatches: 'All Tech Students & Builders',
    stipendOrBenefit: '$500 AWS Credits + Free Certification Vouchers + Direct AWS PM Access',
    overview: 'Program offering technical resources, mentorship, and networking for passionate AWS builders and content creators.',
    selectionProcess: 'Portfolio Review (Technical blogs, open source repos, presentations)',
    keyRequirements: ['Demonstrated technical sharing (blogs, talks, GitHub repos)'],
    officialUrl: 'https://aws.amazon.com/developer/community/community-builders/'
  }
];
