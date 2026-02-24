import React, { useState } from 'react';
import { Layout } from 'lucide-react';
import { CheckCard, Badge } from './UI';

const PostLoginCard = ({ check }) => {
    const [showActions, setShowActions] = useState(false);
    if (!check) return null;

    return (
        <CheckCard title="Post-Login UI Testing" icon={Layout} check={check}>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {[
                    { label: 'Nav Passed', val: check.nav_links_passed, color: 'var(--pass)' },
                    { label: 'Nav Failed', val: check.nav_links_failed, color: check.nav_links_failed > 0 ? 'var(--fail)' : 'var(--text-muted)' },
                    { label: 'Btn Passed', val: check.buttons_passed, color: 'var(--pass)' },
                    { label: 'Btn Failed', val: check.buttons_failed, color: check.buttons_failed > 0 ? 'var(--fail)' : 'var(--text-muted)' },
                    { label: 'Forms', val: check.forms_found, color: 'var(--accent)' },
                ].map((s, i) => (
                    <div key={i} className="card-glass" style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Landing page */}
            {check.landing_url && (
                <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '12px 16px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🏠</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{check.landing_title || 'No title'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {check.landing_url}
                        </div>
                    </div>
                    <Badge status={check.status?.value}>{check.status?.value}</Badge>
                </div>
            )}

            {/* Actions table — collapsed by default */}
            {check.actions?.length > 0 && (
                <>
                    <button
                        className="btn btn-outline btn-sm"
                        style={{ marginBottom: '10px' }}
                        onClick={() => setShowActions(!showActions)}
                    >
                        {showActions ? 'Hide' : 'Show'} {check.actions.length} UI actions
                    </button>

                    {showActions && (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Element</th>
                                        <th>Status</th>
                                        <th>Speed</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {check.actions.map((action, i) => (
                                        <tr key={i}>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                                                    {action.action_type === 'nav_link' ? '🔗 Nav'
                                                        : action.action_type === 'button' ? '🖱️ Btn'
                                                            : action.action_type === 'form' ? '📋 Form'
                                                                : action.action_type}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {action.label?.substring(0, 40)}
                                            </td>
                                            <td>
                                                <span className={action.status?.value === 'pass' ? 'status-ok' : action.status?.value === 'skip' ? 'status-skip' : 'status-err'}>
                                                    {action.status?.value?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {action.response_time_ms ? `${action.response_time_ms} ms` : '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {action.error
                                                    ? <span style={{ color: 'var(--fail)' }}>{action.error.substring(0, 80)}</span>
                                                    : action.screenshot_note || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Post-login JS errors */}
            {check.js_errors_post_login?.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        JS Errors During UI Testing
                    </div>
                    {check.js_errors_post_login.slice(0, 5).map((err, i) => (
                        <div key={i} style={{ marginBottom: '6px', padding: '7px 10px', background: 'rgba(255,77,109,0.07)', border: '1px solid rgba(255,77,109,0.1)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--fail)', wordBreak: 'break-all' }}>
                            {err.message?.substring(0, 120)}
                        </div>
                    ))}
                </div>
            )}
        </CheckCard>
    );
};

export default PostLoginCard;
