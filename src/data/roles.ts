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
      'Appointed **primary TA** by the instructor for a **60+ student** course (~10 hrs/week).',
      'Grade **all homework and lab assignments** as the course’s **only grader**, keeping feedback consistent for every student.',
      'Teach my own weekly **2-hour lab section of ~40 students**, walking through hands-on exercises from first principles.',
      'Hold **2 hours of office hours** a week on programming concepts, problem-solving and students’ own code.',
      'Work with a second TA, who leads the smaller lab section, on day-to-day course operations.',
      'Built a small **recursion visualizer** in Python to explain recursion to my students.',
    ],
    skills: ['Python', 'Teaching', 'Code review', 'Technical communication'], figure: 'terminal',
  },
  {
    id: 'samac', kind: 'work', title: 'Web Content Editor Student Assistant (Front-End Web Developer)',
    org: 'UAB Student Affairs Marketing & Communications (SAMAC)', place: 'Birmingham, AL', dates: 'Oct 2025 – Present', start: '2025-10',
    cardLine: 'Maintain 1,500+ pages across 20+ UAB department sites in Joomla 5 with custom HTML, CSS and JavaScript.',
    bullets: [
      'Maintain and update **1,500+ pages** across **20+ UAB department sites** in **Joomla 5**, writing custom HTML, CSS, JavaScript and Bootstrap.',
      'Converted a **40-page PDF annual report** into an **interactive, animated webpage** as part of a **3-developer team**.',
      'Asked to update a department’s video library page, delivered a **full redesign**: content reorganized and categorized, a cleaner accessible layout and a clear information hierarchy.',
      'Run ongoing **digital accessibility reviews** (WCAG, WAVE) of UAB pages, starting with Dining.',
      'Started in my first semester, at up to **18 hrs/week** alongside a full course load.',
    ],
    skills: ['Joomla 5', 'HTML', 'CSS', 'JavaScript', 'Bootstrap', 'WCAG/WAVE'], figure: 'format',
  },
  {
    id: 'bor-intern', kind: 'work', title: 'Web Developer Intern', org: 'BOR Realty, LLC', place: 'Phoenix, AZ',
    dates: 'Summer 2026', start: '2026-05',
    cardLine: 'Shipped the brokerage’s bilingual (EN/RU) site, 18 pages in Next.js 14.',
    bullets: [
      'Shipped the brokerage’s **bilingual (EN/RU)** site, **18 pages** in **Next.js 14**.',
      'Automated a **689-video library** with the **YouTube Data API** and daily **GitHub Actions** syncs.',
      '**WCAG 2.1 AA** with **0 axe-core violations** and **300+ Playwright tests**.',
    ],
    skills: ['Next.js 14', 'TypeScript', 'GitHub Actions', 'Playwright'], caseStudy: 'bor-realty', figure: 'web',
  },
  {
    id: 'tutor', kind: 'teaching', title: 'Academic Peer Tutor', org: 'UAB Vulcan Materials Academic Success Center',
    place: 'Birmingham, AL', dates: 'Feb 2026 – May 2026', start: '2026-02',
    cardLine: 'Tutored 12+ STEM courses; the center’s only General Physics I tutor.',
    bullets: [
      'Tutored students across **12+ STEM courses**, including Calculus I/II, General Physics and Python (~5–6 hrs/week).',
      'The center’s **only General Physics I tutor**.',
      'Used **inquiry-based problem solving**, graphing and online simulations to help students build intuition.',
      'Taught **TI-Nspire CX II** use for calculus: verifying solutions, writing custom functions, graphing 3D surfaces.',
      'Moved into the **CS 103 primary TA** role in Fall 2026.',
    ],
    skills: ['Calculus', 'Physics', 'Python'], figure: 'tutor',
  },
  {
    id: 'plasma-research', kind: 'research', title: 'Undergraduate Researcher, Computational Plasma Physics',
    org: 'Computational plasma physics research group, UAB Department of Physics', place: 'Birmingham, AL', dates: 'May 2026 – Present', start: '2026-05',
    cardLine: 'Laser-ablation and fluid-dynamics simulations in C/Basilisk on UAB’s Cheaha supercomputer, supporting machine-learning-guided thin-film growth.',
    bullets: [
      'Write and run coupled **laser-ablation and fluid-dynamics simulations** of laser-generated plasmas in **C** with the **Basilisk** PDE framework.',
      'Run workloads on UAB’s **Cheaha supercomputer**; learned **Linux and Bash** from scratch to manage HPC jobs, environments and data.',
      'Work with **synthetic plasma datasets** in which plasma temperature (T) and ionization fraction (Xe) serve as ground truth for testing ML models.',
      'Write **Python** scripts that process, visualize and analyze simulation output into the plots and comparisons the team uses to evaluate models.',
      'Support research on **ML-guided pulsed laser deposition (PLD)**, where **Gaussian Process Bayesian Optimization** builds surrogate models of plasma conditions from a small number of experiments.',
      'Co-author, “Machine Learning-Assisted Pulsed Laser Deposition Based on Plasma Optical Emission Signatures,” accepted for an **oral presentation** at the **AVS 72nd International Symposium**, Pittsburgh, Nov 8–13, 2026.',
    ],
    skills: ['C', 'Basilisk', 'Python', 'Bash', 'Linux', 'HPC (Cheaha)', 'Gaussian Process Bayesian Optimization', 'Scientific visualization'], figure: 'cabinet',
  },
  {
    id: 'aic', kind: 'leadership', title: 'Founder & President, The AI Collective at UAB (AIC)', org: 'The AI Collective at UAB',
    dates: 'Feb 2026 – Present', start: '2026-02',
    cardLine: 'Founded UAB’s first interdisciplinary AI organization, to make practical AI skills accessible to students in every major.',
    bullets: [
      'Founded **UAB’s first interdisciplinary AI organization**, advised by faculty in the Department of Computer Science; wrote the constitution and appointed the officers.',
      'Built a **4-officer executive board** and a **10-member founding team**.',
      'Designed **5 program tracks**: prompt engineering, productivity, coding and research literacy, AI ethics roundtables, industry briefings.',
      'First event this semester (Fall 2026); building partnerships with **ACM, USGA, Women in Technology**, faculty and alumni.',
    ],
    link: { label: 'AIC on CampusLabs', href: 'https://uab.campuslabs.com/engage/actioncenter/organization/aic' }, figure: 'neural',
  },
  {
    id: 'acm', kind: 'leadership', title: 'Events Chair, ACM at UAB', org: 'ACM at UAB',
    dates: 'Aug 2026 – Present (active member since Oct 2025)', start: '2026-08',
    cardLine: 'Plan the full-year event calendar for UAB’s largest computing student organization.',
    bullets: [
      'ACM at UAB is the local chapter of the world’s largest computing society and the **largest CS organization on campus**.',
      'Plan and organize the year’s events: **LeetCode nights**, **alumni panels**, **internship recruiting events** and **networking mixers**.',
      'Handle **outreach to companies** for event collaborations.',
      'Developing **joint programming with The AI Collective**.',
    ],
    figure: 'calendar',
  },
  {
    id: 'usga-web', kind: 'leadership', title: 'Website Coordinator, Undergraduate Student Government Association (USGA)',
    org: 'USGA, Division of Communications', dates: 'Aug 2026 – Present', start: '2026-08',
    cardLine: 'The only person in charge of updating and redesigning the official USGA website (Joomla 5).',
    bullets: [
      'In charge of the **official USGA website**, the main digital channel between student government and the student body.',
      'Build and maintain the site in **Joomla 5** with custom HTML, CSS and JavaScript.',
      'Planning and leading a **major redesign** of its structure, visual design and usability.',
    ],
    figure: 'portico',
  },
  {
    id: 'freshman-forum', kind: 'leadership', title: 'Freshman Forum Member, USGA · Member of the Year', org: 'USGA',
    dates: 'Sep 2025 – May 2026', start: '2025-09',
    cardLine: 'Founded the Micro-Internships pilot with the UAB Career Center, now a long-term program (Project One).',
    bullets: [
      'Selected as **1 of 31** from **100+ applicants** to represent the freshman class.',
      '**Conceived and founded the Micro-Internships initiative** with the **UAB Career Center**, handling the networking, employer outreach and program planning.',
      'Secured **$2,000 in scholarship funding** ($200 per intern) from on-campus departments and placed **10 students** in project-based micro-internships across **7 UAB departments** (Spring 2026).',
      '**Adopted long-term as Project One**, a cohort-based USGA and Career Center program with dedicated Career Center staff, its Fall 2026 cohort placed **20 students** at **18 departments**, including 3 off-campus.',
      'Remain a point of contact: helped match this year’s students to sites and will speak at the closing ceremony.',
      'Led a **6-student team** with the Career Center Director to run a campus-wide **Career Readiness Week** (resume workshops, job fairs, headshots, professional development sessions).',
      'The **only member** in direct mentorship with the **USGA President**.',
      'Named inaugural **Member of the Month** (Oct 2025) and **Freshman Forum Member of the Year**.',
    ],
    figure: 'forum',
  },
  {
    id: 'ambassador', kind: 'leadership', title: 'UAB Ambassador', org: 'Office of Student Engagement',
    dates: 'Apr 2026 – Present', start: '2026-04',
    cardLine: 'Selected 1 of 16 new Ambassadors from 140+ applicants as an official student host of the university.',
    bullets: [
      'Selected as **1 of 16 new Ambassadors from 140+ applicants** for UAB Ambassadors (founded 1978), the university’s official student hosts.',
      'Represent UAB at **high-profile university events** (Commencement, faculty and staff gatherings, events at the UAB President’s Mansion) alongside senior administration, deans and guests.',
      // TODO(Rodion): confirm "stipend" vs "merit scholarship" (contents §15).
      'Recipient of a **$1,000** annual award.',
    ],
    figure: 'flag',
  },
  {
    id: 'isss', kind: 'leadership', title: 'International Mentor, International Scholar & Student Services (ISSS)', org: 'ISSS',
    dates: 'Apr 2026 – Present', start: '2026-04',
    cardLine: 'Mentor new international students from arrival through their first semesters.',
    bullets: [
      'Selected for a **competitive mentorship program** supporting UAB’s international students from arrival through graduation.',
      'Co-lead **four 3-day New International Student Orientations** as part of a mentor team; greet students as they arrive in the U.S.',
      'Help new students with **official documents and administrative processes**.',
      'Meet weekly with **assigned mentees** and track their progress; hold office hours at the ISSS office.',
      // TODO(Rodion): confirm "500+ students" vs "100+ attendees" (contents §15).
      'Help organize **large campus events** and create content for the program’s social media.',
      'Recipient of a **$400 annual scholarship**.',
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
  { id: 'theater', kind: 'earlier', title: 'Organizational Assistant & Actor, Arizona Russian Theater', org: 'Arizona Russian Theater (nonprofit)', place: 'Scottsdale, AZ', dates: 'Aug 2023 – Aug 2025', start: '2023-08', cardLine: 'Coordinated production logistics for **3 plays** and supported fundraising that secured over ==$10,000==; managed backstage operations and performed for audiences of **300+**.', bullets: ['Coordinated production logistics for **3 plays** and supported fundraising initiatives that secured over **$10,000** (total) for the nonprofit.', 'Managed backstage operations and performed for audiences of **300+**.'], link: { label: 'azrussiantheater.org', href: 'https://azrussiantheater.org/' } },
  { id: 'treasurer', kind: 'earlier', title: 'Upper School Student Government Treasurer, Rancho Solano', org: 'Rancho Solano Preparatory School', dates: 'Aug 2024 – May 2025', start: '2024-08', cardLine: 'Managed **student store** finances, reconciling daily revenues over **$300**; organized **Homecoming, Prom** and fundraisers with the student council.', bullets: ['Managed **student store** financial operations and reconciled daily revenues exceeding **$300**.', 'Organized major campus events (**Homecoming, Prom**) and fundraisers with the student council.'] },
  { id: 'pegasus', kind: 'earlier', title: 'Journalist, School Newspaper “Pegasus”, Rancho Solano', org: 'Rancho Solano Preparatory School', place: 'Scottsdale, AZ', dates: 'Aug 2024 – May 2025', start: '2024-08', cardLine: 'Wrote **bi-monthly 500-word articles** on campus life from interviews with faculty and students; publicized new editions and added ==multimedia content==.', bullets: ['Authored **bi-monthly 500-word articles**, interviewing faculty and students to document campus life and events.', 'Publicized new editions during convocations and integrated **multimedia content** to maximize readership engagement.'] },
  { id: 'esports', kind: 'earlier', title: 'School eSports President & Captain, Rancho Solano', org: 'Rancho Solano Preparatory School', dates: 'Aug 2023 – May 2025', start: '2023-08', cardLine: 'Ran **two 5-person teams** in **HSEL and Vanta.gg** tournaments, coordinating practices and rosters; analyzed gameplay recordings to build ==data-driven strategies==.', bullets: ['Managed operations for **two 5-person teams** competing in **HSEL and Vanta.gg** high school tournaments, coordinating practices and roster logistics.', 'Analyzed gameplay recordings to formulate **data-driven strategies**.'] },
  { id: 'tennis', kind: 'earlier', title: 'Varsity Tennis, 4th player, Rancho Solano', org: 'Rancho Solano Preparatory School', dates: 'Jan 2024 – May 2025', start: '2024-01', cardLine: '**20+ matches** over 2 seasons; ==“Most Coachable, Selfless, and Improved Player.”==', bullets: [] },
  { id: 'puerto-rico', kind: 'earlier', title: 'Volunteer, Puerto Rico School Community Service Trip', org: 'Rancho Solano Preparatory School', dates: 'Aug 2023 – Aug 2025', start: '2023-08', cardLine: 'Restored local infrastructure, clearing forest debris and renovating a community basketball court for **disaster recovery**; prepared and distributed ==food supplies== to residents in need.', bullets: ['Restored local infrastructure by clearing forest debris and renovating a community basketball court to aid **disaster recovery**.', 'Prepared and distributed **food supplies** to residents in need.'] },
  { id: 'class-president', kind: 'earlier', title: 'Upper School Class President, School #1354, Moscow', org: 'School #1354', place: 'Moscow', dates: '2020 – 2023', start: '2020-09', cardLine: 'Represented a class of **38 students**, mediating academic and social concerns; coordinated **7 educational field trips** and spirit events.', bullets: ['Represented a class of **38 students**, mediating academic and social concerns.', 'Coordinated logistics for **7 educational field trips** and spirit events.'] },
  { id: 'moscow-tutor', kind: 'earlier', title: 'Peer Tutor & Academic Mentor, School #1354, Moscow', org: 'School #1354', place: 'Moscow', dates: '2021 – 2023', start: '2021-09', cardLine: 'Mentored **8 peers** in Informatics & Physics through over **100 coding problems** and **8 physics labs**; prepared them for the OGE (main state exam), helping them earn =="A" grades== in Computer Science & Physics.', bullets: ['Mentored **8 peers** in Informatics & Physics through over **100 coding problems** and **8 physics labs**.', 'Prepared students for the **OGE** (main state exam), helping them achieve **"A" grades** in Computer Science & Physics.'] },
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
