
import React from 'react';

interface BottomNavProps {
  activeTab: 'shop' | 'customize' | 'mine';
  onChange: (tab: 'shop' | 'customize' | 'mine') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  
  const navItems = [
    {
      id: 'shop',
      label: '市集',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'customize',
      label: '五行訂製',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: 'mine',
      label: '我的',
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 pb-[env(safe-area-inset-bottom)] bg-slate-950/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group"
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute top-0 w-12 h-1 bg-mystic-500 shadow-[0_0_10px_#d946ef] rounded-b-full animate-fade-in"></div>
              )}
              
              <div className={`transition-colors duration-300 ${isActive ? 'text-mystic-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                 {item.icon(isActive)}
              </div>
              
              <span className={`text-[10px] font-sans transition-all duration-300 ${isActive ? 'text-white font-medium scale-105' : 'text-slate-500 scale-100'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
