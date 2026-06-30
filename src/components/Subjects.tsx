import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, BookOpen, AlertCircle, Info, Target } from 'lucide-react';
import { Subject } from '../types';

interface SubjectsProps {
  subjects: Subject[];
  onAddOrEditSubject: (subject: { id?: string; name: string; color: string; targetHours: number }) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#0f766e', // Deep Teal (Main CTUMP)
  '#0284c7', // Sky Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Purple
  '#c026d3', // Pink
  '#db2777', // Rose Pink
  '#be123c', // Red Rose
  '#d97706', // Amber Yellow
  '#059669', // Emerald Green
  '#4b5563'  // Slate Gray
];

export default function Subjects({
  subjects,
  onAddOrEditSubject,
  onDeleteSubject
}: SubjectsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#0f766e');
  const [targetHours, setTargetHours] = useState('8');
  
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên môn học!');
      return;
    }
    const hours = Number(targetHours);
    if (isNaN(hours) || hours <= 0) {
      setErrorMsg('Mục tiêu số giờ học mỗi tuần phải lớn hơn 0!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await onAddOrEditSubject({
        id: editingId || undefined,
        name: name.trim(),
        color,
        targetHours: hours
      });
      
      // Reset state
      setName('');
      setColor('#0f766e');
      setTargetHours('8');
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setErrorMsg('Lỗi khi lưu môn học. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (sub: Subject) => {
    setEditingId(sub.id);
    setName(sub.name);
    setColor(sub.color);
    setTargetHours(sub.targetHours.toString());
    setShowForm(true);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setColor('#0f766e');
    setTargetHours('8');
    setShowForm(false);
    setErrorMsg(null);
  };

  const handleDelete = async (id: string, subName: string) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa môn học "${subName}"?\nLưu ý: Tất cả lịch học liên quan đến môn này cũng sẽ bị xóa vĩnh viễn.`
    );
    if (!confirmed) return;

    try {
      await onDeleteSubject(id);
    } catch (err) {
      alert('Không thể xóa môn học. Vui lòng thử lại!');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Subject Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-[22px] shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Quản lý môn học Y khoa</h2>
          <p className="text-xs text-slate-500 mt-1">Lập danh mục các môn học chuyên ngành và định rõ số giờ tự học mục tiêu mỗi tuần</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d615a] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-900/10"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm môn học mới</span>
          </button>
        )}
      </div>

      {/* Subject Adding / Editing Form Drawer panel */}
      {showForm && (
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 shadow-md max-w-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0f766e]" />
              <span>{editingId ? 'Chỉnh sửa môn học' : 'Thêm môn học Y khoa mới'}</span>
            </h3>
            <button 
              onClick={handleCancelEdit}
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
            {/* Subject Name Input */}
            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                Tên môn học (Ví dụ: Giải phẫu học, Hóa sinh lâm sàng...)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Bệnh lý nội khoa II, Ngoại sản khoa..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-3 px-4 text-sm focus:outline-none transition-all"
              />
            </div>

            {/* Target Hours */}
            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                Mục tiêu tự học trong tuần (Số giờ tự học mong muốn)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  min="1"
                  max="168"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  className="w-28 bg-slate-50 border border-slate-200 focus:border-[#0f766e] focus:bg-white text-slate-850 rounded-xl py-3 px-4 text-sm text-center focus:outline-none transition-all"
                />
                <span className="text-sm text-slate-500 font-bold">giờ / tuần</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                * Giúp thuật toán thông minh phân tích và so sánh tiến độ thực tế so với mục tiêu đặt ra.
              </p>
            </div>

            {/* Subject Color Grid */}
            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                Màu sắc nhận diện môn học
              </label>
              
              {/* Color Grid list */}
              <div className="flex flex-wrap gap-2.5 my-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center shrink-0 cursor-pointer"
                    style={{ 
                      backgroundColor: c, 
                      borderColor: color === c ? '#ffffff' : 'transparent' 
                    }}
                  >
                    {color === c && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    )}
                  </button>
                ))}
                
                {/* Manual picker */}
                <div className="relative shrink-0 w-10 h-10 rounded-full border border-slate-200 overflow-hidden cursor-pointer flex items-center justify-center bg-slate-50">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0"
                    title="Tùy chọn màu khác"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">+ Màu khác</span>
                </div>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#0f766e] hover:bg-[#0d615a] text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Cập nhật môn học' : 'Lưu môn học'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid List displaying subjects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.length === 0 ? (
          <div className="col-span-full py-16 bg-white border border-slate-100 rounded-[22px] text-center text-slate-400 space-y-3 shadow-sm animate-pulse">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-700">Chưa có môn học nào được thiết lập!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nhấp vào nút "Thêm môn học mới" ở góc trên bên phải để bắt đầu thiết lập lộ trình môn học Y Dược của riêng bạn.
            </p>
          </div>
        ) : (
          subjects.map((sub) => (
            <div 
              key={sub.id}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Highlight background strip */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5" 
                style={{ backgroundColor: sub.color }}
              />

              <div className="space-y-4 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0" 
                      style={{ backgroundColor: sub.color }}
                    />
                    <h4 className="font-black text-slate-800 text-base truncate" title={sub.name}>
                      {sub.name}
                    </h4>
                  </div>
                  
                  {/* Actions buttons on card */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(sub)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Chỉnh sửa môn học"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id, sub.name)}
                      className="p-1.5 hover:bg-rose-50 rounded text-rose-500 transition-colors cursor-pointer"
                      title="Xóa môn học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Target badge */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Target className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="font-bold">Mục tiêu:</span>
                  <span className="font-black text-teal-700">{sub.targetHours} giờ / tuần</span>
                </div>
              </div>

              {/* Informational helpful box */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-450">
                <span className="flex items-center gap-1 font-semibold text-slate-500">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Tự học tuần này
                </span>
                <span className="font-bold text-slate-400">Tham chiếu qua lịch học</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
