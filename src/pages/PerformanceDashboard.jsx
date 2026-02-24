import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Cpu, HardDrive, Clock, AlertTriangle, Play, RefreshCw } from 'lucide-react';

export default function PerformanceDashboard() {
  const [loadTests, setLoadTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [benchmarks, setBenchmarks] = useState([]);
  const [creating, setCreating] = useState(false);
  
  // Load test configuration
  const [testConfig, setTestConfig] = useState({
    test_id: '',
    target_url: '',
    duration_seconds: 60,
    concurrent_users: 10,
    ramp_up_time: 10
  });

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    try {
      const res = await fetch('/api/advanced/performance/benchmarks');
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data.benchmarks || []);
      }
    } catch (error) {
      console.error('Failed to load benchmarks:', error);
    }
  };

  const startLoadTest = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/advanced/performance/load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig)
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Load test started! Run ID: ${data.test_run_id}`);
        setTestConfig({
          test_id: '',
          target_url: '',
          duration_seconds: 60,
          concurrent_users: 10,
          ramp_up_time: 10
        });
      }
    } catch (error) {
      console.error('Failed to start load test:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance & Optimization</h1>
          <p className="text-gray-600 mt-2">Monitor and optimize your application performance</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-blue-600" size={24} />
              <span className="text-xs text-gray-500">Avg Response</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">245ms</p>
            <p className="text-xs text-green-600 mt-1">↓ 12% from last week</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-green-600" size={24} />
              <span className="text-xs text-gray-500">Throughput</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">125 RPS</p>
            <p className="text-xs text-green-600 mt-1">↑ 8% from last week</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Cpu className="text-orange-600" size={24} />
              <span className="text-xs text-gray-500">CPU Usage</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">45%</p>
            <p className="text-xs text-gray-600 mt-1">Normal range</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="text-purple-600" size={24} />
              <span className="text-xs text-gray-500">Memory</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">62%</p>
            <p className="text-xs text-gray-600 mt-1">2.4 GB / 4 GB</p>
          </div>
        </div>

        {/* Load Test Creator */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create Load Test</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test ID
              </label>
              <input
                type="text"
                value={testConfig.test_id}
                onChange={(e) => setTestConfig({ ...testConfig, test_id: e.target.value })}
                placeholder="e.g., api_load_test_1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target URL
              </label>
              <input
                type="url"
                value={testConfig.target_url}
                onChange={(e) => setTestConfig({ ...testConfig, target_url: e.target.value })}
                placeholder="https://api.example.com/endpoint"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={testConfig.duration_seconds}
                onChange={(e) => setTestConfig({ ...testConfig, duration_seconds: parseInt(e.target.value) })}
                min="10"
                max="3600"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurrent Users
              </label>
              <input
                type="number"
                value={testConfig.concurrent_users}
                onChange={(e) => setTestConfig({ ...testConfig, concurrent_users: parseInt(e.target.value) })}
                min="1"
                max="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ramp-up Time (seconds)
              </label>
              <input
                type="number"
                value={testConfig.ramp_up_time}
                onChange={(e) => setTestConfig({ ...testConfig, ramp_up_time: parseInt(e.target.value) })}
                min="0"
                max="300"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={startLoadTest}
            disabled={creating || !testConfig.test_id || !testConfig.target_url}
            className="mt-6 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Play size={20} />
            {creating ? 'Starting...' : 'Start Load Test'}
          </button>
        </div>

        {/* Benchmarks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Performance Benchmarks</h2>
            <button
              onClick={loadBenchmarks}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {benchmarks.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">No benchmarks available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {benchmarks.map((benchmark, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">{benchmark.endpoint}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        benchmark.status === 'good' ? 'bg-green-100 text-green-800' :
                        benchmark.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {benchmark.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>Baseline: {benchmark.baseline_time}ms</span>
                      <span>Current: {benchmark.current_time}ms</span>
                      <span className={benchmark.degradation_percent > 10 ? 'text-red-600 font-medium' : ''}>
                        {benchmark.degradation_percent > 0 ? '+' : ''}{benchmark.degradation_percent}%
                      </span>
                    </div>
                  </div>
                  {benchmark.degradation_percent > 10 && (
                    <AlertTriangle className="text-yellow-600" size={20} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
