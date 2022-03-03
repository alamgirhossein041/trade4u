import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { OctetService } from './octet.service';
import { Response, Request } from 'express';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/octet')
export class OctetController {
  constructor(private readonly octetService: OctetService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('account')
  public async getAccount(@Res() res: Response) {
    try {
      const data = await this.octetService.getAccount();
      return res.status(ResponseCode.CREATED_SUCCESSFULLY).send({
        statusCode: ResponseCode.CREATED_SUCCESSFULLY,
        data: data,
        message: ResponseMessage.CREATED_SUCCESSFULLY,
      });
    } catch (err) {
      return res.status(ResponseCode.INTERNAL_ERROR).send({
        statusCode: ResponseCode.INTERNAL_ERROR,
        message: ResponseMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
