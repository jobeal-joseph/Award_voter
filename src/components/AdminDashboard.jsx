import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAwards, getNominees,
  addAward, updateAward, deleteAward,
  addNominee, deleteNominee,
  subscribeToAwards, subscribeToNominees,
  getVotesSummary,
} from '../utils/storage';
import { 
  PlusCircle, Trash2, Edit2, Check, X, 
  Users, Award as AwardIcon, Loader2, BarChart3,
} from 'lucide-react';
import ImageUpload from './ImageUpload';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('awards');
  
  const [awards, setAwards] = useState([]);
  const [allNominees, setAllNominees] = useState([]);
  const [votesSummary, setVotesSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Award Form
  const [editingAwardId, setEditingAwardId] = useState(null);
  const [awardName, setAwardName] = useState('');
  const [awardDescription, setAwardDescription] = useState('');
  const [savingAward, setSavingAward] = useState(false);
  
  // Nominee Form
  const [selectedAward, setSelectedAward] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [savingNominee, setSavingNominee] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');

  // ─── Auth guard ──────────────────────────────────────────
  useEffect(() => {
    if (user === null) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // ─── Data fetching ───────────────────────────────────────
  const refreshData = async () => {
    try {
      const [awardsList, nomineesList, votesData] = await Promise.all([
        getAwards(),
        getNominees(),
        getVotesSummary(),
      ]);
      setAwards(awardsList);
      setAllNominees(nomineesList);
      setVotesSummary(votesData);
      if (awardsList.length > 0 && !selectedAward) {
        setSelectedAward(awardsList[0].id);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const unsubAwards = subscribeToAwards(() => refreshData());
    const unsubNominees = subscribeToNominees(null, () => refreshData());
    return () => {
      unsubAwards();
      unsubNominees();
    };
  }, []);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- Award Actions ---
  const handleAwardSubmit = async (e) => {
    e.preventDefault();
    if (!awardName.trim()) return;
    setSavingAward(true);

    try {
      if (editingAwardId) {
        await updateAward(editingAwardId, { name: awardName, description: awardDescription });
        showToast('Award updated.');
        setEditingAwardId(null);
      } else {
        await addAward(awardName, awardDescription);
        showToast('Award created.');
      }
      setAwardName('');
      setAwardDescription('');
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setSavingAward(false);
    }
  };

  const startEditAward = (award) => {
    setEditingAwardId(award.id);
    setAwardName(award.name);
    setAwardDescription(award.description);
  };

  const cancelEditAward = () => {
    setEditingAwardId(null);
    setAwardName('');
    setAwardDescription('');
  };

  const handleDeleteAward = async (id) => {
    if (window.confirm('Delete this award and all its nominees?')) {
      try {
        await deleteAward(id);
        showToast('Award deleted.');
      } catch (err) {
        showToast('Error: ' + err.message);
      }
    }
  };

  // --- Nominee Actions ---
  const handleNomineeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAward || !nomineeName.trim()) return;
    setSavingNominee(true);

    try {
      await addNominee(selectedAward, nomineeName, imageUrl);
      showToast(`${nomineeName} added.`);
      setNomineeName('');
      setImageUrl('');
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setSavingNominee(false);
    }
  };

  const handleDeleteNominee = async (id) => {
    if (window.confirm('Remove this nominee?')) {
      try {
        await deleteNominee(id);
        showToast('Nominee removed.');
      } catch (err) {
        showToast('Error: ' + err.message);
      }
    }
  };

  // ─── Render ──────────────────────────────────────────────
  if (user === undefined || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-apple-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight text-white mb-6">
        Admin Dashboard
      </h1>

      {/* Segmented Control */}
      <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/10">
        <button 
          onClick={() => setActiveTab('awards')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'awards' 
              ? 'bg-white/15 text-white shadow-sm' 
              : 'text-white/40'
          }`}
        >
          <AwardIcon className="w-4 h-4" />
          <span>Awards</span>
        </button>
        <button 
          onClick={() => setActiveTab('nominees')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'nominees' 
              ? 'bg-white/15 text-white shadow-sm' 
              : 'text-white/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Nominees</span>
        </button>
        <button 
          onClick={() => setActiveTab('votes')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'votes' 
              ? 'bg-white/15 text-white shadow-sm' 
              : 'text-white/40'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Votes</span>
        </button>
      </div>

      {/* Toast */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-xl mb-5 flex items-center space-x-2 font-medium animate-slide-up">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Awards Tab */}
      {activeTab === 'awards' && (
        <div className="space-y-6">
          {/* Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">
              {editingAwardId ? 'Edit Award' : 'New Award'}
            </h2>
            <form onSubmit={handleAwardSubmit} className="space-y-3">
              <input 
                type="text" 
                className="input-field" 
                value={awardName} 
                onChange={e => setAwardName(e.target.value)} 
                placeholder="Award name" 
                required 
              />
              <textarea 
                className="input-field min-h-[80px] resize-none" 
                value={awardDescription} 
                onChange={e => setAwardDescription(e.target.value)} 
                placeholder="Description (optional)"
              />
              <div className="flex space-x-2">
                <button type="submit" disabled={savingAward} className="btn-primary flex-1 py-2.5 flex items-center justify-center">
                  {savingAward ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editingAwardId ? 'Save Changes' : 'Add Award'
                  )}
                </button>
                {editingAwardId && (
                  <button 
                    type="button" 
                    onClick={cancelEditAward}
                    className="btn-secondary px-4 py-2.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="space-y-2">
            {awards.length === 0 ? (
              <div className="text-center py-16 text-white/30 text-sm">
                No awards created yet.
              </div>
            ) : (
              awards.map(award => (
                <div key={award.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">{award.name}</h3>
                    <p className="text-xs text-white/30 truncate mt-0.5">{award.description}</p>
                  </div>
                  <div className="flex space-x-1 ml-3">
                    <button 
                      onClick={() => startEditAward(award)}
                      className="p-2 text-white/30 hover:text-apple-blue rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAward(award.id)}
                      className="p-2 text-white/30 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Nominees Tab */}
      {activeTab === 'nominees' && (
        <div className="space-y-6">
          {/* Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Add Nominee</h2>
            <form onSubmit={handleNomineeSubmit} className="space-y-3">
              <select 
                className="input-field appearance-none" 
                value={selectedAward} 
                onChange={e => setSelectedAward(e.target.value)} 
                required
              >
                {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input 
                type="text" 
                className="input-field" 
                value={nomineeName} 
                onChange={e => setNomineeName(e.target.value)} 
                placeholder="Nominee name" 
                required 
              />
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 ml-1">Photo (optional)</label>
                <ImageUpload
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                />
              </div>
              <button type="submit" disabled={savingNominee} className="btn-primary w-full py-2.5 flex items-center justify-center">
                {savingNominee ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Add Nominee'
                )}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="space-y-2">
            {allNominees.length === 0 ? (
              <div className="text-center py-16 text-white/30 text-sm">
                No nominees added yet.
              </div>
            ) : (
              allNominees.map(nominee => {
                const award = awards.find(a => a.id === nominee.awardId);
                return (
                  <div key={nominee.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {nominee.imageUrl ? (
                        <img src={nominee.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{nominee.name}</h3>
                      <p className="text-xs text-apple-blue truncate">
                        {award ? award.name : 'Unknown'} · {nominee.votes} {nominee.votes === 1 ? 'vote' : 'votes'}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteNominee(nominee.id)}
                      className="p-2 text-white/20 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Votes Tab */}
      {activeTab === 'votes' && (
        <div className="space-y-4">
          {votesSummary.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">
              No votes recorded yet.
            </div>
          ) : (
            votesSummary.map(award => (
              <div key={award.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Award Header */}
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{award.name}</h3>
                  <span className="text-xs font-medium text-apple-blue bg-apple-blue/10 px-2.5 py-1 rounded-full">
                    {award.totalVotes} {award.totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>

                {/* Nominees ranked by votes */}
                {award.nominees.length === 0 ? (
                  <div className="px-5 py-4 text-xs text-white/30">No nominees</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {award.nominees.map((nominee, idx) => {
                      const maxVotes = award.nominees[0]?.votes || 1;
                      const pct = maxVotes > 0 ? ((nominee.votes || 0) / maxVotes) * 100 : 0;
                      return (
                        <div key={nominee.id} className="px-5 py-3 flex items-center space-x-3 relative overflow-hidden">
                          {/* Progress bar background */}
                          <div
                            className="absolute inset-y-0 left-0 bg-apple-blue/10 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative text-xs font-bold text-white/40 w-5 text-center">{idx + 1}</span>
                          <span className="relative flex-1 text-sm font-medium text-white truncate">{nominee.name}</span>
                          <span className="relative text-sm font-bold text-white tabular-nums">
                            {nominee.votes || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
