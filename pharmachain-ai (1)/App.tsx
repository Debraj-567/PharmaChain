
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Upload from './views/Upload';
import Review from './views/Review';
import BatchVerify from './views/BatchVerify';
import RegisterBatch from './views/RegisterBatch';
import ThreatMap from './views/ThreatMap';
import Governance from './views/Governance';
import { AppView, PrescriptionData } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setView] = useState<AppView>(AppView.DASHBOARD);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.UPLOAD:
        return <Upload onAnalysisComplete={(data) => {
            setPrescriptionData(data);
            // Analysis logic is handled inside Upload, but state is lifted here
            // to allow Review to access it.
        }} setView={setView} />;
      case AppView.REVIEW:
        if (!prescriptionData) return <div className="p-8 text-center text-gray-500">No prescription loaded. Please upload first.</div>;
        return <Review data={prescriptionData} />;
      case AppView.VERIFY:
        return <BatchVerify />;
      case AppView.REGISTER:
        return <RegisterBatch />;
      case AppView.MAP:
        return <ThreatMap />;
      case AppView.GOVERNANCE:
        return <Governance />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} setView={setView} onLogout={() => setIsLoggedIn(false)} />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
           {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;
