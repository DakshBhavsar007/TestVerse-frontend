import React, { useState } from 'react';
import { Bug } from 'lucide-react';
import { CheckCard } from './UI';

const JSErrorsCard = ({ check }) => {
    const [showAll, setShowAll] = useState(false);
    if (!check) return null;

    const visible = showAll ? check.errors : check.errors?.slice(0, 4);

    return (
        <CheckCard title="JavaScript Errors" icon={Bug} check={check}>
            <div className="stat-row">
                <span className="stat-label">Errors Found</span>
                <span className="stat-value" style={{ color: check.error_count > 0 ? 'var(--fail)' : 'var(--pass)' }}>
                    {check.error_count}
                </span>
            </div>

            {visible?.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {visible.map((err, i) => (
                        <div key={i} style={{
                            padding: '8px 10px', background: 'rgba(255,77,109,0.07)',
                            border: '1px solid rgba(255,77,109,0.15)', borderRadius: '6px',
                            fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--fail)',
                            wordBreak: 'break-all'
                        }}>
                            {err.message?.substring(0, 200)}
                            {err.source && (
                                <div style={{ color: 'var(--text-dim)', marginTop: '2px', fontSize: '0.65rem' }}>
                                    {err.source}{err.line ? `:${err.line}` : ''}
                                </div>
                            )}
                        </div>
                    ))}
                    {check.errors?.length > 4 && (
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setShowAll(!showAll)}
                        >
                            {showAll ? 'Show less' : `Show all ${check.errors.length} errors`}
                        </button>
                    )}
                </div>
            )}
        </CheckCard>
    );
};

export default JSErrorsCard;
