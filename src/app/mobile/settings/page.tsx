'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { showMobileToast } from '@/hooks/use-mobile-toast';

export default function MobileSettingsPage() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleUpdatePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMobileToast('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMobileToast('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showMobileToast('Password must be at least 8 characters');
      return;
    }
    // Mock success
    showMobileToast('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  function handleDeleteAccount() {
    // Mock deletion
    showMobileToast('Account deleted');
    setShowDeleteConfirm(false);
    router.push('/mobile');
  }

  return (
    <div className="flex flex-col px-4 py-4 bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Notifications toggle */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Push Notifications</p>
              <p className="text-xs text-gray-500">Receive order updates and offers</p>
            </div>
          </div>
          <button
            onClick={() => setPushEnabled(!pushEnabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              pushEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                pushEnabled ? 'left-[22px]' : 'left-[2px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Change Password */}
      <button
        onClick={() => setShowPasswordModal(true)}
        className="w-full rounded-2xl border border-gray-100 bg-white shadow-sm p-4 mb-4 flex items-center gap-3 text-left"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
          <Lock className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Change Password</p>
          <p className="text-xs text-gray-500">Update your account password</p>
        </div>
        <span className="text-gray-400 text-sm">›</span>
      </button>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-900">Danger Zone</p>
            <p className="text-xs text-red-600">This action cannot be undone</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full rounded-2xl border-2 border-red-300 bg-white py-3 text-sm font-medium text-red-600 active:scale-[0.98] transition-transform"
        >
          Delete Account
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="absolute inset-0 z-[300] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPasswordModal(false)} />
          <div className="relative rounded-t-3xl bg-white px-6 pt-4 pb-8 shadow-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:bg-white transition-colors"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:bg-white transition-colors"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:bg-white transition-colors"
              />
              <button
                onClick={() => { handleUpdatePassword(); setShowPasswordModal(false); }}
                className="w-full rounded-2xl bg-gray-900 py-3 text-sm font-medium text-white active:scale-[0.98] transition-transform mt-1"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-xl w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Account?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-700 active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-medium text-white active:scale-[0.98] transition-transform"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
