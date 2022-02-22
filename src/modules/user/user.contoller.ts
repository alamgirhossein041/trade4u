import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import { Request, Response } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { SeedService } from '../../modules/seed/seed.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/user')
export class UserContoller {
  constructor(
    private readonly userService: UsersService,
    private readonly seedService: SeedService,
  ) {}

  @Get('business_plan')
  @UseGuards(AuthGuard('jwt'))
  public async getBussniessPlan(@Res() res: Response) {
    const plans = await this.seedService.getBusinessPlans();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: plans,
      message: ResponseMessage.SUCCESS,
    });
  }

  @Get('license_fee')
  @UseGuards(AuthGuard('jwt'))
  public async getlicenseFee(@Res() res: Response) {
    const licenseFee = await this.seedService.getlicenseFee();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: licenseFee,
      message: ResponseMessage.SUCCESS,
    });
  }

  @Get('preformance_fee')
  @UseGuards(AuthGuard('jwt'))
  public async getPreformanceFee(@Res() res: Response) {
    const preformanceFee = await this.seedService.getpreformanceFee();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: preformanceFee,
      message: ResponseMessage.SUCCESS,
    });
  }
}
