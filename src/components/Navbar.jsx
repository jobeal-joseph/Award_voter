import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { adminLogout } from '../utils/storage';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await adminLogout();
    navigate('/');
  };

  return (
    <nav className="glass-header">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex justify-between items-center h-12">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-sm font-black text-gold-300 tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif", fontSize: "17px" }}>
              Award Ceremony
            </span>
            
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/admin/dashboard" className="text-xs font-medium text-gold-300/50 hover:text-gold-300 transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-xs font-medium text-gold-300/50 hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
