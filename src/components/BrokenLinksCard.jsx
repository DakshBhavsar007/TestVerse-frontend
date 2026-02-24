import React, { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { CheckCard } from './UI';

const BrokenLinksCard = ({ check }) => {
    const [showAll, setShowAll] = useState(false);
    if (!check) return null;

    const visible = showAll
        ? check.broken_links
        : check.broken_links?.slice(0, 5);

    return (
        <CheckCard title="Broken Links" icon={LinkIcon} check={check}>
            <div className="stat-row">
                <span className="stat-label">Total Links</span>
                <span className="stat-value">{check.total_links}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">Broken</span>
                <span className="stat-value" style={{ color: check.broken_count > 0 ? 'var(--fail)' : 'var(--pass)' }}>
                    {check.broken_count}
                </span>
            </div>

            {visible?.length > 0 && (
                <div className="table-wrap" style={{ marginTop: '12px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>URL</th>
                                <th>Code</th>
                                <th>Found On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((link, i) => (
                                <tr key={i}>
                                    <td style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        {link.url}
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--fail)', fontWeight: 700 }}>
                                            {link.status_code || 'ERR'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                        {link.found_on?.replace(/^https?:\/\/[^/]+/, '') || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {check.broken_links?.length > 5 && (
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: '8px' }}
                            onClick={() => setShowAll(!showAll)}
                        >
                            {showAll ? 'Show less' : `Show all ${check.broken_links.length}`}
                        </button>
                    )}
                </div>
            )}
        </CheckCard>
    );
};

export default BrokenLinksCard;
