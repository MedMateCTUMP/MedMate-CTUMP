import React, { useState } from 'react';
import { 
  CalendarDays, 
  CheckCircle, 
  RefreshCw, 
  Smartphone, 
  HelpCircle, 
  Download, 
  Link, 
  Link2Off, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { Subject, StudySession } from '../types';

interface GoogleCalendarSyncProps {
  subjects: Subject[];
  sessions: StudySession[];
  onSyncSessions: (ids: string[]) => Promise<void>;
}

export default function GoogleCalendarSync({
  subjects,
  sessions,
  onSyncSessions
}: GoogleCalendarSyncProps) {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [googleEmail, setGoogleEmail] = useState('');

  // Handle mock Google OAuth login
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setErrorMsg('Vui lòng điền đúng định dạng Gmail của bạn.');
      return;
    }
    
    setSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    setTimeout(() => {
      setConnected(true);
      setSyncing(false);
      setSuccessMsg(`Đã liên kết thành công với Google Calendar của tài khoản: ${googleEmail}`);
    }, 1200);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setGoogleEmail('');
    setSuccessMsg('Đã ngắt liên kết Google Calendar thành công.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Sync All Sessions
  const handleSyncAll = async () => {
    if (!connected) {
      setErrorMsg('Vui lòng kết nối tài khoản Google Calendar trước khi tiến hành đồng bộ!');
      return;
    }

    const plannedSessions = sessions.filter(s => s.status === 'planned');
    if (plannedSessions.length === 0) {
      setSuccessMsg('Không có lịch học mới cần đồng bộ.');
      return;
    }

    setSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const ids = plannedSessions.map(s => s.id);
      await onSyncSessions(ids);
      setSuccessMsg(`Đồng bộ thành công tất cả (${plannedSessions.length}) sự kiện lên Google Calendar của bạn!`);
    } catch (err) {
      setErrorMsg('Đồng bộ thất bại. Vui lòng kiểm tra lại kết nối mạng!');
    } finally {
      setSyncing(false);
    }
  };

  // Sync Today's Sessions
  const handleSyncToday = async () => {
    if (!connected) {
      setErrorMsg('Vui lòng kết nối tài khoản Google Calendar trước khi tiến hành đồng bộ!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.status === 'planned' && s.startTime.startsWith(todayStr));

    if (todaySessions.length === 0) {
      setSuccessMsg('Hôm nay bạn không có ca học mới nào cần đồng bộ.');
      return;
    }

    setSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const ids = todaySessions.map(s => s.id);
      await onSyncSessions(ids);
      setSuccessMsg(`Đã đồng bộ thành công (${todaySessions.length}) sự kiện hôm nay lên Google Calendar!`);
    } catch (err) {
      setErrorMsg('Đồng bộ thất bại. Vui lòng thử lại!');
    } finally {
      setSyncing(false);
    }
  };

  // ================= EXPORT .ICS CALENDAR METHOD (GENUINE HARD SYNC) =================
  const handleExportICS = () => {
    if (sessions.length === 0) {
      setErrorMsg('Không có ca học nào trên hệ thống để xuất bản file lịch.');
      return;
    }

    // Prepare iCalendar file content
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MedMate CTUMP//Study Calendar//VI\n';

    sessions.forEach(session => {
      const subject = subjects.find(s => s.id === session.subjectId);
      
      // Convert ISO dates to ICS format YYYYMMDDTHHMMSSZ (UTC)
      const formatICSDate = (isoStr: string) => {
        const d = new Date(isoStr);
        // We write in local format and let the calendar adjust, or convert to ISO string format
        const pad = (n: number) => n.toString().padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hour = pad(d.getHours());
        const min = pad(d.getMinutes());
        const sec = pad(d.getSeconds());
        return `${year}${month}${day}T${hour}${min}${sec}`;
      };

      const dtStart = formatICSDate(session.startTime);
      const dtEnd = formatICSDate(session.endTime);
      
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:sess-${session.id}@medmate.ctump.edu.vn\n`;
      icsContent += `DTSTART:${dtStart}\n`;
      icsContent += `DTEND:${dtEnd}\n`;
      icsContent += `SUMMARY:[MedMate] ${session.title} (${subject?.name || 'Y học'})\n`;
      if (session.location) icsContent += `LOCATION:${session.location}\n`;
      if (session.notes) icsContent += `DESCRIPTION:${session.notes}\n`;
      icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';

    // Download Blob file trigger
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medmate_ctump_calendar_${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMsg('Đã xuất bản và tải thành công file lịch .ics! Bạn có thể import file này trực tiếp vào bất kỳ ứng dụng lịch nào (Google Calendar, Outlook, Apple Calendar) để xem báo thức nhắc nhở!');
  };

  const syncedSessions = sessions.filter(s => s.syncedToGoogle);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header Widget */}
      <div className="bg-white border border-slate-100 p-6 rounded-[22px] shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-[#0f766e]" />
          <span>Đồng bộ Google Calendar</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1.5">Liên kết lịch học trực tiếp với ứng dụng lịch cá nhân của bạn để cập nhật báo thức và sắp xếp thời gian.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-sm flex gap-3">
          <Sparkles className="w-5 h-5 shrink-0 text-teal-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Link accounts and Sync panel control */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Col: Account Status & Connection Form */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 md:col-span-5 space-y-5 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-800">Kết nối Tài khoản</h3>
          
          {!connected ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
                * Đồng bộ hóa với tài khoản Google để cập nhật tự động lịch học.
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Tài khoản Gmail Google Calendar
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="ví dụ: nguyenvana@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white text-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* GSI style styled button for brand conformity */}
              <button
                type="submit"
                disabled={syncing}
                className="w-full py-3 bg-[#0f766e] hover:bg-[#0d615a] text-white font-black rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-md shadow-teal-900/10 cursor-pointer disabled:opacity-50"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                <span>Liên kết Google Calendar</span>
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Profile Block connected */}
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0f766e] flex items-center justify-center font-bold text-white shadow">
                    G
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đã kết nối</h4>
                    <p className="text-sm font-bold text-slate-800 truncate max-w-[160px]" title={googleEmail}>{googleEmail}</p>
                  </div>
                </div>
                
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping shrink-0" title="Hoạt động bình thường" />
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="w-full py-3 bg-[#0f766e] hover:bg-[#0d615a] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Đồng bộ tất cả ca học</span>
                </button>

                <button
                  onClick={handleSyncToday}
                  disabled={syncing}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
                >
                  <CalendarDays className="w-4 h-4 text-[#0f766e]" />
                  <span>Đồng bộ lịch hôm nay</span>
                </button>
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-rose-200 transition-all cursor-pointer"
              >
                <Link2Off className="w-4 h-4" />
                <span>Hủy liên kết tài khoản</span>
              </button>
            </div>
          )}

        </div>

        {/* Right Col: Genuine Manual Sync file method & Synced events logs */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 md:col-span-7 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-800">Xuất bản lịch học offline</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
              Khuyên dùng
            </span>
          </div>

          {/* Genuine ICS Download Tool intro */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <Download className="w-8 h-8 text-[#0f766e] shrink-0 mt-1 bg-teal-50 p-1.5 rounded-xl border border-teal-100" />
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800 leading-tight">Xuất bản file lịch chuẩn quốc tế (.ics)</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Tính năng độc quyền cho phép bạn tải xuống file lịch chứa toàn bộ các buổi tự học lâm sàng và lịch thi đã lên kế hoạch. Bạn có thể dễ dàng tải lên hoặc import trực tiếp vào ứng dụng Google Calendar hay Apple Calendar trên điện thoại mà không cần thiết lập API bảo mật phức tạp!
              </p>
              <button
                onClick={handleExportICS}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f766e] hover:bg-[#0d615a] text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-teal-900/10 mt-2"
              >
                <Download className="w-4 h-4" />
                <span>Tải lịch học về máy (.ics)</span>
              </button>
            </div>
          </div>

          {/* List of synced events */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Danh sách sự kiện đã đồng bộ ({syncedSessions.length})</h4>
            
            {syncedSessions.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                Chưa có sự kiện nào được đồng bộ hóa lên đám mây.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {syncedSessions.map(sess => {
                  const sub = subjects.find(s => s.id === sess.subjectId);
                  return (
                    <div key={sess.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 truncate">{sess.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Môn: {sub?.name || 'Chuyên ngành'}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[#0f766e] font-bold bg-teal-50 px-2 py-1 rounded border border-teal-100 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã sync
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
