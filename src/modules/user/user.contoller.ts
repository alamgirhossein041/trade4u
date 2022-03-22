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
} from '@nestjs/common';
import { UsersService } from './user.service';
import { Request,Response } from 'express';
import axios from 'axios';
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
import { BinanceTradingDto, TelegramNotifyDto } from './commons/user.dtos';

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
  @Post('update_plan/:planId')
  public async updateUserPlan(@CurrentUser() user: User, @Param('planId') planId: number, @Res() res: Response): Promise<Response> {
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
  public async updateBinanceCredentials(@CurrentUser() user: User,@Body() body: BinanceTradingDto, @Res() res: Response): Promise<Response> {
    this.loggerService.log(
      `Post user/binance_credentials ${LoggerMessages.API_CALLED}`,
    );
    await this.userService.updateUserBinanceCreds(user,body);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }

  @Post(`/webhook/5060344605:AAHuBFdqTZzKg_avhYCRP6DkZrJSXFFAqa4`)
  async getBotWebhook(@Req() req: Request, @Res() res: Response) {
    this.loggerService.log(
      `Post user/telegram_webhook ${LoggerMessages.API_CALLED}`,
    );
    if (req.body.message.text && (req.body.message.text === 'hello' || req.body.message.text === '/start')) {
      let message: string;
      let resObj: Object;
      let Url = process.env.TELEGRAM_BOT_API + `/sendMessage`;
      const firstName = req.body.message.from.first_name;
      const chatId = req.body.message.chat.id;
      const userTelegram = await this.userService.getTelegramBotCode(chatId, firstName);
      if(userTelegram.isActive) {
      message = `You Have Already Activated Binance Plus Notifications`;  
      } else {
        message = `Hi ${firstName}!
      \nYour Telegram comunication code is <u><b>${userTelegram.code}</b></u>
      \nBinancePlus Team`;
      }
      resObj = { chat_id: chatId, text: message, parse_mode: 'HTML' };
      try {
        await axios.post(Url, resObj);
      } catch (err) {
        console.log(err);
      }
    }
    return res.send();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('telegram_code')
  public async updateTelegramNotifications(@CurrentUser() user: User,@Body() body: TelegramNotifyDto, @Res() res: Response): Promise<Response> {
    this.loggerService.log(
      `Post user/telegram_code ${LoggerMessages.API_CALLED}`,
    );
    try {
      const userTelegram = await this.userService.updateUserTelegramNotifications(user,body);
      let resObj: Object;
      let Url = process.env.TELEGRAM_BOT_API + `/sendMessage`;
      let message = `You have successfully activated Binance Plus Notifications\n`;
      if(userTelegram.bonusNotificationsActive)  message+=`\n@ <b>Bonus Notifications</b>\n`;
      if(userTelegram.promotionNotificationsActive)  message+=`\n@ <b>Promotion Notifications</b>\n`;
      if(userTelegram.systemNotificationsActive)  message+=`\n@ <b>System Notifications</b>\n`;
      if(userTelegram.tradeNotificationsActive)  message+=`\n@ <b>Trading Notifications</b>\n`;
      message+=`\nBinancePlus Team`
      resObj = {chat_id: userTelegram.chat_id,text: message,parse_mode: `HTML`}
      await axios.post(Url,resObj);
      return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
    } catch(err) {
      console.log(err);
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
}
