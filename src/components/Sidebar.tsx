import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  CalendarDays, 
  Bot, 
  Timer, 
  Smartphone, 
  Sliders, 
  Award, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({ 
  currentView, 
  setView, 
  user, 
  onLogout,
  collapsed,
  setCollapsed,
  mobileMenuOpen = false,
  setMobileMenuOpen
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', name: 'Tổng quan', icon: LayoutDashboard },
    { id: 'subjects', name: 'Môn học', icon: BookOpen },
    { id: 'sessions', name: 'Lịch học & Ca học', icon: Calendar },
    { id: 'sync', name: 'Google Calendar', icon: CalendarDays },
    { id: 'ai', name: 'AI Trợ lý MedMate', icon: Bot },
    { id: 'pomodoro', name: 'Tập trung Pomodoro', icon: Timer },
    { id: 'screentime', name: 'Screen Time', icon: Smartphone },
    { id: 'limits', name: 'Giới hạn ứng dụng', icon: Sliders },
    { id: 'rewards', name: 'Thống kê & Điểm thưởng', icon: Award }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      {/* Brand Logo & Name */}
      <div className="p-5 flex items-center justify-between border-b border-teal-800/40 bg-teal-950/20">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-md">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {(!collapsed || mobileMenuOpen) && (
            <div className="flex flex-col min-w-0 transition-opacity duration-300">
              <span className="font-bold text-white tracking-tight leading-none text-lg">MedMate</span>
              <span className="text-[10px] text-teal-200/70 font-bold tracking-wider mt-1">CTUMP PORTAL</span>
            </div>
          )}
        </div>
        
        {/* Toggle Collapse desktop button / Mobile close button */}
        {mobileMenuOpen && setMobileMenuOpen ? (
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-teal-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-teal-200 hover:text-white transition-colors cursor-pointer"
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-teal-800/40">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium transition-all duration-150 group relative cursor-pointer ${
                isActive 
                  ? 'bg-white/10 text-white shadow-none' 
                  : 'text-teal-100 hover:bg-white/5 hover:text-white'
              }`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-teal-200/80 group-hover:text-white transition-colors'}`} />
              {(!collapsed || mobileMenuOpen) && <span className="text-sm tracking-wide truncate">{item.name}</span>}
              
              {/* Tooltip on collapsed desktop view */}
              {collapsed && !mobileMenuOpen && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-teal-950 text-xs font-semibold text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-teal-800/40">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* User Information & Logout */}
      {user && (
        <div className="p-4 border-t border-teal-800/40 bg-teal-950/20">
          {(!collapsed || mobileMenuOpen) ? (
            <div className="space-y-4">
              {/* Profile Block */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold shadow-inner shrink-0">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate leading-tight" title={user.email}>
                    {user.email}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-amber-300 border border-white/5">
                      🔥 Streak: {user.streak}d
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-teal-200 border border-white/5">
                      🏅 {user.points} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={onLogout}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-rose-950/40 text-teal-100 hover:text-rose-200 rounded-xl font-medium text-xs flex items-center justify-center gap-2.5 transition-all border border-white/10 hover:border-rose-900/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Collapsed Avatar */}
              <div 
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-white/20 transition-colors"
                title={`${user.email} (Streak: ${user.streak}d, Points: ${user.points} XP)`}
                onClick={() => setView('rewards')}
              >
                {user.email.substring(0, 2).toUpperCase()}
              </div>
              <button 
                onClick={onLogout}
                className="p-2 bg-white/5 hover:bg-rose-950 hover:text-rose-200 rounded-xl text-teal-100 transition-colors cursor-pointer border border-white/10"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={`hidden lg:flex h-screen bg-[#0f766e] text-white flex-col transition-all duration-300 shadow-xl ${
          collapsed ? 'w-20' : 'w-64'
        } fixed left-0 top-0 bottom-0 z-20`}
      >
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop mask */}
          <div 
            onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          {/* Drawer content panel */}
          <div className="fixed top-0 bottom-0 left-0 w-72 bg-[#0f766e] text-white shadow-2xl z-50 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
