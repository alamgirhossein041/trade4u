import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterPayload } from 'modules/auth';
import { Repository } from 'typeorm';
import {
  ResponseCode,
  ResponseMessage,
  TelergramBotMessages,
} from '../../utils/enum';
import { UserStats } from './user-stats.entity';
import { AffliatesInterface } from './commons/user.types';
import { User } from './user.entity';
import { SeedService } from '../seed/seed.service';
import { BinanceTradingDto, TelegramNotifyDto } from './commons/user.dtos';
import { BinanceService } from '../../utils/binance/binance.service';
import { UserTelegram } from './telegram.entity';
import { TelegramService } from '../../utils/telegram/telegram-bot.service';
import { BotResponse } from './commons/user.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
    @InjectRepository(UserTelegram)
    private readonly userTelegramRepository: Repository<UserTelegram>,
    private readonly seedService: SeedService,
    private readonly binanceService: BinanceService,
    private readonly telegramService: TelegramService,
  ) { }

  /**
   * Get user by id
   * @param id
   * @returns
   */
  async get(uuid: string): Promise<User> {
    return this.userRepository.findOne(
      { uuid },
      { relations: ['plan', 'userStats'] },
    );
  }

  /**
   * Get user by email
   * @param email
   * @returns
   */
  async getByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ email });
  }

  /**
   * Get user by userName
   * @param username
   * @returns
   */
  async getByUserName(userName: string): Promise<User> {
    return await this.userRepository.findOne({ userName });
  }

  /**
   * Get user by userName
   * @param username
   * @returns
   */
  async checkReferee(userName: string): Promise<User> {
    return await this.userRepository.findOne({
      userName,
      emailConfirmed: true,
      planIsActive: true,
    });
  }

  /**
   * Get affiliates of user
   * @param user
   * @returns
   */
  async getUserAffiliates(user: User): Promise<AffliatesInterface[]> {
    if (user.refereeUuid && !user.plan) {
      throw new HttpException(
        ResponseMessage.PURCHASE_PLAN,
        ResponseCode.BAD_REQUEST,
      );
    }
    const sql = `WITH RECURSIVE MlmTree AS 
              (
                    (
                        SELECT h.uuid, h."fullName",h."userName",h."phoneNumber",h."createdAt",h."planPlanId",h."tradingSystem", 0 AS level
                        FROM users h
                        WHERE h.uuid = $1
                    )
                      UNION ALL
                    (
                      SELECT u.uuid, u."fullName",u."userName",u."phoneNumber",u."createdAt",u."planPlanId",u."tradingSystem", h.level + 1 as level
                      FROM users u
                      INNER JOIN MlmTree h ON h.uuid = u."refereeUuid"
                    )
            )`;
    const affiliates = ` SELECT level,"fullName","userName","phoneNumber","tradingSystem",p."planName" as plan_name,"createdAt"
                FROM
                  MlmTree
                INNER JOIN plans p ON "planPlanId" = p."planId"
              WHERE
                  level > 0 AND level <= $2 AND "planPlanId" IS NOT NULL
              ORDER BY level;`;
    const affliatesCountLevelWise = ` SELECT level,COUNT(level) as total_affiliates
              FROM
                  MlmTree
              WHERE
                  level > 0 AND level <= $2 AND "planPlanId" IS NOT NULL
              GROUP BY level 
              ORDER BY level;`;
    const affiliatesResult = await this.userRepository.query(sql + affiliates, [
      user.uuid,
      user.plan.levels,
    ]);
    const affiliatesCountResult = await this.userRepository.query(
      sql + affliatesCountLevelWise,
      [user.uuid, user.plan.levels],
    );
    affiliatesCountResult.map(
      (count) => (count.total_affiliates = Number(count.total_affiliates)),
    );
    let newAffiliatesRes: any[] =[]; 
    for(let i=0;i < affiliatesCountResult.length; i++){
      let levelWiseArray: any[] = [];
      for(let j=0; j < affiliatesResult.length; j++) {
        if(affiliatesResult[j].level === affiliatesCountResult[i].level){
          levelWiseArray.push(affiliatesResult[j]);
        }
      }
      newAffiliatesRes.push({level:affiliatesCountResult[i].level,total_affiliates: affiliatesCountResult[i].total_affiliates,affiliates: levelWiseArray});
    }
    return newAffiliatesRes;
  }

  /**
   * Get Parent tree of user
   * @param user
   * @returns
   */
  async getUserParentsTree(user: User): Promise<unknown> {
    if (user.refereeUuid && !user.plan) {
      throw new HttpException(
        ResponseMessage.PURCHASE_PLAN,
        ResponseCode.BAD_REQUEST,
      );
    }
    const sql = `WITH RECURSIVE ReverseMlmTree AS 
              (
                    (
                        SELECT h.uuid,h."balance",h."refereeUuid",h."planPlanId", h."fullName",h."userName" ,0 AS level
                        FROM users h
                        WHERE h.uuid = $1
                    )
                      UNION ALL
                    (
                      SELECT u.uuid,u."balance",u."refereeUuid",u."planPlanId",u."fullName",u."userName", h.level + 1 as level
                      FROM users u
                      INNER JOIN ReverseMlmTree h ON u.uuid = h."refereeUuid" 
                    )
            ) 
             SELECT "fullName","balance","userName",p."planName" as plan_name,p."levels" as parent_depth_level,level FROM ReverseMlmTree
             INNER JOIN plans p ON "planPlanId" = p."planId"
             WHERE level > 0 AND level <= $2 AND "refereeUuid" IS NOT NULL
             ORDER BY level;
            `;
    try {
      const parentsResult = await this.userRepository.query(sql, [
        user.uuid,
        user.plan.levels,
      ]);
      return parentsResult;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }

  /**
   * Create a genesis user
   * @param payload
   * @returns
   */
  async createGenesisUser(payload: RegisterPayload): Promise<User> {
    const user = await this.getByEmail(payload.email);
    if (user) {
      throw new HttpException(
        ResponseMessage.USER_ALREADY_EXISTS,
        ResponseCode.BAD_REQUEST,
      );
    }
    const newUser = new User().fromDto(payload);
    newUser.userStats = await this.initializeStats();
    newUser.referralLink = this.getUserReferralLink(newUser);
    newUser.planIsActive = true;
    newUser.plan = await this.seedService.getPlanById(1);
    newUser.emailConfirmed = true;
    return await this.userRepository.save(newUser);
  }

  /**
   * Create user referral link
   * @param username
   * @returns
   */
  public getUserReferralLink(user: User): string {
    const link = process.env.APP_URL + `register?referrer=` + user.userName;
    return link;
  }

  /**
   * Initiate user stats
   * @returns
   */
  public async initializeStats(): Promise<UserStats> {
    let userStats: UserStats;
    userStats = new UserStats();
    return this.userStatsRepository.save(userStats);
  }

  /**
   * Update user plan
   * @returns
   */
  public async updateUserPlan(user: User, planId: number): Promise<User> {
    const plan = await this.seedService.getPlanById(planId);
    user.planIsActive = true;
    user.plan = plan;
    return await this.userRepository.save(user);
  }

  /**
   * Update user Binance Creds
   * @returns
   */
  public async updateUserBinanceCreds(
    user: User,
    binanceDto: BinanceTradingDto,
  ): Promise<User> {
    await this.binanceService.verifyApiKey(
      binanceDto.apiKey,
      binanceDto.apiSecret,
    );
    user.apiKey = binanceDto.apiKey;
    user.apiSecret = binanceDto.apiSecret;
    user.tradingSystem = binanceDto.tradingSystem;
    return await this.userRepository.save(user);
  }

  /**
   * get user telegram by code
   * @param code
   * @returns
   */
  async getUserTelegramByCode(code: number) {
    const userTelegram = await this.userTelegramRepository.findOne({ code });
    return userTelegram;
  }

  /**
   * Get user telegram by chat id
   * @param chat_id
   * @returns
   */
  async getUserTelegramByChatId(chat_id: number) {
    const userTelegram = await this.userTelegramRepository.findOne({ chat_id });
    return userTelegram;
  }

  /**
   * DeActivate user telegram notifications
   * @param chat_id
   * @returns
   */
  async deActivateUserNotifications(chat_id: number) {
    try {
      const userTelegram = await this.getUserTelegramByChatId(chat_id);
      if (userTelegram.isActive) {
        userTelegram.isActive = false;
        await this.userTelegramRepository.save(userTelegram);
        await this.telegramService.sendResponseToUser({
          chat_id: userTelegram.chat_id,
          parse_mode: 'HTML',
          text: TelergramBotMessages.SUCCCESSFULLY_DEACTIVATED,
        });
        return;
      }
      await this.telegramService.sendResponseToUser({
          chat_id: userTelegram.chat_id,
          parse_mode: 'HTML',
          text: TelergramBotMessages.ACTIVATE_FIRST,
        });
        return;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get Communication Message Of Bot For User
   * @param name
   * @param code
   * @returns message
   */
  public getCommunicationMessage(name: string, code: number) {
    return `Hi ${name}!
                \nYour Telegram comunication code is <u><b>${code}</b></u>
                \nBinancePlus Team`;
  }

  /**
   * Get The communication Code Of telegram bot for current user
   * @param chat_id
   * @param name
   * @returns
   */
  async getTelegramBotCode(chat_id: number, name: string): Promise<void> {
    try {
      const userTelegram = await this.getUserTelegramByChatId(chat_id);
      let resObj: BotResponse;
      if (userTelegram) {
        if (userTelegram.isActive) {
          resObj = {
            chat_id,
            parse_mode: 'HTML',
            text: TelergramBotMessages.ALREADY_ACTIVATED,
          };
        } else {
          resObj = {
            chat_id,
            parse_mode: 'HTML',
            text: this.getCommunicationMessage(name, userTelegram.code),
          };
        }
        return await this.telegramService.sendResponseToUser(resObj);
      }
      const newUserTelegram = new UserTelegram();
      newUserTelegram.chat_id = chat_id;
      newUserTelegram.name = name;
      newUserTelegram.code = this.telegramService.getTelegramCode();
      await this.userTelegramRepository.save(newUserTelegram);
      resObj = {
        chat_id,
        parse_mode: 'HTML',
        text: this.getCommunicationMessage(name, newUserTelegram.code),
      };
      return await this.telegramService.sendResponseToUser(resObj);
    } catch (err) {
      throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }

  /**
   * Get Notifications Message of Bot For User
   * @param userTelegram
   * @returns
   */
  public getNotificationsMessage(userTelegram: UserTelegram) {
    let message = TelergramBotMessages.SUCCCESSFULLY_ACTIVATED + `\n`;
    if (userTelegram.bonusNotificationsActive)
      message += `\n@ <b>Bonus Notifications</b>\n`;
    if (userTelegram.promotionNotificationsActive)
      message += `\n@ <b>Promotion Notifications</b>\n`;
    if (userTelegram.systemNotificationsActive)
      message += `\n@ <b>System Notifications</b>\n`;
    if (userTelegram.tradeNotificationsActive)
      message += `\n@ <b>Trading Notifications</b>\n`;
    message += `\nBinancePlus Team`;
    return message;
  }

  /**
   * Update user Telegram Notifications Creds
   * @returns
   */
  public async updateUserTelegramNotifications(
    user: User,
    telegramDto: TelegramNotifyDto,
  ): Promise<UserTelegram> {
    let resObj: BotResponse;
    const userTelegram = await this.getUserTelegramByCode(telegramDto.code);
    if (!userTelegram) {
      throw new HttpException(
        `Code ${ResponseMessage.IS_INVALID}`,
        ResponseCode.BAD_REQUEST,
      );
    }
    const newUserTelegram = new UserTelegram().fromNotifyDto(telegramDto);
    newUserTelegram.chat_id = userTelegram.chat_id;
    newUserTelegram.isActive = true;
    const updatedTelegram = await this.userTelegramRepository.save(
      newUserTelegram,
    );
    resObj = {
      chat_id: updatedTelegram.chat_id,
      parse_mode: `HTML`,
      text: this.getNotificationsMessage(updatedTelegram),
    };
    user.userTelegram = updatedTelegram;
    await this.userRepository.save(user);
    await this.telegramService.sendResponseToUser(resObj);
    return updatedTelegram;
  }

  /**
   * Create a new user
   * @param payload
   * @returns
   */
  async create(payload: RegisterPayload, referrer: string): Promise<User> {
    const referee = await this.checkReferee(referrer);
    if (!referee) {
      throw new HttpException(
        ResponseMessage.INVALID_REFERRER,
        ResponseCode.BAD_REQUEST,
      );
    }
    const userNameTaken = await this.getByUserName(payload.userName);
    if (userNameTaken) {
      throw new HttpException(
        ResponseMessage.USERNAME_ALREADY_TAKEN,
        ResponseCode.BAD_REQUEST,
      );
    }
    const user = await this.getByEmail(payload.email);
    if (user) {
      throw new HttpException(
        ResponseMessage.USER_ALREADY_EXISTS,
        ResponseCode.BAD_REQUEST,
      );
    }
    const newUser = new User().fromDto(payload);
    newUser.userStats = await this.initializeStats();
    newUser.referralLink = this.getUserReferralLink(newUser);
    newUser.refereeUuid = referee.uuid;
    return await this.userRepository.save(newUser);
  }

  /**
   * Get Total Affiliates of Referrer
   * @param uuid
   */
  async getReferrerAffiliates(uuid: string): Promise<UserStats> {
    const referrer = await this.get(uuid);
    const sql = `Select COUNT(DISTINCT(u.uuid)) as total_affiliates
                FROM
                    users u
                WHERE
                    u."refereeUuid" = $1;`;
    let userStats = referrer.userStats;
    const totalAffiliates = await this.userRepository.query(sql, [uuid]);
    userStats.total_affiliates = Number(totalAffiliates[0].total_affiliates);
    return userStats;
  }
  /**
   * Update Stats Of User
   * @param userStats
   */
  async updateRefereeStats(userStats: UserStats) {
    return await this.userStatsRepository.save(userStats);
  }

  /**
   * Update user email status
   * @param user
   * @returns
   */
  async updateEmailStatus(user: User): Promise<User> {
    user.emailConfirmed = true;
    const confirmedUser = await this.userRepository.save(user);
    if (user.refereeUuid) {
      const refereeStats = await this.getReferrerAffiliates(user.refereeUuid);
      await this.updateRefereeStats(refereeStats);
    }
    return confirmedUser;
  }

  /**
   * Update user plan on purchase and compensate parent users
   * @param user
   * @returns
   */
  async updateUserPlanOnPurchase(user: User, planId: number): Promise<User> {
    const plan = await this.seedService.getPlanById(planId);
    user.plan = plan;
    return await this.userRepository.save(user);
  }

  /**
   * Forget password confirmation
   * @param email
   * @param password
   * @returns
   */
  public async confirmForgotPassword(
    email: string,
    password: string,
  ): Promise<User> {
    const user: User = await this.userRepository.findOne({ email });
    if (user) {
      await this.userRepository.update({ email }, { password });
      return user;
    } else {
      throw new HttpException(
        ResponseMessage.USER_DOES_NOT_EXIST,
        ResponseCode.NOT_FOUND,
      );
    }
  }

  /**
   * Remove a user
   */
  async remove(user: User) {
    await this.userRepository.delete({ uuid: user.uuid });
  }
}
