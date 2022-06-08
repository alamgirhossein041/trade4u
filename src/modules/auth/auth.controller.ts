import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  AuthService,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordDto,
  EmailDto,
} from './';
import { CurrentUser } from './../common/decorator/current-user.decorator';
import { User } from '../user/user.entity';
import { Request, Response } from 'express';
import {
  ResponseCode,
  ResponseMessage,
  LoggerMessages,
} from '../../utils/enum';
import { LoggerService } from '../../utils/logger/logger.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext('AuthController');
  }

  @Post('login')
  async login(@Body() payload: LoginPayload): Promise<any> {
    this.loggerService.log(`POST auth/login ${LoggerMessages.API_CALLED}`);
    const user = await this.authService.validateUser(payload);
    return await this.authService.createToken(user);
  }

  @Post('genesis_user')
  async createGenesisUser(
    @Body() payload: RegisterPayload,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.authService.registerGenesisUser(payload);
    return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
      statusCode: ResponseCode.CREATED_SUCCESSFULLY,
      data: user.toDto(),
      message: ResponseMessage.CREATED_SUCCESSFULLY,
    });
  }

  @Post('register')
  async register(
    @Body() payload: RegisterPayload,
    @Query('referrer') referrer: string,
    @Res() res: Response,
  ): Promise<Response> {
    if (!referrer)
      throw new HttpException(
        `${ResponseMessage.INVALID_QUERY_PARAM} referrer`,
        ResponseCode.BAD_REQUEST,
      );
    await this.authService.register(payload, referrer);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.CONFIRAMATION_EMAIL_SENT,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('confirm_email')
  async emailConfirmation(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `GET auth/confirm_email ${LoggerMessages.API_CALLED}`,
    );
    await this.authService.confirmEmail(user);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.EMAIL_CONFIRMED,
    });
  }

  @Post('forgot_password')
  async forgotPassword(
    @Body() body: EmailDto,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `GET auth/forgot_password ${LoggerMessages.API_CALLED}`,
    );
    await this.authService.forgotPassword(body.email);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.FORGOT_PASSWORD_EMAIL,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('verify_token')
  async checkPasswordLinkExpiry(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    this.loggerService.log(
      `GET auth/verify_token ${LoggerMessages.API_CALLED}`,
    );
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.checkPasswordLinkExpiry(user.email, token);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('confirm_forgot_password')
  async forgotConfirmPassword(
    @CurrentUser() user: User,
    @Res() res: Response,
    @Body() payload: ForgotPasswordDto,
  ): Promise<Response> {
    this.loggerService.log(
      `GET auth/confirm_forgot_password ${LoggerMessages.API_CALLED}`,
    );
    await this.authService.confirmForgotPassword(user.email, payload.password);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }

  @Post('resend_email')
  async resendEmail(@Res() res: Response, @Query('email') email: string) {
    if (!email)
      throw new HttpException(
        ResponseMessage.EMAIL_QUERY_PARAM_MISSING,
        ResponseCode.BAD_REQUEST,
      );
    this.loggerService.log(
      `GET auth/resend_email ${LoggerMessages.API_CALLED}`,
    );
    await this.authService.resendEmail(email);
    return res.status(ResponseCode.SUCCESS).send({
      statusCode: ResponseCode.SUCCESS,
      message: ResponseMessage.SUCCESS,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getLoggedInUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
