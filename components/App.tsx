
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import RequestManager from './components/RequestManager';
import DriverList from './components/DriverList';
import BusList from './components/BusList';
import EntityManager from './components/EntityManager';
import WeeklySchedule from './components/WeeklySchedule';
import ShiftManager from './components/ShiftManager';
import { storageService } from './services/storageService';
import { AppData } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppData>(storageService.getData());

  const refreshData = () => {
    setData(storageService.getData());
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onUpdate={refreshData} />;
      case 'requests': return <RequestManager data={data} onUpdate={refreshData} />;
      case 'shifts': return <ShiftManager data={data} onUpdate={refreshData} />;
      case 'weekly-schedule': return <WeeklySchedule data={data} />;
      case 'entities': return <EntityManager data={data} onUpdate={refreshData} />;
      case 'drivers': return <DriverList data={data} onUpdate={refreshData} />;
      case 'buses': return <BusList data={data} onUpdate={refreshData} />;
      default: return <Dashboard data={data} onUpdate={refreshData} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
