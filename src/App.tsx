import { useState } from 'react';
import { EduPortalProvider, useEduPortal } from './context/EduPortalContext';
import RoleSelect from './components/portal/RoleSelect';
import TeacherPortal from './components/portal/TeacherPortal';
import StudentPortal from './components/portal/StudentPortal';
import HelpModal from './components/portal/HelpModal';

function PortalShell() {
  const { role } = useEduPortal();
  const [helpOpen, setHelpOpen] = useState(false);

  if (!role) {
    return <RoleSelect />;
  }

  return (
    <>
      {role === 'teacher' && <TeacherPortal onOpenHelp={() => setHelpOpen(true)} />}
      {role === 'student' && <StudentPortal />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}

function App() {
  return (
    <EduPortalProvider>
      <PortalShell />
    </EduPortalProvider>
  );
}

export default App;
