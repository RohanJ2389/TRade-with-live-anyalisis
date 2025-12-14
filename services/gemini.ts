import { 
  GoogleGenAI, 
  Chat, 
  GenerateContentResponse,
  FunctionDeclaration,
  Type,
  Schema
} from "@google/genai";
import { StockChartData, ChartDataPoint, TimePeriod } from "../types";

// --- Mock Data Generator for Charts ---
// In a real app, this would call a financial API.
const generateMockChartData = (symbol: string, period: string): StockChartData => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  let points = 30;
  let startPrice = Math.random() * 100 + 50; // Random start price 50-150
  
  if (period === '1D') points = 24;
  if (period === '1W') points = 7;
  if (period === '1M') points = 30;
  if (period === '1Y') points = 12;

  let currentPrice = startPrice;
  const volatility = 0.02;

  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    if (period === '1D') date.setHours(date.getHours() - i);
    else if (period === '1Y') date.setMonth(date.getMonth() - i);
    else date.setDate(date.getDate() - i);

    const change = currentPrice * (Math.random() - 0.5) * volatility;
    currentPrice += change;
    
    data.push({
      date: period === '1D' ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : date.toLocaleDateString(),
      price: parseFloat(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 10000) + 1000
    });
  }

  const start = data[0].price;
  const end = data[data.length - 1].price;

  return {
    symbol: symbol.toUpperCase(),
    data,
    period,
    trend: end > start ? 'up' : end < start ? 'down' : 'neutral'
  };
};

// --- Tool Definitions ---

const getStockChartFunction: FunctionDeclaration = {
  name: 'getStockChart',
  description: 'Generates a visual stock price chart for a given symbol and time period. Use this when the user asks to "see", "show", "plot" or "visualize" a stock or crypto chart.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: 'The stock or crypto ticker symbol (e.g., AAPL, BTC, TSLA).',
      },
      period: {
        type: Type.STRING,
        description: 'The time period for the chart. Defaults to 1M if not specified.',
        enum: ['1D', '1W', '1M', '1Y']
      }
    },
    required: ['symbol'],
  } as Schema,
};

const getStockPriceFunction: FunctionDeclaration = {
  name: 'getStockPrice',
  description: 'Retrieves the current stock price and basic market data for a symbol.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: 'The stock ticker symbol.',
      }
    },
    required: ['symbol'],
  } as Schema,
};

// --- Service Class ---

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private apiKey: string;

  constructor() {
    // Ensuring API key is present is handled by the caller or environmental setup usually,
    // but here we grab it from env.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables");
    }
    this.apiKey = apiKey || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  public initializeChat() {
    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are TradeBot, an advanced financial assistant. 
        Your goal is to help users understand the markets with data-driven insights.
        
        Capabilities:
        1. Use 'getStockPrice' to fetch current stock prices when asked.
        2. Use 'getStockChart' tool ONLY when the user explicitly asks for a chart, visualization, or performance graph.
        
        Style:
        - Be professional, concise, and helpful.
        - Use markdown for formatting (tables for data, bold for emphasis).
        `,
        tools: [
          // googleSearch removed to avoid conflict with functionDeclarations
          { functionDeclarations: [getStockChartFunction, getStockPriceFunction] }
        ]
      }
    });
  }

  public async sendMessage(
    message: string, 
    onChunk: (text: string) => void,
    onChart: (chart: StockChartData) => void
  ): Promise<{ text: string, sources: any[] }> {
    if (!this.chatSession) {
      this.initializeChat();
    }

    try {
      let fullTextResponse = '';
      const sources: any[] = [];
      
      const streamResult = await this.chatSession!.sendMessageStream({ message });
      
      for await (const chunk of streamResult) {
        // 1. Handle Text
        const text = chunk.text;
        if (text) {
            fullTextResponse += text;
            onChunk(text);
        }

        // 2. Handle Grounding (Search Results) - kept for compatibility if tools change
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
             groundingChunks.forEach((c: any) => {
                 if (c.web?.uri && c.web?.title) {
                     sources.push({ title: c.web.title, uri: c.web.uri });
                 }
             });
        }

        // 3. Handle Function Calls
        const functionCalls = chunk.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const functionResponses = [];
            
            for (const call of functionCalls) {
                const args = call.args as any;
                const symbol = args.symbol || 'UNKNOWN';

                if (call.name === 'getStockChart') {
                    const period = args.period || '1M';
                    const chartData = generateMockChartData(symbol, period);
                    onChart(chartData);

                    functionResponses.push({
                        id: call.id,
                        name: call.name,
                        response: { 
                            result: `Chart generated for ${symbol}. Current price is ${chartData.data[chartData.data.length-1].price}.` 
                        }
                    });
                } else if (call.name === 'getStockPrice') {
                    // Mock price data
                    const price = (Math.random() * 1000 + 10).toFixed(2);
                    functionResponses.push({
                        id: call.id,
                        name: call.name,
                        response: {
                             result: `The current price of ${symbol} is $${price}.`
                        }
                    });
                }
            }

            if (functionResponses.length > 0) {
                 const responseParts = functionResponses.map(fr => ({
                     functionResponse: fr
                 }));
                 
                 // FIX: Pass parts wrapped in an object with 'message' property
                 const toolStream = await this.chatSession!.sendMessageStream({
                     message: responseParts
                 });
                 
                 for await (const toolChunk of toolStream) {
                      const toolText = toolChunk.text;
                      if (toolText) {
                          fullTextResponse += toolText;
                          onChunk(toolText);
                      }
                 }
            }
        }
      }

      return { text: fullTextResponse, sources };

    } catch (error) {
      console.error("Gemini interaction error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();