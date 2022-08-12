import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  LoggerMessages,
  ResponseCode,
  ResponseMessage,
} from '../../utils/enum';
import { LoggerService } from '../../utils/logger/logger.service';
import { MachinePayload } from './machine.payload';
import { MachineService } from './machine.service';

@Controller('api/machine')
export class MachineController {
  constructor(
    private readonly machineService: MachineService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext('MachineController');
  }

  @Post('create')
  async create(@Body() payload: MachinePayload): Promise<any> {
    this.loggerService.log(`POST machine/create ${LoggerMessages.API_CALLED}`);
    return await this.machineService.createMachine(payload);
  }

  @Get('getAll')
  async getAll(@Res() res: Response): Promise<any> {
    this.loggerService.log(`GET machine/getAll ${LoggerMessages.API_CALLED}`);
    const machines = await this.machineService.getAllMachines();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: machines,
      message: ResponseMessage.SUCCESS,
    });
  }
}
