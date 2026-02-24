import React from 'react';
import { Shield } from 'lucide-react';
import { CheckCard } from './UI';

const SSLCard = ({ check }) => {
    if (!check) return null;
    const daysLeft = check.days_until_expiry;
    const daysColor = daysLeft == null ? 'var(--text-muted)'
        : daysLeft > 60 ? 'var(--pass)'
        : daysLeft > 14 ? 'var(--warn)' : 'var(--fail)';
    return (
        <CheckCard title="SSL Certificate" icon={Shield} check={check}>
            <div className="stat-row">
                <span className="stat-label">Valid</span>
                <span className="stat-value" style={{ color: check.valid ? 'var(--pass)' : 'var(--fail)' }}>
                    {check.valid ? '✓ Yes' : '✗ No'}
                </span>
            </div>
            {check.expires_on && (
                <div className="stat-row">
                    <span className="stat-label">Expires</span>
                    <span className="stat-value">{check.expires_on}</span>
                </div>
            )}
            {daysLeft != null && (
                <div className="stat-row">
                    <span className="stat-label">Days Left</span>
                    <span className="stat-value" style={{ color: daysColor }}>{daysLeft}d</span>
                </div>
            )}
            {check.issuer && (
                <div className="stat-row">
                    <span className="stat-label">Issuer</span>
                    <span className="stat-value" style={{ fontSize: '0.78rem' }}>
                        {check.issuer.substring(0, 40)}
                    </span>
                </div>
            )}
        </CheckCard>
    );
};

export default SSLCard;
