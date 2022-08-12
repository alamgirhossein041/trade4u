import { IsNotEmpty } from 'class-validator';
export class MachinePayload {
  @IsNotEmpty()
  machinename: string;

  @IsNotEmpty()
  ip: string;

  @IsNotEmpty()
  url: string;
}
