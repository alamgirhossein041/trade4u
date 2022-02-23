import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, LoginPayload, RegisterPayload, ForgotPasswordDto } from './';
import { CurrentUser } from './../common/decorator/current-user.decorator';
import { User } from '../user/user.entity';
import { Response } from 'express';
import { ResponseCode, ResponseMessage,LoggerMessages } from '../../utils/enum';
import { LoggerService } from '../../utils/logger/logger.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
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
    @Res() res: Response
  ): Promise<Response> {
    const user = await this.authService.register(payload);
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
    @Res() res: Response
  ): Promise<Response> {
    if (!referrer) throw new HttpException(`${ResponseMessage.INVALID_QUERY_PARAM} referrer`, ResponseCode.BAD_REQUEST);
    await this.authService.registerUser(payload, referrer);
    return res
      .status(ResponseCode.SUCCESS)
      .send({
        statusCode: ResponseCode.SUCCESS,
        message: ResponseMessage.CONFIRAMATION_EMAIL_SENT,
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('confirm_email')
  async emailConfirmation(
    @CurrentUser() user: User,
    @Res() res: Response
  ): Promise<Response> {
    await this.authService.confirmEmail(user);
    return res
      .status(ResponseCode.SUCCESS)
      .send({
        statusCode: ResponseCode.SUCCESS,
        message: ResponseMessage.EMAIL_CONFIRMED,
      });
  }


  @Get('forgot_password')
  async forgotPassword(@Query('email') email: string, @Res() res: Response): Promise<Response> {
    if (!email) throw new HttpException(`${ResponseMessage.INVALID_QUERY_PARAM} email`, ResponseCode.BAD_REQUEST);
    await this.authService.forgotPassword(email);
    return res.status(ResponseCode.SUCCESS).send({ statusCode: ResponseCode.SUCCESS, message: ResponseMessage.FORGOT_PASSWORD_EMAIL })
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('confirm_forgot_password')
  async forgotConfirmPassword(@CurrentUser() user: User, @Res() res: Response, @Body() payload: ForgotPasswordDto): Promise<Response> {
    await this.authService.confirmForgotPassword(user.email, payload.password);
    return res.status(ResponseCode.SUCCESS).send({ statusCode: ResponseCode.SUCCESS, message: ResponseMessage.SUCCESS });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getLoggedInUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
