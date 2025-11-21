
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend 
} from 'recharts';
import { AlertTriangle, CheckCircle, Activity, Package, Download, RefreshCw, Filter } from 'lucide-react';
import { downloadCSV } from '../services/exportService';
import { getDashboardMetrics } from '../services/analyticsService';
import { DashboardMetrics, DateRange } from '../types';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [region, setRegion] = useState('ALL');

  useEffect(() => {
    loadMetrics();
  }, [dateRange, region]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await getDashboardMetrics(dateRange, region);
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load metrics", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!metrics) return;
    
    // Flatten volume data for CSV
    const headers = "Date,Valid Prescriptions,Flagged Incidents,OCR Accuracy,Automation Rate\n";
    const rows = metrics.volumeData.map((v, i) => {
      const p = metrics.performanceData[i];
      return `${v.date},${v.valid},${v.flagged},${p?.ocrAccuracy.toFixed(2)}%,${p?.automationRate.toFixed(2)}%`;
    }).join("\n");

    downloadCSV(headers + rows, `analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Analytics & Insights</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Operational • Sepolia Testnet Live
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {/* Date Filter */}
           <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center">
              {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    dateRange === r ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
           </div>

           {/* Region Filter */}
           <div className="relative">
             <select 
                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
             >
                <option value="ALL">All Regions</option>
                <option value="US-EAST">US East Coast</option>
                <option value="EU-CENTRAL">EU Central</option>
                <option value="APAC">Asia Pacific</option>
             </select>
             <Filter className="w-3 h-3 text-gray-400 absolute right-3 top-3 pointer-events-none" />
           </div>
           
           <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors"
           >
              <Download className="w-4 h-4" />
              Export
           </button>
           
           <button 
              onClick={loadMetrics}
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              title="Refresh Data"
           >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {loading || !metrics ? (
         <div className="h-96 flex items-center justify-center">
             <RefreshCw className="w-10 h-10 text-gray-300 animate-spin" />
         </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+12% vs last {dateRange}</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{metrics.totalPrescriptions.toLocaleString()}</h3>
              <p className="text-sm text-gray-500">Total Processed</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+0.8%</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{metrics.approvalRate}%</h3>
              <p className="text-sm text-gray-500">Auto-Approval Rate</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-red-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${metrics.counterfeitIncidents > 0 ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
                    {metrics.counterfeitIncidents > 0 ? 'Action Req' : 'Clear'}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{metrics.counterfeitIncidents}</h3>
              <p className="text-sm text-gray-500">Counterfeit Attempts</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">Restock</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{metrics.lowStockItems}</h3>
              <p className="text-sm text-gray-500">Batches Low Stock</p>
            </div>
          </div>

          {/* Charts Section 1: Volume & Threats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Prescription Volume & Integrity</h3>
              <p className="text-xs text-gray-500 mb-6">Valid vs Flagged transactions over {dateRange}</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.volumeData}>
                    <defs>
                      <linearGradient id="colorValid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Valid Batches" dataKey="valid" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorValid)" />
                    <Area type="monotone" name="Security Flags" dataKey="flagged" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFlagged)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Threat Origins</h3>
              <p className="text-xs text-gray-500 mb-6">Top sources of flagged batches</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={metrics.threatOrigins} margin={{left: 10}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="origin" width={100} tick={{fill: '#4b5563', fontSize: 11}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                    <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} name="Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Section 2: Model Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">AI Model Performance</h3>
                    <p className="text-xs text-gray-500">OCR Accuracy & Automation Rate trends</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div> OCR Confidence</span>
                    <span className="flex items-center text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div> Auto-Approval</span>
                </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} dy={10} />
                  <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="ocrAccuracy" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="automationRate" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
