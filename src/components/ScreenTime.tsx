import React, { useState } from 'react';
import { Smartphone, Plus, Trash2, AlertCircle, Info, Sparkles, AlertTriangle } from 'lucide-react';
import { ScreenTime as ScreenTimeType, AppLimit } from '../types';

interface ScreenTimeProps {
  screenTime: ScreenTimeType[];
  appLimits: AppLimit[];
  onAddScreenTime: (appName: string, minutes: number) => Promise<void>;
  onDeleteScreenTime: (id: string) => Promise<void>;
}

export default function ScreenTime({
  screenTime,
  appLimits,
  onAddScreenTime,
  onDeleteScreenTime
}: ScreenTimeProps) {
  const [appName, setAppName] = useState('');
  const [minutes, setMinutes] = useState('30');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = screenTime.filter(st => st.date === todayStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      setErrorMsg('Vui lòng nhập tên ứng dụng!');
      return;
    }
    const mins = Number(minutes);
    if (isNaN(mins) || mins <= 0) {
      setErrorMsg('Số phút sử dụng ứng dụng phải lớn hơn 0!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onAddScreenTime(appName.trim(), mins);
      
      // Look up if this app exceeds limit to show custom warning trigger immediately!
      const limit = appLimits.find(l => l.appName.toLowerCase() === appName.trim().toLowerCase());
      const existingUsage = todayRecords.find(st => st.appName.toLowerCase() === appName.trim().toLowerCase());
      const currentMinutesUsed = (existingUsage ? existingUsage.minutes : 0) + mins;

      if (limit && currentMinutesUsed > limit.limitMinutes) {
        setSuccessMsg(`⚠️ Cảnh báo! Ứng dụng "${appName.trim()}" đã sử dụng ${currentMinutesUsed} phút, vượt hạn mức tối đa cho phép (${limit.limitMinutes} phút)!`);
      } else {
        setSuccessMsg(`Đã ghi nhận ${mins} phút sử dụng ứng dụng "${appName.trim()}" thành công!`);
      }

      setAppName('');
      setMinutes('30');
    } catch (err) {
      setErrorMsg('Lỗi khi lưu thời gian sử dụng ứng dụng.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xóa bản ghi thời gian sử dụng của ứng dụng "${name}"?`)) return;

    try {
      await onDeleteScreenTime(id);
    } catch (err) {
      alert('Không thể xóa bản ghi.');
    }
  };

  // Calculate overall statistics
  const totalEntertainmentMinutes = todayRecords
    .filter(st => ['tiktok', 'facebook', 'youtube', 'instagram', 'game', 'messenger'].some(kw => st.appName.toLowerCase().includes(kw)))
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const totalStudyMinutes = todayRecords
    .filter(st => ['medmate', 'học', 'study', 'anatomy', 'dược'].some(kw => st.appName.toLowerCase().includes(kw)))
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const totalAllMins = todayRecords.reduce((acc, curr) => acc + curr.minutes, 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Title Widget */}
      <div className="bg-white border border-slate-100 p-6 rounded-[22px] shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Smartphone className="w-8 h-8 text-[#0f766e]" />
          <span>Screen Time Tracking</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 font-medium">Ghi nhận thời gian sử dụng điện thoại và kiểm soát các tác nhân giải trí xao nhãng trong ngày.</p>
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

      {/* Grid: Forms and visual lists */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Col: Log Usage Form */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 md:col-span-4 space-y-5 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-800">Ghi nhận sử dụng App</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                Tên ứng dụng (ví dụ: TikTok, Facebook, MedMate...)
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="ví dụ: TikTok, Youtube, Safari..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 text-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                Thời lượng sử dụng hôm nay (phút)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  min="1"
                  max="1440"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-24 bg-slate-50 border border-slate-200 focus:border-teal-500 text-slate-800 rounded-xl py-2.5 px-4 text-xs text-center focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-medium">phút sử dụng</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0f766e] hover:bg-[#0d615a] text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
            >
              <Plus className="w-4 h-4 animate-pulse" />
              <span>Ghi nhận thời gian</span>
            </button>
          </form>

          {/* Tips block */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0f766e]" />
              <span>Phân loại thông minh</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Các từ khóa chứa <span className="font-bold text-slate-700">MedMate, học, study, anatomy, dược</span> được tự động phân vào mục <span className="font-bold text-[#0f766e]">Học tập</span>. Các từ khóa <span className="font-bold text-rose-600">TikTok, Facebook, Youtube, Game</span> được xếp vào mục <span className="font-bold text-slate-700">Giải trí</span> để phân tích tỷ lệ học tập thông minh!
            </p>
          </div>
        </div>

        {/* Right Col: Today records list */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 md:col-span-8 space-y-6 shadow-sm">
          
          {/* Header stat block */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Nhật ký sử dụng hôm nay</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Tổng cộng thiết bị ghi nhận: <span className="font-bold text-slate-700">{totalAllMins} phút</span></p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-100">
                📚 Học: {totalStudyMinutes}p
              </span>
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-100">
                🎮 Giải trí: {totalEntertainmentMinutes}p
              </span>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-4">
            {todayRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-3xl bg-slate-50">
                Hôm nay chưa ghi nhận thời gian sử dụng ứng dụng nào.
              </div>
            ) : (
              todayRecords.map((st) => {
                const limitObj = appLimits.find(l => l.appName.toLowerCase() === st.appName.toLowerCase());
                const isExceeded = limitObj && st.minutes > limitObj.limitMinutes;
                
                // Color configuration of bar
                const isStudy = ['medmate', 'học', 'study', 'anatomy', 'dược'].some(kw => st.appName.toLowerCase().includes(kw));
                const barColor = isExceeded ? 'bg-rose-500' : isStudy ? 'bg-[#0f766e]' : 'bg-slate-400';

                return (
                  <div key={st.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 relative">
                    
                    <div className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isExceeded ? 'bg-rose-500 animate-pulse' : isStudy ? 'bg-[#0f766e]' : 'bg-slate-400'}`} />
                        <span className="font-extrabold text-slate-800">{st.appName}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-600">
                          {st.minutes} phút {limitObj && <span className="text-[10px] text-slate-400 font-normal">/ {limitObj.limitMinutes}p giới hạn</span>}
                        </span>
                        
                        <button
                          onClick={() => handleDelete(st.id, st.appName)}
                          className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg hover:text-rose-500 transition-all cursor-pointer"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
                        style={{ width: `${Math.min(100, limitObj ? (st.minutes / limitObj.limitMinutes) * 100 : (st.minutes / 180) * 100)}%` }}
                      />
                    </div>

                    {/* Exceeded Warning text */}
                    {isExceeded && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Đã vượt mức giới hạn quy định ({st.minutes - limitObj.limitMinutes} phút vượt mức)!</span>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
