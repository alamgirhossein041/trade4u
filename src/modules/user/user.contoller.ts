import { Body, Controller, Get, Param, Post, Res, UseGuards, HttpException } from '@nestjs/common';
import { UsersService } from './user.service';
import { Request, Response } from 'express';
import {
  ResponseCode,
  ResponseMessage,
  LoggerMessages,
} from '../../utils/enum';
import { SeedService } from '../../modules/seed/seed.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import { User } from './user.entity';
import { LoggerService } from '../../utils/logger/logger.service';
import { EarningLimit } from './commons/user.constants';
import { isPositiveInteger } from '../../utils/methods';

@Controller('api/user')
export class UserContoller {
  constructor(
    private readonly userService: UsersService,
    private readonly seedService: SeedService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext('UserController');
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('business_plan')
  @UseGuards(AuthGuard('jwt'))
  public async getBussniessPlan(@Res() res: Response): Promise<Response> {
    const plans = await this.seedService.getBusinessPlans();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: plans,
      message: ResponseMessage.SUCCESS,
    });
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('plan_by_id/:id')
  public async getPlanById(
    @Param('id') id: number,
    @Res() res: Response,
  ): Promise<any> {
    const isPosInt = isPositiveInteger(id.toString());
    if (!isPosInt) throw new HttpException(`Parameter id ${ResponseMessage.IS_INVALID}`, ResponseCode.BAD_REQUEST);
    const plan = await this.seedService.getPlanById(Number(id));
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: { planId: plan.planId, planName: plan.planName, price: plan.price, levels: plan.levels, earningLimit: plan.price * EarningLimit },
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('affiliates')
  public async getUserAffiliates(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const affiliates = await this.userService.getUserAffiliates(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: affiliates,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('parents')
  public async getUserParents(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const parents = await this.userService.getUserParentsTree(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: parents,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('purchase_plan')
  public async updateUserPlanOnPurchase(
    @CurrentUser() user: User,
    @Body() body: { planId: number },
    @Res() res: Response,
  ): Promise<any> {
    await this.userService.updateUserPlanOnPurchase(user, body.planId);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('license_fee')
  public async getlicenseFee(@Res() res: Response): Promise<Response> {
    const licenseFee = await this.seedService.getlicenseFee();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: licenseFee,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('preformance_fee')
  public async getPreformanceFee(@Res() res: Response): Promise<Response> {
    const preformanceFee = await this.seedService.getpreformanceFee();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: preformanceFee,
      message: ResponseMessage.SUCCESS,
    });
  }
}
