export enum PaymentStatus {
  PENDING = `pending`,
  COMPLETED = `completed`,
  DEFICIT = `deficit`,
  CANCELLED = `cancelled`,
}

export enum BonusType {
  LISENCE = `license`,
  PERFORMANCE = `performance`,
}

export enum PaymentType {
  ACTIVATION = 'Activation',
  TX_PREFORMANCE_USDT = 'Tx.PreformaceFee USDT',
  TX_PREFORMANCE_BTC = 'Tx.PreformaceFee BTC',
}

export enum CryptoAsset {
  USDT = 'USDT',
  BTC = 'BTC',
  ETH = 'ETH',
  KLAY = 'KLAY',
}
