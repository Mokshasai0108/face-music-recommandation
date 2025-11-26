import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BarChart3, Settings } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">

            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Face Detection
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              data-testid="nav-home-link"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${isActive('/')
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                }`}
            >

              <span className="font-medium">Detect</span>
            </Link>

            <Link
              to="/analytics"
              data-testid="nav-analytics-link"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${isActive('/analytics')
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                }`}
            >

              <span className="font-medium">Analytics</span>
            </Link>

            <Link
              to="/settings"
              data-testid="nav-settings-link"
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${isActive('/settings')
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                }`}
            >

              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
