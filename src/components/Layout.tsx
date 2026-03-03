import React from 'react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-pixel">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 font-pixel text-xs md:text-sm">
      <div className="max-w-4xl mx-auto">
        {user && <Navbar />}
        <main className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
