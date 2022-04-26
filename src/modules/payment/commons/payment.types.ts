import moment from 'moment';

export interface PDF {
  userName: string;
  from: string;
  to: string;
  issueDate: string;
  profit: number;
  charges: number;
  preformanceFee: number;
  trades: [];
}
