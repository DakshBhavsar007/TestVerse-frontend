// ============================================================================
// ENVIRONMENT MANAGER
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Globe, Plus, Edit, Trash2, Copy, GitCompare, Rocket } from 'lucide-react';

export function EnvironmentManager() {
  const [environments, setEnvironments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newEnv, setNewEnv] = useState({
    name: '',
    type: 'development',
    base_url: '',
    variables: {}
  });

  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      const res = await fetch('/api/advanced/environments');
      if (res.ok) {
        const data = await res.json();
        setEnvironments(data.environments || []);
      }
    } catch (error) {
      console.error('Failed to load environments:', error);
    }
  };

  const createEnvironment = async () => {
    try {
      const res = await fetch('/api/advanced/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEnv)
      });
      
      if (res.ok) {
        loadEnvironments();
        setShowCreate(false);
        setNewEnv({ name: '', type: 'development', base_url: '', variables: {} });
      }
    } catch (error) {
      console.error('Failed to create environment:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Environment Manager</h1>
          <p className="text-gray-600 mt-2">Manage your test environments and configurations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Environment
        </button>
      </div>

      {/* Environment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {environments.map((env) => (
          <div key={env.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{env.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                  env.type === 'production' ? 'bg-red-100 text-red-800' :
                  env.type === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {env.type}
                </span>
              </div>
              <Globe className="text-gray-400" size={24} />
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">URL:</span>
                <p className="text-gray-900 truncate">{env.base_url}</p>
              </div>
              <div>
                <span className="text-gray-500">Variables:</span>
                <p className="text-gray-900">{env.variables_count} configured</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                <Edit size={14} />
                Edit
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded hover:bg-gray-100">
                <Copy size={14} />
                Clone
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create Environment</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newEnv.name}
                  onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Production"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newEnv.type}
                  onChange={(e) => setNewEnv({ ...newEnv, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                  <option value="qa">QA</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                <input
                  type="url"
                  value={newEnv.base_url}
                  onChange={(e) => setNewEnv({ ...newEnv, base_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://api.example.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createEnvironment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEST DATA MANAGER
// ============================================================================
export function TestDataManager() {
  const [templates, setTemplates] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/advanced/test-data/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const generateData = async (templateId, count) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/advanced/test-data/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, count })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Generated ${data.generated_count} records`);
      }
    } catch (error) {
      console.error('Failed to generate data:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Test Data Manager</h1>
        <p className="text-gray-600 mt-2">Generate and manage test data for your applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {template.type}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>Fields: {template.fields?.join(', ')}</p>
              <p>Sample data: {template.sample_count} records</p>
            </div>

            <button
              onClick={() => generateData(template.id, 10)}
              disabled={generating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate 10 Records'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// REPORTING HUB
// ============================================================================
export function ReportingHub() {
  const [executiveData, setExecutiveData] = useState(null);

  useEffect(() => {
    loadExecutiveDashboard();
  }, []);

  const loadExecutiveDashboard = async () => {
    try {
      const res = await fetch('/api/advanced/reports/executive');
      if (res.ok) {
        const data = await res.json();
        setExecutiveData(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  if (!executiveData) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reporting & Insights</h1>
        <p className="text-gray-600 mt-2">Executive dashboard and quality insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Tests</p>
          <p className="text-3xl font-bold text-gray-900">{executiveData.summary?.total_tests}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Pass Rate</p>
          <p className="text-3xl font-bold text-green-600">{executiveData.summary?.pass_rate}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Active Bugs</p>
          <p className="text-3xl font-bold text-red-600">{executiveData.summary?.active_bugs}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Velocity</p>
          <p className="text-3xl font-bold text-blue-600">{executiveData.summary?.test_velocity}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Coverage</p>
          <p className="text-3xl font-bold text-purple-600">{executiveData.summary?.coverage}%</p>
        </div>
      </div>

      {/* Risk Areas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Risk Areas</h2>
        <div className="space-y-3">
          {executiveData.risk_areas?.map((area, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{area.module}</p>
                <p className="text-sm text-gray-600">{area.open_issues} open issues</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded ${
                area.risk === 'high' ? 'bg-red-100 text-red-800' :
                area.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {area.risk} risk
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COLLABORATION HUB
// ============================================================================
export function CollaborationHub() {
  const [notifications, setNotifications] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    loadNotifications();
    loadActivityFeed();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/advanced/collaboration/notifications?user_id=current_user');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadActivityFeed = async () => {
    try {
      const res = await fetch('/api/advanced/collaboration/activity-feed');
      if (res.ok) {
        const data = await res.json();
        setActivityFeed(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load activity feed:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Collaboration Hub</h1>
        <p className="text-gray-600 mt-2">Team activity and notifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-4 rounded-lg border ${
                notif.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Team Activity</h2>
          <div className="space-y-3">
            {activityFeed.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-600">
                    {activity.user?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>
                    {' '}{activity.action}{' '}
                    <span className="font-medium">{activity.resource}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECURITY & COMPLIANCE
// ============================================================================
export function SecurityCompliance() {
  const [frameworks, setFrameworks] = useState([]);
  const [scans, setScans] = useState([]);

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      const res = await fetch('/api/advanced/compliance/frameworks');
      if (res.ok) {
        const data = await res.json();
        setFrameworks(data.frameworks || []);
      }
    } catch (error) {
      console.error('Failed to load frameworks:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security & Compliance</h1>
        <p className="text-gray-600 mt-2">Monitor security and compliance status</p>
      </div>

      {/* Compliance Frameworks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {frameworks.map((framework, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{framework.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                framework.status === 'compliant' ? 'bg-green-100 text-green-800' :
                framework.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {framework.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{framework.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Checks:</span>
                <span className="font-medium">{framework.checks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Check:</span>
                <span className="font-medium">{framework.last_check}</span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Run Check
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default { EnvironmentManager, TestDataManager, ReportingHub, CollaborationHub, SecurityCompliance };
