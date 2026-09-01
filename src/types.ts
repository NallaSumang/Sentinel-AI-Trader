export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  timestamp: string;
  symbol?: string;
  estimated_price?: number;
}

export type SignalType = "BUY" | "SELL" | "HOLD";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AiDecision {
  symbol: string;
  signal: SignalType;
  confidence: number;
  risk: RiskLevel;
  reason: string;
  isLiveAi?: boolean;
  optionType?: "CALL" | "PUT" | "N/A" | string;
  strikePrice?: number;
}

export interface RiskCheckResult {
  approved: boolean;
  symbol: string;
  signal: SignalType;
  requestedQty: number;
  approvedQty: number;
  passedChecks: string[];
  failedChecks: string[];
  rejectionReason: string | null;
}

export interface PaperAccount {
  portfolio_value: number;
  cash: number;
  buying_power: number;
  equity: number;
  status: string;
  currency: string;
  session_trades_count: number;
  isLivePaper?: boolean;
  account_number?: string;
}

export interface Position {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_plpc: number;
}

export interface OrderRecord {
  id: string;
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  status: "filled" | "pending" | "rejected";
  submitted_at: string;
  filled_at?: string;
  filled_avg_price?: number;
  reason?: string;
  isLiveAlpaca?: boolean;
}

export interface RiskSettings {
  minConfidence: number;
  maxPositionPct: number;
  maxOrderQty: number;
  maxTradesPerSession: number;
}

export interface ConfigStatus {
  hasGroqKey: boolean;
  hasAlpacaKey: boolean;
  isPaperTrading: boolean;
  alpacaBaseUrl: string;
  aiModel: string;
  aiProvider: string;
  demoMode: boolean;
  missingCredentialsMessage?: string | null;
}

