import React, { useState, useEffect } from 'react';
import { Globe, Plus, Edit, Copy } from 'lucide-react';

export default function EnvironmentManager() {
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
