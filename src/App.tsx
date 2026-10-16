import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import ElderlyDashboard from '@/pages/ElderlyDashboard';
import FamilyDashboard from '@/pages/FamilyDashboard';
import CaregiverDashboard from '@/pages/CaregiverDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import BridgeyCelebration from '@/components/BridgeyCelebration';
import SOSResolutionNotice from '@/components/SOSResolutionNotice';

function AppContent() {
  const { profile, authLoading, signOut, setBridgeySection } = useApp();
  const [pathname, setPathname] = useState(window.location.pathname);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setPathname(path);
  };

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const dashboardMatch = pathname.match(/^\/dashboard\/([^/]+)\/?$/);

    if (dashboardMatch) {
      if (!profile) navigate('/login');
      else if (dashboardMatch[1] !== profile.role) navigate(`/dashboard/${profile.role}`);
      else setBridgeySection(profile.role);
      return;
    }

    if (pathname === '/login') {
      if (profile) navigate(`/dashboard/${profile.role}`);
      return;
    }

    if (pathname === '/') {
      if (profile) navigate(`/dashboard/${profile.role}`);
      return;
    }

    navigate(profile ? `/dashboard/${profile.role}` : '/login');
  }, [authLoading, pathname, profile, setBridgeySection]);

  if (authLoading) {
    return <main className="min-h-screen grid place-items-center bg-primary-50 text-neutral-600">Loading CareBridge...</main>;
  }

  const dashboardMatch = pathname.match(/^\/dashboard\/([^/]+)\/?$/);
  const canShowDashboard = dashboardMatch && profile && dashboardMatch[1] === profile.role;
  let page;

  if (pathname === '/' && !profile) {
    page = <Landing onEnter={() => navigate('/login')} />;
  } else if (pathname === '/login' && !profile) {
    page = <Login onBack={() => navigate('/')} />;
  } else if (canShowDashboard) {
    const handleLogout = async () => {
      try {
        await signOut();
        setBridgeySection('landing');
        navigate('/login');
      } catch (error) {
        console.error('Unable to sign out:', error);
      }
    };

    switch (profile.role) {
      case 'elderly': page = <ElderlyDashboard onBack={handleLogout} />; break;
      case 'family': page = <FamilyDashboard onBack={handleLogout} />; break;
      case 'caregiver': page = <CaregiverDashboard onBack={handleLogout} />; break;
      case 'admin': page = <AdminDashboard onBack={handleLogout} />; break;
    }
  } else {
    page = null;
  }

  return (
    <>
      {page}
      <BridgeyCelebration />
      <SOSResolutionNotice />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
