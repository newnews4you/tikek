import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  BarChart3,
  Trash2,
  RefreshCw,
  Database,
  Euro,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  calculateUsageStatistics,
  getTokenUsageHistory,
  getTokenUsageForChart,
  clearTokenUsageHistory,
  UsageStatistics,
  TokenUsageEntry
} from '../../services/tokenTracking';

export const TokenStatistics: React.FC = () => {
  const [stats, setStats] = useState<UsageStatistics | null>(null);
  const [history, setHistory] = useState<TokenUsageEntry[]>([]);
  const [chartData, setChartData] = useState<{ date: string; tokens: number; cost: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [chartDays, setChartDays] = useState(7);

  const loadData = () => {
    setIsLoading(true);
    const usageStats = calculateUsageStatistics();
    const usageHistory = getTokenUsageHistory();
    const chart = getTokenUsageForChart(chartDays);

    setStats(usageStats);
    setHistory(usageHistory.slice(-20).reverse()); // Show last 20 entries
    setChartData(chart);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [chartDays]);

  const handleClearHistory = () => {
    if (window.confirm('Ar tikrai norite ištrinti visą naudojimo istoriją?')) {
      clearTokenUsageHistory();
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-amber-600" size={24} />
        <span className="ml-2 text-gray-600">Kraunama statistika...</span>
      </div>
    );
  }

  if (!stats || stats.totalQueries === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
        <Activity size={48} className="mx-auto mb-4 text-stone-300" />
        <h3 className="text-lg font-semibold text-stone-700 mb-2">Nėra duomenų</h3>
        <p className="text-stone-500 text-sm">
          Tokenų naudojimo statistika pasirodys po pirmųjų užklausų į Gemini API.
        </p>
      </div>
    );
  }

  // Calculate max values for chart scaling
  const maxTokens = Math.max(...chartData.map(d => d.tokens), 1);
  const maxCost = Math.max(...chartData.map(d => d.cost), 0.01);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Euro size={20} className="opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Viso</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalCostEUR.toFixed(4)}€</p>
          <p className="text-sm opacity-80 mt-1">Bendra sąnauda</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-70">{stats.queriesPerEuro} užklausų už 1€</p>
          </div>
        </div>

        {/* Total Queries */}
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Hash size={20} className="text-amber-600" />
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Užklausos</span>
          </div>
          <p className="text-3xl font-bold text-stone-800">{stats.totalQueries}</p>
          <p className="text-sm text-stone-500 mt-1">Iš viso užklausų</p>
          <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between text-xs">
            <span className="text-stone-400">Vidutiniškai:</span>
            <span className="text-stone-600 font-medium">{stats.averageCostPerQuery.toFixed(5)}€</span>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Database size={20} className="text-blue-600" />
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Tokenai</span>
          </div>
          <p className="text-3xl font-bold text-stone-800">{stats.totalTokens.toLocaleString()}</p>
          <p className="text-sm text-stone-500 mt-1">Iš viso tokenų</p>
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Įvestis:</span>
              <span className="text-stone-600">{stats.totalInputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Išvestis:</span>
              <span className="text-stone-600">{stats.totalOutputTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Time Period Stats */}
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Clock size={20} className="text-purple-600" />
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Laikotarpiai</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">24 val.</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-800">{stats.last24Hours.queries}</p>
                <p className="text-xs text-stone-400">{stats.last24Hours.costEUR.toFixed(3)}€</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">7 d.</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-800">{stats.last7Days.queries}</p>
                <p className="text-xs text-stone-400">{stats.last7Days.costEUR.toFixed(3)}€</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">30 d.</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-800">{stats.last30Days.queries}</p>
                <p className="text-xs text-stone-400">{stats.last30Days.costEUR.toFixed(3)}€</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-amber-600" />
            Naudojimo grafikas
          </h3>
          <div className="flex gap-2">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setChartDays(days)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${chartDays === days
                    ? 'bg-amber-100 text-amber-700 font-medium'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
              >
                {days} d.
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-48 flex items-end gap-2">
          {chartData.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-16 bg-stone-800 text-white text-xs p-2 rounded-lg pointer-events-none z-10">
                <p className="font-medium">{day.date}</p>
                <p>Tokenai: {day.tokens.toLocaleString()}</p>
                <p>Sąnaudos: {day.cost.toFixed(4)}€</p>
              </div>

              {/* Bar */}
              <div
                className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all duration-300 hover:from-amber-600 hover:to-amber-500"
                style={{
                  height: `${(day.tokens / maxTokens) * 100}%`,
                  minHeight: day.tokens > 0 ? '4px' : '0'
                }}
              />

              {/* Date label */}
              <span className="text-[10px] text-stone-400">{day.date}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-t from-amber-500 to-amber-400 rounded" />
            <span className="text-xs text-stone-600">Tokenų kiekis</span>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Activity size={20} className="text-amber-600" />
            Paskutinės užklausos ({history.length})
          </h3>
          {showHistory ? <ChevronUp size={20} className="text-stone-400" /> : <ChevronDown size={20} className="text-stone-400" />}
        </button>

        {showHistory && (
          <div className="border-t border-stone-100">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Laikas</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Modelis</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Užklausa</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Tokenai</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Kaina</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {history.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="px-4 py-2 text-xs text-stone-500">
                        {new Date(entry.timestamp).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-500 font-mono">
                        {entry.model.replace('gemini-', '').replace('text-', '')}
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-700 max-w-xs truncate">
                        {entry.query}
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-600 text-right">
                        {entry.totalTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-600 text-right">
                        {entry.costEUR.toFixed(5)}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm"
        >
          <RefreshCw size={16} />
          Atnaujinti
        </button>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
        >
          <Trash2 size={16} />
          Išvalyti istoriją
        </button>
      </div>
    </div>
  );
};

export default TokenStatistics;
