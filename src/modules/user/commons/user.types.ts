export interface AffliatesInterface {
  level: number;
   total_affiliates: number;
   affiliates: Affiliate[]
}

interface Affiliate {
  level: number;
  fullName: string;
  userName: string;
  phoneNumber: string;
  tradingSystem: string;
  plan_name: string;
  createdAt: string;
}

export interface BotResponse {
  chat_id: number;
  text: string;
  parse_mode: string;
}
