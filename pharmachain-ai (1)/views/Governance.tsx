
import React, { useState, useEffect } from 'react';
import { Gavel, Plus, ThumbsUp, ThumbsDown, Clock, Users, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { Proposal, ProposalStatus, ProposalType } from '../types';
import { getProposals, castVote, createProposal } from '../services/governanceService';

const Governance: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<ProposalType>(ProposalType.APPROVE_MANUFACTURER);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getProposals();
    setProposals(data);
    setLoading(false);
  };

  const handleVote = async (id: string, support: boolean) => {
    setVotingId(id);
    try {
      const updated = await castVote(id, support);
      setProposals(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.error(err);
    } finally {
      setVotingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    
    setCreating(true);
    try {
      await createProposal(newTitle, newDesc, newType);
      setNewTitle('');
      setNewDesc('');
      setShowCreate(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const getTypeColor = (type: ProposalType) => {
    switch(type) {
      case ProposalType.APPROVE_MANUFACTURER: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ProposalType.FLAG_SUSPICIOUS_ENTITY: return 'bg-red-100 text-red-800 border-red-200';
      case ProposalType.VERIFY_BATCH: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch(status) {
      case ProposalStatus.PASSED: return <span className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold border border-green-200"><CheckCircle className="w-3 h-3"/> PASSED</span>;
      case ProposalStatus.REJECTED: return <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold border border-red-200"><XCircle className="w-3 h-3"/> REJECTED</span>;
      case ProposalStatus.ACTIVE: return <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"><Clock className="w-3 h-3"/> ACTIVE</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gavel className="w-7 h-7 text-teal-600" />
            Governance DAO
          </h2>
          <p className="text-gray-500 mt-1">Decentralized voting on supply chain approvals and security protocols.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          {showCreate ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Proposal'}
        </button>
      </div>

      {/* Create Proposal Panel */}
      {showCreate && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top-4">
           <h3 className="text-lg font-bold text-gray-800 mb-4">Submit New Proposal</h3>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title</label>
                 <input 
                   type="text" 
                   value={newTitle}
                   onChange={e => setNewTitle(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                   placeholder="e.g., Whitelist New Distributor Node"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                 <select 
                   value={newType}
                   onChange={e => setNewType(e.target.value as ProposalType)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                 >
                   {Object.values(ProposalType).map(t => (
                     <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                   ))}
                 </select>
               </div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Description & Justification</label>
               <textarea 
                 value={newDesc}
                 onChange={e => setNewDesc(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                 placeholder="Provide details, compliance IDs, or transaction hashes..."
                 required
               />
             </div>
             <div className="flex justify-end pt-2">
               <button 
                type="submit" 
                disabled={creating}
                className="px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-70"
               >
                 {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                 Submit to Chain
               </button>
             </div>
           </form>
        </div>
      )}

      {/* Proposals List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal) => {
            const totalVotes = proposal.votesFor + proposal.votesAgainst;
            const forPercent = totalVotes === 0 ? 0 : Math.round((proposal.votesFor / totalVotes) * 100);
            const againstPercent = totalVotes === 0 ? 0 : Math.round((proposal.votesAgainst / totalVotes) * 100);
            const timeLeft = Math.max(0, new Date(proposal.deadline).getTime() - Date.now());
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            const isExpired = timeLeft <= 0;

            return (
              <div key={proposal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getTypeColor(proposal.type)}`}>
                        {proposal.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{proposal.id}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{proposal.title}</h3>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>
                
                <p className="text-gray-600 text-sm mb-6 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {proposal.description}
                </p>

                {/* Voting Bar */}
                <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
                  <span className="text-teal-600">{forPercent}% For ({proposal.votesFor.toLocaleString()})</span>
                  <span className="text-red-500">{againstPercent}% Against ({proposal.votesAgainst.toLocaleString()})</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex mb-4">
                  <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${forPercent}%` }}></div>
                  <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${againstPercent}%` }}></div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Proposer: {proposal.proposer.substring(0, 12)}...</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{isExpired ? 'Voting Closed' : `${daysLeft} days remaining`}</span>
                    </div>
                  </div>

                  {proposal.status === ProposalStatus.ACTIVE && !isExpired && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={votingId === proposal.id}
                        className="px-3 py-1.5 bg-white border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        {votingId === proposal.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <ThumbsUp className="w-3 h-3" />}
                        Vote For
                      </button>
                      <button 
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={votingId === proposal.id}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        {votingId === proposal.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <ThumbsDown className="w-3 h-3" />}
                        Vote Against
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Governance;
