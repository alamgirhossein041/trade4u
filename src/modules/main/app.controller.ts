import { Get, Controller, UseGuards,Post, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import axios from 'axios';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(AuthGuard())
  root(): string {
    return this.appService.root();
  }

  @Post(`/webhook/5060344605:AAHuBFdqTZzKg_avhYCRP6DkZrJSXFFAqa4`)
  async getBotWebhook(@Req() req: Request,@Res() res: Response) {
    let resObj: Object;
    let Url = process.env.TELEGRAM_BOT_API;
    const chatId= req.body.message.chat.id;
    if(req.body.message.sticker){
      Url+=`/sendAnimation`;
      resObj = { chat_id: chatId , animation: req.body.message.sticker.file_id};
    } else if(req.body.message.animation) {
      Url+=`/sendDocument`;
      resObj = { chat_id: chatId , document: req.body.message.animation.file_id};
    } else {
      Url+=`/sendMessage`;
      resObj = { chat_id: chatId , text: req.body.message.text};
    }
    try{
      await axios.post(Url,resObj);
    } catch (err) {
      console.log(err);
    }
    return res.send();
  }
}
