import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { path: '/', label: 'ステータス' },
    { path: '/inventory', label: 'アイテム一覧' },
    { path: '/builds', label: '装備セット' },
    { path: '/profile', label: 'プロフィール' },
  ];

  return (
    <nav className="rpg-box mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="text-xl text-yellow-400 animate-pulse">SkillQuest</div>
      <div className="flex flex-wrap gap-4 justify-center">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-2 py-1 hover:text-yellow-300 ${location.pathname === link.path ? 'text-yellow-300 border-b-2 border-yellow-300' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
