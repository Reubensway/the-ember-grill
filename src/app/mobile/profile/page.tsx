'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Mail, Phone, MapPin, Hash, User, Pencil, Check, X } from 'lucide-react';
import { showMobileToast } from '@/hooks/use-mobile-toast';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
}

export default function MobileProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: 'Demo User',
    email: 'demo@theembergrill.co.uk',
    phone: '+44 20 7946 0958',
    address: '',
    postcode: '',
  });

  // Hydrate profile from sessionStorage (set during signup)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('user_profile');
      if (stored) {
        const data = JSON.parse(stored);
        setProfile((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // ignore
    }
  }, []);
  const [editProfile, setEditProfile] = useState<ProfileData>(profile);

  function handleEdit() {
    setEditProfile(profile);
    setIsEditing(true);
  }

  function handleSave() {
    setProfile(editProfile);
    setIsEditing(false);
    // Persist to sessionStorage
    try {
      sessionStorage.setItem('user_profile', JSON.stringify(editProfile));
    } catch { /* ignore */ }
    showMobileToast('Profile updated');
  }

  function handleCancel() {
    setEditProfile(profile);
    setIsEditing(false);
  }

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  const fields = [
    { key: 'name', label: 'Full Name', icon: User, placeholder: 'Enter your name' },
    { key: 'email', label: 'Email', icon: Mail, placeholder: 'Enter email' },
    { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+44...' },
    { key: 'address', label: 'Address', icon: MapPin, placeholder: 'Delivery address' },
    { key: 'postcode', label: 'Postcode', icon: Hash, placeholder: 'E1 6AN' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900">My Profile</h1>
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <X className="h-4 w-4 text-gray-500" />
            </button>
            <button onClick={handleSave} className="flex h-9 w-9 items-center justify-center rounded-full bg-amber">
              <Check className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <button onClick={handleEdit} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Pencil className="h-4 w-4 text-gray-700" />
          </button>
        )}
      </div>

      {/* Avatar section */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber to-orange-500 shadow-lg shadow-amber/20">
            <span className="text-2xl font-bold text-white">
              {getInitials(profile.name)}
            </span>
          </div>
          {isEditing && (
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 border-2 border-white shadow-sm">
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          )}
        </div>
        <h2 className="mt-3 text-lg font-bold text-gray-900">{profile.name}</h2>
        <p className="text-xs text-gray-500">{profile.email}</p>
      </div>

      {/* Profile fields */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="space-y-3">
          {fields.map((field) => {
            const Icon = field.icon;
            const value = isEditing ? editProfile[field.key] : profile[field.key];

            return (
              <div key={field.key} className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{field.label}</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setEditProfile({ ...editProfile, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none mt-0.5 placeholder:text-gray-300"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{value}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Member since */}
        <div className="mt-6 rounded-2xl bg-amber/5 border border-amber/10 px-4 py-3 text-center">
          <p className="text-xs text-amber font-medium">🔥 Member since May 2025</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Loyalty Points: 320</p>
        </div>
      </div>
    </div>
  );
}
