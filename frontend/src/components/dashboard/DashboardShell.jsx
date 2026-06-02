import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { uploadProfileImage } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../layout/NotificationBell';
import Sidebar from '../layout/Sidebar';

export default function DashboardShell({ title, subtitle, links, children }) {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingProfileImage(true);
    try {
      const response = await uploadProfileImage(file);
      await updateProfile({ profile_image_url: response.image_url });
    } finally {
      setIsUploadingProfileImage(false);
      event.target.value = '';
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
            VR
          </div>
          <span className="text-lg font-bold text-brand">Veloce Rentals</span>
        </div>
        <NotificationBell />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          role={user?.role}
          user={user}
          links={links}
          onLogout={handleLogout}
          onProfileImageChange={handleProfileImageChange}
          isUploadingProfileImage={isUploadingProfileImage}
          fileInputRef={fileInputRef}
        />

        {/* Main content */}
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            {title ? (
              <header className="mb-4">
                <h1 className="text-2xl font-semibold text-ink">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
              </header>
            ) : null}
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
