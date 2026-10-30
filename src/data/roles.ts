// Experience, research, leadership and earlier history, transcribed from contents.md §5–7 and §13.
export type RoleKind = 'work' | 'teaching' | 'research' | 'leadership' | 'earlier';

export interface Role {
  id: string;
  kind: RoleKind;
  title: string;
  org: string;
  place?: string;
  dates: string;
  /** For ordering, newest first: YYYY-MM of the start. */
  start: string;
  cardLine: string;
  bullets: string[];
  skills?: string[];
  link?: { label: string; href: string };
  caseStudy?: string;
  /** Name of a Hairline figure: the package's, or a custom one in src/scripts/hairline.ts. */
  figure?: string;
}

export const roles: Role[] = [
  {
    id: 'ta-cs103', kind: 'teaching', title: 'Teaching Assistant, CS 103: Introduction to Python',
    org: 'UAB Department of Computer Science', place: 'Birmingham, AL', dates: 'Aug 2026 – Present', start: '2026-08',
    cardLine: 'Primary TA for a 60+ student intro Python course: sole grader, teaches a ~40-student weekly lab.',
    bullets: [
      'Appointed primary TA by the instructor for a 60+ student course (~10 hrs/week).',
      'Grade all homework and lab assignments as the course’s only grader, keeping feedback consistent for every student.',
      'Teach my own weekly 2-hour lab section of ~40 students, walking through hands-on exercises from first principles.',
      'Hold 2 hours of office hours a week on programming concepts, problem-solving and students’ own code.',
      'Work with a second TA, who leads the smaller lab section, on day-to-day course operations.',
      'Took CS 103 as a student in Fall 2025 (A) and became its primary TA a year later.',
    ],
    skills: ['Python', 'Teaching', 'Code review', 'Technical communication'], figure: 'terminal',
  },
  {
    id: 'samac', kind: 'work', title: 'Web Content Editor Student Assistant (Front-End Web Developer)',
    org: 'UAB Student Affairs Marketing & Communications (SAMAC)', place: 'Birmingham, AL', dates: 'Oct 2025 – Present', start: '2025-10',
    cardLine: 'Maintain 1,500+ pages across 20+ UAB department sites in Joomla 5 with custom HTML, CSS and JavaScript.',
    bullets: [
      'Maintain and update 1,500+ pages across 20+ UAB department sites in Joomla 5, writing custom HTML, CSS, JavaScript and Bootstrap.',
      'Converted a 40-page PDF annual report into an interactive, animated webpage as part of a 3-developer team.',
      'Asked to update a department’s video library page, delivered a full redesign: content reorganized and categorized, a cleaner accessible layout and a clear information hierarchy.',
      'Run ongoing digital accessibility reviews (WCAG, WAVE) of UAB pages, starting with Dining.',
      'Started in my first semester, at up to 18 hrs/week alongside a full course load.',
    ],
    skills: ['Joomla 5', 'HTML', 'CSS', 'JavaScript', 'Bootstrap', 'WCAG/WAVE'], figure: 'format',
  },
  {
    id: 'bor-intern', kind: 'work', title: 'Web Developer Intern', org: 'BOR Realty, LLC', place: 'Phoenix, AZ',
    dates: 'Summer 2026', start: '2026-05',
    cardLine: 'Shipped the brokerage’s bilingual (EN/RU) site, 18 pages in Next.js 14.',
    bullets: [
      'Shipped the brokerage’s bilingual (EN/RU) site, 18 pages in Next.js 14.',
      'Automated a 689-video library with the YouTube Data API and daily GitHub Actions syncs.',
      'WCAG 2.1 AA with 0 axe-core violations and 300+ Playwright tests.',
    ],
    skills: ['Next.js 14', 'TypeScript', 'GitHub Actions', 'Playwright'], caseStudy: 'bor-realty', figure: 'web',
  },
  {
    id: 'tutor', kind: 'teaching', title: 'Academic Peer Tutor', org: 'UAB Vulcan Materials Academic Success Center',
    place: 'Birmingham, AL', dates: 'Feb 2026 – May 2026', start: '2026-02',
    cardLine: 'Tutored 12+ STEM courses; the center’s only General Physics I tutor.',
    bullets: [
      'Tutored students across 12+ STEM courses, including Calculus I/II, General Physics and Python (~5–6 hrs/week).',
      'The center’s only General Physics I tutor.',
      'Used inquiry-based problem solving, graphing and online simulations to help students build intuition.',
      'Taught TI-Nspire CX II use for calculus: verifying solutions, writing custom functions, graphing 3D surfaces.',
      'Moved into the CS 103 primary TA role in Fall 2026.',
    ],
    skills: ['Calculus', 'Physics', 'Python'], figure: 'tutor',
  },
  {
    id: 'plasma-research', kind: 'research', title: 'Undergraduate Researcher, Computational Plasma Physics',
    org: 'Computational plasma physics research group, UAB Department of Physics', place: 'Birmingham, AL', dates: 'May 2026 – Present', start: '2026-05',
    cardLine: 'Laser-ablation and fluid-dynamics simulations in C/Basilisk on UAB’s Cheaha supercomputer, supporting machine-learning-guided thin-film growth.',
    bullets: [
      'Write and run coupled laser-ablation and fluid-dynamics simulations of laser-generated plasmas in C with the Basilisk PDE framework.',
      'Run workloads on UAB’s Cheaha supercomputer; learned Linux and Bash from scratch to manage HPC jobs, environments and data.',
      'Work with synthetic plasma datasets in which plasma temperature (T) and ionization fraction (Xe) serve as ground truth for testing ML models.',
      'Write Python scripts that process, visualize and analyze simulation output into the plots and comparisons the team uses to evaluate models.',
      'Support research on ML-guided pulsed laser deposition (PLD), where Gaussian Process Bayesian Optimization builds surrogate models of plasma conditions from a small number of experiments.',
      'Co-author, “Machine Learning-Assisted Pulsed Laser Deposition Based on Plasma Optical Emission Signatures,” accepted for an oral presentation at the AVS 72nd International Symposium, Pittsburgh, Nov 8–13, 2026.',
    ],
    skills: ['C', 'Basilisk', 'Python', 'Bash', 'Linux', 'HPC (Cheaha)', 'Gaussian Process Bayesian Optimization', 'Scientific visualization'], figure: 'cabinet',
  },
  {
    id: 'aic', kind: 'leadership', title: 'Founder & President, The AI Collective at UAB (AIC)', org: 'The AI Collective at UAB',
    dates: 'Feb 2026 – Present', start: '2026-02',
    cardLine: 'Founded UAB’s first interdisciplinary AI organization, to make practical AI skills accessible to students in every major.',
    bullets: [
      'Founded UAB’s first interdisciplinary AI organization, advised by faculty in the Department of Computer Science; wrote the constitution and appointed the officers.',
      'Built a 4-officer executive board and a 10-member founding team.',
      'Designed 5 program tracks: prompt engineering, productivity, coding and research literacy, AI ethics roundtables, industry briefings.',
      'First event this semester (Fall 2026); building partnerships with ACM, USGA, Women in Technology, faculty and alumni.',
    ],
    link: { label: 'AIC on CampusLabs', href: 'https://uab.campuslabs.com/engage/actioncenter/organization/aic' }, figure: 'hub',
  },
  {
    id: 'acm', kind: 'leadership', title: 'Events Chair, ACM at UAB', org: 'ACM at UAB',
    dates: 'Aug 2026 – Present (active member since Oct 2025)', start: '2026-08',
    cardLine: 'Plan the full-year event calendar for UAB’s largest computing student organization.',
    bullets: [
      'ACM at UAB is the local chapter of the world’s largest computing society and the largest CS organization on campus.',
      'Plan and run the chapter’s full-year calendar: LeetCode nights, alumni panels, internship recruiting events and networking mixers.',
      'Handle outreach to companies for event collaborations.',
      'Developing joint programming with The AI Collective.',
    ],
    figure: 'keyboard',
  },
  {
    id: 'usga-web', kind: 'leadership', title: 'Website Coordinator, Undergraduate Student Government Association (USGA)',
    org: 'USGA, Division of Communications', dates: 'Aug 2026 – Present', start: '2026-08',
    cardLine: 'The only person in charge of updating and redesigning the official USGA website (Joomla 5).',
    bullets: [
      'In charge of the official USGA website, the main digital channel between student government and the student body.',
      'Build and maintain the site in Joomla 5 with custom HTML, CSS and JavaScript.',
      'Planning and leading a major redesign of its structure, visual design and usability.',
    ],
    figure: 'stack',
  },
  {
    id: 'freshman-forum', kind: 'leadership', title: 'Freshman Forum Member, USGA · Member of the Year', org: 'USGA',
    dates: 'Sep 2025 – May 2026', start: '2025-09',
    cardLine: 'Founded the Micro-Internships pilot with the UAB Career Center, now a long-term program (Project One).',
    bullets: [
      'Selected as 1 of 31 from 100+ applicants to represent the freshman class.',
      'Conceived and founded the Micro-Internships initiative with the UAB Career Center, handling the networking, employer outreach and program planning.',
      'Secured $2,000 in stipend funding and placed 10 students in project-based micro-internships across 7 UAB departments (Spring 2026).',
      'Adopted long-term as Project One, a cohort-based USGA and Career Center program with dedicated Career Center staff, expanded to 20 host sites for 20 students, including off-campus organizations.',
      'Remain a point of contact: helped match this year’s students to sites and will speak at the closing ceremony.',
      'Led a 6-student team with the Career Center Director to run a campus-wide Career Readiness Week (resume workshops, job fairs, headshots, professional development sessions).',
      'The only member in direct mentorship with the USGA President.',
      'Named inaugural Member of the Month (Oct 2025) and Freshman Forum Member of the Year.',
    ],
    figure: 'relay',
  },
  {
    id: 'ambassador', kind: 'leadership', title: 'UAB Ambassador', org: 'Office of Student Engagement',
    dates: 'Apr 2026 – Present', start: '2026-04',
    cardLine: 'Selected 1 of 16 new Ambassadors from 140+ applicants as an official student host of the university.',
    bullets: [
      'Selected as 1 of 16 new Ambassadors from 140+ applicants for UAB Ambassadors (founded 1978), the university’s official student hosts.',
      'Represent UAB at high-profile university events (Commencement, faculty and staff gatherings, events at the UAB President’s Mansion) alongside senior administration, deans and guests.',
      // TODO(Rodion): confirm "stipend" vs "merit scholarship" (contents §15).
      'Recipient of a $1,000 annual award.',
    ],
    figure: 'router',
  },
  {
    id: 'isss', kind: 'leadership', title: 'International Mentor, International Scholar & Student Services (ISSS)', org: 'ISSS',
    dates: 'Apr 2026 – Present', start: '2026-04',
    cardLine: 'Mentor new international students from arrival through their first semesters.',
    bullets: [
      'Selected for a competitive mentorship program supporting UAB’s international students from arrival through graduation.',
      'Co-lead four 3-day New International Student Orientations as part of a mentor team; greet students as they arrive in the U.S.',
      'Help new students with official documents and administrative processes.',
      'Meet weekly with assigned mentees and track their progress; hold office hours at the ISSS office.',
      // TODO(Rodion): confirm "500+ students" vs "100+ attendees" (contents §15).
      'Help organize large campus events and create content for the program’s social media.',
      'Recipient of a $400 annual scholarship.',
    ],
    figure: 'globe',
  },
  {
    id: 'other-involvement', kind: 'leadership', title: 'Other involvement', org: 'UAB',
    dates: '2025 – Present', start: '2025-08',
    cardLine: 'Women in Technology (WIT), member · UAB Tennis Club, member (2025 – Present).',
    bullets: ['Women in Technology (WIT), member', 'UAB Tennis Club, member (2025 – Present)'],
  },
  // Earlier history (§13). Dates with open conflicts are left as the contents file has them.
  { id: 'theater', kind: 'earlier', title: 'Actor & Organizational Assistant, Arizona Russian Theater', org: 'Arizona Russian Theater (nonprofit)', place: 'Scottsdale, AZ', dates: 'Aug 2023 – Aug 2025', start: '2023-08', cardLine: 'Coordinated production logistics for **3 plays**, performed for audiences of **300+**, helped raise ==$10,000==.', bullets: [], link: { label: 'azrussiantheater.org', href: 'https://azrussiantheater.org/' } },
  { id: 'treasurer', kind: 'earlier', title: 'Student Government Treasurer, Rancho Solano', org: 'Rancho Solano Preparatory School', dates: 'Aug 2024 – May 2025', start: '2024-08', cardLine: 'Ran student store finances (daily revenue over **$300**); helped organize **Homecoming, Prom and fundraisers**.', bullets: [] },
  { id: 'esports', kind: 'earlier', title: 'eSports President & Captain, Rancho Solano', org: 'Rancho Solano Preparatory School', dates: 'Sep 2023 – May 2025', start: '2023-09', cardLine: 'Managed **two 5-person teams** in **HSEL and Vanta.gg** tournaments; reviewed match recordings to shape strategy; ran the club’s Instagram and Twitch streams.', bullets: [] },
  { id: 'tennis', kind: 'earlier', title: 'Varsity Tennis, 4th player, Rancho Solano', org: 'Rancho Solano Preparatory School', dates: 'Jan 2024 – May 2025', start: '2024-01', cardLine: '**20+ matches** over 2 seasons; ==“Most Coachable, Selfless, and Improved Player.”==', bullets: [] },
  { id: 'puerto-rico', kind: 'earlier', title: 'Community service trip, Puerto Rico', org: 'Rancho Solano Preparatory School', dates: 'Apr 2024', start: '2024-04', cardLine: '**55-student, 5-day** trip; debris clearing, basketball court renovation, food distribution to hurricane-affected residents.', bullets: [] },
  { id: 'class-president', kind: 'earlier', title: 'Class President, School #1354, Moscow', org: 'School #1354', place: 'Moscow', dates: '3 consecutive years', start: '2020-09', cardLine: 'Organized **7 educational trips** for a **38-student class**; introduced a behavioral journal system; mediated conflicts.', bullets: [] },
  { id: 'moscow-tutor', kind: 'earlier', title: 'Peer Tutor in Informatics & Physics, School #1354, Moscow', org: 'School #1354', place: 'Moscow', dates: 'Two years', start: '2021-09', cardLine: 'Tutored **8 peers** over two years (**100+ coding problems**, **10 physics labs**) for the national OGE exam.', bullets: [] },
  { id: 'volleyball', kind: 'earlier', title: 'Boys volleyball, School #1354', org: 'School #1354', place: 'Moscow', dates: '2022', start: '2022-01', cardLine: '==2nd of 8 teams== in an in-school tournament.', bullets: [] },
];

export const byStart = (a: Role, b: Role) => b.start.localeCompare(a.start);

/** Not on the site yet: move an entry back into `roles` to publish it. */
export const parkedRoles: Role[] = [
  {
    id: 'techbham', kind: 'research', title: 'Community Data Research with TechBirmingham (PH 104)',
    org: 'UAB Community Data Research course', place: 'Birmingham, AL', dates: 'Fall 2026', start: '2026-08',
    cardLine: 'Applied data research for Birmingham’s tech industry organization on talent retention and how the city’s tech ecosystem compares with peer cities.',
    bullets: [
      'Part of a 5-student team doing applied data research for TechBirmingham, the city’s technology industry organization.',
      'Analyzing how Birmingham’s tech ecosystem compares with peer cities, including talent retention and where the city’s tech workforce is educated.',
      'Contributing to an impact analysis of TechBirmingham’s programs using data shared by the organization.',
      'Proposed an original research question: do Birmingham employers hire tech talent from UAB, other Alabama universities or out of state?',
      'Completed IRB human-subjects research training, plus coursework in research methods and data ethics.',
    ],
    skills: ['Data analysis', 'Research design', 'IRB compliance', 'Excel'], figure: 'plot',
  },
];
