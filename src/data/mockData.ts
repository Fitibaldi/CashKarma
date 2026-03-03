export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  totalExpenses: number;
  currency: string;
  lastActivity: string;
  avatarUrl?: string;
  location?: string;
  yourBalance: number;
  isArchived?: boolean;
  createdBy?: string;
}

export const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Roommates',
    description: 'Apartment expenses and utilities',
    memberCount: 4,
    totalExpenses: 2847.50,
    currency: '€',
    lastActivity: '2 days ago',
    yourBalance: -125.75
  },
  {
    id: '2',
    name: 'Weekend Trip',
    description: 'Barcelona vacation expenses',
    memberCount: 6,
    totalExpenses: 1650.00,
    currency: '€',
    lastActivity: '1 week ago',
    yourBalance: 89.25
  },
  {
    id: '3',
    name: 'Office Lunch',
    description: 'Daily lunch orders with colleagues',
    memberCount: 8,
    totalExpenses: 456.80,
    currency: '€',
    lastActivity: '3 hours ago',
    yourBalance: 0
  },
  {
    id: '4',
    name: 'Family Dinner',
    description: 'Monthly family gatherings',
    memberCount: 5,
    totalExpenses: 890.30,
    currency: '€',
    lastActivity: '5 days ago',
    yourBalance: 45.60
  },
  {
    id: '5',
    name: 'Gym Membership',
    description: 'Shared fitness expenses',
    memberCount: 3,
    totalExpenses: 180.00,
    currency: '€',
    lastActivity: '1 month ago',
    yourBalance: -60.00
  },
  {
    id: '6',
    name: 'Book Club',
    description: 'Monthly book purchases and coffee',
    memberCount: 7,
    totalExpenses: 234.50,
    currency: '€',
    lastActivity: '2 weeks ago',
    yourBalance: 12.75
  }
];