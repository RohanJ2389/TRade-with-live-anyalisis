export interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
}

export interface StockChartData {
  symbol: string;
  data: ChartDataPoint[];
  period: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
  chartData?: StockChartData;
  sources?: GroundingSource[];
}

export enum TimePeriod {
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y'
}