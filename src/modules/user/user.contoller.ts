import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
  HttpException,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
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
import { EarningLimit, TradeResultDaysLimit } from './commons/user.constants';
import { isPositiveInteger } from '../../utils/methods';
import {
  BinanceTradingDto,
  TelegramNotifyDto,
  SystemDto,
  TradeNotificationDto,
} from './commons/user.dtos';
import { UserDataDto } from './user.entity';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Pagination } from '../../utils/paginate';
import moment from 'moment';

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
  public async getBussniessPlan(@Res() res: Response): Promise<Response> {
    this.loggerService.log(
      `Get user/business_plan ${LoggerMessages.API_CALLED}`,
    );
    const plans = await this.seedService.getBusinessPlans();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: plans,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('meetings')
  public async getMeetings(@Res() res: Response): Promise<Response> {
    this.loggerService.log(
      `Get user/business_meetings ${LoggerMessages.API_CALLED}`,
    );
    const meetings = await this.userService.getBusinessMeetings();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: meetings,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('update_plan/:planId')
  public async updateUserPlan(
    @CurrentUser() user: User,
    @Param('planId') planId: number,
    @Res() res: Response,
  ): Promise<Response> {
    const isPosInt = isPositiveInteger(planId.toString());
    if (!isPosInt)
      throw new HttpException(
        `Parameter planId ${ResponseMessage.IS_INVALID}`,
        ResponseCode.BAD_REQUEST,
      );
    this.loggerService.log(
      `Post user/update_plan ${LoggerMessages.API_CALLED}`,
    );
    await this.userService.updateUserPlan(user, planId);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('binance_credentials')
  public async updateBinanceCredentials(
    @CurrentUser() user: User,
    @Body() body: BinanceTradingDto,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `Post user/binance_credentials ${LoggerMessages.API_CALLED}`,
    );
    await this.userService.updateUserBinanceCreds(user, body);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.BINANCE_BOT_STARTED,
    });
  }

  @Post(`/webhook/5060344605:AAHuBFdqTZzKg_avhYCRP6DkZrJSXFFAqa4`)
  async getBotWebhook(@Req() req: Request, @Res() res: Response) {
    this.loggerService.log(
      `Post user/telegram_webhook ${LoggerMessages.API_CALLED}`,
    );
    let firstName: string;
    let chatId: number;
    let text: string = ``;
    if (req.body.edited_message) {
      firstName = req.body.edited_message.from.first_name;
      chatId = req.body.edited_message.chat.id;
      text = req.body.edited_message.text;
    } else if (req.body.message.text) {
      firstName = req.body.message.from.first_name;
      chatId = req.body.message.chat.id;
      text = req.body.message.text;
    }
    if (text && (text === 'hello' || text === '/start')) {
      await this.userService.getTelegramBotCode(chatId, firstName);
    } else if (text && text === '/stop') {
      await this.userService.deActivateUserNotifications(chatId);
    }
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('telegram_code')
  public async updateTelegramNotifications(
    @CurrentUser() user: User,
    @Body() body: TelegramNotifyDto,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `Post user/telegram_code ${LoggerMessages.API_CALLED}`,
    );
    try {
      await this.userService.updateUserTelegramNotifications(user, body);
      return res.status(ResponseCode.SUCCESS).send({
        statusCode: ResponseCode.SUCCESS,
        message: ResponseMessage.SUCCESS,
      });
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('plan_by_id/:id')
  public async getPlanById(
    @Param('id') id: number,
    @Res() res: Response,
  ): Promise<any> {
    const isPosInt = isPositiveInteger(id.toString());
    if (!isPosInt)
      throw new HttpException(
        `Parameter id ${ResponseMessage.IS_INVALID}`,
        ResponseCode.BAD_REQUEST,
      );
    const plan = await this.seedService.getPlanById(Number(id));
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: {
        planId: plan.planId,
        planName: plan.planName,
        price: plan.price,
        levels: plan.levels,
        earningLimit: plan.price * EarningLimit,
      },
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('affiliates')
  public async getUserAffiliates(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(`Get user/affiliates ${LoggerMessages.API_CALLED}`);
    const affiliates = await this.userService.getUserAffiliates(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: affiliates,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(`trades`)
  public async getTradeOrders(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.loggerService.log(`GET user/trades_list ${LoggerMessages.API_CALLED}`);
    let filter = ``;
    if (req.query && req.query.startDate && req.query.endDate) {
      const isPosIntStart = isPositiveInteger(req.query.startDate.toString());
      const isPosIntEnd = isPositiveInteger(req.query.endDate.toString());
      if (!isPosIntStart || !isPosIntEnd)
        throw new HttpException(
          `Query Parameter startDate or endDate ${ResponseMessage.IS_INVALID}`,
          ResponseCode.BAD_REQUEST,
        );
      filter = `AND t."date" >= ${req.query.startDate} AND t."date" <= ${req.query.endDate}`;
    }
    const pagination: IPaginationOptions = await Pagination.paginate(req, res);
    const payment = await this.userService.getTrades(user, pagination, filter);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: payment,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(`trades_result`)
  public async getTradesResult(
    @CurrentUser() user: User,
    @Body() body: SystemDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.loggerService.log(
      `GET user/trades_result ${LoggerMessages.API_CALLED}`,
    );
    let filter = ``;
    let system = body.system;
    let effectivePeriod: number = 0;
    if (req.query && req.query.startDate && req.query.endDate) {
      const isPosIntStart = isPositiveInteger(req.query.startDate.toString());
      const isPosIntEnd = isPositiveInteger(req.query.endDate.toString());
      if (!isPosIntStart || !isPosIntEnd)
        throw new HttpException(
          `Query Parameter startDate or endDate ${ResponseMessage.IS_INVALID}`,
          ResponseCode.BAD_REQUEST,
        );
      const today = moment().unix();
      const start = Number(req.query.startDate);
      const end = Number(req.query.endDate);
      if (start > today || end > today)
        throw new HttpException(
          `Query Parameter startDate or endDate ${ResponseMessage.IS_INVALID}, future date not allowed`,
          ResponseCode.BAD_REQUEST,
        );
      effectivePeriod = moment
        .unix(end)
        .startOf('day')
        .diff(moment.unix(start).startOf('day'), 'days');
      if (effectivePeriod > TradeResultDaysLimit)
        throw new HttpException(
          `Effective Period Limit ${ResponseMessage.IS_INVALID}, allowed 180 days , got ${effectivePeriod} days`,
          ResponseCode.BAD_REQUEST,
        );
      filter = `AND t."date" >= ${moment
        .unix(start)
        .startOf('day')
        .unix()} AND t."date" <= ${moment
        .unix(end)
        .endOf('day')
        .unix()} AND b."baseasset" = '${system.toUpperCase()}'`;
    }
    const tradesResult = await this.userService.getTradesResult(
      user,
      system,
      effectivePeriod,
      filter,
    );
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: tradesResult,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(`history_general`)
  public async getTradesGeneralHistory(@Res() res: Response) {
    this.loggerService.log(
      `GET user/trades_history_general ${LoggerMessages.API_CALLED}`,
    );
    const history = await this.userService.getTradesGeneralHistory();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: history,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(`bank_usage`)
  public async getUserBankUsage(
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    this.loggerService.log(`GET user/bank_usage ${LoggerMessages.API_CALLED}`);
    const history = await this.userService.getBankUsage(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: history,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(`bot_efficiency`)
  public async getUserBotEfficiency(
    @CurrentUser() user: User,
    @Query('system') system: string,
    @Res() res: Response,
  ) {
    this.loggerService.log(
      `GET user/bot_efficiency ${LoggerMessages.API_CALLED}`,
    );

    const efficiency = await this.userService.getBotEfficiency(user, system);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: efficiency,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(`commissions`)
  public async getUserCommissions(
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    this.loggerService.log(`GET user/commissions ${LoggerMessages.API_CALLED}`);
    const commissions = await this.userService.getUserCommissions(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: commissions,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('earning_cap')
  public async getUserEarningCap(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(`Get user/earning_cap ${LoggerMessages.API_CALLED}`);
    const percentage = this.userService.getBonusEarningCap(user.userStats);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: {
        consumed_percentage: percentage,
        consumed_amount: user.userStats.consumed_amount,
        total_amount: user.userStats.earning_limit,
      },
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('financials')
  public async getUserFinancials(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(`Get user/financials ${LoggerMessages.API_CALLED}`);
    const amounts = await this.userService.getUserFinancials(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: amounts,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('graph_data')
  public async getUserGraphData(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(`Get user/graph_data ${LoggerMessages.API_CALLED}`);
    const trades_commisions = await this.userService.getUserGraph(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: trades_commisions,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('affiliates_depth')
  public async getUserAffiliatesAndDepth(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `Get user/affiliates_depth ${LoggerMessages.API_CALLED}`,
    );
    const affiliatesAndDepth =
      await this.userService.getTotalAffiliatesWithDepth(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: affiliatesAndDepth,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('parents')
  public async getUserParents(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(`Get user/parents ${LoggerMessages.API_CALLED}`);
    const parents = await this.userService.getUserParentsTree(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: parents,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('license_fee')
  public async getlicenseFee(@Res() res: Response): Promise<Response> {
    this.loggerService.log(`GET user/license_fee ${LoggerMessages.API_CALLED}`);
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
    this.loggerService.log(
      `GET user/preformance_fee ${LoggerMessages.API_CALLED}`,
    );
    const preformanceFee = await this.seedService.getpreformanceFee();
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: preformanceFee,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile_verification_code')
  public async getProfileVerificationCode(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `GET user/profile_verification_code ${LoggerMessages.API_CALLED}`,
    );
    await this.userService.getProfileVerificationCode(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.VERIFICATION_CODE_SEND,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile_details/:code')
  public async getProfileDetails(
    @CurrentUser() user: User,
    @Res() res: Response,
    @Param('code') code: string,
  ): Promise<Response> {
    this.loggerService.log(
      `GET user/profile_details ${LoggerMessages.API_CALLED}`,
    );
    const profileCode = await this.userService.getProfileDetails(user, code);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: profileCode,
      message: ResponseMessage.VERIFICATION_DONE,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  public async getCurrentUserDetails(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    let referrerObj: Object = null;
    this.loggerService.log(`GET user/me ${LoggerMessages.API_CALLED}`);
    if (user.refereeUuid) {
      const referrer = await this.userService.getByid(user.refereeUuid);
      referrerObj = {
        name: referrer.fullName,
        username: referrer.userName,
        contact: referrer.phoneNumber,
        email: referrer.email,
      };
    }
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      data: { user: user.toDto(), referrer: referrerObj },
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('update_profile')
  public async validateWalletAddress(
    @Body() data: UserDataDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `Patch user/update_profile ${LoggerMessages.API_CALLED}`,
    );
    await this.userService.validateKlaytnAddress(data.address);
    await this.userService.updateProfileInfo(data, user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.PROFILE_UPDATED_SUCCESSFULLY,
    });
  }

  @Post('send_trade_notification')
  public async sendTradeNotification(
    @Body() body: TradeNotificationDto,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `Patch user/send_trade_notication ${LoggerMessages.API_CALLED}`,
    );
    await this.userService.sendTradeNotification(body);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }
}
