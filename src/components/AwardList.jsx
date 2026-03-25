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
        <div className="w-6 h-6 border-2 border-gold-300/20 border-t-gold-300 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Award Cards */}
      <div className="space-y-0">
        {awards.map((award, index) => (
          <Link 
            to={`/award/${award.id}`} 
            key={award.id}
            className="block group"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center px-4 py-5 border-b border-gold-300/10 hover:bg-gold-300/5 transition-all duration-200 active:scale-[0.99]">

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-gold-300 transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                  {award.name}
                </h2>
               
              
              </div>
              <ChevronRight className="w-5 h-5 text-gold-300/20 group-hover:text-gold-300 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AwardList;
