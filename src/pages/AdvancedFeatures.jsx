import React, { useState } from 'react';
import { Activity, Database, BarChart3, Users, Shield, Globe } from 'lucide-react';
import PerformanceDashboard from './PerformanceDashboard';
import { EnvironmentManager, TestDataManager, ReportingHub, CollaborationHub, SecurityCompliance } from './AllAdvancedModules';

export default function AdvancedFeatures() {
  const [activeModule, setActiveModule] = useState('performance');

  const modules = [
    { id: 'performance', name: 'Performance', icon: Activity, component: PerformanceDashboard },
    { id: 'environments', name: 'Environments', icon: Globe, component: EnvironmentManager },
    { id: 'testdata', name: 'Test Data', icon: Database, component: TestDataManager },
    { id: 'reporting', name: 'Reporting', icon: BarChart3, component: ReportingHub },
    { id: 'collaboration', name: 'Collaboration', icon: Users, component: CollaborationHub },
    { id: 'security', name: 'Security', icon: Shield, component: SecurityCompliance }
  ];

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 overflow-x-auto">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`flex items-center gap-2 px-4 py-2 mx-1 rounded-lg transition-colors whitespace-nowrap ${
                    activeModule === module.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {module.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}