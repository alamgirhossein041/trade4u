import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
  HttpException,
  Query,
  Injectable,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, response, Response } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { CurrentUser } from '../../modules/common/decorator/current-user.decorator';
import { User } from '../../modules/user';
import { AuthGuard } from '@nestjs/passport';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Pagination } from '../../utils/paginate';
import { DepositWebHook } from './commons/payment.dtos';
import { LoggerService } from '../../utils/logger/logger.service';
import { LoggerMessages } from '../../utils/enum';

@Controller('api/payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly loggerService: LoggerService,
  ) { }

  @Post(`order_plan/:planId`)
  @UseGuards(AuthGuard('jwt'))
  public async orderPlan(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
    @Param() params,
  ) {
    const order = await this.paymentService.orderPlan(user, params.planId);
    return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
      statusCode: ResponseCode.CREATED_SUCCESSFULLY,
      data: order,
      message: ResponseMessage.CREATED_SUCCESSFULLY,
    });
  }

  @Get(`payment_list`)
  @UseGuards(AuthGuard('jwt'))
  public async getPayments(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
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
  public async getAccount(@Res() res: Response, @Query('paymentId') paymentId: string) {
    if (!paymentId) {
      throw new HttpException(ResponseMessage.INVALID_QUERY_PARAM, ResponseCode.BAD_REQUEST)
    }
    await this.paymentService.getAddress(paymentId)
      .then((data) => {
        return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
          statusCode: ResponseCode.CREATED_SUCCESSFULLY,
          data: data,
          message: ResponseMessage.CREATED_SUCCESSFULLY,
        });
      });
  }

  @Post(`make_payment`)
  public async makePayment() { }

  @Post('deposit_webhook')
  public async initDepositTransaction(
    @Body() body: DepositWebHook,
    @Res() res: Response,
  ): Promise<void> {
    if (body.toAddress === process.env.OCTET_REPRESENTATIVE_ADDRESS) return;
    this.loggerService.log(
      `POST payment/deposit_webhook ${LoggerMessages.API_CALLED}`,
    );
    try {
      await this.paymentService.initDepositTransaction(body);
    } catch (err) {
      throw err;
    }
  }
}
