
import { Proposal, ProposalType, ProposalStatus } from '../types';

// Mock In-Memory DAO State
let PROPOSALS: Proposal[] = [
  {
    id: 'PROP-001',
    title: 'Approve BioGen Labs as Certified Manufacturer',
    description: 'BioGen Labs has submitted all required compliance documents (FDA-2024-882). Vote to whitelist their address on the supply chain contract.',
    type: ProposalType.APPROVE_MANUFACTURER,
    proposer: '0xRegulator...A12',
    votesFor: 12500,
    votesAgainst: 450,
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days left
    status: ProposalStatus.ACTIVE,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'PROP-002',
    title: 'Flag Batch #9928-X for Investigation',
    description: 'Multiple reports of inconsistent packaging from Distributor node 0x77...22. Suspending batch verification until inspected.',
    type: ProposalType.FLAG_SUSPICIOUS_ENTITY,
    proposer: '0xPharmacyGuild...B99',
    votesFor: 32000,
    votesAgainst: 120,
    deadline: new Date(Date.now() - 3600000).toISOString(), // Just ended
    status: ProposalStatus.PASSED,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'PROP-003',
    title: 'Update API Rate Limits for Public Verifier',
    description: 'Increase public node rate limits to 1000 req/min to support holiday traffic.',
    type: ProposalType.UPDATE_PROTOCOL,
    proposer: '0xDevTeam...C44',
    votesFor: 5000,
    votesAgainst: 8200,
    deadline: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: ProposalStatus.REJECTED,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

export const getProposals = async (): Promise<Proposal[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [...PROPOSALS];
};

export const createProposal = async (title: string, description: string, type: ProposalType): Promise<Proposal> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newProposal: Proposal = {
    id: `PROP-${Math.floor(Math.random() * 1000)}`,
    title,
    description,
    type,
    proposer: '0xYou (Regulator)',
    votesFor: 0,
    votesAgainst: 0,
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
    status: ProposalStatus.ACTIVE,
    createdAt: new Date().toISOString()
  };
  
  PROPOSALS.unshift(newProposal);
  return newProposal;
};

export const castVote = async (proposalId: string, support: boolean): Promise<Proposal> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const proposalIndex = PROPOSALS.findIndex(p => p.id === proposalId);
  if (proposalIndex === -1) throw new Error("Proposal not found");
  
  const proposal = PROPOSALS[proposalIndex];
  
  // Simulate voting power (weighted vote)
  const votingPower = Math.floor(Math.random() * 500) + 100;
  
  if (support) {
    proposal.votesFor += votingPower;
  } else {
    proposal.votesAgainst += votingPower;
  }
  
  // Simple logic to auto-pass/reject if it's just a demo
  // In a real app, this would wait for deadline
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  if (totalVotes > 50000) {
      proposal.status = proposal.votesFor > proposal.votesAgainst ? ProposalStatus.PASSED : ProposalStatus.REJECTED;
  }

  PROPOSALS[proposalIndex] = { ...proposal };
  return proposal;
};
