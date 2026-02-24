import React, { useState, useEffect } from 'react';
import { Save, Check, X, AlertCircle, ExternalLink, Upload, Download } from 'lucide-react';

export default function CICDSettings() {
  const [activeTab, setActiveTab] = useState('github');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  
  // GitHub state
  const [githubConfig, setGithubConfig] = useState({
    webhook_secret: '',
    auto_trigger: true
  });
  
  // GitLab state
  const [gitlabConfig, setGitlabConfig] = useState({
    webhook_token: '',
    auto_trigger: true
  });
  
  // Jira state
  const [jiraConfig, setJiraConfig] = useState({
    domain: '',
    email: '',
    api_token: '',
    project_key: ''
  });
  const [testingJira, setTestingJira] = useState(false);
  const [jiraTestResult, setJiraTestResult] = useState('');
  
  // Postman state
  const [postmanFile, setPostmanFile] = useState(null);
  const [postmanUrl, setPostmanUrl] = useState('');
  const [importingPostman, setImportingPostman] = useState(false);
  const [postmanImports, setPostmanImports] = useState([]);

  // Load existing configs
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      // Load GitHub config
      const githubRes = await fetch('/api/cicd/github/config');
      if (githubRes.ok) {
        const data = await githubRes.json();
        if (data.webhook_secret) setGithubConfig(data);
      }

      // Load GitLab config
      const gitlabRes = await fetch('/api/cicd/gitlab/config');
      if (gitlabRes.ok) {
        const data = await gitlabRes.json();
        if (data.webhook_token) setGitlabConfig(data);
      }

      // Load Postman imports
      const postmanRes = await fetch('/api/cicd/postman/imports');
      if (postmanRes.ok) {
        const data = await postmanRes.json();
        setPostmanImports(data.imports || []);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  const saveGitHubConfig = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/cicd/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(githubConfig)
      });
      
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const saveGitLabConfig = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/cicd/gitlab/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gitlabConfig)
      });
      
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const saveJiraConfig = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/cicd/jira/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jiraConfig)
      });
      
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const testJiraConnection = async () => {
    setTestingJira(true);
    setJiraTestResult('');
    try {
      const res = await fetch('/api/cicd/jira/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jiraConfig)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setJiraTestResult('✓ Connection successful!');
      } else {
        setJiraTestResult(`✗ ${data.error || 'Connection failed'}`);
      }
    } catch (error) {
      setJiraTestResult('✗ Connection failed');
    } finally {
      setTestingJira(false);
    }
  };

  const importPostmanFile = async () => {
    if (!postmanFile) return;
    
    setImportingPostman(true);
    try {
      const formData = new FormData();
      formData.append('file', postmanFile);
      
      const res = await fetch('/api/cicd/postman/import', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        setPostmanFile(null);
        loadConfigs();
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setImportingPostman(false);
    }
  };

  const importPostmanUrl = async () => {
    if (!postmanUrl) return;
    
    setImportingPostman(true);
    try {
      const res = await fetch('/api/cicd/postman/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: postmanUrl })
      });
      
      if (res.ok) {
        setPostmanUrl('');
        loadConfigs();
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setImportingPostman(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CI/CD Integrations</h1>
          <p className="text-gray-600 mt-2">Configure your development workflow integrations</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('github')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'github'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              GitHub
            </button>
            <button
              onClick={() => setActiveTab('gitlab')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'gitlab'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              GitLab
            </button>
            <button
              onClick={() => setActiveTab('jira')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'jira'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Jira
            </button>
            <button
              onClick={() => setActiveTab('postman')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'postman'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Postman
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* GitHub Tab */}
            {activeTab === 'github' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={githubConfig.webhook_secret}
                    onChange={(e) => setGithubConfig({ ...githubConfig, webhook_secret: e.target.value })}
                    placeholder="Enter your GitHub webhook secret"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Generate this in your GitHub repository settings under Webhooks
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="github-auto-trigger"
                    checked={githubConfig.auto_trigger}
                    onChange={(e) => setGithubConfig({ ...githubConfig, auto_trigger: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="github-auto-trigger" className="ml-2 text-sm text-gray-700">
                    Automatically trigger tests on push events
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Webhook URL</h3>
                  <code className="text-sm text-blue-700 bg-white px-3 py-1 rounded border border-blue-200">
                    {window.location.origin}/api/cicd/github/webhook/YOUR_USER_ID
                  </code>
                  <p className="text-sm text-blue-700 mt-2">
                    Configure this URL in your GitHub repository webhook settings
                  </p>
                </div>

                <button
                  onClick={saveGitHubConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saveStatus === 'success' ? <Check size={20} /> : <Save size={20} />}
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}

            {/* GitLab Tab */}
            {activeTab === 'gitlab' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Token
                  </label>
                  <input
                    type="password"
                    value={gitlabConfig.webhook_token}
                    onChange={(e) => setGitlabConfig({ ...gitlabConfig, webhook_token: e.target.value })}
                    placeholder="Enter your GitLab webhook token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Generate this in your GitLab project settings under Webhooks
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gitlab-auto-trigger"
                    checked={gitlabConfig.auto_trigger}
                    onChange={(e) => setGitlabConfig({ ...gitlabConfig, auto_trigger: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gitlab-auto-trigger" className="ml-2 text-sm text-gray-700">
                    Automatically trigger tests on push events
                  </label>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 mb-2">Webhook URL</h3>
                  <code className="text-sm text-orange-700 bg-white px-3 py-1 rounded border border-orange-200">
                    {window.location.origin}/api/cicd/gitlab/webhook/YOUR_USER_ID
                  </code>
                  <p className="text-sm text-orange-700 mt-2">
                    Configure this URL in your GitLab project webhook settings
                  </p>
                </div>

                <button
                  onClick={saveGitLabConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saveStatus === 'success' ? <Check size={20} /> : <Save size={20} />}
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}

            {/* Jira Tab */}
            {activeTab === 'jira' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jira Domain
                  </label>
                  <input
                    type="text"
                    value={jiraConfig.domain}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, domain: e.target.value })}
                    placeholder="your-domain.atlassian.net"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={jiraConfig.email}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                    placeholder="your-email@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token
                  </label>
                  <input
                    type="password"
                    value={jiraConfig.api_token}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, api_token: e.target.value })}
                    placeholder="Enter your Jira API token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      Generate an API token <ExternalLink size={14} />
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Key
                  </label>
                  <input
                    type="text"
                    value={jiraConfig.project_key}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, project_key: e.target.value })}
                    placeholder="PROJ"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The key of the Jira project where tickets will be created
                  </p>
                </div>

                {jiraTestResult && (
                  <div className={`p-4 rounded-lg ${jiraTestResult.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {jiraTestResult}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={testJiraConnection}
                    disabled={testingJira}
                    className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <AlertCircle size={20} />
                    {testingJira ? 'Testing...' : 'Test Connection'}
                  </button>

                  <button
                    onClick={saveJiraConfig}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saveStatus === 'success' ? <Check size={20} /> : <Save size={20} />}
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            )}

            {/* Postman Tab */}
            {activeTab === 'postman' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Import Postman Collection</h3>
                  
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">Upload a file</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => setPostmanFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {postmanFile && (
                      <p className="text-sm text-gray-600 mt-2">Selected: {postmanFile.name}</p>
                    )}
                  </div>

                  {postmanFile && (
                    <button
                      onClick={importPostmanFile}
                      disabled={importingPostman}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Download size={20} />
                      {importingPostman ? 'Importing...' : 'Import Collection'}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or import from URL</span>
                  </div>
                </div>

                {/* URL Import */}
                <div className="space-y-3">
                  <input
                    type="url"
                    value={postmanUrl}
                    onChange={(e) => setPostmanUrl(e.target.value)}
                    placeholder="https://www.getpostman.com/collections/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={importPostmanUrl}
                    disabled={importingPostman || !postmanUrl}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Download size={20} />
                    {importingPostman ? 'Importing...' : 'Import from URL'}
                  </button>
                </div>

                {/* Imported Collections */}
                {postmanImports.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Imported Collections</h3>
                    <div className="space-y-3">
                      {postmanImports.map((imp) => (
                        <div key={imp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">{imp.name}</p>
                            <p className="text-sm text-gray-500">
                              {imp.collection_count} collections • Imported {new Date(imp.imported_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Check className="text-green-600" size={20} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Status */}
            {saveStatus === 'success' && (
              <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <Check size={20} />
                Configuration saved successfully!
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <X size={20} />
                Failed to save configuration. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
