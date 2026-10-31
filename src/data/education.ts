// Education, awards and AI literacy, from contents.md §9, §10 and §12.
// **x** and ==x== mark key details for display; see rich.ts.
export const uab = {
  school: 'University of Alabama at Birmingham',
  degree: 'B.S. Computer Science & B.S. Physics (double major)',
  dates: 'Aug 2025 – expected May 2029',
  span: { from: 'Aug 2025', to: 'May 2029', start: '2025-08-15', end: '2029-05-15' },
  concentration: 'Data-Driven Modeling and Technology',
  minors: 'Mathematics, Entrepreneurship',
  honors: 'Honors College (Personalized Pathway) · College of Arts & Sciences',
  gpa: '4.0',
  lines: [
    '==GPA 4.0== · **Presidential Honors List** (Fall 2025, Spring 2026)',
    '**Early admission** to UAB’s Accelerated Bachelor’s-to-Master’s Program in Artificial Intelligence',
  ],
  // course codes and titles exactly as on the official transcript (issued Oct 26, 2026)
  completed: [
    ['CS 103', 'Introduction to CS in Python'], ['HC 100', 'Honors FYE'], ['HC 118', 'HonSem: Fantastic Film'], ['MA 126', 'Calculus II'], ['PH 221', 'General Physics I'],
    ['CS 203', 'Object-Oriented Programming'], ['CS 250', 'Discrete Structures'], ['MA 227', 'Calculus III'], ['PH 103', 'The World Through Data'], ['PH 222', 'General Physics II'],
  ] as Array<[string, string]>,
  transfer: [['MA 125', 'Calculus I'], ['PH 201', 'College Physics I'], ['PH 202', 'College Physics II']] as Array<[string, string]>,
  inProgress: [
    ['CS 113', 'AI in a Nutshell'], ['CS 303', 'Algorithms and Data Structures'], ['CS 380', 'Mathematical Foundations of AI'], ['MA 252', 'Intro Diff Equations (HON)'],
    ['MA 360', 'Scientific Programming'], ['PH 104', 'Community Data Research'], ['PH 110', 'Topics in Contemporary Physics'],
  ] as Array<[string, string]>,
};

export const highSchool = {
  school: 'Rancho Solano Preparatory School, Scottsdale, AZ',
  dates: 'Aug 2023 – May 2025',
  lines: ['**IB curriculum** (HL Physics, HL Mathematics), on scholarship', '==GPA 4.0 unweighted== / 4.47 weighted · **SAT 1550**'],
};

export interface Award { title: string; year: string; group: 'university' | 'highschool' | 'certificate' }

/** Newest first within each group (ranges sort by their last year). */
export const awards: Award[] = [
  { group: 'university', title: '==1st place==, **EcoCAR track**, HackBama_01, University of Alabama', year: 'Oct 2026' },
  { group: 'university', title: '**Co-author**, AVS 72nd International Symposium abstract, accepted for an oral presentation', year: '2026' },
  { group: 'university', title: '**UAB Ambassador**, ==1 of 16== new Ambassadors from 140+ applicants', year: '2026' },
  { group: 'university', title: '**Freshman Forum Member of the Year**, UAB USGA', year: '2026' },
  { group: 'university', title: '**Presidential Honors List**, UAB', year: '2026' },
  { group: 'university', title: '**Early admission**, UAB Accelerated Bachelor’s-to-Master’s Program in AI', year: '2026' },
  { group: 'university', title: 'Inaugural **Freshman Forum Member of the Month**, UAB USGA', year: 'Oct 2025' },
  { group: 'highschool', title: '**Mu Alpha Theta** (National Math Honors Society), Student Officer; ==highest AMC 12 score== at school', year: '2023–2025' },
  { group: 'highschool', title: '==2nd of 30==, **Game Development Camp**, Arizona State University', year: '2024' },
  { group: 'highschool', title: '**Prize Winner**, MISIS University Olympiad in Technical & Information Technologies', year: '2023' },
  { group: 'highschool', title: '**Prize Winner**, All-Russian Olympiad in Technology & Languages', year: '2021–2023' },
  { group: 'highschool', title: '**Award Winner**, Finskills Financial Competencies Championship', year: '2022' },
  { group: 'certificate', title: 'Anthropic: **Claude 101** · **Claude Code 101** · **Claude Platform 101**', year: '' },
  { group: 'certificate', title: '**Certificate in Python Programming**, Yandex Lyceum, Moscow', year: '2023' },
  { group: 'certificate', title: '**Ira A. Fulton Engineering Camp**, Arizona State University', year: '2023' },
];

/** The marquee keeps short forms of the same awards. */
export const marquee = [
  ['1st place HackBama_01', 'EcoCAR track'], ['Co-author', 'AVS 72'], ['UAB Ambassador', '1 of 16'], ['Member of the Year', 'USGA'],
  ['Presidential Honors List', '2026'], ['Early admission', 'B.S.–M.S. in AI'], ['Founder', 'The AI Collective'], ['2nd of 30', 'ASU Game Dev Camp'],
] as const;

export const aiLiteracy = {
  intro: 'I use AI as a **daily engineering and research tool** and focus on using it well: knowing ==what to delegate==, ==how to verify output== and ==how to build repeatable workflows==.',
  points: [
    { title: 'Agentic coding, daily', text: 'Work daily with **agentic coding tools** (Claude Code, Codex CLI) to plan, build, test and ship software, including ==running several agents in parallel== on separate modules with human review before merge (HackBama).' },
    { title: 'Custom skills and plugins', text: 'Build **custom skills, projects and plugins** that turn repeated workflows into ==reusable tools==.' },
    { title: 'Built on the Anthropic API', text: 'Build on the **Anthropic API**, including ==Phasora’s physics tutor==.' },
    { title: 'Anthropic courses', text: 'Completed Anthropic’s **Claude 101**, **Claude Code 101** and **Claude Platform 101**.' },
  ],
};

export const about = {
  short: 'Computer Science & Physics double major at UAB (4.0 GPA). Computational plasma physics research, production web development and applied AI.',
  intro: 'I’m a **Computer Science and Physics** double major at UAB, in the Honors College with early admission to its accelerated master’s program in AI. I write ==plasma simulations== for a physics lab, build **production websites**, teach Python as a **TA for CS 103** and lead student groups like **The AI Collective**. Long term, I want to build ==AI systems grounded in physical law== and pursue a **Ph.D. in machine learning and AI**.',
  long: [
    'My name is **Rodion Mayatskiy**. I was born and raised in **Moscow, Russia**. At 16, I moved to **Scottsdale, Arizona**, to pursue my career interests in the United States. I finished high school in Arizona and came to UAB.',
    'I’m a **Computer Science and Physics** double major at the University of Alabama at Birmingham, with minors in Mathematics and Entrepreneurship, in the **Honors College**, with ==early admission to UAB’s Accelerated Bachelor’s-to-Master’s Program in AI==.',
    'I work where **software meets science**. In a UAB physics research lab I write and run ==laser-plasma simulations on UAB’s Cheaha supercomputer== for machine-learning-guided materials research. I build **production websites** for real clients and for the university, and I teach Python as the **primary TA for CS 103**. Outside class I founded ==The AI Collective==, UAB’s first interdisciplinary AI organization, and I plan events for **ACM**.',
    'Long term, I want to build ==AI systems grounded in physical law== and pursue a **Ph.D. in machine learning and AI**.',
  ],
  languages: ['Russian (native)', 'English (full professional)', 'Mandarin (beginner)'],
};
