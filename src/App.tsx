import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import type { Role } from '@/data/mockData';
import Landing from '@/pages/Landing';
import RoleSelection from '@/pages/RoleSelection';
import ElderlyDashboard from '@/pages/ElderlyDashboard';
import FamilyDashboard from '@/pages/FamilyDashboard';
import CaregiverDashboard from '@/pages/CaregiverDashboard';
import AdminDashboard from '@/pages/AdminDashboard';

type Screen = 'landing' | 'role-select' | 'dashboard';

function AppContent() {
  const { currentRole, setCurrentRole } = useApp();
  const [screen, setScreen] = useState<Screen>('landing');

  const handleEnter = () => setScreen('role-select');
  const handleBackToLanding = () => {
    setScreen('landing');
    setCurrentRole(null);
  };
  const handleBackToRoles = () => {
    setScreen('role-select');
    setCurrentRole(null);
  };
  const handleSelectRole = (role: Role) => {
    setCurrentRole(role);
    setScreen('dashboard');
  };

  if (screen === 'landing') {
    return <Landing onEnter={handleEnter} />;
  }

  if (screen === 'role-select') {
    return <RoleSelection onSelect={handleSelectRole} onBack={handleBackToLanding} />;
  }

  // Dashboard
  switch (currentRole) {
    case 'elderly':
      return <ElderlyDashboard onBack={handleBackToRoles} />;
    case 'family':
      return <FamilyDashboard onBack={handleBackToRoles} />;
    case 'caregiver':
      return <CaregiverDashboard onBack={handleBackToRoles} />;
    case 'admin':
      return <AdminDashboard onBack={handleBackToRoles} />;
    default:
      return <RoleSelection onSelect={handleSelectRole} onBack={handleBackToLanding} />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
