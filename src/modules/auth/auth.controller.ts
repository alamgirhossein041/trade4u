import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, LoginPayload, RegisterPayload } from './';
import { CurrentUser } from './../common/decorator/current-user.decorator';
import { User, UsersService } from './../user';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() payload: LoginPayload): Promise<any> {
    const user = await this.authService.validateUser(payload);
    return await this.authService.createToken(user);
  }

  @Post('register')
  async register(@Body() payload: RegisterPayload): Promise<any> {
    const user = await this.userService.create(payload);
    return await this.authService.createToken(user);
  }

  @UseGuards(AuthGuard())
  @Get('me')
  async getLoggedInUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
