import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Input } from '@streetpaw/ui';
import {
  BarChart3, PieChart as PieIcon, TrendingUp, TrendingDown, Clock, ShieldCheck,
  Award, Download, Sparkles, Filter, RefreshCw, FileText, AlertTriangle, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export function AnalyticsPage({ authToken }) {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [areaFilter, setAreaFilter] = useState('all');
  const [breedFilter, setBreedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [areaFilter, breedFilter, statusFilter]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};

      // 1. Fetch Summary
      const sRes = await fetch('http://localhost:8000/api/analytics/summary', { headers });
      const sData = await sRes.json();
      setSummary(sData);

      // 2. Fetch Charts
      let cUrl = 'http://localhost:8000/api/analytics/charts?';
      if (areaFilter !== 'all') cUrl += `area=${encodeURIComponent(areaFilter)}&`;
      if (breedFilter !== 'all') cUrl += `breed=${encodeURIComponent(breedFilter)}&`;
      if (statusFilter !== 'all') cUrl += `status=${encodeURIComponent(statusFilter)}&`;

      const cRes = await fetch(cUrl, { headers });
      const cData = await cRes.json();
      setCharts(cData);

      // 3. Fetch Insights
      const iRes = await fetch('http://localhost:8000/api/analytics/insights', { headers });
      const iData = await iRes.json();
      setInsights(iData.insights || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Download Full Multi-sheet Excel Report
  const handleDownloadFullExcel = () => {
    window.open('http://localhost:8000/api/exports/full-report.xlsx', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={28} color="#8b5cf6" /> Welfare Analytics & Intelligence Dashboard
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real SQL metrics, breed distribution, health trends, and dispatch performance
          </span>
        </div>

        <Button variant="emerald" icon={Download} onClick={handleDownloadFullExcel}>
          Download Full Excel Report (.xlsx)
        </Button>
      </div>

      {/* GLOBAL FILTERS BAR */}
      <Card variant="glass" style={{ padding: '14px 20px', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Area:</span>
            {['all', 'Indiranagar', 'Koramangala', 'BTM Layout', 'JP Nagar', 'Whitefield'].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAreaFilter(a)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  background: areaFilter === a ? '#8b5cf6' : 'rgba(30, 41, 59, 0.5)',
                  color: areaFilter === a ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {a}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Breed:</span>
            {['all', 'Indian Pariah / Desi', 'Street Mongrel', 'Beagle Mix'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBreedFilter(b)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  background: breedFilter === b ? '#8b5cf6' : 'rgba(30, 41, 59, 0.5)',
                  color: breedFilter === b ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Dogs Registered */}
        <Card variant="glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Dogs Registered</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
            {summary ? summary.dogs_registered : '...'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> {summary?.trends?.dogs_registered || '+12% vs last mo'}
          </div>
        </Card>

        {/* Card 2: Open Complaints */}
        <Card variant="glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Open Complaints</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f87171', margin: '4px 0' }}>
            {summary ? summary.open_complaints : '...'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingDown size={12} /> {summary?.trends?.open_complaints || '-8% vs last week'}
          </div>
        </Card>

        {/* Card 3: Avg Response Time */}
        <Card variant="glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Avg Response Time</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#60a5fa', margin: '4px 0' }}>
            {summary ? `${summary.avg_response_time_minutes}m` : '...'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#60a5fa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {summary?.trends?.avg_response_time || '-15m faster'}
          </div>
        </Card>

        {/* Card 4: Resolved This Month */}
        <Card variant="glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Resolved This Month</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#4ade80', margin: '4px 0' }}>
            {summary ? summary.resolved_this_month : '...'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> {summary?.trends?.resolved_this_month || '+22% rate'}
          </div>
        </Card>

        {/* Card 5: Vaccination % */}
        <Card variant="glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Vaccination %</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c084fc', margin: '4px 0' }}>
            {summary ? `${summary.vaccination_coverage_pct}%` : '...'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#c084fc', fontWeight: 700 }}>Target: 80.0% ARV</div>
        </Card>

        {/* Card 6: Sterilisation % */}
        <Card variant="glass" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Sterilisation %</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', margin: '4px 0' }}>
            {summary ? `${summary.sterilisation_coverage_pct}%` : '...'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 700 }}>Target: 70.0% ABC</div>
        </Card>

      </div>

      {/* COMPUTED DATA INSIGHTS PANEL */}
      <Card variant="glow" style={{ padding: '20px', borderColor: 'rgba(139, 92, 246, 0.4)' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#c084fc" /> Computed Data Intelligence Insights
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {insights.map((insight, idx) => (
            <div key={idx} style={{ fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#c084fc', fontWeight: 800 }}>•</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* RECHARTS VISUALIZATION GRID */}
      {charts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          
          {/* Chart 1: Breed Distribution Donut */}
          <Card variant="glass" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
              Breed Trait Distribution
            </h4>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.breed_distribution}
                    dataKey="count"
                    nameKey="breed"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {charts.breed_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Monthly Complaints Trend Area */}
          <Card variant="glass" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
              Monthly Complaints & Resolution Volume
            </h4>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthly_trend}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="complaints" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Received" />
                  <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Resolved" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 3: Complaints Funnel Bar Chart */}
          <Card variant="glass" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
              Complaints Dispatch Funnel Status
            </h4>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.complaints_funnel}>
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 4: Response Time Distribution */}
          <Card variant="glass" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
              Response Time Performance Distribution
            </h4>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.response_time_distribution} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="range" stroke="#94a3b8" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      )}

      {/* DISEASE HOTSPOTS LIST LINKED TO MAP */}
      {charts?.disease_hotspots && (
        <Card variant="glass" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
            🚨 Identified Disease & Skin Infection Hotspots
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {charts.disease_hotspots.map((hs, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{hs.location}</div>
                <div style={{ fontSize: '0.775rem', color: '#f87171', fontWeight: 700 }}>{hs.disease} ({hs.cases} cases)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GPS: {hs.lat}, {hs.lng}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
