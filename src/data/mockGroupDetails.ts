import { GroupDetails, GroupMember, Payment } from '../types/group';

const mockMembers: GroupMember[] = [
  {
    id: '1',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    joinedAt: '2024-01-15',
    role: 'admin',
    totalPaid: 450.00,
    totalOwed: 324.25,
    balance: 125.75
  },
  {
    id: '2',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    joinedAt: '2024-01-16',
    role: 'member',
    totalPaid: 280.50,
    totalOwed: 356.75,
    balance: -76.25
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@example.com',
    joinedAt: '2024-01-18',
    role: 'member',
    totalPaid: 195.00,
    totalOwed: 245.50,
    balance: -50.50
  },
  {
    id: '4',
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol@example.com',
    joinedAt: '2024-01-20',
    role: 'member',
    totalPaid: 320.75,
    totalOwed: 319.75,
    balance: 1.00
  }
];

const mockPayments: Payment[] = [
  {
    id: '1',
    fromUserId: '2',
    fromUserName: 'Alice Johnson',
    splitType: 'equal',
    selectedMembers: ['1', '2', '3', '4'],
    amount: 45.50,
    currency: '€',
    description: 'Groceries - Whole Foods',
    date: '2024-01-25',
    method: 'revolut',
    status: 'confirmed'
  },
  {
    id: '2',
    fromUserId: '3',
    fromUserName: 'Bob Smith',
    splitType: 'specific',
    selectedMembers: ['3', '4'],
    amount: 28.75,
    currency: '€',
    description: 'Dinner at Italian restaurant',
    date: '2024-01-24',
    method: 'cash',
    status: 'confirmed'
  },
  {
    id: '3',
    fromUserId: '1',
    fromUserName: 'Demo User',
    splitType: 'equal',
    selectedMembers: ['1', '2', '3', '4'],
    amount: 67.20,
    currency: '€',
    description: 'Utilities - Electricity bill',
    date: '2024-01-23',
    method: 'bank',
    status: 'pending'
  },
  {
    id: '4',
    fromUserId: '4',
    fromUserName: 'Carol Davis',
    splitType: 'specific',
    selectedMembers: ['3', '4'],
    amount: 15.00,
    currency: '€',
    description: 'Coffee and snacks',
    date: '2024-01-22',
    method: 'paypal',
    status: 'confirmed'
  }
];

export const mockGroupDetails: { [key: string]: GroupDetails } = {
  '1': {
    id: '1',
    name: 'Roommates',
    description: 'Apartment expenses and utilities',
    location: 'New York, NY',
    createdAt: '2024-01-15',
    createdBy: '1',
    members: mockMembers,
    payments: mockPayments,
    totalExpenses: 2847.50,
    currency: '$'
  },
  '2': {
    id: '2',
    name: 'Weekend Trip',
    description: 'Barcelona vacation expenses',
    location: 'Barcelona, Spain',
    createdAt: '2024-01-10',
    createdBy: '1',
    members: mockMembers.slice(0, 3),
    payments: mockPayments.slice(0, 2),
    totalExpenses: 1650.00,
    currency: '€'
  }
};