export interface AffliatesInterface {
  affiliates: Affiliate[];
  affiliatesCount: AffiliateCount[];
}

interface Affiliate {
  level: number;
  fullName: string;
  userName: string;
}

interface AffiliateCount {
  level: number;
  total_affiliates: number;
}

export interface BotResponse {
  chat_id: number;
  text: string;
  parse_mode: string;
}
