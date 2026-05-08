import { useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EduPortalProvider, useEduPortal } from './context/EduPortalContext';
import LoginPage from './components/portal/LoginPage';
import RoleSelect from './components/portal/RoleSelect';
import TeacherPortal from './components/portal/TeacherPortal';
import StudentPortal from './components/portal/StudentPortal';
import HelpModal from './components/portal/HelpModal';

function PortalShellInner() {
  const { authReady, token, user, offlineDemo } = useAuth();
  const { role: offlineRole } = useEduPortal();
  const [helpOpen, setHelpOpen] = useState(false);

  const activeRole = useMemo(() => {
    if (offlineDemo || !token || !user) return offlineRole;
    return user.role === 'TEACHER' ? ('teacher' as const) : ('student' as const);
  }, [offlineDemo, offlineRole, token, user]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Checking session…
      </div>
    );
  }

  if (!offlineDemo && !token) {
    return <LoginPage />;
  }

  if (offlineDemo && !offlineRole) {
    return <RoleSelect />;
  }

  if (!activeRole) {
    return null;
  }

  return (
    <>
      {activeRole === 'teacher' && <TeacherPortal onOpenHelp={() => setHelpOpen(true)} />}
      {activeRole === 'student' && <StudentPortal />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}

/** Auth context must wrap EduPortalProvider so roster sync can attach JWT headers. */
function PortalShell() {
  return (
    <EduPortalProvider>
      <PortalShellInner />
    </EduPortalProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <PortalShell />
    </AuthProvider>
  );
}

export default App;
