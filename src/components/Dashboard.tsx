import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  GraduationCap, 
  Timer, 
  Tv, 
  Flame, 
  Plus, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin
} from 'lucide-react';
import { Subject, StudySession, ScreenTime, AppLimit, PointLog, UserProfile } from '../types';

interface DashboardProps {
  user: UserProfile;
  subjects: Subject[];
  sessions: StudySession[];
  screenTime: ScreenTime[];
  appLimits: AppLimit[];
  pointLogs: PointLog[];
  setView: (view: string) => void;
  onQuickStudy: () => void;
}

export default function Dashboard({
  user,
  subjects,
  sessions,
  screenTime,
  appLimits,
  pointLogs,
  setView,
  onQuickStudy
}: DashboardProps) {
  
  const todayStr = new Date().toISOString().split('T')[0];

  // ================= CALCULATE STATS =================

  // 1. Study time calculations
  const totalCompletedMinutes = sessions
    .filter(s => s.status === 'done')
    .reduce((acc, curr) => {
      const start = new Date(curr.startTime).getTime();
      const end = new Date(curr.endTime).getTime();
      return acc + Math.round((end - start) / 60000);
    }, 0);
  
  const totalCompletedHours = (totalCompletedMinutes / 60).toFixed(1);
  const weeklyTargetHours = subjects.reduce((acc, curr) => acc + curr.targetHours, 0);

  // 2. Today's sessions
  const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr));
  const doneToday = todaySessions.filter(s => s.status === 'done').length;
  const totalToday = todaySessions.length;

  // 3. Screen Time
  const todayScreenTimeList = screenTime.filter(st => st.date === todayStr);
  const totalEntertainmentMinutes = todayScreenTimeList
    .filter(st => ['tiktok', 'facebook', 'youtube', 'instagram', 'game'].some(kw => st.appName.toLowerCase().includes(kw)))
    .reduce((acc, curr) => acc + curr.minutes, 0);
  
  const totalStudyAppMinutes = todayScreenTimeList
    .filter(st => ['medmate', 'học', 'study', 'anatomy', 'dược'].some(kw => st.appName.toLowerCase().includes(kw)))
    .reduce((acc, curr) => acc + curr.minutes, 0);

  // Exceeded limits warnings
  const exceededLimits = appLimits.map(limit => {
    const usage = todayScreenTimeList.find(st => st.appName.toLowerCase() === limit.appName.toLowerCase());
    const usedMins = usage ? usage.minutes : 0;
    return {
      appName: limit.appName,
      limit: limit.limitMinutes,
      used: usedMins,
      exceeded: usedMins > limit.limitMinutes
    };
  }).filter(l => l.exceeded);

  // ================= PREPARE CHART DATA =================

  // Chart 1: Subject actual study hours vs targets
  const subjectChartData = subjects.map(sub => {
    // Sum minutes of done sessions for this subject
    const mins = sessions
      .filter(s => s.subjectId === sub.id && s.status === 'done')
      .reduce((acc, curr) => {
        const start = new Date(curr.startTime).getTime();
        const end = new Date(curr.endTime).getTime();
        return acc + Math.round((end - start) / 60000);
      }, 0);
    
    return {
      name: sub.name.length > 12 ? sub.name.substring(0, 12) + '...' : sub.name,
      'Thực tế (Giờ)': parseFloat((mins / 60).toFixed(1)),
      'Mục tiêu (Giờ)': sub.targetHours,
      color: sub.color
    };
  });

  // Chart 2: Daily Screentime Breakdown
  const screenTimeChartData = todayScreenTimeList.map(st => ({
    name: st.appName,
    'Phút học': ['medmate', 'học', 'study', 'anatomy'].some(kw => st.appName.toLowerCase().includes(kw)) ? st.minutes : 0,
    'Phút giải trí': !['medmate', 'học', 'study', 'anatomy'].some(kw => st.appName.toLowerCase().includes(kw)) ? st.minutes : 0
  }));

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Header Banner Greeting */}
      <div className="relative rounded-[22px] bg-[#0f766e] p-8 text-white overflow-hidden shadow-lg shadow-teal-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>MedMate CTUMP SMART LEARNING</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Chào ngày mới học tập vất vả, sinh viên Y Dược!
          </h2>
          <p className="text-teal-100/90 text-sm leading-relaxed font-medium">
            Hôm nay bạn đang duy trì chuỗi <strong className="font-extrabold text-amber-300">{user.streak} ngày học liên tục</strong> cực kỳ xuất sắc. Hãy giữ vững ngọn lửa nhiệt huyết này nhé. Tập trung cao độ với Pomodoro để chinh phục mục tiêu tuần này!
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={onQuickStudy}
              className="px-5 py-3 bg-white text-teal-900 rounded-xl font-bold text-sm shadow-md hover:bg-teal-50 transition-all cursor-pointer flex items-center gap-2"
            >
              <Timer className="w-4 h-4 text-[#0f766e]" />
              <span>Học Pomodoro ngay</span>
            </button>
            <button 
              onClick={() => setView('ai')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-teal-300" />
              <span>Hỏi Trợ Lý AI gợi ý học</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exceeded Limits Warnings */}
      {exceededLimits.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3.5 shadow-sm animate-pulse">
          <AlertTriangle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Cảnh báo sử dụng ứng dụng giải trí vượt hạn mức!</h4>
            <p className="text-xs text-amber-700/90 leading-relaxed font-medium">
              Các ứng dụng giải trí sau đã vượt giới hạn quy định hôm nay: {exceededLimits.map(l => `${l.appName} (${l.used}/${l.limit}p)`).join(', ')}. Hãy cân nhắc đóng ứng dụng giải trí và tập trung học tập thôi nào!
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Study Time */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-5 shadow-sm flex items-center gap-4 hover:border-teal-500/20 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng giờ học hoàn thành</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCompletedHours}h <span className="text-xs text-slate-400 font-normal">/ {weeklyTargetHours}h target</span></h3>
            <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-teal-600 h-full rounded-full" 
                style={{ width: `${Math.min(100, (parseFloat(totalCompletedHours) / (weeklyTargetHours || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Today's Session count */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-5 shadow-sm flex items-center gap-4 hover:border-teal-500/20 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lịch học hôm nay</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {doneToday} <span className="text-xs text-slate-400 font-normal">đã xong / {totalToday} ca học</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-none">
              Tỷ lệ hoàn thành: {totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* KPI 3: Screen Time Balance */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-5 shadow-sm flex items-center gap-4 hover:border-teal-500/20 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Giải trí hôm nay</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalEntertainmentMinutes} phút <span className="text-xs text-slate-400 font-normal">vô ích</span>
            </h3>
            <p className="text-[11px] text-teal-600 mt-1.5 leading-none font-bold">
              Học qua App: {totalStudyAppMinutes} phút
            </p>
          </div>
        </div>

        {/* KPI 4: Streak & Points */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-5 shadow-sm flex items-center gap-4 hover:border-teal-500/20 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Điểm thưởng tích lũy</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {user.points} XP <span className="text-xs text-amber-600 font-bold font-sans">🔥 x{user.streak}d</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-none">
              Hoàn thành bài học để tăng XP!
            </p>
          </div>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Visual: Subject Hours Chart */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 lg:col-span-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Phân tích giờ học thực tế vs Mục tiêu</h3>
              <p className="text-xs text-slate-500 mt-1">So sánh tiến độ các môn học chuyên ngành Y trong tuần hiện tại</p>
            </div>
            <button 
              onClick={() => setView('subjects')}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-80 w-full">
            {subjectChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                Chưa có dữ liệu môn học. Hãy thêm môn học mới để bắt đầu theo dõi tiến độ!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="Thực tế (Giờ)" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="Mục tiêu (Giờ)" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Visual: Today's App Screen Time Usage */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 lg:col-span-4 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Tỷ lệ sử dụng app hôm nay</h3>
              <p className="text-xs text-slate-500 mt-1">Cân bằng giải trí và học tập</p>
            </div>
            <button 
              onClick={() => setView('screentime')}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Chi tiết</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-80 w-full flex flex-col justify-between">
            {screenTimeChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                Chưa có dữ liệu theo dõi hôm nay. Hãy log thời gian sử dụng ứng dụng!
              </div>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={screenTimeChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <ChartTooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="Phút giải trí" stroke="#be123c" fill="#be123c" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="Phút học" stroke="#0f766e" fill="#0f766e" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Visual Legend / Breakdown List */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                      Tổng ứng dụng Học tập:
                    </span>
                    <span className="font-bold text-slate-900">{totalStudyAppMinutes} phút</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      Tổng ứng dụng Giải trí:
                    </span>
                    <span className="font-bold text-slate-900">{totalEntertainmentMinutes} phút</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Grid bottom row: Today's agenda & Recent reward activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Today's Agenda List */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Lịch trình học hôm nay</h3>
              <p className="text-xs text-slate-500 mt-1">Hoàn thành các mốc học lâm sàng lý thuyết</p>
            </div>
            <button 
              onClick={() => setView('sessions')}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
            >
              Lịch trình đầy đủ
            </button>
          </div>

          <div className="space-y-4">
            {todaySessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">
                Hôm nay bạn thảnh thơi không có ca học nào được lên kế hoạch. Thật tuyệt!
              </div>
            ) : (
              todaySessions.map((session) => {
                const subject = subjects.find(s => s.id === session.subjectId);
                const isDone = session.status === 'done';
                return (
                  <div 
                    key={session.id} 
                    className={`p-4 rounded-2xl flex items-center justify-between gap-4 border transition-all ${
                      isDone 
                        ? 'bg-slate-50 border-slate-100 opacity-60' 
                        : 'bg-slate-50 border-slate-100 hover:border-teal-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Vertical color line */}
                      <span 
                        className="w-1.5 h-10 rounded-full shrink-0" 
                        style={{ backgroundColor: subject?.color || '#334155' }}
                      />
                      <div className="min-w-0">
                        <h4 className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {session.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {session.startTime.split('T')[1].substring(0, 5)} - {session.endTime.split('T')[1].substring(0, 5)}
                          </span>
                          {session.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {session.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isDone 
                        ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isDone ? 'Xong' : 'Chưa'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent XP Activity logs */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Hoạt động thưởng gần đây</h3>
              <p className="text-xs text-slate-500 mt-1">Lịch sử tích lũy điểm thưởng gamification của bạn</p>
            </div>
            <button 
              onClick={() => setView('rewards')}
              className="text-xs text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
            >
              Kho Quà thưởng
            </button>
          </div>

          <div className="space-y-4">
            {pointLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4 hover:bg-slate-100/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate leading-tight">{log.reason}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                    {new Date(log.timestamp).toLocaleDateString('vi-VN')} lúc {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-sm font-black px-3 py-1.5 rounded-xl shrink-0 border ${
                  log.points > 0 
                    ? 'text-teal-700 bg-teal-50 border-teal-200' 
                    : 'text-rose-750 bg-rose-50 border-rose-200'
                }`}>
                  {log.points > 0 ? `+${log.points}` : log.points} XP
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
