import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import { Request, Response } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { SeedService } from '../../modules/seed/seed.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import { User } from './user.entity';
import { CompensationTransaction } from './compensation.transaction';

@Controller('api/user')
export class UserContoller {
  constructor(
    private readonly userService: UsersService,
    private readonly seedService: SeedService,
    private readonly compensationTransaction: CompensationTransaction,
  ) {}

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
  @Post('update_plan')
  public async updateUserPlanOnPurchase(
    @CurrentUser() user: User,
    @Body() body: { planId: number },
    @Res() res: Response,
  ): Promise<any> {
    const userAfterUpdate = await this.userService.updateUserPlanOnPurchase(
      user,
      body.planId,
    );
    await this.compensationTransaction
      .initLicenseBonusTransaction(userAfterUpdate)
      .then(() => {
        return res
          .status(ResponseCode.SUCCESS)
          .send({
            statusCode: ResponseCode.SUCCESS,
            message: ResponseMessage.SUCCESS,
          });
      })
      .catch((err) => {
        return res
          .status(ResponseCode.BAD_REQUEST)
          .send({
            statusCode: ResponseCode.BAD_REQUEST,
            message: ResponseMessage.ERROR_WHILE_DISTRIBUTING_BONUS,
          });
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
