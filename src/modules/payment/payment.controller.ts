import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
  HttpException,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, Response } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { CurrentUser } from '../../modules/common/decorator/current-user.decorator';
import { User } from '../../modules/user';
import { AuthGuard } from '@nestjs/passport';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Pagination } from '../../utils/paginate';
import { LoggerService } from '../../utils/logger/logger.service';
import { LoggerMessages } from '../../utils/enum';
import { isPositiveInteger } from '../../utils/methods';

@Controller('api/payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly loggerService: LoggerService,
  ) {}

  @Post(`order_plan/:planId`)
  @UseGuards(AuthGuard('jwt'))
  public async orderPlan(
    @CurrentUser() user: User,
    @Res() res: Response,
    @Param('planId') planId: number,
  ) {
    this.loggerService.log(
      `POST payment/order_plan ${LoggerMessages.API_CALLED}`,
    );
    const isPosInt = isPositiveInteger(planId.toString());
    if (!isPosInt)
      throw new HttpException(
        `Parameter planId ${ResponseMessage.IS_INVALID}`,
        ResponseCode.BAD_REQUEST,
      );
    const order = await this.paymentService.orderPlan(user, planId);
    return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
      statusCode: ResponseCode.CREATED_SUCCESSFULLY,
      data: order,
      message: ResponseMessage.CREATED_SUCCESSFULLY,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(`payment_list`)
  public async getPayments(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.loggerService.log(
      `GET payment/payment_list ${LoggerMessages.API_CALLED}`,
    );
    const pagination: IPaginationOptions = await Pagination.paginate(req, res);
    const payment = await this.paymentService.getPayments(user, pagination);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: payment,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('address')
  public async getAccount(
    @Res() res: Response,
    @Query('paymentId') paymentId: string,
  ) {
    this.loggerService.log(`POST payment/address ${LoggerMessages.API_CALLED}`);
    if (!paymentId) {
      throw new HttpException(
        ResponseMessage.INVALID_QUERY_PARAM,
        ResponseCode.BAD_REQUEST,
      );
    }
    await this.paymentService.getAddress(paymentId).then((data) => {
      return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
        statusCode: ResponseCode.CREATED_SUCCESSFULLY,
        data: data,
        message: ResponseMessage.CREATED_SUCCESSFULLY,
      });
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(`preformance_fee_payment`)
  public async createPreformanceFeePayment(
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const payments = await this.paymentService.createPreformanceFeePayment(
      user,
    );
    return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
      statusCode: ResponseCode.CREATED_SUCCESSFULLY,
      data: payments,
      message: ResponseMessage.CREATED_SUCCESSFULLY,
    });
  }
}
