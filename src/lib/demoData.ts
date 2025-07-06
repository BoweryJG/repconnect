export interface DemoContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  lastCall?: Date;
  callCount: number;
  notes?: string;
  tags?: string[];
  location?: {
    city?: string;
    state?: string;
  };
  value?: 'high' | 'standard';
}

export const DEMO_CONTACTS: DemoContact[] = [
  {
    id: 'demo-1',
    name: 'Sarah Johnson',
    phoneNumber: '+14155552341',
    email: 'sarah.j@techcorp.com',
    callCount: 3,
    lastCall: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    notes: 'VP of Sales at TechCorp. Interested in enterprise solution.',
    tags: ['enterprise', 'decision-maker', 'hot-lead'],
    location: { city: 'San Francisco', state: 'CA' },
    value: 'high'
  },
  {
    id: 'demo-2',
    name: 'Michael Chen',
    phoneNumber: '+12125558976',
    email: 'mchen@innovate.io',
    callCount: 1,
    lastCall: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    notes: 'CTO looking for automation tools. Budget approved for Q1.',
    tags: ['technical', 'qualified', 'Q1-close'],
    location: { city: 'New York', state: 'NY' },
    value: 'high'
  },
  {
    id: 'demo-3',
    name: 'Emily Rodriguez',
    phoneNumber: '+13105554567',
    email: 'emily.r@growthco.com',
    callCount: 2,
    notes: 'Operations Manager. Evaluating multiple solutions.',
    tags: ['mid-market', 'evaluating'],
    location: { city: 'Los Angeles', state: 'CA' },
    value: 'standard'
  },
  {
    id: 'demo-4',
    name: 'David Thompson',
    phoneNumber: '+14695553210',
    email: 'dthompson@enterprise.com',
    callCount: 0,
    notes: 'New lead from webinar. Schedule follow-up.',
    tags: ['new', 'webinar-lead'],
    location: { city: 'Dallas', state: 'TX' },
    value: 'standard'
  },
  {
    id: 'demo-5',
    name: 'Lisa Park',
    phoneNumber: '+12065559876',
    email: 'lpark@cloudsoft.com',
    callCount: 4,
    lastCall: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    notes: 'Ready to move forward. Needs contract review.',
    tags: ['closing', 'contract-sent'],
    location: { city: 'Seattle', state: 'WA' },
    value: 'high'
  }
];

export const DEMO_CALL_HISTORY = [
  {
    id: 'call-1',
    contactId: 'demo-1',
    phoneNumber: '+14155552341',
    duration: 245,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    type: 'outgoing' as const,
    transcript: 'Discussed enterprise pricing and implementation timeline...',
    sentiment: 'positive' as const,
    summary: 'Sarah is interested in moving forward with enterprise plan. Needs board approval by end of month.'
  },
  {
    id: 'call-2',
    contactId: 'demo-5',
    phoneNumber: '+12065559876',
    duration: 567,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    type: 'incoming' as const,
    transcript: 'Contract review questions and technical requirements...',
    sentiment: 'positive' as const,
    summary: 'Lisa confirmed technical requirements are met. Legal team reviewing contract.'
  }
];