import React from 'react';
import { Zap } from 'lucide-react';
import { CheckCard } from './UI';

const SpeedCard = ({ check }) => {
    if (!check) return null;
    return (
        <CheckCard title="Page Speed" icon={Zap} check={check}>
            <div className="stat-row">
                <span className="stat-label">Load Time</span>
                <span className="stat-value" style={{
                    color: check.load_time_ms < 1500 ? 'var(--pass)'
                        : check.load_time_ms < 3000 ? 'var(--warn)' : 'var(--fail)'
                }}>
                    {check.load_time_ms != null ? `${check.load_time_ms} ms` : '—'}
                </span>
            </div>
            <div className="stat-row">
                <span className="stat-label">TTFB</span>
                <span className="stat-value">
                    {check.ttfb_ms != null ? `${check.ttfb_ms} ms` : '—'}
                </span>
            </div>
            <div className="stat-row">
                <span className="stat-label">Page Size</span>
                <span className="stat-value">
                    {check.page_size_kb != null ? `${check.page_size_kb} KB` : '—'}
                </span>
            </div>
        </CheckCard>
    );
};

export default SpeedCard;
