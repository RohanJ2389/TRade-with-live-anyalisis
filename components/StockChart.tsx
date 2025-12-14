import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { StockChartData } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StockChartProps {
  data: StockChartData;
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const isUp = data.trend === 'up';
  const color = isUp ? '#10b981' : data.trend === 'down' ? '#ef4444' : '#64748b';

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 mt-4 w-full max-w-2xl animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {data.symbol} 
            <span className="text-xs font-normal text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
              {data.period}
            </span>
          </h3>
          <p className="text-sm text-slate-400">Price History</p>
        </div>
        <div className={`flex items-center gap-1 font-semibold ${isUp ? 'text-emerald-400' : data.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
          {isUp ? <TrendingUp size={20} /> : data.trend === 'down' ? <TrendingDown size={20} /> : <Minus size={20} />}
          <span>{data.data[data.data.length - 1].price.toFixed(2)}</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.data}
            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`color${data.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
              width={40}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#color${data.symbol})`}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;