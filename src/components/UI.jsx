import React from 'react';
import { ShieldCheck, Zap, Globe, Link, Image, Smartphone, Bug, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const Badge = ({ status, children }) => {
    const classes = {
        pass: 'badge-pass',
        fail: 'badge-fail',
        warning: 'badge-warning',
        skip: 'badge-skip',
        pending: 'badge-pending',
        running: 'badge-running'
    };
    return (
        <span className={`badge ${classes[status] || 'badge-skip'}`}>
            {status === 'pass' && <CheckCircle2 size={12} />}
            {status === 'fail' && <XCircle size={12} />}
            {status === 'warning' && <AlertTriangle size={12} />}
            {status === 'pending' && <Clock size={12} />}
            {children || status}
        </span>
    );
};

export const ScoreRing = ({ score }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s) => {
        if (s >= 80) return '#10b981';
        if (s >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="score-ring">
            <svg width="160" height="160">
                <circle className="score-ring-track" cx="80" cy="80" r={radius} />
                <circle
                    className="score-ring-fill"
                    cx="80" cy="80" r={radius}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        stroke: getColor(score)
                    }}
                />
            </svg>
            <div className="score-ring-text">
                <span className="score-num" style={{ color: getColor(score) }}>{score}</span>
                <span className="score-label">Health Score</span>
            </div>
        </div>
    );
};

export const CheckCard = ({ title, icon: Icon, check, children }) => {
    if (!check) return null;
    return (
        <div className="check-card fade-in">
            <div className="check-header">
                <div className="check-title">
                    <Icon size={18} className="accent" />
                    <span>{title}</span>
                </div>
                <Badge status={check.status} />
            </div>
            <div className="check-stats">
                {children}
            </div>
            {check.message && <div className="check-message">{check.message}</div>}
        </div>
    );
};

export const LoadingSpinner = ({ size = 'md' }) => (
    <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`}></div>
);

export const PageTitle = ({ title, subtitle }) => (
    <div className="hero" style={{ padding: '20px 0 40px' }}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
    </div>
);
