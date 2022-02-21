import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, LoginPayload, RegisterPayload } from './';
import { CurrentUser } from './../common/decorator/current-user.decorator';
import { User } from '../user/user.entity';
import { Response } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() payload: LoginPayload): Promise<any> {
    const user = await this.authService.validateUser(payload);
    return await this.authService.createToken(user);
  }

  @Post('genesis_user')
  public async createGenesisUser(
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

  @UseGuards(AuthGuard('jwt'))
  @Get('confirmEmail')
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

  @Post('register')
  async register(
    @Body() payload: RegisterPayload,
    @Query('referrer') referrer: string,
    @Res() res: Response
  ): Promise<Response> {
    await this.authService.registerUser(payload, referrer);
    return res
      .status(ResponseCode.SUCCESS)
      .send({
        statusCode: ResponseCode.SUCCESS,
        message: ResponseMessage.CONFIRAMATION_EMAIL_SENT,
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getLoggedInUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
