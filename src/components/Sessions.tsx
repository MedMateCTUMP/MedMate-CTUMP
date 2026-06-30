import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Clock, 
  X, 
  Trash2, 
  AlertCircle, 
  Sparkles, 
  CheckSquare, 
  CalendarDays,
  Bell,
  BellRing,
  Check
} from 'lucide-react';
import { Subject, StudySession } from '../types';

interface SessionsProps {
  subjects: Subject[];
  sessions: StudySession[];
  onAddOrEditSession: (session: {
    id?: string;
    subjectId: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    notes?: string;
    status: 'planned' | 'done';
    syncedToGoogle: boolean;
  }) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onSyncSessions: (ids: string[]) => Promise<void>;
}

export default function Sessions({
  subjects,
  sessions,
  onAddOrEditSession,
  onDeleteSession,
  onSyncSessions
}: SessionsProps) {
  const [showForm, setShowForm] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("🎉 Đã bật thông báo!", {
          body: "Bạn sẽ nhận được thông báo nhắc nhở 15 phút trước khi bắt đầu mỗi ca học.",
          icon: "/favicon.ico"
        });
      }
    }
  };
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('09:30');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [syncGCal, setSyncGCal] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter options
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'done'>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setErrorMsg('Vui lòng chọn môn học!');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề ca học!');
      return;
    }

    const startISO = `${startDate}T${startTime}:00`;
    const endISO = `${endDate}T${endTime}:00`;

    if (new Date(startISO).getTime() >= new Date(endISO).getTime()) {
      setErrorMsg('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onAddOrEditSession({
        subjectId,
        title: title.trim(),
        startTime: startISO,
        endTime: endISO,
        location: location.trim(),
        notes: notes.trim(),
        status: 'planned',
        syncedToGoogle: syncGCal
      });

      // Award simulation popup notice
      setSuccessMsg('Đã lên lịch học thành công! Hoàn thành ca học để tích luỹ +50 XP!');
      
      // Reset
      setTitle('');
      setLocation('');
      setNotes('');
      setSyncGCal(false);
      setShowForm(false);
    } catch (err) {
      setErrorMsg('Lỗi khi thiết lập ca học. Vui lòng kiểm tra dữ liệu và thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDone = async (session: StudySession) => {
    if (session.status === 'done') return; // Cannot undo completed session

    const confirmDone = window.confirm(`Bạn muốn đánh dấu hoàn thành ca học "${session.title}"?\nBạn sẽ tích lũy thêm +50 XP điểm thưởng học tập!`);
    if (!confirmDone) return;

    try {
      await onAddOrEditSession({
        ...session,
        status: 'done'
      });
      setSuccessMsg(`Xuất sắc! Đã hoàn thành ca học. Bạn nhận được +50 XP điểm thưởng!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert('Không thể cập nhật trạng thái ca học.');
    }
  };

  const handleDelete = async (id: string, titleStr: string) => {
    const confirmed = window.confirm(`Xóa lịch học "${titleStr}"? Thao tác này không thể hoàn tác.`);
    if (!confirmed) return;

    try {
      await onDeleteSession(id);
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa lịch học.');
    }
  };

  const handleSyncToGoogle = async (session: StudySession) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onSyncSessions([session.id]);
      setSuccessMsg(`Đã đồng bộ thành công sự kiện "${session.title}" sang Google Calendar!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('Không thể kết nối API Google Calendar. Thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter sessions
  const filteredSessions = sessions
    .filter(s => filterStatus === 'all' || s.status === filterStatus)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-[22px] shadow-sm hover:shadow-md transition-all duration-350">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Lịch học & Ca học Y khoa</h2>
          <p className="text-xs text-slate-500 mt-1">Lập thời khóa biểu lâm sàng, tự học lý thuyết lâm sàng CTUMP</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              if (subjects.length === 0) {
                alert('Vui lòng thêm ít nhất một môn học trong phần "Môn học" trước khi lên lịch ca học!');
                return;
              }
              setShowForm(true);
              setSubjectId(subjects[0].id);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d615a] active:bg-[#094742] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[103%] active:scale-[97%] cursor-pointer shadow-lg shadow-teal-900/10 hover:shadow-teal-900/20"
          >
            <Plus className="w-5 h-5" />
            <span>Lên lịch học mới</span>
          </button>
        )}
      </div>

      {/* Browser Notification Banner */}
      {typeof window !== 'undefined' && 'Notification' in window && (
        <div className="bg-white border border-slate-100 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all duration-350 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl transition-colors duration-300 ${
              notificationPermission === 'granted' 
                ? 'bg-teal-50 text-[#0f766e]' 
                : notificationPermission === 'denied'
                ? 'bg-rose-50 text-rose-500'
                : 'bg-amber-50 text-amber-500 animate-pulse'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                {notificationPermission === 'granted' 
                  ? 'Nhắc nhở ca học: Đang hoạt động' 
                  : notificationPermission === 'denied'
                  ? 'Thông báo bị chặn trên trình duyệt'
                  : 'Nhận thông báo nhắc nhở 15 phút trước ca học'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
                {notificationPermission === 'granted'
                  ? 'MedMate sẽ gửi thông báo đẩy để bạn chuẩn bị tập vở và nhắc bạn đúng giờ vào bàn học.'
                  : notificationPermission === 'denied'
                  ? 'Bạn đã chặn quyền thông báo. Hãy cho phép lại trong cài đặt trình duyệt để không bỏ lỡ ca học!'
                  : 'Cho phép thông báo để nhận nhắc nhở chuẩn bị học bài và vào lớp đúng giờ tự học.'}
              </p>
            </div>
          </div>
          
          {notificationPermission === 'default' && (
            <button
              onClick={requestNotificationPermission}
              className="w-full md:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold rounded-xl text-xs transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-md shadow-amber-500/15 shrink-0 flex items-center justify-center gap-2"
            >
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>Bật thông báo ngay</span>
            </button>
          )}

          {notificationPermission === 'granted' && (
            <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-100 flex items-center gap-1.5 shrink-0 self-end md:self-center shadow-inner">
              <Check className="w-4 h-4 text-teal-600 stroke-[3]" />
              <span>Đang hoạt động</span>
            </span>
          )}

          {notificationPermission === 'denied' && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 shrink-0 self-end md:self-center">
              Chưa kích hoạt
            </span>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-sm flex gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 shrink-0 text-teal-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Adding Session Form Modal/Drawer Panel */}
      {showForm && (
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 shadow-md max-w-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0f766e]" />
              <span>Thiết lập lịch ca học mới</span>
            </h3>
            <button 
              onClick={() => setShowForm(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject Select & Title input side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Môn học liên kết
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Tiêu đề ca học (Nội dung ôn tập)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đọc điện tim ECG nhồi máu cơ tim..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Start and End date time pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              {/* Start Date & Time */}
              <div className="space-y-3">
                <span className="block text-xs text-[#0f766e] font-bold uppercase tracking-wider">Thời gian bắt đầu</span>
                <div className="flex gap-3">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                  />
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-24 bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-3">
                <span className="block text-xs text-[#0f766e] font-bold uppercase tracking-wider">Thời gian kết thúc</span>
                <div className="flex gap-3">
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                  />
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-24 bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Location & Note inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Địa điểm học (Tùy chọn)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ví dụ: Phòng thực hành Hóa sinh, Khoa Y"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Ghi chú nội dung cần nhớ (Tùy chọn)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ví dụ: Đọc trước bài lý thuyết trang 45-60 sách"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Google Calendar Checkbox option */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <input
                type="checkbox"
                id="syncGCal"
                checked={syncGCal}
                onChange={(e) => setSyncGCal(e.target.checked)}
                className="w-5 h-5 rounded bg-white border-slate-300 text-[#0f766e] focus:ring-teal-500/20 focus:ring-offset-white cursor-pointer"
              />
              <label htmlFor="syncGCal" className="text-xs text-slate-600 font-medium cursor-pointer">
                Đồng bộ tự động sang tài khoản Google Calendar sau khi lưu.
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#0f766e] hover:bg-[#0d615a] active:bg-[#094742] text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-md shadow-teal-900/10"
              >
                <Calendar className="w-4 h-4" />
                <span>Thêm vào lịch trình</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters options panel */}
      <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer ${
            filterStatus === 'all' ? 'bg-[#0f766e] text-white shadow-md shadow-teal-900/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Tất cả ca học
        </button>
        <button
          onClick={() => setFilterStatus('planned')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer ${
            filterStatus === 'planned' ? 'bg-[#0f766e] text-white shadow-md shadow-teal-900/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Lịch trình sắp tới
        </button>
        <button
          onClick={() => setFilterStatus('done')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer ${
            filterStatus === 'done' ? 'bg-[#0f766e] text-white shadow-md shadow-teal-900/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Lịch sử hoàn thành
        </button>
      </div>

      {/* Sessions Timeline List Display */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="py-20 bg-white border border-slate-100 rounded-[22px] text-center text-slate-400 space-y-3 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-700">Không tìm thấy ca học nào!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterStatus === 'all' 
                ? 'Nhấp vào "Lên lịch học mới" để tạo buổi tự ôn tập hay thời khóa biểu học phần.'
                : 'Chưa có ca học nào tương thích với bộ lọc đã chọn.'}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const subject = subjects.find(s => s.id === session.subjectId);
            const isDone = session.status === 'done';
            
            const startDateObj = new Date(session.startTime);
            const endDateObj = new Date(session.endTime);
            
            const dateStr = startDateObj.toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            const timeStr = `${startDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

            return (
              <div 
                key={session.id}
                className={`bg-white border transition-all rounded-[22px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group ${
                  isDone 
                    ? 'border-slate-100 bg-slate-50/50 opacity-60' 
                    : 'border-slate-100 hover:border-slate-200 shadow-sm'
                }`}
              >
                {/* Horizontal side indicator color bar on the left */}
                <span 
                  className="absolute top-0 bottom-0 left-0 w-2 rounded-l-full shrink-0" 
                  style={{ backgroundColor: subject?.color || '#334155' }}
                />

                {/* Left side info block */}
                <div className="space-y-3 pl-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span 
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg text-white shrink-0 uppercase tracking-wide"
                      style={{ backgroundColor: subject?.color || '#334155' }}
                    >
                      {subject?.name || 'Môn học khác'}
                    </span>
                    
                    <span className="text-[11px] text-slate-400 font-bold tracking-tight">
                      {dateStr}
                    </span>
                  </div>

                  <h3 className={`text-base font-extrabold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`} title={session.title}>
                    {session.title}
                  </h3>

                  {/* Location & notes */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-bold text-[#0f766e] shrink-0">
                      <Clock className="w-4 h-4 text-teal-600" />
                      {timeStr}
                    </span>
                    
                    {session.location && (
                      <span className="flex items-center gap-1 min-w-0 max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{session.location}</span>
                      </span>
                    )}

                    {session.notes && (
                      <span className="flex items-center gap-1 min-w-0 max-w-[220px]">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate italic text-slate-400">{session.notes}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side interactions & buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto pl-3 md:pl-0">
                  
                  {/* Google Calendar status badge */}
                  {session.syncedToGoogle ? (
                    <span 
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 shadow-sm hover:scale-105 duration-200 transition-all cursor-default"
                      title="Sự kiện này đã được đồng bộ hóa thành công lên Google Calendar"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                      <span>Google Sync</span>
                    </span>
                  ) : (
                    !isDone && (
                      <button
                        onClick={() => handleSyncToGoogle(session)}
                        className="p-1.5 px-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl border border-slate-200 hover:border-blue-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 duration-200 flex items-center gap-1 cursor-pointer"
                        title="Đồng bộ thủ công sang Google Calendar"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
                        <span>Sync</span>
                      </button>
                    )
                  )}

                  {/* Complete study button */}
                  {!isDone ? (
                    <button
                      onClick={() => handleToggleDone(session)}
                      className="px-4 py-2 bg-teal-50 hover:bg-[#0f766e] active:bg-[#0a524c] text-[#0f766e] hover:text-white rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 duration-200 flex items-center gap-1.5 border border-teal-100 hover:border-transparent hover:shadow-md hover:shadow-teal-900/10 cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4 shrink-0" />
                      <span>Đánh dấu xong (+50 XP)</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-teal-50 text-teal-700 border border-teal-100 shadow-inner">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Hoàn thành</span>
                    </span>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(session.id, session.title)}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all hover:scale-110 active:scale-90 duration-200 cursor-pointer"
                    title="Xóa lịch học này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
