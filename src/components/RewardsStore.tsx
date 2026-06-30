import React, { useState } from 'react';
import { Award, Flame, ShoppingBag, Sparkles, CheckCircle, Gift, AlertCircle, Clock } from 'lucide-react';
import { UserProfile, PointLog } from '../types';

interface RewardsStoreProps {
  user: UserProfile;
  pointLogs: PointLog[];
  onDeductPoints: (points: number, reason: string) => Promise<void>;
}

interface RewardItem {
  id: string;
  title: string;
  cost: number;
  description: string;
  category: 'coffee' | 'doc' | 'perk';
}

const STORE_ITEMS: RewardItem[] = [
  {
    id: 'coffee',
    title: 'Cốc cà phê ôn thi Cần Thơ',
    cost: 300,
    description: 'Một ly cà phê Robusta đặc biệt giúp bạn tỉnh táo tỉnh trí thức đêm ôn thi lâm sàng tại bệnh viện.',
    category: 'coffee'
  },
  {
    id: 'anatomy_vip',
    title: 'Tài liệu ôn thi Giải Phẫu VIP CTUMP',
    cost: 500,
    description: 'Bộ đề trắc nghiệm tuyển chọn giải phẫu xương, cơ, dây thần kinh và tạng được biên soạn từ tài liệu mật khoa Y.',
    category: 'doc'
  },
  {
    id: 'pharmacology_cheat',
    title: 'Bảng tra cứu Dược lý lâm sàng nhanh',
    cost: 400,
    description: 'Bản tóm tắt cơ chế tác dụng, phân loại nhóm thuốc và chỉ định cực dễ nhớ cho sinh viên đi tua nội khoa.',
    category: 'doc'
  },
  {
    id: 'badge_pro',
    title: 'Huy hiệu "Y sĩ vĩ đại" trên hồ sơ',
    cost: 800,
    description: 'Huy hiệu lấp lánh khẳng định vị thế học bá tối cao của bạn trước các đồng môn trong lớp.',
    category: 'perk'
  },
  {
    id: 'mentorship',
    title: '1 Buổi giải đáp học thuật 1-1 với Thủ Khoa',
    cost: 1500,
    description: 'Gặp gỡ trao đổi trực tiếp hỏi mẹo đi lâm sàng, phương pháp ôn thi đạt điểm A với Thủ khoa nội trú CTUMP.',
    category: 'perk'
  }
];

export default function RewardsStore({
  user,
  pointLogs,
  onDeductPoints
}: RewardsStoreProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClaimReward = async (item: RewardItem) => {
    if (user.points < item.cost) {
      setErrorMsg(`Bạn không đủ điểm XP để đổi quà này! Cần thêm ${item.cost - user.points} XP.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const confirmClaim = window.confirm(`Bạn muốn đổi ${item.cost} XP lấy món quà "${item.title}"?`);
    if (!confirmClaim) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Deduct points is done by passing NEGATIVE value to endpoint
      await onDeductPoints(-item.cost, `Đổi thưởng: ${item.title}`);
      setSuccessMsg(`🎉 Đổi quà thành công! Bạn đã nhận được món quà "${item.title}". Hãy kiểm tra email học tập để nhận hướng dẫn chi tiết.`);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      setErrorMsg('Đổi quà thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Title Panel Banner */}
      <div className="relative rounded-[22px] bg-gradient-to-r from-amber-600 to-[#0f766e] p-6 text-white overflow-hidden shadow-lg shadow-teal-950/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Gift className="w-7 h-7 text-amber-300" />
              <span>Cửa hàng Quà thưởng Gamification</span>
            </h2>
            <p className="text-xs text-amber-100/90 leading-relaxed max-w-xl">
              Quy đổi thành quả nỗ lực tự học Pomodoro và duy trì chuỗi liên tục thành những phần quà học tập cực kỳ giá trị cho đời sinh viên Y Dược.
            </p>
          </div>

          {/* User Points Profile Display */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 shrink-0 flex items-center gap-3.5 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              🔥
            </div>
            <div>
              <p className="text-[10px] text-teal-100 font-bold uppercase tracking-wider">Số dư điểm của bạn</p>
              <h3 className="text-xl font-black text-amber-300 mt-0.5">{user.points} XP</h3>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-sm flex gap-3 animate-bounce">
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

      {/* Grid containing store items list */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Reward Items grid list */}
        <div className="md:col-span-8 space-y-4">
          <h3 className="text-base font-extrabold text-slate-850 border-b border-slate-100 pb-3">Các phần quà đang mở bán</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STORE_ITEMS.map((item) => {
              const canAfford = user.points >= item.cost;
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-100 hover:border-amber-300 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="space-y-2">
                    {/* Category Icon */}
                    <span className="inline-block p-2 rounded-xl bg-slate-50 border border-slate-250 text-slate-700 text-xs font-bold mb-1">
                      {item.category === 'coffee' ? '☕ Đồ ăn uống' : item.category === 'doc' ? '📚 Học tập' : '🌟 Đặc quyền'}
                    </span>

                    <h4 className="font-extrabold text-slate-850 text-sm leading-tight group-hover:text-[#0f766e] transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-black text-amber-600">
                      {item.cost} XP
                    </span>

                    <button
                      onClick={() => handleClaimReward(item)}
                      disabled={loading}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Quy đổi ngay' : 'Chưa đủ điểm'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Reward Claims/Deductions history logs */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 md:col-span-4 space-y-5 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-850 border-b border-slate-100 pb-3">Lịch sử nhận quà</h3>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {pointLogs.filter(l => l.points < 0).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                Bạn chưa thực hiện bất kỳ giao dịch quy đổi quà thưởng nào.
              </div>
            ) : (
              pointLogs.filter(l => l.points < 0).map(log => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 truncate leading-tight">{log.reason}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-xl shrink-0">
                    {log.points} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
