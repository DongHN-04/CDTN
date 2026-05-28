import React, { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  LockKeyhole,
  Pencil,
  Mail,
  MapPin,
  Phone,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import uploadService from '../../services/uploadService';
import { useToast } from '../../contexts/ToastContext';

const formatDate = value => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const formatCurrency = value => {
  if (value === undefined || value === null || value === '') return 'Chưa cập nhật';
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
};

const getEmployeeCode = user => {
  if (!user?._id) return 'NV-SD0000';
  return `NV-SD${String(user._id).slice(-4).toUpperCase()}`;
};

const getInitials = name => {
  const words = String(name || 'SD').trim().split(/\s+/);
  const letters = words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0].slice(0, 2);
  return letters.toUpperCase();
};

const roleLabels = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  customer: 'Khách hàng',
};

const statusClasses = {
  'Đang làm việc': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Đang nghỉ phép': 'border-amber-200 bg-amber-50 text-amber-700',
  'Đã nghỉ việc': 'border-gray-200 bg-gray-50 text-gray-600',
};

const ProfilePage = () => {
  const { user, updateCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setError] = useState('');
  const [, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await userService.getProfile();
        if (mounted) setProfile(data);
      } catch (err) {
        if (mounted) {
          setProfile(user);
          const message = err.response?.data?.message || 'Không thể tải hồ sơ mới nhất';
          setError(message);
      showToast(message, 'error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [user, showToast]);

  const displayName = profile?.name || 'Người dùng Sơn Đông';
  const roleLabel = profile?.position || roleLabels[profile?.role] || 'Chưa cập nhật';
  const employeeCode = getEmployeeCode(profile);
  const status = profile?.status || 'Chưa cập nhật';
  const statusClass = statusClasses[status] || 'border-gray-200 bg-gray-50 text-gray-600';

  const openEdit = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      avatar: profile?.avatar || '',
    });
    setAvatarFile(null);
    setError('');
    setSuccess('');
    setIsEditing(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setIsEditing(false);
  };

  const handleChange = event => {
    const { name, value } = event.target;
    setFormData(current => ({ ...current, [name]: value }));
  };

  const handleAvatarChange = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setFormData(current => ({ ...current, avatar: URL.createObjectURL(file) }));
  };

  const handlePasswordChange = event => {
    const { name, value } = event.target;
    setPasswordData(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setError('Họ tên không được để trống');
      showToast('Họ tên không được để trống', 'error');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let avatarUrl = formData.avatar;
      if (avatarFile) {
        avatarUrl = await uploadService.uploadImage(avatarFile);
      }
      const updated = await userService.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        avatar: avatarUrl,
      });
      setProfile(updated);
      updateCurrentUser(updated);
      setSuccess('Đã cập nhật hồ sơ');
      showToast('Đã cập nhật hồ sơ');
      setIsEditing(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể cập nhật hồ sơ';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess('');
    setIsChangingPassword(true);
  };

  const closePasswordModal = () => {
    if (saving) return;
    setIsChangingPassword(false);
  };

  const handlePasswordSubmit = async event => {
    event.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Đã đổi mật khẩu');
      showToast('Đã đổi mật khẩu');
      setIsChangingPassword(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể đổi mật khẩu';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-red-100 bg-white p-8 text-sm font-bold text-slate-500 shadow-sm">
        Đang tải hồ sơ...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      <section className="rounded-lg border border-red-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="h-36 w-36 shrink-0 overflow-hidden rounded-lg bg-[#c70d18]">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl font-black text-white">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="m-0 text-3xl font-black tracking-tight text-slate-950">{displayName}</h1>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass}`}>
                {status}
              </span>
            </div>

            <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness size={15} className="text-[#c70d18]" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={15} className="text-[#c70d18]" />
                {employeeCode}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail size={15} className="text-[#c70d18]" />
                {profile?.email || 'Chưa cập nhật email'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={openEdit} className="inline-flex items-center gap-2 rounded-lg bg-[#c70d18] px-5 py-3 text-sm font-black text-white hover:bg-[#a90b14]">
                <Pencil size={16} />
                Chỉnh sửa hồ sơ
              </button>
              <button onClick={openPasswordModal} className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-[#c70d18] hover:bg-red-100">
                <LockKeyhole size={16} />
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-red-100 bg-white p-6 shadow-sm">
        <h2 className="m-0 mb-7 text-lg font-black text-slate-950">Thông tin hồ sơ</h2>

        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <ProfileField label="Họ tên" value={displayName} />
          <ProfileField label="Ngày tham gia" value={formatDate(profile?.createdAt)} />
          <ProfileField label="Vai trò" value={roleLabel} />
          <ProfileField label="Mã nhân viên" value={employeeCode} />
          <ProfileField
            label="Email"
            value={profile?.email || 'Chưa cập nhật'}
            icon={<Mail size={15} className="text-[#c70d18]" />}
          />
          <ProfileField
            label="Số điện thoại"
            value={profile?.phone || 'Chưa cập nhật'}
            icon={<Phone size={15} className="text-[#c70d18]" />}
          />
          <ProfileField
            label="Địa chỉ"
            value={profile?.address || 'Chưa cập nhật'}
            icon={<MapPin size={15} className="text-[#c70d18]" />}
            wide
          />
          <ProfileField
            label="Lương"
            value={formatCurrency(profile?.salary)}
            icon={<WalletCards size={15} className="text-[#c70d18]" />}
          />
          <div>
            <p className="mb-1 text-xs font-black uppercase text-slate-400">Trạng thái</p>
            <p className={`m-0 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${statusClass}`}>
              <CheckCircle2 size={15} />
              {status}
            </p>
          </div>
        </div>
      </section>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="m-0 text-xl font-black text-slate-950">Chỉnh sửa hồ sơ</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Cập nhật thông tin liên hệ của tài khoản hiện tại.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-red-50 bg-red-50/40 p-3">
                <div className="h-20 w-20 overflow-hidden rounded-lg bg-[#c70d18]">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xl font-black text-white">
                      {getInitials(formData.name || displayName)}
                    </div>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-[#c70d18] shadow-sm ring-1 ring-red-100">
                  <Camera size={16} />
                  Đổi avatar
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <FormField
                label="Họ tên"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <FormField
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase text-slate-400">Địa chỉ</span>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full resize-none rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold outline-none focus:border-[#c70d18] focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#c70d18] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <form onSubmit={handlePasswordSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="m-0 text-xl font-black text-slate-950">Đổi mật khẩu</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Nhập mật khẩu hiện tại trước khi đặt mật khẩu mới.</p>
            </div>

            <div className="space-y-4">
              <FormField
                label="Mật khẩu hiện tại"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <FormField
                label="Mật khẩu mới"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <FormField
                label="Nhập lại mật khẩu mới"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={saving}
                className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#c70d18] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ProfileField = ({ label, value, icon, wide = false }) => (
  <div className={wide ? 'sm:col-span-2' : ''}>
    <p className="mb-1 text-xs font-black uppercase text-slate-400">{label}</p>
    <p className="m-0 inline-flex items-center gap-2 text-sm font-bold text-slate-900">
      {icon}
      {value}
    </p>
  </div>
);

const FormField = ({ label, name, value, onChange, required = false, type = 'text' }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-black uppercase text-slate-400">{label}</span>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="h-11 w-full rounded-lg border border-red-100 px-3 text-sm font-semibold outline-none focus:border-[#c70d18] focus:ring-2 focus:ring-red-100"
    />
  </label>
);

export default ProfilePage;
