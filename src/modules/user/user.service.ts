import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterPayload } from 'modules/auth';
import {
  In,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  ILike,
  Repository,
  getConnection,
} from 'typeorm';
import {
  JOB,
  ResponseCode,
  ResponseMessage,
  TelergramBotMessages,
  Time,
} from '../../utils/enum';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { UserStats } from './user-stats.entity';
import { AffliatesInterface, TradesResultStats } from './commons/user.types';
import { User } from './user.entity';
import { SeedService } from '../seed/seed.service';
import {
  BinanceTradingDto,
  TelegramNotifyDto,
  TradeNotificationDto,
} from './commons/user.dtos';
import { BinanceService } from '../../utils/binance/binance.service';
import { UserTelegram } from './telegram.entity';
import { TelegramService } from '../../utils/telegram/telegram-bot.service';
import { MailService } from '../../utils/mailer/mail.service';
import { KlaytnService } from '../klaytn/klaytn.service';
import { Hash } from '../../utils/Hash';
import speakeasy from 'speakeasy';
import { UserDataDto } from '.';
import { Crypto } from '../../utils/crypto';
import {
  botConstants,
  HistoryLimit,
  MaxLevels,
  MaxProfitLimit,
} from './commons/user.constants';
import { BOTClient } from 'botclient';
import { IBotResponse, ICreateBot } from 'botclient/lib/@types/types';
import {
  Exchange,
  TradingSystem,
  UserActiveStatus,
} from './commons/user.enums';
import { Bot } from '../bot/bot.entity';
import bigDecimal from 'js-big-decimal';
import { UserCommision } from './user-commision.entity';
import moment, { unix } from 'moment';
import { CryptoAsset } from '../../modules/payment/commons/payment.enum';
import { PriceService } from '../../modules/price/price.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../../utils/logger/logger.service';
import { PlanNameEnum } from '../seed/seed.enums';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Machine } from 'modules/bot/machine.entity';

@Injectable()
export class UsersService {
  private botclient: BOTClient;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
    @InjectRepository(UserTelegram)
    private readonly userTelegramRepository: Repository<UserTelegram>,
    @InjectRepository(Bot)
    private readonly tradingBotRepository: Repository<Bot>,
    @InjectRepository(UserCommision)
    private readonly userCommisionRepository: Repository<UserCommision>,
    private readonly seedService: SeedService,
    private readonly binanceService: BinanceService,
    private readonly telegramService: TelegramService,
    private readonly mailerservice: MailService,
    private readonly klaytnService: KlaytnService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly loggerService: LoggerService,
  ) {
    
  }

  /**
   * Get user by id
   * @param uuid
   * @returns
   */
  async get(uuid: string): Promise<User> {
    return this.userRepository.findOne(
      { uuid },
      { relations: ['plan', 'userStats', 'userTelegram'] },
    );
  }
  async checkIfAlreadyExist(userId:string): Promise<boolean> {
    try {
      const sql=`SELECT botId, userId, botName FROM bots b WHERE b."userid" = $1`
      let bots=await getConnection().query(sql,[userId]);
      
      if (bots&& bots.length) {
        throw new HttpException(
          ResponseMessage.BOT_ALREADY_EXISTS_MESSAGE,
          ResponseCode.BAD_REQUEST,
        );
      }
      return 
    }
    catch(error){
      throw new HttpException(error.message,ResponseCode.BAD_REQUEST,)
    }
  }

  /**
   * Get Available Server Ip
   * @returns
   */
   async getAvailableServerIp(): Promise<Machine> {
    try {
      let sqlMachines =`SELECT 
                              *
                         FROM
                            machine
                         ORDER BY machinename ASC`

        let machines=await getConnection().query(sqlMachines);
        if(machines && machines.length>0){
          let count=1;
          for(let machine of machines){

            let sql=`SELECT 
                        COUNT(*) as total_bots
                      FROM
                        bots as b
                      WHERE b."machineid"=$1`
              const countOfBots= await getConnection().query(sql,[machine.machineid]);
              if(countOfBots.length && parseInt(countOfBots[0].total_bots) < parseInt(process.env.TOTAL_BOT_CAPACITY)){
               this.botclient = new BOTClient(machine.url);
               try {
                await this.botclient.ping()
                return machine;
               } catch (error) {
                if(count===machines.length){
                  throw new HttpException(
                    ResponseMessage.BOT_SERVER_DOWN,
                    ResponseCode.BAD_REQUEST,
                  );
                }
                count++;
                continue;
               }
              }
              else{
                if(count===machines.length){
                  throw new HttpException(ResponseMessage.NO_CAPACITY_AVAILABLE, ResponseCode.BAD_REQUEST);
                }
                count++;
                continue;
              }
            }
        }
      else{
          throw new HttpException(ResponseMessage.NO_BOT_SERVER_AVAILABLE, ResponseCode.BAD_REQUEST);
        } 
    } catch (error) {
      throw new HttpException(error.message, ResponseCode.BAD_REQUEST);
    }
  }

  /**
   * Get user by id
   * @param uuid
   * @returns
   */
  async getBotIp(): Promise<any> {
    try {
    const machine = await this.getAvailableServerIp()
     return machine.ip;
    } catch (err) {
      throw new HttpException(err.message, ResponseCode.BAD_REQUEST);
    }
  }

  /**
   * Get user by id
   * @param uuid
   * @returns
   */
  async getByid(uuid: string): Promise<User> {
    return this.userRepository.findOne(uuid);
  }

  /**
   * Get user by email
   * @param email
   * @returns
   */
  async getByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ email: ILike(`${email}`) });
  }

  /**
   * Get user by userName
   * @param username
   * @returns
   */
  async getByUserName(userName: string): Promise<User> {
    return await this.userRepository.findOne(
      { userName },
      { relations: ['userTelegram'] },
    );
  }

  /**
   * Get user by userName
   * @param username
   * @returns
   */
  async getByUserStats(userStats: UserStats): Promise<User> {
    return await this.userRepository.findOne(
      { userStats },
      { relations: ['userTelegram'] },
    );
  }

  /**
   * Get businees meetings for user
   * @returns
   */
  async getBusinessMeetings() {
    let sql = `SELECT * FROM meetings`;
    const meetings = await this.userRepository.query(sql);
    if (!meetings.length) {
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }
    return meetings;
  }

  /**
   * Get user commisions of last week and last month
   * @param user
   * @returns
   */
  async getUserFinancials(
    user: User,
  ): Promise<{ weekAmount: number; monthAmount: number }> {
    try {
      const lastweekdate = moment().subtract(1, 'week').unix();
      const lastmonthdate = moment().subtract(1, 'month').unix();
      const sql = `SELECT SUM("amount") as total_amount
            FROM
                users_commisions
            WHERE
                "userId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3;
    `;
      const week = await this.userCommisionRepository.query(sql, [
        user.uuid,
        lastweekdate,
        moment().unix(),
      ]);
      const weekAmount = Number(week[0].total_amount);
      const month = await this.userCommisionRepository.query(sql, [
        user.uuid,
        lastmonthdate,
        moment().unix(),
      ]);
      const monthAmount = Number(month[0].total_amount);
      return { weekAmount, monthAmount };
    } catch (err) {
      throw new HttpException(err.message, ResponseCode.BAD_REQUEST);
    }
  }

  /**
   * Get all user commisions
   * @param user
   * @returns
   */
  async getUserGraph(
    user: User,
  ): Promise<{ trades: any; commisions: UserCommision[] }> {
    let trades: any[] = [];
    const userBots = await this.getBotsByUserId(user);
    if (userBots.length > 0) {
      try {
        await Promise.all(
          userBots.map(async (bot) => {
            let sql = `SELECT 
                        t."date",
                        t."profit",
                        b."baseasset"
                      FROM
                        bots b
                        INNER JOIN slots s ON b."botid" = s."botid"
                        INNER JOIN trades t ON s."slotid" = t."slotid"
                      WHERE
                        b."botid" = $1; `;
            const result = await this.tradingBotRepository.query(sql, [
              bot.botid,
            ]);
            trades = trades.concat(result);
          }),
        );
      } catch (err) {
        throw new HttpException(err.message, ResponseCode.BAD_REQUEST);
      }
    }
    const commisions = await this.userCommisionRepository.find({ user });
    return { trades, commisions };
  }

  /**
   * Get total count of user trade orders
   * @param botId
   * @returns
   */
  async getTotalTradesCount(botId: string): Promise<number> {
    let sql = `SELECT 
                COUNT(*) as total_trades
              FROM
                bots b
                INNER JOIN slots s ON b."botid" = s."botid"
                INNER JOIN trades t ON s."slotid" = t."slotid"
              WHERE
                b."botid" = $1`;
    const result = await this.tradingBotRepository.query(sql, [botId]);
    const tradesCount = Number(result[0].total_trades);
    return tradesCount;
  }

  /**
   * Get user trade orders
   * @param user
   * @returns
   */
  async getTrades(
    user: User,
    paginationOption: IPaginationOptions,
    filter: string,
  ): Promise<{ trades: any; tradesCount: number }> {
    let trades: any[] = [];
    let tradesCount: number = 0;
    const limit = Number(paginationOption.limit);
    const page = Number(paginationOption.page);
    const userBots = await this.getBotsByUserId(user);
    if (!userBots.length)
      throw new HttpException(
        ResponseMessage.NO_ACTIVE_BOT,
        ResponseCode.BAD_REQUEST,
      );
    await Promise.all(
      userBots.map(async (bot) => {
        let sql = `SELECT 
                    t."date",
                    t."amount",
                    t."profit",
                    t."profitpercentage",
                    t."status",
                    b."baseasset"
                  FROM
                    bots b
                    INNER JOIN slots s ON b."botid" = s."botid"
                    INNER JOIN trades t ON s."slotid" = t."slotid"
                  WHERE
                    b."botid" = $1 ${filter} LIMIT $2 OFFSET $3;`;
        const result = await this.tradingBotRepository.query(sql, [
          bot.botid,
          limit,
          limit * (page - 1),
        ]);
        trades = trades.concat(result);
        const count = await this.getTotalTradesCount(bot.botid);
        tradesCount += count;
      }),
    );
    if (!trades.length)
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    return { trades, tradesCount };
  }

  /**
   * Get user trade orders
   * @param user
   * @returns
   */
  async getTradesResult(
    user: User,
    system: string,
    effectivePeriod: number,
    filter: string,
  ): Promise<{ trades: any; stats: TradesResultStats }> {
    const userBot = await this.getBotByUserIdAndBaseAsset(
      user,
      system.toUpperCase(),
    );
    if (!userBot)
      throw new HttpException(
        ResponseMessage.NO_ACTIVE_BOT,
        ResponseCode.BAD_REQUEST,
      );
    let sql = `SELECT 
                t."date",
                t."profit",
                t."profitpercentage",
                b."baseasset",SUM(t."profit") OVER(ORDER BY t."tid" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS accumulated
              FROM
                bots b
                INNER JOIN slots s ON b."botid" = s."botid"
                INNER JOIN trades t ON s."slotid" = t."slotid"
              WHERE
                b."botid" = $1 ${filter};`;
    const trades = await this.tradingBotRepository.query(sql, [userBot.botid]);
    if (!trades.length)
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    const stats = await this.getTradeResultStats(
      user,
      trades,
      effectivePeriod,
      system.toUpperCase(),
    );
    return { trades, stats };
  }

  async getTradeResultStats(
    user: User,
    trades: any,
    effectivePeriod: number,
    system: string,
  ) {
    let totalBalance: number;
    const accumulated: number = trades.at(-1).accumulated;
    const balances = await this.getBankUsage(user);
    balances.map((balance) => {
      if (balance.baseasset === system) {
        totalBalance = balance.total;
      }
    });
    const periodResult = Number(
      new bigDecimal(accumulated)
        .divide(new bigDecimal(totalBalance), 4)
        .multiply(new bigDecimal(100))
        .getValue(),
    );
    const totalResult = { accumulated, periodResult };
    const dailyAccumulated =
      effectivePeriod === 0
        ? accumulated
        : Number(
            new bigDecimal(accumulated)
              .divide(new bigDecimal(effectivePeriod), 4)
              .getValue(),
          );
    const dailyPercentage = Number(
      new bigDecimal(dailyAccumulated)
        .divide(new bigDecimal(totalBalance), 4)
        .multiply(new bigDecimal(100))
        .getValue(),
    );
    const dailyResult = { dailyAccumulated, dailyPercentage };
    return { periodResult, totalResult, dailyResult, effectivePeriod };
  }

  /**
   * Get Last 20 trades data
   * @param user
   */
  async getTradesGeneralHistory() {
    let sql = `SELECT 
                  t."date",
                  t."amount",
                  t."profit",
                  t."profitpercentage",
                  t."status",
                  b."baseasset",
                  b."quoteasset",
                  u."userName" as username
              FROM
                  bots b
                  INNER JOIN slots s ON b."botid" = s."botid"
                  INNER JOIN trades t ON s."slotid" = t."slotid"
                  INNER JOIN users u ON CAST(b."userid" as uuid) = u."uuid"
              ORDER BY 
                  t."date" DESC LIMIT $1;`;
    const trades = await this.tradingBotRepository.query(sql, [HistoryLimit]);
    if (!trades.length)
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    return trades;
  }

  /**
   * Get Last 20 trades data
   * @param user
   */
  async getBankUsage(user: User) {
    const userBots = await this.getBotsByUserId(user);
    let banks: any[] = [];
    if (!userBots.length)
      throw new HttpException(
        ResponseMessage.NO_ACTIVE_BOT,
        ResponseCode.BAD_REQUEST,
      );
    await Promise.all(
      userBots.map(async (bot) => {
        let sql = `SELECT 
                    bn."total",
                    bn."available",
                    bn."hold",
                    bn."usage",
                    b."baseasset",
                    u."apiActivationDate"
                  FROM
                    bots b
                    INNER JOIN bank bn ON b."botid" = bn."botid"
                    INNER JOIN users u ON CAST(b."userid" as uuid) = u."uuid"
                  WHERE b."botid" = $1`;
        const bank = await this.tradingBotRepository.query(sql, [bot.botid]);
        banks = banks.concat(bank);
      }),
    );
    return banks;
  }

  /**
   * Get User Commisions data
   * @param user
   */
  async getUserCommissions(user: User) {
    let sql = `SELECT
                SUM(c."amount") as total_commission
              FROM
                users_commisions c
              WHERE
                c."consumed" = true AND c."userId"='${user.uuid}';`;
    const result = await this.userCommisionRepository.query(sql);
    const commisions = await this.userCommisionRepository.find({
      where: { user, consumed: true, amount: MoreThan(0) },
    });
    if (!commisions.length) {
      throw new HttpException(
        ResponseMessage.CONTENT_NOT_FOUND,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }
    return { commisions, total_commision: result[0].total_commission };
  }

  /**
   * Get User Bot Efficiency
   * @param user
   */
  async getBotEfficiency(user: User, system: string) {
    const bot = await this.getBotByUserIdAndBaseAsset(
      user,
      system.toUpperCase(),
    );
    if (!bot)
      throw new HttpException(
        ResponseMessage.NO_ACTIVE_BOT,
        ResponseCode.BAD_REQUEST,
      );
    return {
      todayEfficiency: bot.efficiencytoday,
      globalEfficiency: bot.efficiencyoverall,
    };
  }

  /**
   * Get user by userName
   * @param userName
   * @returns
   */
  async checkReferrer(userName: string): Promise<User> {
    return await this.userRepository.findOne({
      userName,
      emailConfirmed: true,
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
                LEFT JOIN plans p ON "planPlanId" = p."planId"
              WHERE
                  level > 0 AND level <= $2
              ORDER BY level;`;
    const affliatesCountLevelWise = ` SELECT level,COUNT(level) as total_affiliates
              FROM
                  MlmTree
              WHERE
                  level > 0 AND level <= $2
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
    let newAffiliatesRes: any[] = [];
    for (let i = 0; i < affiliatesCountResult.length; i++) {
      let levelWiseArray: any[] = [];
      for (let j = 0; j < affiliatesResult.length; j++) {
        if (affiliatesResult[j].level === affiliatesCountResult[i].level) {
          levelWiseArray.push(affiliatesResult[j]);
        }
      }
      newAffiliatesRes.push({
        level: affiliatesCountResult[i].level,
        total_affiliates: affiliatesCountResult[i].total_affiliates,
        affiliates: levelWiseArray,
      });
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
                        SELECT h.uuid,h."planIsActive",h."balance",h."refereeUuid",h."planPlanId", h."fullName",h."userName" ,0 AS level
                        FROM users h
                        WHERE h.uuid = $1
                    )
                      UNION ALL
                    (
                      SELECT u.uuid,u."planIsActive",u."balance",u."refereeUuid",u."planPlanId",u."fullName",u."userName", h.level + 1 as level
                      FROM users u
                      INNER JOIN ReverseMlmTree h ON u.uuid = h."refereeUuid" 
                    )
            ) 
             SELECT uuid,"refereeUuid","fullName","balance","userName","planIsActive" as plan_is_active,p."planName" as plan_name,p."levels" as parent_depth_level,level FROM ReverseMlmTree
             INNER JOIN plans p ON "planPlanId" = p."planId"
             WHERE level > 0 AND level <= $2
             ORDER BY level;
            `;
    try {
      const parentsResult = await this.userRepository.query(sql, [
        user.uuid,
        MaxLevels,
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
    newUser.plan = await this.seedService.getPlanByName(PlanNameEnum.Premium);
    newUser.emailConfirmed = true;
    newUser.activeStatus = UserActiveStatus.ENABLE;
    newUser.password = await Hash.make(newUser.password);
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
   * Get user Bonus Earning cap
   * @param user
   * @returns
   */
  public getBonusEarningCap(userStats: UserStats): number {
    if (!userStats.earning_limit) {
      return userStats.earning_limit;
    }
    const amountToMultiplyWith = Number(
      new bigDecimal(userStats.consumed_amount)
        .divide(new bigDecimal(userStats.earning_limit), 4)
        .getValue(),
    );
    const originalPercentage = Number(
      new bigDecimal(amountToMultiplyWith)
        .multiply(new bigDecimal(100))
        .getValue(),
    );
    return originalPercentage;
  }

  /**
   * Update user plan
   * @returns
   */
  public async getTotalAffiliatesWithDepth(
    user: User,
  ): Promise<{ total_affiliates: number; depth: number }> {
    const levels = await this.getUserAffiliates(user);
    const depth = levels.length;
    let total_affiliates: number = 0;
    levels.map((level) => (total_affiliates += level.total_affiliates));
    return { total_affiliates, depth };
  }

  /**
   * Update user Binance Creds
   * @returns
   */
  public async updateUserBinanceCreds(
    user: User,
    binanceDto: BinanceTradingDto,
  ): Promise<User> {
    if (!user.planIsActive) {
      throw new HttpException(
        ResponseMessage.PURCHASE_PLAN,
        ResponseCode.BAD_REQUEST,
      );
    }
    try {
     await this.checkIfAlreadyExist(user.uuid);
      let machineId='';
     await this.getAvailableServerIp().then((machine)=>{
      machineId=machine.machineid;
     }).catch((error)=>{
      throw new HttpException(
        error.message,
        ResponseCode.BAD_REQUEST,
      );
      })
      user.apiKey = Crypto.encrypt(binanceDto.apiKey);
      user.apiSecret = Crypto.encrypt(binanceDto.apiSecret);
      user.tradingSystem = binanceDto.tradingSystem;
      user.apiActivationDate = moment().unix();
      if (user.refereeUuid) {
        user.tradeStartDate = moment().unix();
        user.tradeExpiryDate = moment().unix() + Time.THIRTY_DAYS; //30 Days after the trading is started
      }
      const botData: ICreateBot = {
        apiKey: binanceDto.apiKey,
        apiSecret: binanceDto.apiSecret,
        baseAsset: '',
        quoteAsset: '',
        exchange: process.env.EXCHANGE,
        strategy: botConstants.strategy,
        riskLevel: botConstants.riskLevel,
        userId: user.uuid,
        machineId:machineId
      };
      if (machineId) {
        await this.iniateUserBot(binanceDto.tradingSystem, botData);
        return await this.userRepository.save(user);
      }
    } catch (err) {
      throw new HttpException(err.message, ResponseCode.BAD_REQUEST);
    }
  }

  async iniateUserBot(
    tradingSystem: string,
    botData: ICreateBot,
  ): Promise<IBotResponse[]> {
    try {
      let botResponseArr: IBotResponse[] = [];
      switch (tradingSystem) {
        case TradingSystem.USDT:
          botData.baseAsset = CryptoAsset.USDT;
          botData.quoteAsset = CryptoAsset.BTC;
          botResponseArr[0] = await this.botclient.createBot(botData);
          await this.botclient.startBot(botResponseArr[0].data.botId);
          return botResponseArr;
        case TradingSystem.BTC:
          botData.baseAsset = CryptoAsset.BTC;
          botData.quoteAsset = CryptoAsset.ETH;
          botResponseArr[0] = await this.botclient.createBot(botData);
          await this.botclient.startBot(botResponseArr[0].data.botId);
          return botResponseArr;
        case TradingSystem.BOTH:
          botData.baseAsset = CryptoAsset.USDT;
          botData.quoteAsset = CryptoAsset.BTC;
          const bot1 = await this.botclient.createBot(botData);
          await this.botclient.startBot(bot1.data.botId);
          botData.baseAsset = CryptoAsset.BTC;
          botData.quoteAsset = CryptoAsset.ETH;
          const bot2 = await this.botclient.createBot(botData);
          await this.botclient.startBot(bot2.data.botId);
          botResponseArr.push(bot1, bot2);
          return botResponseArr;
        }
    } catch (error) {
      throw new HttpException(
        error.message,
        ResponseCode.BAD_REQUEST,
      );
    }
  }

  async getBotsByUserId(user: User): Promise<Bot[]> {
    return await this.tradingBotRepository.find({ userid: user.uuid });
  }

  async getBotByUserIdAndBaseAsset(
    user: User,
    baseasset: string,
  ): Promise<Bot> {
    return await this.tradingBotRepository.findOne({
      userid: user.uuid,
      baseasset,
    });
  }

  async stopUserBot(botId: string): Promise<void> {
    try {
      const sql =`SELECT m."url" as url
                  FROM bots as b
                  INNER JOIN  machine as m ON b."machineid"=m."machineid"
                  WHERE  b."botid"=$1`
      const machine= await getConnection().query(sql,[botId]);
      if(machine && machine[0] &&machine[0].url){
        this.botclient= new BOTClient(machine[0].url)
        const botServer = await this.botclient.ping();
        if (!botServer) {
          throw new HttpException(
            ResponseMessage.BOT_SERVER_DOWN,
            ResponseCode.BAD_REQUEST,
          );
        }
        await this.botclient.stopBot(botId);
      }
      else{
        throw new HttpException(
          ResponseMessage.BOT_SERVER_DOWN,
          ResponseCode.BAD_REQUEST,
        );
      }
      return;
    } catch (err) {
      throw new HttpException(err.message, ResponseCode.BAD_REQUEST);
    }
  }

  async restartUserBot(botId: string): Promise<void> {
    try {
      const sql =`SELECT m."url" as url
                  FROM bots as b
                  INNER JOIN  machine as m ON b."machineid"=m."machineid"
                  WHERE  b."botid"=$1`
      const machine= await getConnection().query(sql,[botId]);
      if(machine && machine[0] &&machine[0].url){
        this.botclient= new BOTClient(machine[0].url)
      const botServer = await this.botclient.ping();
      if (!botServer) {
        throw new HttpException(
          ResponseMessage.BOT_SERVER_DOWN,
          ResponseCode.BAD_REQUEST,
        );
      }
      await this.botclient.startBot(botId);
      return;
    }
    else{
      throw new HttpException(
        ResponseMessage.BOT_SERVER_DOWN,
        ResponseCode.BAD_REQUEST,
      );
    }
    } catch (err) {
      throw new HttpException(err.message, ResponseCode.BAD_REQUEST);
    }
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
   * Get user by telegram
   * @param userTelegram
   * @returns
   */
  async getUserByTelegram(userTelegram: UserTelegram) {
    const user = await this.userRepository.findOne({ userTelegram });
    return user;
  }

  /**
   * DeActivate user telegram notifications
   * @param chat_id
   * @returns
   */
  async deActivateUserNotifications(chat_id: number) {
    try {
      const userTelegram = await this.getUserTelegramByChatId(chat_id);
      if (userTelegram && userTelegram.isActive) {
        const user = await this.getUserByTelegram(userTelegram);
        await this.userRepository.update(
          { uuid: user.uuid },
          { userTelegram: null },
        );
        await this.userTelegramRepository.delete({
          chat_id: userTelegram.chat_id,
        });
        if (TelegramService.connected) {
          await this.telegramService.sendResponseToUser({
            chat_id: userTelegram.chat_id,
            parse_mode: 'HTML',
            text: TelergramBotMessages.SUCCCESSFULLY_DEACTIVATED,
          });
        }
      } else if (userTelegram && !userTelegram.isActive) {
        if (TelegramService.connected) {
          await this.telegramService.sendResponseToUser({
            chat_id: userTelegram.chat_id,
            parse_mode: 'HTML',
            text: TelergramBotMessages.ACTIVATE_FIRST,
          });
        }
      }
      return;
    } catch (err) {
      throw err;
    }
  }

  async sendTradeNotification(body: TradeNotificationDto) {
    try {
      const user = await this.get(body.userId);
      if (!user) {
        throw new HttpException(
          `User ${ResponseMessage.DOES_NOT_EXIST}`,
          ResponseCode.NOT_FOUND,
        );
      }
      if (user.userTelegram && user.userTelegram.isActive) {
        const userTelegram = user.userTelegram;
        if (
          userTelegram.systemNotificationsActive &&
          TelegramService.connected
        ) {
          await this.telegramService.sendTradeNotification(userTelegram, body);
        }
      }
      return;
    } catch (err) {
      throw err;
    }
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
      if (userTelegram) {
        if (userTelegram.isActive && TelegramService.connected) {
          await this.telegramService.sendAlreadyActivatedMessage(userTelegram);
          return;
        } else if (TelegramService.connected) {
          await this.telegramService.sendCommunicationMessage(userTelegram);
          return;
        }
      }
      const code = this.telegramService.getTelegramCode();
      const newUserTelegram = new UserTelegram();
      newUserTelegram.chat_id = chat_id;
      newUserTelegram.name = name;
      newUserTelegram.code = code;
      await this.userTelegramRepository.save(newUserTelegram);
      if (TelegramService.connected) {
        await this.telegramService.sendCommunicationMessage(newUserTelegram);
      }
      return;
    } catch (err) {
      throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }

  /**
   * Update user Telegram Notifications Creds
   * @returns
   */
  public async updateUserTelegramNotifications(
    user: User,
    telegramDto: TelegramNotifyDto,
  ): Promise<UserTelegram> {
    const userTelegram = await this.getUserTelegramByCode(telegramDto.code);
    if (!userTelegram) {
      throw new HttpException(
        `Code ${ResponseMessage.IS_INVALID}`,
        ResponseCode.BAD_REQUEST,
      );
    }
    userTelegram.bonusNotificationsActive = telegramDto.bonusNotifications;
    userTelegram.systemNotificationsActive = telegramDto.systemNotifications;
    userTelegram.promotionNotificationsActive =
      telegramDto.promotionNotifications;
    userTelegram.tradeNotificationsActive = telegramDto.tradingNotifications;
    if (!userTelegram.isActive) {
      userTelegram.isActive = true;
    }
    const updatedTelegram = await this.userTelegramRepository.save(
      userTelegram,
    );
    user.userTelegram = updatedTelegram;
    await this.userRepository.save(user);
    if (TelegramService.connected) {
      await this.telegramService.sendNotificationsMessage(updatedTelegram);
    }
    return updatedTelegram;
  }

  /**
   * Create a new user
   * @param payload
   * @returns
   */
  async create(payload: RegisterPayload, referrerName: string): Promise<User> {
    const referrer = await this.checkReferrer(referrerName);
    if (!referrer) {
      throw new HttpException(
        ResponseMessage.INVALID_REFERRER,
        ResponseCode.BAD_REQUEST,
      );
    }
    if (!referrer.planIsActive) {
      throw new HttpException(
        ResponseMessage.REFERRER_PLAN_NOT_ACTIVATED,
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
    try {
      const newUser = new User().fromDto(payload);
      newUser.userStats = await this.initializeStats();
      newUser.referralLink = this.getUserReferralLink(newUser);
      newUser.refereeUuid = referrer.uuid;
      newUser.password = await Hash.make(newUser.password);
      return await this.userRepository.save(newUser);
    } catch (err) {
      throw new HttpException(err.detail, ResponseCode.BAD_REQUEST);
    }
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
    user.activeStatus = UserActiveStatus.ENABLE;
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
  public async confirmForgotPassword(email: string, password: string) {
    const user: User = await this.userRepository.findOne({ email });
    if (user) {
      const passwordHash = await Hash.make(password);
      await this.userRepository.update({ email }, { password: passwordHash });
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
    return await this.userRepository.delete({ uuid: user.uuid });
  }

  /**
   * Generate code for profile verification Latest
   * @param User
   * @returns
   */
  async getProfileVerificationCode(user: User) {
    try {
      let token = speakeasy.totp({
        secret: process.env.OTP_KEY,
        digits: 6,
        step: 120,
      });
      await this.userRepository.update(
        { uuid: user.uuid },
        { profileCode: Number(token) },
      );
      return await this.mailerservice.sendEmailProfileVerificationCode(
        user,
        token.toString(),
      );
    } catch (err) {
      throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }

  /**
   * Profile Details After Verification
   * @param User
   * @param code
   * @returns
   */
  async getProfileDetails(user: User, code: string) {
    const verified = speakeasy.totp.verify({
      secret: process.env.OTP_KEY,
      token: code,
      step: 120,
    });

    if (user.profileCode === Number(code) && verified) {
      await this.userRepository.update(
        { uuid: user.uuid },
        { profileCode: null },
      );
      return user.toDto();
    } else {
      throw new HttpException(
        ResponseMessage.INVALID_VERIFICATION_CODE,
        ResponseCode.NOT_FOUND,
      );
    }
  }

  /**
   * Klay Wallet Address validation
   * @param email
   * @param klay
   * @returns
   */
  async validateKlaytnAddress(address: string): Promise<boolean> {
    const status = await this.klaytnService.validateKlaytnAddress(address);
    if (status) {
      return status;
    } else {
      throw new HttpException(
        ResponseMessage.INVALID_KLAYTN_ADDRESS,
        ResponseCode.BAD_REQUEST,
      );
    }
  }

  /**
   * Klay Wallet Address
   * @param payload
   * @param user
   * @returns
   */
  async updateProfileInfo(data: UserDataDto, user: User): Promise<User> {
    const exist = await this.userRepository.findOne({ email: user.email });
    if (!exist) {
      throw new HttpException(
        ResponseMessage.USER_DOES_NOT_EXIST,
        ResponseCode.NOT_FOUND,
      );
    }
    exist.klayWallet = data.address;
    exist.phoneNumber = data.phoneNumber;
    exist.fullName = data.fullName;
    exist.country = data.country;
    return await this.userRepository.save(exist);
  }

  /**
   * Get user for withdrawal
   * @param limit
   * @returns
   */
  public async getUsersForWithDrawal(limit: number) {
    return await this.userRepository.find({
      where: { balance: MoreThanOrEqual(limit) },
    });
  }

  /**
   *
   * @returns
   */
  public async validateTradeTimeStamp() {
    const users = await this.userRepository.find({
      where: { tradeExpiryDate: LessThanOrEqual(moment().unix()) },
    });
    return users;
  }

  /**
   * Validate active traders profit percentage
   * @param user
   * @returns
   */
  public async validateActiveTradersProfit(user: User) {
    const bots = await this.getBotsByUserId(user);
    let profit: number = 0;
    let percentage: number = 0;
    await Promise.all(
      bots.map(async (m) => {
        profit += await this.getBotProfit(
          m.botid,
          user.tradeStartDate,
          moment().unix(),
        );
        if (m.baseasset === CryptoAsset.BTC) {
          let profitInUsd = new bigDecimal(PriceService.btcPrice).multiply(
            new bigDecimal(profit),
          );
          percentage += Number(
            profitInUsd
              .divide(new bigDecimal(user.plan.price), 4)
              .multiply(new bigDecimal(100))
              .getValue(),
          );
        } else {
          percentage += Number(
            new bigDecimal(profit)
              .divide(new bigDecimal(user.plan.price), 4)
              .multiply(new bigDecimal(100))
              .getValue(),
          );
        }
      }),
    );

    return percentage > MaxProfitLimit ? true : false;
  }

  /**
   * Get Active Traders
   */
  public async getActiveTraders() {
    let sql = `SELECT  
                "uuid",
                "tradeStartDate",
                "tradeExpiryDate"
              FROM
               (SELECT
                  "uuid",
                  "tradeStartDate",
                  "tradeExpiryDate",
                  
                  CASE  
                    WHEN $1 BETWEEN "tradeStartDate" AND "tradeExpiryDate"
                    
                    THEN '1'
                    
                    ELSE '0'
                  END
                as activeTrader  from users) AS results  WHERE results.activeTrader='1';`;
    const result: any[] = await this.userRepository.query(sql, [
      moment().unix(),
    ]);
    const users = result.map((m) => m.uuid);
    let activeTraders: User[] = [];
    if (users.length) {
      activeTraders = await this.userRepository.find({
        where: { uuid: In(users) },
        relations: ['plan'],
      });
    }
    return activeTraders;
  }

  /**
   * Get the profit of the bot
   */
  public async getBotProfit(botId: string, from: number, to: number) {
    let sql = `SELECT 
                COALESCE(SUM(T.profit :: double precision), 0) as profit
              FROM
                bots B
                INNER JOIN slots S ON B."botid" = S."botid"
                INNER JOIN trades T ON S."slotid" = T."slotid"
              WHERE
                B."botid" = $1 AND T.date Between $2 AND $3;`;

    const trades = await this.tradingBotRepository.query(sql, [
      botId,
      from,
      to,
    ]);
    return trades[0].profit;
  }

  /**
   * Get Trades between range
   * @param botId
   * @param from
   * @param to
   * @returns
   */
  public async getTradesBetweenRange(botId: string, from: number, to: number) {
    let sql = `SELECT 
              T."date",
              T."amount" as stack,
              T."profit",
              T."profitpercentage" as variation
            FROM
              bots B
              INNER JOIN slots S ON B."botid" = S."botid"
              INNER JOIN trades T ON S."slotid" = T."slotid"
            WHERE
              B."botid" = $1 AND T.date Between $2 AND $3;`;
    const trades = await this.tradingBotRepository.query(sql, [
      botId,
      from,
      to,
    ]);
    return trades;
  }

  /**
   * Stop the user's bot when the currentDate >= TradeExpiryDate + 10 days.
   * @returns
   */
  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: JOB.TRADE_LIMIT_EXCEED,
  })
  public async tradeLimitExpiry() {
    this.loggerService.log(
      `Trade limit exceed job started at: ${moment().unix()}`,
    );
    const users = await this.userRepository.find({
      where: {
        tradeExpiryDate: LessThanOrEqual(moment().unix()),
      },
    });

    const filtered = users.filter(
      (u) => u.tradeExpiryDate + Time.TEN_DAYS <= moment().unix(),
    );
    if (!filtered.length) {
      this.loggerService.log(
        `Trade limit exceed job completed at: ${moment().unix()}`,
      );
      return;
    } else {
      await Promise.all(
        filtered.map(async (m) => {
          if (m.refereeUuid) {
            this.loggerService.warn(`Trade limit exceeded: ${m.fullName}`);
            const bots = await this.getBotsByUserId(m);
            bots.map(async (b) => {
              if (b.pid != -1) await this.stopUserBot(b.botid);
            });
          }
        }),
      );
      this.loggerService.log(
        `Trade limit exceed job completed at: ${moment().unix()}`,
      );
      return;
    }
  }

  /**
   * Stop the user's bot when the currentDate >= TradeExpiryDate + 10 days.
   * @returns
   */
  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: JOB.PLAN_EXPIRY_LIMIT_EXCEED,
  })
  public async planExpiry() {
    this.loggerService.log(
      `Plan Expiry On Time job started at: ${moment().unix()}`,
    );
    const users = await this.userRepository.find({
      planIsActive: true,
    });
    if (!users.length) {
      this.loggerService.log(
        `Plan Expiry On Time  job completed at: ${moment().unix()}`,
      );
      return;
    } else {
      await Promise.all(
        users.map(async (u: User) => {
          if (moment().unix() >= u.planExpiry && u.refereeUuid) {
            this.loggerService.warn(`Plan Expiry Time exceeded: ${u.fullName}`);
            u.plan = null;
            u.planIsActive = false;
            u.planExpiry = null;
            u.tradeStartDate = null;
            u.tradeExpiryDate = null;
            await this.userRepository.save(u);
            const bots = await this.getBotsByUserId(u);
            bots.map(async (b) => {
              if (b.pid != -1) await this.stopUserBot(b.botid);
            });
          }
        }),
      );
      this.loggerService.log(
        `Plan Expiry On Time job completed at: ${moment().unix()}`,
      );
      return;
    }
  }
}
