export interface DepositListInterface {
  id: number;
  customer_idx: number;
  coin_symbol: string;
  from_address: string;
  to_address: string;
  amount: string;
  txid: string;
  output_index: number;
  data: string | null;
  block_height: number;
  dw_date: string;
  dw_modified_date: string;
  tx_hash: string;
  confirmations: number;
}
