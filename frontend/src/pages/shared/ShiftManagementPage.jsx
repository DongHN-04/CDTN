import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shiftService from '../../services/shiftService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircle } from 'lucide-react';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const shiftSlots = [
  { id: 'morning', label: 'Ca Sáng', time: '08:00 - 13:00', color: 'bg-[#0089a8]', dot: 'bg-[#0089a8]' },
  { id: 'afternoon', label: 'Ca Chiều', time: '13:00 - 18:00', color: 'bg-[#ff8b82]', dot: 'bg-[#ff8b82]' },
  { id: 'evening', label: 'Ca Tối', time: '18:00 - 23:00', color: 'bg-[#2f3136]', dot: 'bg-[#2f3136]' },
];

const dayLabels = ['THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7', 'CN'];
const defaultSlotTimes = {
  morning: { start: '08:00', end: '13:00', nextDayEnd: false },
  afternoon: { start: '13:00', end: '18:00', nextDayEnd: false },
  evening: { start: '18:00', end: '23:00', nextDayEnd: false },
};

const formatDateInput = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatCurrency = (value = 0) => `${Number(value).toLocaleString('vi-VN')}₫`;

const getMonday = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getSlotId = (shift) => {
  const hour = new Date(shift.startTime).getHours();
  if (hour >= 8 && hour < 13) return 'morning';
  if (hour >= 13 && hour < 18) return 'afternoon';
  return 'evening';
};

const ShiftManagementPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [shifts, setShifts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [form, setForm] = useState({ name: '', startTime: '', endTime: '', staff: [] });
  const [selectedShiftForAssign, setSelectedShiftForAssign] = useState(null);
  const [selectedShiftForSummary, setSelectedShiftForSummary] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, shift: null, loading: false });

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = isAdmin ? await shiftService.getShifts() : await shiftService.getMyShifts();
      setShifts(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách ca làm việc');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchStaff = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const users = await userService.getUsers();
      setStaffList((users || []).filter(item => item.role === 'staff' || item.role === 'admin'));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách nhân viên');
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchShifts();
    fetchStaff();
  }, [fetchShifts, fetchStaff]);

  const weekDays = useMemo(() => (
    Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  ), [weekStart]);

  const weekEnd = weekDays[6];
  const weekNumber = Math.ceil((((weekStart - new Date(weekStart.getFullYear(), 0, 1)) / 86400000) + new Date(weekStart.getFullYear(), 0, 1).getDay() + 1) / 7);

  const visibleShifts = useMemo(() => {
    const start = new Date(weekStart);
    const end = addDays(weekStart, 7);
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.startTime);
      return shiftStart >= start && shiftStart < end;
    });
  }, [shifts, weekStart]);

  const weekSummary = useMemo(() => ({
    total: visibleShifts.length,
    open: visibleShifts.filter(shift => shift.status === 'open').length,
    closed: visibleShifts.filter(shift => shift.status === 'closed').length,
    revenue: visibleShifts.reduce((sum, shift) => sum + Number(shift.totalRevenue || 0), 0),
    cash: visibleShifts.reduce((sum, shift) => sum + Number(shift.totalCash || 0), 0),
    difference: visibleShifts.reduce((sum, shift) => sum + Number(shift.difference || 0), 0),
  }), [visibleShifts]);

  const openCreateForm = (day = weekStart, slotId = 'morning') => {
    const slot = defaultSlotTimes[slotId];
    const start = new Date(day);
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(day);
    if (slot.nextDayEnd) end.setDate(end.getDate() + 1);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    end.setHours(endHour, endMinute, 0, 0);

    setEditingShift(null);
    setForm({
      name: slot.label,
      startTime: formatDateInput(start),
      endTime: formatDateInput(end),
      staff: [],
    });
    setShowForm(true);
  };

  const openEditForm = (shift) => {
    setEditingShift(shift);
    setForm({
      name: shift.name || '',
      startTime: formatDateInput(new Date(shift.startTime)),
      endTime: formatDateInput(new Date(shift.endTime)),
      staff: shift.staff?.map(item => item._id || item) || [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingShift(null);
    setForm({ name: '', startTime: '', endTime: '', staff: [] });
  };

  const handleCreateOrUpdate = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (editingShift) {
        await shiftService.updateShift(editingShift._id, form);
      } else {
        await shiftService.createShift(form);
      }
      closeForm();
      fetchShifts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu ca làm việc');
    }
  };

  const handleDelete = (shift) => {
    setDeleteModal({ isOpen: true, shift, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteModal.shift) return;

    try {
      setDeleteModal(current => ({ ...current, loading: true }));
      await shiftService.deleteShift(deleteModal.shift._id);
      setDeleteModal({ isOpen: false, shift: null, loading: false });
      fetchShifts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa ca');
      setDeleteModal({ isOpen: false, shift: null, loading: false });
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      setError('Vui lòng chọn nhân viên');
      return;
    }

    try {
      await shiftService.assignStaff(selectedShiftForAssign._id, selectedStaffId);
      setSelectedShiftForAssign(null);
      setSelectedStaffId('');
      fetchShifts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể phân ca');
    }
  };

  const handleCloseShift = async (shift) => {
    const names = shift.staff?.map(item => item.name).join(', ') || 'Chưa có';
    const confirmMessage = `Đóng ca "${shift.name}"?\nNhân viên: ${names}\nBắt đầu: ${new Date(shift.startTime).toLocaleString('vi-VN')}`;
    if (!window.confirm(confirmMessage)) return;

    const actualCash = prompt('Nhập tổng tiền mặt thực tế (VNĐ):', '0');
    if (actualCash === null) return;

    try {
      const closedShift = await shiftService.closeShift(shift._id, {
        endTime: new Date().toISOString(),
        actualCash: Number(actualCash),
      });
      alert(
        `Đã đóng ca "${closedShift.name}"\n` +
        `Tiền mặt hệ thống: ${formatCurrency(closedShift.totalCash)}\n` +
        `Tiền thực tế: ${formatCurrency(closedShift.actualCash)}\n` +
        `Chênh lệch: ${formatCurrency(closedShift.difference)}`
      );
      fetchShifts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đóng ca');
    }
  };

  const getShiftsInCell = (day, slotId) => visibleShifts.filter(shift => {
    const start = new Date(shift.startTime);
    return start.toDateString() === day.toDateString() && getSlotId(shift) === slotId;
  });

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-black tracking-tight text-gray-950">
            Quản lý Ca làm việc {!isAdmin && '(Ca của tôi)'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-black text-gray-700 shadow-sm">
            Tháng {weekStart.getMonth() + 1}, {weekStart.getFullYear()}
          </button>
          {isAdmin && (
            <button
              onClick={() => openCreateForm(new Date(), 'morning')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c70d1a] px-5 py-3 text-xs font-black text-white shadow-sm hover:bg-[#a90b16]"
            >
              <PlusCircle size={17} />
              Thêm ca mới
            </button>
          )}
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white">
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-black text-white">
              {(user?.name || user?.email || 'AD').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-7 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="rounded-full px-3 py-2 text-xl font-black text-gray-500 hover:bg-gray-50">‹</button>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-gray-400">Tuần {weekNumber}</div>
              <div className="text-xl font-black text-gray-950">
                {weekStart.getDate()}/{weekStart.getMonth() + 1} - {weekEnd.getDate()}/{weekEnd.getMonth() + 1}
              </div>
            </div>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-full px-3 py-2 text-xl font-black text-gray-500 hover:bg-gray-50">›</button>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            {shiftSlots.map(slot => (
              <div key={slot.id} className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <span className={`h-2.5 w-2.5 rounded-full ${slot.dot}`} />
                <span>{slot.label} ({slot.time})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Tổng ca" value={weekSummary.total} />
        <SummaryCard label="Đang mở" value={weekSummary.open} tone="text-emerald-700" />
        <SummaryCard label="Đã đóng" value={weekSummary.closed} tone="text-gray-700" />
        <SummaryCard label="Doanh thu" value={formatCurrency(weekSummary.revenue)} />
        <SummaryCard label="Tiền mặt HT" value={formatCurrency(weekSummary.cash)} />
        <SummaryCard
          label="Chênh lệch"
          value={formatCurrency(weekSummary.difference)}
          tone={weekSummary.difference < 0 ? 'text-red-600' : 'text-emerald-700'}
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="grid min-w-[900px] grid-cols-[120px_repeat(7,1fr)]">
          <div className="border-b border-r border-gray-100 p-4 text-[11px] font-black uppercase leading-4 tracking-widest text-red-950">
            Ca /<br />Khung giờ
          </div>
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const isWeekend = index >= 5;
            return (
              <div key={day.toISOString()} className={`border-b border-r border-gray-100 p-4 text-center ${isWeekend ? 'bg-red-50/35' : ''}`}>
                <div className={`text-[11px] font-black uppercase tracking-wider ${isToday ? 'text-[#c70d1a]' : 'text-gray-500'}`}>
                  {dayLabels[index]} {isToday ? 'Hôm nay' : ''}
                </div>
                <div className={`mt-1 text-2xl font-black ${isToday ? 'text-[#c70d1a]' : 'text-gray-950'}`}>{day.getDate()}</div>
              </div>
            );
          })}

          {shiftSlots.map(slot => (
            <React.Fragment key={slot.id}>
              <div className="border-b border-r border-gray-100 bg-[#fbf8f7] p-4">
                <div className="text-xs font-black text-red-950">{slot.label}</div>
                <div className="mt-1 text-[11px] font-bold leading-4 text-gray-500">{slot.time}</div>
              </div>

              {weekDays.map((day, dayIndex) => {
                const cellShifts = getShiftsInCell(day, slot.id);
                const isWeekend = dayIndex >= 5;
                return (
                  <div key={`${slot.id}-${day.toISOString()}`} className={`min-h-[116px] border-b border-r border-gray-100 p-2 ${isWeekend ? 'bg-red-50/35' : 'bg-white'}`}>
                    <div className="flex flex-col gap-2">
                      {loading ? (
                        <div className="rounded-lg bg-gray-100 p-2 text-xs font-bold text-gray-400">Đang tải...</div>
                      ) : cellShifts.length > 0 ? (
                        cellShifts.map(shift => (
                          <ShiftCard
                            key={shift._id}
                            shift={shift}
                            slot={slot}
                            isAdmin={isAdmin}
                            onAssign={() => setSelectedShiftForAssign(shift)}
                            onSummary={() => setSelectedShiftForSummary(shift)}
                            onEdit={() => openEditForm(shift)}
                            onClose={() => handleCloseShift(shift)}
                            onDelete={() => handleDelete(shift)}
                          />
                        ))
                      ) : (
                        isAdmin && (
                          <button
                            onClick={() => openCreateForm(day, slot.id)}
                            className="rounded-lg border border-dashed border-gray-200 px-2 py-3 text-xs font-black text-gray-300 hover:border-red-200 hover:text-[#c70d1a]"
                          >
                            + Thêm
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {isAdmin && showForm && (
        <ShiftFormModal
          form={form}
          setForm={setForm}
          staffList={staffList}
          editingShift={editingShift}
          onSubmit={handleCreateOrUpdate}
          onClose={closeForm}
        />
      )}

      {isAdmin && selectedShiftForAssign && (
        <AssignModal
          shift={selectedShiftForAssign}
          staffList={staffList}
          selectedStaffId={selectedStaffId}
          setSelectedStaffId={setSelectedStaffId}
          onConfirm={handleAssignStaff}
          onClose={() => {
            setSelectedShiftForAssign(null);
            setSelectedStaffId('');
          }}
        />
      )}

      {selectedShiftForSummary && (
        <ShiftSummaryModal
          shift={selectedShiftForSummary}
          onClose={() => setSelectedShiftForSummary(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Xóa ca?"
        message={`Bạn có chắc chắn muốn xóa "${deleteModal.shift?.name || 'ca này'}" khỏi hệ thống không?`}
        loading={deleteModal.loading}
        onCancel={() => setDeleteModal({ isOpen: false, shift: null, loading: false })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const SummaryCard = ({ label, value, tone = 'text-gray-950' }) => (
  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
    <div className="text-[11px] font-black uppercase tracking-wider text-gray-400">{label}</div>
    <div className={`mt-2 text-xl font-black ${tone}`}>{value}</div>
  </div>
);

const ShiftCard = ({ shift, slot, isAdmin, onAssign, onSummary, onEdit, onClose, onDelete }) => {
  const staffText = shift.staff?.length
    ? shift.staff.map(item => item.name || item.email).join(', ')
    : 'Chưa phân ca';

  return (
    <div className={`rounded-lg px-3 py-2 text-white shadow-sm ${slot.color} ${shift.status === 'closed' ? 'opacity-60 grayscale' : ''}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="line-clamp-1 text-[11px] font-black">{shift.name}</div>
        <span className="text-[10px] font-black">{shift.status === 'closed' ? 'Đóng' : 'Mở'}</span>
      </div>
      <div className="line-clamp-2 text-sm font-black leading-4">{staffText}</div>
      {shift.status === 'closed' && (
        <div className="mt-1 text-[11px] font-bold opacity-90">
          DT: {formatCurrency(shift.totalRevenue)}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={onSummary} className="rounded bg-white/20 px-1.5 py-1 text-[10px] font-black">Tổng kết</button>
        {shift.status === 'open' && (
          <>
            {isAdmin && <button onClick={onAssign} className="rounded bg-white/20 px-1.5 py-1 text-[10px] font-black">Phân</button>}
            {isAdmin && <button onClick={onEdit} className="rounded bg-white/20 px-1.5 py-1 text-[10px] font-black">Sửa</button>}
            <button onClick={onClose} className="rounded bg-white/20 px-1.5 py-1 text-[10px] font-black">Đóng</button>
          </>
        )}
        {isAdmin && <button onClick={onDelete} className="rounded bg-white/20 px-1.5 py-1 text-[10px] font-black">Xóa</button>}
      </div>
    </div>
  );
};

const ShiftFormModal = ({ form, setForm, staffList, editingShift, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-xl font-black text-gray-950">{editingShift ? 'Sửa ca làm việc' : 'Thêm ca mới'}</h2>
          <p className="mt-1 text-sm text-gray-500">Thiết lập thời gian và nhân viên phụ trách ca.</p>
        </div>
        <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">Đóng</button>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Tên ca">
          <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Ca Sáng" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Bắt đầu">
            <input type="datetime-local" value={form.startTime} onChange={event => setForm({ ...form, startTime: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Kết thúc">
            <input type="datetime-local" value={form.endTime} onChange={event => setForm({ ...form, endTime: event.target.value })} className={inputClass} />
          </Field>
        </div>
        <Field label="Nhân viên trong ca">
          <select
            multiple
            value={form.staff}
            onChange={event => setForm({ ...form, staff: Array.from(event.target.selectedOptions, option => option.value) })}
            className={`${inputClass} min-h-[120px]`}
          >
            {staffList.map(staff => (
              <option key={staff._id} value={staff._id}>{staff.name || staff.email} ({staff.role})</option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">Hủy</button>
          <button type="submit" className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white">
            {editingShift ? 'Cập nhật' : 'Tạo ca'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const AssignModal = ({ shift, staffList, selectedStaffId, setSelectedStaffId, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="m-0 text-xl font-black text-gray-950">Phân ca cho "{shift.name}"</h2>
      <p className="mt-1 text-sm text-gray-500">Chọn nhân viên để thêm vào ca này.</p>

      <select value={selectedStaffId} onChange={event => setSelectedStaffId(event.target.value)} className={`${inputClass} mt-5`}>
        <option value="">Chọn nhân viên</option>
        {staffList.map(staff => (
          <option key={staff._id} value={staff._id}>{staff.name || staff.email} ({staff.role})</option>
        ))}
      </select>

      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600">Đóng</button>
        <button onClick={onConfirm} className="rounded-xl bg-[#c70d1a] px-5 py-3 text-sm font-black text-white">Xác nhận</button>
      </div>
    </div>
  </div>
);

const ShiftSummaryModal = ({ shift, onClose }) => {
  const staffText = shift.staff?.length
    ? shift.staff.map(staff => staff.name || staff.email).join(', ')
    : 'Chưa phân ca';

  const difference = Number(shift.difference || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-black text-gray-950">Tổng kết ca</h2>
            <p className="mt-1 text-sm text-gray-500">{shift.name} - {staffText}</p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">Đóng</button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 text-sm">
          <InfoRow label="Bắt đầu" value={new Date(shift.startTime).toLocaleString('vi-VN')} />
          <InfoRow label="Kết thúc" value={shift.endTime ? new Date(shift.endTime).toLocaleString('vi-VN') : 'Chưa kết thúc'} />
          <InfoRow label="Trạng thái" value={shift.status === 'closed' ? 'Đã đóng' : 'Đang mở'} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SummaryCard label="Tổng doanh thu" value={formatCurrency(shift.totalRevenue)} />
          <SummaryCard label="Tiền mặt hệ thống" value={formatCurrency(shift.totalCash)} />
          <SummaryCard label="Tiền mặt thực tế" value={formatCurrency(shift.actualCash)} />
          <SummaryCard
            label="Chênh lệch"
            value={formatCurrency(difference)}
            tone={difference < 0 ? 'text-red-600' : 'text-emerald-700'}
          />
        </div>

        {shift.status === 'open' && (
          <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            Ca đang mở nên số liệu tổng kết chỉ đầy đủ sau khi đóng ca.
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
    <span className="font-bold text-gray-500">{label}</span>
    <span className="font-black text-gray-900">{value}</span>
  </div>
);

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-black uppercase tracking-wider text-gray-500">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#c0392b] focus:ring-2 focus:ring-red-100';

export default ShiftManagementPage;
