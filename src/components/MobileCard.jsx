import React from 'react';
import { Smartphone } from 'lucide-react';
import { CheckCard } from './UI';

const MobileCard = ({ check }) => {
    if (!check) return null;
    return (
        <CheckCard title="Mobile Responsiveness" icon={Smartphone} check={check}>
            <div className="stat-row">
                <span className="stat-label">Viewport Meta</span>
                <span className="stat-value" style={{ color: check.has_viewport_meta ? 'var(--pass)' : 'var(--fail)' }}>
                    {check.has_viewport_meta ? '✓ Present' : '✗ Missing'}
                </span>
            </div>
            <div className="stat-row">
                <span className="stat-label">Responsive CSS</span>
                <span className="stat-value" style={{ color: check.has_responsive_css ? 'var(--pass)' : 'var(--warn)' }}>
                    {check.has_responsive_css ? '✓ Detected' : '? Not detected'}
                </span>
            </div>
            {check.mobile_score != null && (
                <div className="stat-row">
                    <span className="stat-label">Mobile Score</span>
                    <span className="stat-value" style={{
                        color: check.mobile_score >= 80 ? 'var(--pass)'
                            : check.mobile_score >= 50 ? 'var(--warn)' : 'var(--fail)'
                    }}>
                        {check.mobile_score}/100
                    </span>
                </div>
            )}
            {check.issues?.length > 0 && (
                <ul style={{ margin: '10px 0 0 16px', color: 'var(--warn)', fontSize: '0.8rem' }}>
                    {check.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
            )}
        </CheckCard>
    );
};

export default MobileCard;
