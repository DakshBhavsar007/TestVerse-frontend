import React, { useState } from 'react';
import { Upload, Link, Code, CheckCircle, AlertCircle, Download, Play, FileJson, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const POPULAR = [
  { name: 'Petstore (OpenAPI 3)', url: 'https://petstore3.swagger.io/api/v3/openapi.json' },
  { name: 'Petstore (Swagger 2)', url: 'https://petstore.swagger.io/v2/swagger.json' },
];

const METHOD_COLORS = {
  GET:    'bg-green-100 text-green-700',
  POST:   'bg-blue-100 text-blue-700',
  PUT:    'bg-yellow-100 text-yellow-700',
  PATCH:  'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
  HEAD:   'bg-gray-100 text-gray-700',
};

export default function OpenAPIImport() {
  const [tab, setTab]           = useState('url');   // url | file | paste
  const [url, setUrl]           = useState('');
  const [baseUrl, setBaseUrl]   = useState('');
  const [pasteText, setPaste]   = useState('');
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const toggleSelect = (id) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const selectAll = () => {
    const all = {};
    result?.generated_tests.forEach(t => { all[t.id] = true; });
    setSelected(all);
  };
  const deselectAll = () => setSelected({});
  const selectedCount = Object.values(selected).filter(Boolean).length;

  async function doImport() {
    setLoading(true); setError(''); setResult(null);
    try {
      let res;
      if (tab === 'url') {
        res = await fetch('/api/openapi/import/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, base_url: baseUrl || undefined }),
        });
      } else if (tab === 'file') {
        const fd = new FormData();
        fd.append('file', file);
        if (baseUrl) fd.append('base_url', baseUrl);
        res = await fetch('/api/openapi/import/file', { method: 'POST', body: fd });
      } else {
        const spec = JSON.parse(pasteText);
        res = await fetch('/api/openapi/import/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(spec),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Import failed');
      }
      const data = await res.json();
      setResult(data);
      // auto-select all
      const all = {};
      data.generated_tests.forEach(t => { all[t.id] = true; });
      setSelected(all);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendToTestVerse() {
    const tests = result.generated_tests.filter(t => selected[t.id]);
    if (!tests.length) return;
    setImporting(true);
    try {
      // Run each selected test through the normal test endpoint
      await Promise.all(tests.map(t =>
        fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: t.url,
            method: t.method,
            headers: t.headers,
            body: t.body ? JSON.stringify(t.body) : undefined,
            name: t.name,
            tags: t.tags,
          }),
        })
      ));
      setImportDone(true);
    } catch (e) {
      setError('Failed to run tests: ' + e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileJson className="text-white" size={22} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">OpenAPI / Swagger Import</h1>
          </div>
          <p className="text-gray-600">Import any OpenAPI 3.x or Swagger 2.0 spec and instantly generate test cases.</p>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {[
              { id: 'url',   label: 'From URL',      icon: Link },
              { id: 'file',  label: 'Upload File',   icon: Upload },
              { id: 'paste', label: 'Paste JSON',    icon: Code },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* URL Tab */}
          {tab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spec URL <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center">Try:</span>
                {POPULAR.map(p => (
                  <button
                    key={p.url}
                    onClick={() => setUrl(p.url)}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File Tab */}
          {tab === 'file' && (
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <Upload className="mx-auto text-gray-400 mb-3" size={36} />
              {file
                ? <p className="font-medium text-blue-700">{file.name}</p>
                : <p className="text-gray-500">Click to upload <span className="font-medium">.json</span> or <span className="font-medium">.yaml</span></p>
              }
              <input
                id="fileInput"
                type="file"
                accept=".json,.yaml,.yml"
                className="hidden"
                onChange={e => setFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Paste Tab */}
          {tab === 'paste' && (
            <textarea
              value={pasteText}
              onChange={e => setPaste(e.target.value)}
              placeholder='Paste raw OpenAPI JSON here...'
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* Base URL Override */}
          {(tab === 'url' || tab === 'file') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL Override <span className="text-gray-400">(optional)</span></label>
              <input
                type="url"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://api.yourapp.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            onClick={doImport}
            disabled={loading || (tab === 'url' && !url) || (tab === 'file' && !file) || (tab === 'paste' && !pasteText)}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Parsing spec...</>
            ) : (
              <><Zap size={18} /> Generate Tests</>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div>
                <h2 className="text-xl font-bold">{result.spec_title}</h2>
                <p className="text-blue-200 text-sm">v{result.spec_version} · {result.total_endpoints} endpoints found</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-blue-200 text-sm">{selectedCount} selected</span>
                <button onClick={selectAll} className="text-xs px-3 py-1 bg-white/20 rounded hover:bg-white/30">All</button>
                <button onClick={deselectAll} className="text-xs px-3 py-1 bg-white/20 rounded hover:bg-white/30">None</button>
                <button
                  onClick={sendToTestVerse}
                  disabled={!selectedCount || importing || importDone}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors text-sm"
                >
                  {importDone
                    ? <><CheckCircle size={16} /> Sent!</>
                    : importing
                    ? <><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Running...</>
                    : <><Play size={16} /> Run {selectedCount} Test{selectedCount !== 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-yellow-700 flex items-center gap-2"><AlertCircle size={14} />{w}</p>
                ))}
              </div>
            )}

            {/* Test List */}
            <div className="divide-y divide-gray-100">
              {result.generated_tests.map(test => (
                <div key={test.id} className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!selected[test.id]}
                      onChange={() => toggleSelect(test.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className={`text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[test.method] || 'bg-gray-100 text-gray-700'}`}>
                      {test.method}
                    </span>
                    <code className="text-sm text-gray-800 flex-1 truncate">{test.url}</code>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{test.expected_status}</span>
                    <button onClick={() => toggle(test.id)} className="text-gray-400 hover:text-gray-600">
                      {expanded[test.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 ml-11 mt-1">{test.name}</p>

                  {expanded[test.id] && (
                    <div className="ml-11 mt-3 space-y-3 text-sm">
                      {test.description && test.description !== test.name && (
                        <p className="text-gray-500 italic">{test.description}</p>
                      )}
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Headers</p>
                        <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">{JSON.stringify(test.headers, null, 2)}</pre>
                      </div>
                      {test.body && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Body</p>
                          <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">{JSON.stringify(test.body, null, 2)}</pre>
                        </div>
                      )}
                      {test.tags?.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {test.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
