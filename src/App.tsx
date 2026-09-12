import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import type { Role } from '@/data/mockData';
import Landing from '@/pages/Landing';
import RoleSelection from '@/pages/RoleSelection';
import ElderlyDashboard from '@/pages/ElderlyDashboard';
import FamilyDashboard from '@/pages/FamilyDashboard';
import CaregiverDashboard from '@/pages/CaregiverDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import BridgeyCelebration from '@/components/BridgeyCelebration';

type Screen = 'landing' | 'role-select' | 'dashboard';

function AppContent() {
  const { currentRole, setCurrentRole, setBridgeySection } = useApp();
  const [screen, setScreen] = useState<Screen>(() => (currentRole ? 'dashboard' : 'landing'));

  const handleEnter = () => {
    setBridgeySection('role-select');
    setScreen('role-select');
  };
  const handleBackToLanding = () => {
    setBridgeySection('landing');
    setScreen('landing');
    setCurrentRole(null);
  };
  const handleBackToRoles = () => {
    setScreen('role-select');
    setCurrentRole(null);
  };
  const handleSelectRole = (role: Role) => {
    setBridgeySection(role);
    setCurrentRole(role);
    setScreen('dashboard');
  };

  let page;
  if (screen === 'landing') {
    page = <Landing onEnter={handleEnter} />;
  } else if (screen === 'role-select') {
    page = <RoleSelection onSelect={handleSelectRole} onBack={handleBackToLanding} />;
  } else {
    switch (currentRole) {
      case 'elderly': page = <ElderlyDashboard onBack={handleBackToRoles} />; break;
      case 'family': page = <FamilyDashboard onBack={handleBackToRoles} />; break;
      case 'caregiver': page = <CaregiverDashboard onBack={handleBackToRoles} />; break;
      case 'admin': page = <AdminDashboard onBack={handleBackToRoles} />; break;
      default: page = <RoleSelection onSelect={handleSelectRole} onBack={handleBackToLanding} />;
    }
  }

  return (
    <>
      {page}
      <BridgeyCelebration />
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
