import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, response, Response } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { CurrentUser } from '../../modules/common/decorator/current-user.decorator';
import { User } from '../../modules/user';
import { AuthGuard } from '@nestjs/passport';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Pagination } from '../../utils/paginate';

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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

  @Post(`make_payment`)
  public async makePayment() {}
}
