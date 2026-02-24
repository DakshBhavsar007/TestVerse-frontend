import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface Trigger {
  id: string;
  source: 'github' | 'gitlab' | 'jira' | 'postman' | 'manual';
  event_type: string;
  repository?: string;
  branch?: string;
  commit?: string;
  author?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  triggered_at: string;
  completed_at?: string;
  test_results?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  error_message?: string;
}

export default function CICDTriggers() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');

  useEffect(() => {
    loadTriggers();
    const interval = setInterval(loadTriggers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTriggers = async () => {
    try {
      const res = await fetch('/api/cicd/triggers');
      if (res.ok) {
        const data = await res.json();
        setTriggers(data.triggers || []);
      }
    } catch (error) {
      console.error('Failed to load triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return <GitBranch className="text-gray-700" size={20} />;
      case 'gitlab':
        return <GitBranch className="text-orange-600" size={20} />;
      case 'jira':
        return <AlertCircle className="text-blue-600" size={20} />;
      case 'postman':
        return <ExternalLink className="text-orange-500" size={20} />;
      default:
        return <Clock className="text-gray-600" size={20} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'failed':
        return <XCircle className="text-red-600" size={20} />;
      case 'running':
        return <Clock className="text-blue-600 animate-spin" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTriggers = filterSource === 'all' 
    ? triggers 
    : triggers.filter(t => t.source === filterSource);

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CI/CD Triggers</h1>
          <p className="text-gray-600 mt-2">Monitor your automated test runs and deployments</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by source:</span>
            <button
              onClick={() => setFilterSource('all')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                filterSource === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSource('github')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                filterSource === 'github'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              GitHub
            </button>
            <button
              onClick={() => setFilterSource('gitlab')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                filterSource === 'gitlab'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              GitLab
            </button>
            <button
              onClick={() => setFilterSource('jira')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                filterSource === 'jira'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Jira
            </button>
            <button
              onClick={() => setFilterSource('postman')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                filterSource === 'postman'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Postman
            </button>
          </div>
        </div>

        {/* Triggers List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Clock className="animate-spin mx-auto mb-4 text-gray-400" size={32} />
            <p className="text-gray-500">Loading triggers...</p>
          </div>
        ) : filteredTriggers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500">No triggers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTriggers.map((trigger) => (
              <div
                key={trigger.id}
                onClick={() => setSelectedTrigger(trigger)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Source Icon */}
                    <div className="mt-1">
                      {getSourceIcon(trigger.source)}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {trigger.source} • {trigger.event_type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(trigger.status)}`}>
                          {trigger.status}
                        </span>
                      </div>

                      {trigger.repository && (
                        <p className="text-sm text-gray-600 mb-1">
                          📦 {trigger.repository}
                          {trigger.branch && ` • 🌿 ${trigger.branch}`}
                        </p>
                      )}

                      {trigger.commit && (
                        <p className="text-sm text-gray-600 mb-1">
                          📝 {trigger.commit.substring(0, 7)}
                          {trigger.author && ` by ${trigger.author}`}
                        </p>
                      )}

                      <p className="text-sm text-gray-500">
                        🕐 {new Date(trigger.triggered_at).toLocaleString()}
                        {trigger.completed_at && (
                          <span className="ml-2">
                            • Duration: {formatDuration(trigger.triggered_at, trigger.completed_at)}
                          </span>
                        )}
                      </p>

                      {trigger.test_results && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-gray-700">
                            Total: <strong>{trigger.test_results.total}</strong>
                          </span>
                          <span className="text-green-600">
                            Passed: <strong>{trigger.test_results.passed}</strong>
                          </span>
                          <span className="text-red-600">
                            Failed: <strong>{trigger.test_results.failed}</strong>
                          </span>
                          {trigger.test_results.skipped > 0 && (
                            <span className="text-gray-500">
                              Skipped: <strong>{trigger.test_results.skipped}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {trigger.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          ⚠️ {trigger.error_message}
                        </div>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="mt-1">
                      {getStatusIcon(trigger.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedTrigger && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedTrigger(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {getSourceIcon(selectedTrigger.source)}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 capitalize">
                        {selectedTrigger.source} • {selectedTrigger.event_type}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Trigger ID: {selectedTrigger.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTrigger(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded border ${getStatusColor(selectedTrigger.status)}`}>
                      {getStatusIcon(selectedTrigger.status)}
                      {selectedTrigger.status}
                    </span>
                  </div>

                  {selectedTrigger.repository && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Repository</h3>
                      <p className="text-gray-900">{selectedTrigger.repository}</p>
                    </div>
                  )}

                  {selectedTrigger.branch && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Branch</h3>
                      <p className="text-gray-900">{selectedTrigger.branch}</p>
                    </div>
                  )}

                  {selectedTrigger.commit && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Commit</h3>
                      <p className="text-gray-900 font-mono text-sm">{selectedTrigger.commit}</p>
                      {selectedTrigger.author && (
                        <p className="text-sm text-gray-600 mt-1">by {selectedTrigger.author}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Timing</h3>
                    <p className="text-gray-900">
                      Triggered: {new Date(selectedTrigger.triggered_at).toLocaleString()}
                    </p>
                    {selectedTrigger.completed_at && (
                      <p className="text-gray-900">
                        Completed: {new Date(selectedTrigger.completed_at).toLocaleString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Duration: {formatDuration(selectedTrigger.triggered_at, selectedTrigger.completed_at)}
                    </p>
                  </div>

                  {selectedTrigger.test_results && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Test Results</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-600">Total Tests</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedTrigger.test_results.total}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="text-sm text-green-600">Passed</p>
                          <p className="text-2xl font-bold text-green-600">{selectedTrigger.test_results.passed}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-sm text-red-600">Failed</p>
                          <p className="text-2xl font-bold text-red-600">{selectedTrigger.test_results.failed}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-600">Skipped</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedTrigger.test_results.skipped}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTrigger.error_message && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Error Details</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700 text-sm font-mono whitespace-pre-wrap">
                          {selectedTrigger.error_message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
