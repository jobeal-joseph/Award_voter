import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAwardById, getNominees, voteForNominee, hasVoted, subscribeToNominees } from '../utils/storage';
import { ArrowLeft, CheckCircle2, User } from 'lucide-react';

const NomineeList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [award, setAward] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const fetchData = async () => {
    try {
      const [currentAward, nomineesList, voted] = await Promise.all([
        getAwardById(id),
        getNominees(id),
        hasVoted(id),
      ]);

      if (!currentAward) {
        navigate('/');
        return;
      }

      setAward(currentAward);
      setNominees(nomineesList);
      setUserHasVoted(voted);
    } catch (err) {
      console.error('Error loading data:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription for nominee changes (votes, edits, additions)
    const unsubscribe = subscribeToNominees(id, async () => {
      try {
        const updated = await getNominees(id);
        setNominees(updated);
      } catch (_) { /* ignore */ }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleVote = async (nomineeId) => {
    if (userHasVoted || voting) return;
    setVoting(true);

    try {
      await voteForNominee(nomineeId, id);
      const updated = await getNominees(id);
      setNominees(updated);
      setUserHasVoted(true);
      setToastMessage('Your vote has been recorded.');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setToastMessage(err.message || 'Something went wrong.');
      setTimeout(() => setToastMessage(''), 3000);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-apple-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!award) return null;

  return (
    <div className="animate-fade-in relative pb-20">
      {/* Back */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center space-x-1 text-white text-sm font-medium mb-6 active:opacity-60 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {award.name}
        </h1>
        <p className="text-sm text-white/50 mt-1">{award.description}</p>
        
        {userHasVoted && (
          <div className="mt-4 flex items-center space-x-2 text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>You've voted in this category</span>
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black text-sm px-5 py-3 rounded-full shadow-xl flex items-center space-x-2 z-50 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Nominees */}
      {nominees.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-white/50 font-medium">No nominees yet.</p>
          
        </div>
      ) : (
        <div className="space-y-3">
          {nominees.map((nominee) => (
            <div 
              key={nominee.id} 
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-4"
            >
              {/* Avatar */}
             

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white truncate">{nominee.name}</h3>
            
              </div>

              {/* Vote Button */}
              <button
                onClick={() => handleVote(nominee.id)}
                disabled={userHasVoted || voting}
                className={`flex-shrink-0 text-sm font-semibold py-2 px-5 rounded-full transition-all duration-200 ${
                  userHasVoted 
                    ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                    : 'bg-apple-blue text-white active:scale-95'
                }`}
              >
                {voting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : userHasVoted ? 'Voted' : 'Vote'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NomineeList;
