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
import { EarningLimit } from './commons/user.constants';
import { isPositiveInteger } from '../../utils/methods';
import { BinanceTradingDto, TelegramNotifyDto } from './commons/user.dtos';
import { UserDataDto } from './commons/user.types';

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
      message: ResponseMessage.SUCCESS,
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
  @Patch('validate_wallet_address')
  public async validateWalletAddress(
    @Body() data: UserDataDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `Patch user/validate_wallet_address ${LoggerMessages.API_CALLED}`,
    );
    await this.userService.validateKlaytnAddress(data.address);
    await this.userService.updateProfileInfo(data, user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.VERIFICATION_DONE,
    });
  }
}
