import { GroupMember } from '../types/group';
import { DebtDetail } from '../types/group';

export interface DebtGraph {
  [userId: string]: { [creditorId: string]: number };
}

/**
 * Optimizes debts using a simplified debt resolution algorithm
 * This reduces the number of transactions needed to settle all debts
 */
export const optimizeDebts = (members: GroupMember[], currency: string): DebtDetail[] => {
  // Create a list of net balances (positive = owed money, negative = owes money)
  const balances = members.map(member => ({
    userId: member.id,
    userName: `${member.firstName} ${member.lastName}`,
    avatarUrl: member.avatarUrl,
    balance: member.balance
  })).filter(b => Math.abs(b.balance) > 0.01); // Ignore very small amounts

  const debts: DebtDetail[] = [];
  
  // Sort by balance - debtors first (negative), then creditors (positive)
  balances.sort((a, b) => a.balance - b.balance);
  
  let debtorIndex = 0;
  let creditorIndex = balances.length - 1;
  
  // Match debtors with creditors
  while (debtorIndex < creditorIndex) {
    const debtor = balances[debtorIndex];
    const creditor = balances[creditorIndex];
    
    // Skip if already settled
    if (Math.abs(debtor.balance) < 0.01) {
      debtorIndex++;
      continue;
    }
    if (Math.abs(creditor.balance) < 0.01) {
      creditorIndex--;
      continue;
    }
    
    // Calculate settlement amount
    const debtAmount = Math.abs(debtor.balance);
    const creditAmount = creditor.balance;
    const settlementAmount = Math.min(debtAmount, creditAmount);
    
    // Create debt record
    debts.push({
      fromUserId: debtor.userId,
      fromUserName: debtor.userName,
      fromUserAvatarUrl: debtor.avatarUrl,
      toUserId: creditor.userId,
      toUserName: creditor.userName,
      toUserAvatarUrl: creditor.avatarUrl,
      amount: settlementAmount,
      currency
    });
    
    // Update balances
    debtor.balance += settlementAmount;
    creditor.balance -= settlementAmount;
    
    // Move to next debtor/creditor if current one is settled
    if (Math.abs(debtor.balance) < 0.01) {
      debtorIndex++;
    }
    if (Math.abs(creditor.balance) < 0.01) {
      creditorIndex--;
    }
  }
  
  return debts;
};

/**
 * Calculate direct debts between members based on payment history
 * This shows the raw debt relationships before optimization
 */
export const calculateDirectDebts = (members: GroupMember[], currency: string): DebtDetail[] => {
  const debts: DebtDetail[] = [];
  
  members.forEach(member => {
    if (member.balance < -0.01) { // Member owes money
      const amountOwed = Math.abs(member.balance);
      
      // Find creditors to pay back (simplified - in reality this would track specific payment relationships)
      const creditors = members.filter(m => m.balance > 0.01);
      
      if (creditors.length > 0) {
        // For simplicity, assign debt to the largest creditor
        // In a real system, this would track actual payment relationships
        const largestCreditor = creditors.reduce((max, creditor) => 
          creditor.balance > max.balance ? creditor : max
        );
        
        const settlementAmount = Math.min(amountOwed, largestCreditor.balance);
        
        debts.push({
          fromUserId: member.id,
          fromUserName: `${member.firstName} ${member.lastName}`,
          toUserId: largestCreditor.id,
          toUserName: `${largestCreditor.firstName} ${largestCreditor.lastName}`,
          amount: settlementAmount,
          currency
        });
      }
    }
  });
  
  return debts;
};