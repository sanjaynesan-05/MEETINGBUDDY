import React from 'react';
import { RefreshCw } from 'lucide-react';
import DashboardHeader from '../../components/dashboard/DashboardHeader'; // Reuse the header if appropriate, or build a simplified title

export default function AnalyticsLayout({ 
  children, 
  onRefresh, 
  isRefreshing, 
  dateFilter, 
  setDateFilter 
}) {
  return (
    <div className="page-content">
      <div className="analytics-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>Organization Analytics</h1>
        
        <div className="analytics-actions">
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
            style={{ minWidth: '150px' }}
          >
            <option value="all">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          
          <button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="analytics-layout">
        {children}
      </div>
    </div>
  );
}
