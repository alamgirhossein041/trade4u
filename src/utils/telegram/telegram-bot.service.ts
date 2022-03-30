import { HttpException, Injectable } from '@nestjs/common';
import { ResponseCode, ResponseMessage, TelergramBotMessages } from '../enum';
import otpGenerator from 'otp-generator';
import axios from 'axios';
import { UserTelegram } from '../../modules/user/telegram.entity';
import { BotResponse } from 'modules/user/commons/user.types';

@Injectable()
export class TelegramService {
  constructor() {}

  public getTelegramCode() {
    return Number(
      otpGenerator.generate(10, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      }),
    );
  }

  static async initBotWebhook() {
    try {
      const res = await axios.get(
        `${process.env.TELEGRAM_BOT_API}/setWebhook?url=${process.env.SERVER_URL}/api/user/webhook/${process.env.BOT_TOKEN}`,
      );
      console.log(res.data);
    } catch (err) {
      console.log(
        'Please Use VPN and Restart Server to Connect to Telegram Bot',
      );
    }
  }

  /**
   * Get Notifications Message of Bot For User
   * @param userTelegram
   * @returns
   */
  public async sendNotificationsMessage(
    userTelegram: UserTelegram,
  ): Promise<void> {
    let message = `Hi ${userTelegram.name}!
        \nCongratulations! Your Telegram configuration has been successfully updated!\n`;
    if (userTelegram.bonusNotificationsActive)
      message += `\n\u{2705}  <b>Bonus Notifications</b>\n`;
    if (userTelegram.promotionNotificationsActive)
      message += `\n\u{2705}  <b>Promotion Notifications</b>\n`;
    if (userTelegram.systemNotificationsActive)
      message += `\n\u{2705}  <b>System Notifications</b>\n`;
    if (userTelegram.tradeNotificationsActive)
      message += `\n\u{2705}  <b>Trading Notifications</b>\n`;
    message += `\nThanks!\n\nBinancePlus Team`;
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: message,
    };
    return await this.sendResponseToUser(resObj);
  }

  /**
   * Get Communication Message Of Bot For USer
   * @param userTelegram
   * @returns
   */
  public async sendCommunicationMessage(
    userTelegram: UserTelegram,
  ): Promise<void> {
    let message = `Hi ${userTelegram.name}!
                \nYour Telegram comunication code is <u><b>${userTelegram.code}</b></u>
                \nBinancePlus Team`;
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: message,
    };
    return await this.sendResponseToUser(resObj);
  }

  /**
   * Get Communication Message Of Bot For USer
   * @param userTelegram
   * @returns
   */
  public async sendAlreadyActivatedMessage(
    userTelegram: UserTelegram,
  ): Promise<void> {
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: TelergramBotMessages.ALREADY_ACTIVATED,
    };
    return await this.sendResponseToUser(resObj);
  }

  /**
   * Send Bonus Notification To User on telegram
   * @param userTelegram
   * @param amountKlay
   * @param amountUSD
   * @returns
   */
  public async sendBonusNotification(
    userTelegram: UserTelegram,
    txHash: string,
    klayPrice: number,
    amountKlay: number,
    amountUSD: number,
    bonusType: string,
  ) {
    let message = `${bonusType.toUpperCase()} Bonus Received ***
    \n<a href="https://baobab.scope.klaytn.com/tx/${txHash}"> ${txHash}</a>
    \n <b>KLAY Price: US$ ${klayPrice}</b>
    \n <b>Amount (KLAY): ${amountKlay}</b>
    \n <b>Amount(USDT): US$ ${amountUSD}</b>
    \n Binance Plus Team
    `;
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: message,
    };
    await this.sendResponseToUser(resObj);
    return;
  }

  /**
   * Send Binance Trading Notification To User on telegram
   * @param userTelegram
   * @param order
   * @returns
   */
  public async sendTradeNotification(userTelegram: UserTelegram, order: any) {
    let message = `Hi ${userTelegram.name}!
    \nTrade ID: ${order.tradeId}
    \nTrade Type: ${order.type}
    \nBase Currency: ${order.baseCurrency}
    \nCoin: ${order.coin}
    \nAmount: ${order.amount}
    \nDate: ${order.date}
    
    \nThanks
    
    \nBinance Plus Team
`;
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: message,
    };
    await this.sendResponseToUser(resObj);
    return;
  }

  /**
   * Send Sysytem Notification to User on telegram
   * @param userTelegram
   * @param content
   * @returns
   */
  public async sendSystemNotifications(
    userTelegram: UserTelegram,
    content: any,
  ) {
    let message = `Hi ${userTelegram.name}!
                \nYou Received Bonus Of <b>${content}</b> KLAY.
                \nAmount in Dollars : <b>$${content}</b> USD.
                \nBinancePlus Team`;
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: message,
    };
    await this.sendResponseToUser(resObj);
    return;
  }

   /**
   * Send Sysytem Notification to User on telegram
   * @param userTelegram
   * @param affiliateUsername
   * @returns
   */
  public async sendReferralNotification(
    userTelegram: UserTelegram,
    affiliateUsername: string,
  ) {
    let message = `Hi ${userTelegram.name}!
                \nYou Have A New Affiliate
                \nUsername : <b>${affiliateUsername}</b>
                \nBinancePlus Team`;
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: message,
    };
    await this.sendResponseToUser(resObj);
    return;
  }

  /**
   * Send Promotional Notification to User on telegram
   * @param userTelegram
   * @param promotion
   * @returns
   */
  public async sendPromotionNotifications(
    userTelegram: UserTelegram,
    promotion: any,
  ) {
    let message = `Hi ${userTelegram.name}!
                \nYou Received Bonus Of <b>${promotion}</b> KLAY.
                \nAmount in Dollars : <b>$${promotion}</b> USD.
                \nBinancePlus Team`;
    const resObj: BotResponse = {
      chat_id: userTelegram.chat_id,
      parse_mode: 'HTML',
      text: message,
    };
    await this.sendResponseToUser(resObj);
    return;
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
      console.log(err);
      throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }
}
