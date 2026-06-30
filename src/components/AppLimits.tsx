import React, { useState } from 'react';
import { Sliders, Plus, Trash2, AlertTriangle, Sparkles, CheckSquare, ShieldAlert } from 'lucide-react';
import { AppLimit, ScreenTime } from '../types';

interface AppLimitsProps {
  appLimits: AppLimit[];
  screenTime: ScreenTime[];
  onAddOrEditLimit: (appName: string, limitMinutes: number) => Promise<void>;
  onDeleteLimit: (id: string) => Promise<void>;
}

export default function AppLimits({
  appLimits,
  screenTime,
  onAddOrEditLimit,
  onDeleteLimit
}: AppLimitsProps) {
  const [appName, setAppName] = useState('');
  const [limitMinutes, setLimitMinutes] = useState('30');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayScreenTime = screenTime.filter(st => st.date === todayStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      alert('Vui lòng nhập tên ứng dụng!');
      return;
    }
    const mins = Number(limitMinutes);
    if (isNaN(mins) || mins <= 0) {
      alert('Hạn mức giới hạn số phút phải lớn hơn 0!');
      return;
    }

    setLoading(true);
    setSuccessMsg(null);

    try {
      await onAddOrEditLimit(appName.trim(), mins);
      setSuccessMsg(`Đã thiết lập thành công hạn mức ${mins} phút/ngày cho ứng dụng "${appName.trim()}"!`);
      setAppName('');
      setLimitMinutes('30');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu hạn mức.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xóa giới hạn của ứng dụng "${name}"?`)) return;

    try {
      await onDeleteLimit(id);
      setSuccessMsg(`Đã xóa thành công hạn mức của ứng dụng "${name}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Không thể xóa giới hạn.');
    }
  };

  // Find apps exceeding limits today
  const exceededApps = appLimits.map(limit => {
    const todayUsage = todayScreenTime.find(st => st.appName.toLowerCase() === limit.appName.toLowerCase());
    const minsUsed = todayUsage ? todayUsage.minutes : 0;
    return {
      appName: limit.appName,
      limit: limit.limitMinutes,
      used: minsUsed,
      exceeded: minsUsed > limit.limitMinutes
    };
  }).filter(app => app.exceeded);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Title Panel */}
      <div className="bg-white border border-slate-100 p-6 rounded-[22px] shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Sliders className="w-8 h-8 text-[#0f766e]" />
          <span>Hạn mức giới hạn Ứng dụng</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 font-medium">Đặt giới hạn tối đa thời gian sử dụng hàng ngày cho các mạng xã hội xao nhãng để kéo dãn thời gian tự học.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-sm flex gap-3">
          <Sparkles className="w-5 h-5 shrink-0 text-teal-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Form setup limits */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 md:col-span-4 space-y-5 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-800">Đặt giới hạn mới</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                Tên ứng dụng cần giới hạn
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="ví dụ: TikTok, Facebook, Instagram..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 text-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                Giới hạn sử dụng mỗi ngày (phút)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  min="1"
                  max="1440"
                  value={limitMinutes}
                  onChange={(e) => setLimitMinutes(e.target.value)}
                  className="w-24 bg-slate-50 border border-slate-200 focus:border-teal-500 text-slate-800 rounded-xl py-2.5 px-4 text-xs text-center focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-medium">phút / ngày</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0f766e] hover:bg-[#0d615a] text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
            >
              <Plus className="w-4 h-4 animate-pulse" />
              <span>Thiết lập giới hạn</span>
            </button>
          </form>
        </div>

        {/* Right Column: Limits list & Warning Box */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 md:col-span-8 space-y-6 shadow-sm">
          
          {/* Exceeded Warning box alert */}
          {exceededApps.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>Bạn đã lướt app vượt hạn mức tối đa ngày hôm nay!</span>
              </h4>
              <p className="text-xs text-rose-800/80 leading-relaxed">
                Các ứng dụng sau đây đã tiêu tốn thời gian vượt quá ngưỡng cam kết:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {exceededApps.map(app => (
                  <span key={app.appName} className="px-2.5 py-1 rounded bg-rose-100 text-[10px] font-extrabold border border-rose-200 text-rose-800">
                    ⚠️ {app.appName}: lướt {app.used}p / hạn mức {app.limit}p
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Configuration List Display */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">Các ứng dụng đang nằm dưới kiểm soát</h3>

            {appLimits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                Chưa có bất kỳ ứng dụng nào bị đặt giới hạn ngày. Thật thoải mái!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {appLimits.map(limit => {
                  const usage = todayScreenTime.find(st => st.appName.toLowerCase() === limit.appName.toLowerCase());
                  const minsUsed = usage ? usage.minutes : 0;
                  const ratio = Math.min(100, (minsUsed / limit.limitMinutes) * 100);

                  return (
                    <div key={limit.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">{limit.appName}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Giới hạn: <span className="font-bold text-slate-700">{limit.limitMinutes} phút/ngày</span></p>
                        </div>
                        <button
                          onClick={() => handleDelete(limit.id, limit.appName)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                          title="Hủy kiểm soát ứng dụng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Small visual bar tracking with limit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-medium">Hôm nay lướt:</span>
                          <span className={`font-bold ${minsUsed > limit.limitMinutes ? 'text-rose-600' : 'text-slate-700'}`}>{minsUsed} phút ({Math.round(ratio)}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${minsUsed > limit.limitMinutes ? 'bg-rose-500' : 'bg-[#0f766e]'}`} 
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>

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
