import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAwards, subscribeToAwards } from '../utils/storage';
import { ChevronRight } from 'lucide-react';

const AwardList = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAwards = async () => {
    try {
      const data = await getAwards();
      setAwards(data);
    } catch (err) {
      console.error('Error fetching awards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwards();
    const unsubscribe = subscribeToAwards(() => fetchAwards());
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-apple-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Award Cards */}
      <div className="space-y-3">
        {awards.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-white/50 font-medium">No award categories yet.</p>
            <p className="text-xs text-white/30 mt-1">Check back soon!</p>
          </div>
        ) : (
          awards.map((award, index) => (
            <Link 
              to={`/award/${award.id}`} 
              key={award.id}
              className="block group"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between transition-all duration-200 active:scale-[0.98]">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    {award.name}
                  </h2>
                  <p className="text-sm text-white/40 mt-0.5 truncate">
                    {award.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 ml-3" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default AwardList;
