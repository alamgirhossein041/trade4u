import { HttpException, Injectable } from '@nestjs/common';
import { ResponseCode, ResponseMessage } from '../enum';
import otpGenerator from 'otp-generator';
import axios from 'axios';

@Injectable()
export class TelegramService {
  constructor() {}

  public getTelegramCode() {
    return Number(
      otpGenerator.generate(8, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      }),
    );
  }

  public async sendResponseToUser(resObj: {
    chat_id: number;
    text: string;
    parse_mode: string;
  }) {
    try {
      await axios.post(process.env.TELEGRAM_BOT_API + `/sendMessage`, resObj);
      return;
    } catch (err) {
      throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }
}
