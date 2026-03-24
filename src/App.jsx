import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AwardList from './components/AwardList';
import NomineeList from './components/NomineeList';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import LightRays from './components/LightRays';
import { onAuthStateChange } from './utils/storage';

const App = () => {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in

  useEffect(() => {
    const subscription = onAuthStateChange((u) => setUser(u));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black relative">
      {/* LightRays Background */}
      <div className="fixed inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.4}
          lightSpread={1.2}
          rayLength={3.5}
          pulsating={true}
          fadeDistance={1.2}
          saturation={0.6}
          followMouse={true}
          mouseInfluence={0.05}
          noiseAmount={0.02}
          distortion={0.1}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar user={user} />
        <main className="flex-grow max-w-5xl mx-auto px-5 py-8 w-full">
          <Routes>
            <Route path="/" element={<AwardList />} />
            <Route path="/award/:id" element={<NomineeList />} />
            <Route path="/admin" element={<AdminLogin user={user} />} />
            <Route path="/admin/login" element={<AdminLogin user={user} />} />
            <Route path="/admin/dashboard" element={<AdminDashboard user={user} />} />
          </Routes>
        </main>
        
        <footer className="py-6 text-center text-white/30 text-xs tracking-tight">
         
        </footer>
      </div>
    </div>
  );
};

export default App;
