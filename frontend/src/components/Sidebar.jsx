import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: '🏠', path: '/', label: 'Home' },
    { icon: '🎮', path: '/playonline', label: 'Play Online' },
    { icon: '🧑‍🤝‍🧑', path: '/playlocal', label: 'Play Local' },
    { icon: '⚙️', path: '/settings', label: 'Settings' },
    { icon: '❓', path: '/help', label: 'Help' },
  ];

  return (
    <div className="w-16 md:w-20 bg-[#111111] border-r border-gray-800 flex flex-col items-center py-6 space-y-8">
      {/* Logo */}
      <div className="text-white font-bold text-sm">♟️</div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-6 text-gray-400 text-2xl">
        {navItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            data-tooltip-id={`tip-${idx}`}
            data-tooltip-content={item.label}
            className={`hover:text-white transition duration-200 ${
              location.pathname === item.path ? 'text-white' : ''
            }`}
          >
            <span>{item.icon}</span>
            <Tooltip id={`tip-${idx}`} place="right" effect="solid" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
