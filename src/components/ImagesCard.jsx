import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { CheckCard } from './UI';

const ImagesCard = ({ check }) => {
    const [showAll, setShowAll] = useState(false);
    if (!check) return null;

    const visible = showAll
        ? check.missing_images
        : check.missing_images?.slice(0, 5);

    return (
        <CheckCard title="Missing Images" icon={ImageIcon} check={check}>
            <div className="stat-row">
                <span className="stat-label">Total Images</span>
                <span className="stat-value">{check.total_images}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">Missing</span>
                <span className="stat-value" style={{ color: check.missing_count > 0 ? 'var(--warn)' : 'var(--pass)' }}>
                    {check.missing_count}
                </span>
            </div>

            {visible?.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    {visible.map((img, i) => (
                        <div key={i} style={{
                            padding: '6px 10px', marginBottom: '4px',
                            background: 'rgba(245,158,11,0.07)',
                            border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px',
                            fontFamily: 'monospace', fontSize: '0.72rem',
                            color: 'var(--warn)', wordBreak: 'break-all'
                        }}>
                            <div>{img.src?.substring(0, 100)}</div>
                            {img.status_code && (
                                <span style={{ color: 'var(--fail)', fontWeight: 700 }}>
                                    HTTP {img.status_code}
                                </span>
                            )}
                        </div>
                    ))}
                    {check.missing_images?.length > 5 && (
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: '6px' }}
                            onClick={() => setShowAll(!showAll)}
                        >
                            {showAll ? 'Show less' : `Show all ${check.missing_images.length}`}
                        </button>
                    )}
                </div>
            )}
        </CheckCard>
    );
};

export default ImagesCard;
