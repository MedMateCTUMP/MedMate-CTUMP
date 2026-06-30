import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Subjects from './components/Subjects';
import Sessions from './components/Sessions';
import ScreenTime from './components/ScreenTime';
import AppLimits from './components/AppLimits';
import AIAssistant from './components/AIAssistant';
import GoogleCalendarSync from './components/GoogleCalendarSync';
import RewardsStore from './components/RewardsStore';
import Pomodoro from './components/Pomodoro';

import { UserProfile, Subject, StudySession, ScreenTime as ScreenTimeType, AppLimit, PointLog } from './types';
import { Menu, User, Flame, LogOut, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // App views
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [screenTime, setScreenTime] = useState<ScreenTimeType[]>([]);
  const [appLimits, setAppLimits] = useState<AppLimit[]>([]);
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);

  // Loading states
  const [loadingData, setLoadingData] = useState(false);

  // Check if session exists in localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('medmate_email');
    const token = localStorage.getItem('medmate_token');
    if (savedEmail && token) {
      setUserEmail(savedEmail);
      setIsAuthenticated(true);
      fetchUserData(savedEmail);
    }
  }, []);

  // 15-minute push notifications background check
  useEffect(() => {
    if (!isAuthenticated || sessions.length === 0) return;

    const checkStudyNotifications = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const notifiedString = localStorage.getItem('medmate_notified_sessions') || '[]';
      let notifiedArray: string[] = [];
      try {
        notifiedArray = JSON.parse(notifiedString);
      } catch (e) {
        notifiedArray = [];
      }

      let updated = false;

      sessions.forEach(session => {
        if (session.status !== 'planned') return;
        if (notifiedArray.includes(session.id)) return;

        const startTime = new Date(session.startTime);
        const diffMs = startTime.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        // Notify if start time is between 13 and 16.5 minutes from now (around 15 minutes)
        if (diffMins >= 13 && diffMins <= 16.5) {
          const subjectName = subjects.find(s => s.id === session.subjectId)?.name || 'Môn học';
          
          // Show browser push notification
          new Notification(`📅 Lịch học: ${session.title}`, {
            body: `Môn học: ${subjectName}\nSắp diễn ra sau 15 phút nữa (${new Date(session.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}). Chuẩn bị vào bàn học nhé!`,
            icon: '/favicon.ico',
            tag: session.id,
            requireInteraction: true
          });

          notifiedArray.push(session.id);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem('medmate_notified_sessions', JSON.stringify(notifiedArray));
      }
    };

    // Run check immediately on mount/update and then every 20 seconds
    checkStudyNotifications();
    const interval = setInterval(checkStudyNotifications, 20000);

    return () => clearInterval(interval);
  }, [isAuthenticated, sessions, subjects]);

  // Fetch all user specific data from backend API
  const fetchUserData = async (email: string) => {
    setLoadingData(true);
    try {
      // 1. Get user profile
      const userRes = await fetch(`/api/user/${encodeURIComponent(email)}`);
      if (userRes.ok) {
        const profileData = await userRes.json();
        setUserProfile(profileData);
      }

      // 2. Get global dashboard data structure
      const dataRes = await fetch(`/api/data?email=${encodeURIComponent(email)}`);
      if (dataRes.ok) {
        const payload = await dataRes.json();
        setSubjects(payload.subjects || []);
        setSessions(payload.sessions || []);
        setScreenTime(payload.screenTime || []);
        setAppLimits(payload.appLimits || []);
        setPointLogs(payload.pointLogs || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    fetchUserData(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('medmate_email');
    localStorage.removeItem('medmate_token');
    setIsAuthenticated(false);
    setUserEmail('');
    setUserProfile(null);
    setCurrentView('dashboard');
  };

  // ================= DATA MUTATION API HANDLERS =================

  // 1. Subject add/edit
  const handleAddOrEditSubject = async (sub: { id?: string; name: string; color: string; targetHours: number }) => {
    const url = sub.id ? `/api/subjects?id=${sub.id}` : '/api/subjects';
    const method = sub.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sub, userEmail })
    });

    if (res.ok) {
      // Refresh database
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to save subject');
    }
  };

  // 2. Subject deletion
  const handleDeleteSubject = async (id: string) => {
    const res = await fetch(`/api/subjects?id=${id}&userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to delete subject');
    }
  };

  // 3. Study Session add/edit (marking completed awards +50 points instantly!)
  const handleAddOrEditSession = async (sess: {
    id?: string;
    subjectId: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    notes?: string;
    status: 'planned' | 'done';
    syncedToGoogle: boolean;
  }) => {
    const url = sess.id ? `/api/sessions?id=${sess.id}` : '/api/sessions';
    const method = sess.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sess, userEmail })
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to save study session');
    }
  };

  // 4. Study Session deletion
  const handleDeleteSession = async (id: string) => {
    const res = await fetch(`/api/sessions?id=${id}&userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to delete session');
    }
  };

  // 5. Google Calendar Synchronization
  const handleSyncSessions = async (ids: string[]) => {
    const res = await fetch('/api/sessions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, userEmail })
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to sync sessions to Google Calendar');
    }
  };

  // 6. Log daily screen time
  const handleAddScreenTime = async (appName: string, minutes: number) => {
    const res = await fetch('/api/screentime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appName, minutes, userEmail })
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to log screen time');
    }
  };

  // 7. Delete screen time
  const handleDeleteScreenTime = async (id: string) => {
    const res = await fetch(`/api/screentime?id=${id}&userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to delete screen time log');
    }
  };

  // 8. Configure limit config
  const handleAddOrEditLimit = async (appName: string, limitMinutes: number) => {
    const res = await fetch('/api/limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appName, limitMinutes, userEmail })
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to save app limit config');
    }
  };

  // 9. Delete limit
  const handleDeleteLimit = async (id: string) => {
    const res = await fetch(`/api/limits?id=${id}&userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to delete limit');
    }
  };

  // 10. Award Points (Manual or Pomodoro completion)
  const handleAwardPoints = async (points: number, reason: string) => {
    const res = await fetch('/api/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, reason, userEmail })
    });

    if (res.ok) {
      fetchUserData(userEmail);
    } else {
      throw new Error('Failed to update reward points');
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased overflow-x-hidden selection:bg-teal-500/10 selection:text-teal-900">
      
      {/* 1. Fixed Left sidebar */}
      <Sidebar 
        currentView={currentView}
        setView={(view) => {
          setCurrentView(view);
          setMobileMenuOpen(false); // Close drawer on navigation
        }}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        user={userProfile || { email: userEmail, points: 0, streak: 1 }}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* 2. Main content viewport area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        
        {/* Top bar header */}
        <header className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger button for small viewports */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            
            {/* Display active view label */}
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest hidden sm:block">
              {currentView === 'dashboard' && 'Bảng điều khiển'}
              {currentView === 'subjects' && 'Quản lý Môn học'}
              {currentView === 'sessions' && 'Lịch trình Ca học'}
              {currentView === 'screentime' && 'Theo dõi Screen Time'}
              {currentView === 'limits' && 'Hạn mức Ứng dụng'}
              {currentView === 'ai' && 'Hỏi đáp Trợ lý AI'}
              {currentView === 'sync' && 'Đồng bộ Google Calendar'}
              {currentView === 'rewards' && 'Cửa hàng Quà thưởng'}
            </h1>
          </div>

          {/* User profile capsule info */}
          <div className="flex items-center gap-4">
            
            {/* Streak count capsule */}
            {userProfile && (
              <div 
                className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black cursor-pointer shadow-sm hover:bg-amber-100 transition-colors"
                title="Chuỗi liên tục học tập hàng ngày"
                onClick={() => setCurrentView('rewards')}
              >
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>{userProfile.streak} ngày</span>
              </div>
            )}

            {/* Email display and action button */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-none">{userEmail.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1.5 leading-none uppercase tracking-wider">Sinh viên Y Dược</p>
              </div>
              
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-black text-xs shadow-inner uppercase">
                {userEmail.substring(0, 2)}
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Đăng xuất tài khoản"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>

        {/* Global Loading overlay screen */}
        {loadingData ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3.5 bg-slate-50">
            <Loader2 className="w-9 h-9 text-teal-600 animate-spin" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase animate-pulse">Đang đồng bộ cơ sở dữ liệu học tập...</span>
          </div>
        ) : (
          /* View switch main area */
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              
              {currentView === 'dashboard' && (
                <Dashboard 
                  user={userProfile || { email: userEmail, points: 0, streak: 1 }}
                  subjects={subjects}
                  sessions={sessions}
                  screenTime={screenTime}
                  appLimits={appLimits}
                  pointLogs={pointLogs}
                  setView={setCurrentView}
                  onQuickStudy={() => setCurrentView('pomodoro')}
                />
              )}

              {currentView === 'subjects' && (
                <Subjects 
                  subjects={subjects}
                  onAddOrEditSubject={handleAddOrEditSubject}
                  onDeleteSubject={handleDeleteSubject}
                />
              )}

              {currentView === 'sessions' && (
                <Sessions 
                  subjects={subjects}
                  sessions={sessions}
                  onAddOrEditSession={handleAddOrEditSession}
                  onDeleteSession={handleDeleteSession}
                  onSyncSessions={handleSyncSessions}
                />
              )}

              {currentView === 'screentime' && (
                <ScreenTime 
                  screenTime={screenTime}
                  appLimits={appLimits}
                  onAddScreenTime={handleAddScreenTime}
                  onDeleteScreenTime={handleDeleteScreenTime}
                />
              )}

              {currentView === 'limits' && (
                <AppLimits 
                  appLimits={appLimits}
                  screenTime={screenTime}
                  onAddOrEditLimit={handleAddOrEditLimit}
                  onDeleteLimit={handleDeleteLimit}
                />
              )}

              {currentView === 'pomodoro' && (
                <Pomodoro 
                  subjects={subjects}
                  onAwardPoints={handleAwardPoints}
                />
              )}

              {currentView === 'ai' && (
                <AIAssistant 
                  user={userProfile || { email: userEmail, points: 0, streak: 1 }}
                />
              )}

              {currentView === 'sync' && (
                <GoogleCalendarSync 
                  subjects={subjects}
                  sessions={sessions}
                  onSyncSessions={handleSyncSessions}
                />
              )}

              {currentView === 'rewards' && (
                <RewardsStore 
                  user={userProfile || { email: userEmail, points: 0, streak: 1 }}
                  pointLogs={pointLogs}
                  onDeductPoints={handleAwardPoints}
                />
              )}

            </div>
          </main>
        )}

      </div>

    </div>
  );
}
