// Identity and links, from contents.md §1–2.
export const site = {
  name: 'Rodion Mayatskiy',
  first: 'Rodion',
  last: 'Mayatskiy',
  location: 'Birmingham, Alabama',
  primaryLine: 'Computer Science & Physics · University of Alabama at Birmingham',
  focusLine: 'Software engineering · Scientific computing · Applied AI',
  heroSentence: 'Computer Science & Physics student at UAB with a 4.0 GPA. I build AI-powered tools, production web apps, scientific software, and simulations.',
  description: 'Computer Science & Physics double major at UAB (4.0 GPA). Computational plasma physics research, production web development and applied AI.',
  roles: ['Software Engineer', 'Researcher', 'Founder', 'Physics × CS'],
  email: 'mayatrod@gmail.com',
  links: {
    github: 'https://github.com/rmaytr',
    linkedin: 'https://www.linkedin.com/in/rodion-mayatskiy-025128374/',
  },
  // TODO(Rodion): supply the updated résumé PDF (contents §15); until then the link is hidden.
  resume: null as string | null,
  source: 'https://github.com/rmaytr/rmaytr.github.io',
} as const;

export const nav = [
  { href: '/about/', label: 'About' },
  { href: '/work/', label: 'Projects' },
  { href: '/experience/', label: 'Experience' },
  { href: '/research/', label: 'Research' },
  { href: '/cv/', label: 'CV' },
] as const;
