import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Helper } from '../helper';
import request from 'supertest';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { MailerMock, LoggerMock, CoinMarketMock, KlaytnServiceMock, BinanceMock,TelegramBotMock } from '../mocks/mocks';
import { ResponseMessage } from '../../src/utils/enum';
import { AppService } from '../../src/modules/main/app.service';
import { CoinGeckoMarket } from '../../src/modules/scheduler/coingecko.service';
import { KlaytnService } from '../../src/modules/klaytn/klaytn.service';
import { BinanceService } from '../../src/utils/binance/binance.service';
import { TelegramService } from '../../src/utils/telegram/telegram-bot.service';

describe('BinancePlus User test', () => {
    let app: INestApplication;
    let helper: Helper;
    let token: string;
    let server: any;
    const regDto = {
        userName: "bnptestuser32",
        fullName: "bnp user",
        country: "United States",
        email: "bnptestuser@yopmail.com",
        phoneNumber: "+14842918831",
        password: "Rnssol@21",
        passwordConfirmation: "Rnssol@21"
    }

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(MailService)
            .useValue(MailerMock)
            .overrideProvider(LoggerService)
            .useValue(LoggerMock)
            .overrideProvider(CoinGeckoMarket)
            .useValue(CoinMarketMock)
            .overrideProvider(KlaytnService)
            .useValue(KlaytnServiceMock)
            .overrideProvider(BinanceService)
            .useValue(BinanceMock)
            .overrideProvider(TelegramService)
            .useValue(TelegramBotMock)
            .compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        await AppService.startup();
        helper = new Helper(app);
        token = await helper.init();
        server = app.getHttpServer();
    });

    describe(`Get /affiliates of bnp user`, () => {
        it(`Test /register bnp user affiliates API`, async () => {
            await request(server)
                .post('/api/auth/register?referrer=john58')
                .send(regDto)
                .expect(200)
                .expect(({ body }) => {
                    expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
                });
            await helper.updateEmailConfirmation(`bnptestuser@yopmail.com`);
            await helper.updateUserPlan(`bnptestuser@yopmail.com`);
            await helper.login('bnptestuser@yopmail.com', 'Rnssol@21');

            regDto.userName = `testuser1`;
            regDto.email = `bnptestuser1@yopmail.com`;
            await request(server)
                .post('/api/auth/register?referrer=bnptestuser32')
                .send(regDto)
                .expect(200)
                .expect(({ body }) => {
                    expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
                });

            await helper.updateEmailConfirmation(`bnptestuser1@yopmail.com`);
            await helper.updateUserPlan(`bnptestuser1@yopmail.com`);

            regDto.userName = `testuser2`;
            regDto.email = `bnptestuser2@yopmail.com`;
            await request(server)
                .post('/api/auth/register?referrer=testuser1')
                .send(regDto)
                .expect(200)
                .expect(({ body }) => {
                    expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
                });
            await helper.updateEmailConfirmation(`bnptestuser2@yopmail.com`);
            await helper.updateUserPlan(`bnptestuser2@yopmail.com`);
        });

        it(`Test get user/affiliates of bnp user after plan purchase API`, async () => {
            const expectedAffiliates = [
                { level: 1, fullName: `bnp user`, tradingSystem: null, userName: `testuser1`, phoneNumber: '+14842918831', plan_name: 'Silver' },
                { level: 2, fullName: `bnp user`, tradingSystem: null, userName: `testuser2`, phoneNumber: '+14842918831', plan_name: 'Silver' }
            ];
            const expectedAffiliatesCount = [{ level: 1, total_affiliates: 1 }, { level: 2, total_affiliates: 1 }];
            await request(server)
                .get('/api/user/affiliates')
                .set('Authorization', helper.getAccessToken())
                .expect(200)
                .expect(({ body }) => {
                    const { affiliates, affiliatesCount } = body.data;
                    affiliates.map(affiliate => delete affiliate.createdAt);
                    expect(affiliates).toEqual(expectedAffiliates);
                    expect(affiliatesCount).toEqual(expectedAffiliatesCount);
                });
        });

        it(`Test get user/parents of bnp user 2  API`, async () => {
            await helper.login('bnptestuser2@yopmail.com', 'Rnssol@21');
            const expectedParents = [
                { level: 1, fullName: `bnp user`, userName: `testuser1`, balance: 0,parent_depth_level: 7, plan_name: 'Silver' },
                { level: 2, fullName: `bnp user`, userName: `bnptestuser32`, balance: 0,parent_depth_level: 7, plan_name: 'Silver' }
            ];
            await request(server)
                .get('/api/user/parents')
                .set('Authorization', helper.getAccessToken())
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data).toEqual(expectedParents);
                });
        });
        it(`Test get user/parents of bnp user 2 after plan purchase to verify balance  API`, async () => {
            const expectedParents = [
                { level: 1, fullName: `bnp user`,parent_depth_level: 7, userName: `testuser1`, balance: 0, plan_name: 'Silver' },
                { level: 2, fullName: `bnp user`,parent_depth_level: 7, userName: `bnptestuser32`, balance: 0, plan_name: 'Silver' }
            ];
            await request(server)
                .get('/api/user/parents')
                .set('Authorization', helper.getAccessToken())
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data).toEqual(expectedParents);
                });
        });

        it(`Test get user/plan_by_id API`, async () => {
            const expectedObj = { planId: 1, planName: 'Silver', price: 100, levels: 7, earningLimit: 500 };
            await request(server)
                .get('/api/user/plan_by_id/1')
                .set('Authorization', helper.getAccessToken())
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data).toEqual(expectedObj);
                });
        });

        it(`Test post user/update_plan/:planId API`, async () => {
            await request(server)
                .post('/api/user/update_plan/3')
                .set('Authorization', helper.getAccessToken())
                .expect(200)
        });
        it(`Test post user/binance_credentials API`, async () => {
            const dtoObj = {apiKey: "asdadadasdsfsd",apiSecret:"fdasfadfsdsfsdfsd",tradingSystem: 'both'};
            await request(server)
                .post('/api/user/binance_credentials')
                .set('Authorization', helper.getAccessToken())
                .send(dtoObj)
                .expect(200)
        });


        it(`Test /webhook bnp telegram bot webhook API`, async () => {
            await request(server)
                .post('/api/user/webhook/5060344605:AAHuBFdqTZzKg_avhYCRP6DkZrJSXFFAqa4')
                .send({message:{chat:{id: 154090},from:{first_name: 'HasNain'},text: 'hello'}})
                .expect(200)
        });

        it(`Test /telegram_code bnp telegram notifications enabling API`, async () => {
            await request(server)
                .post('/api/user/telegram_code')
                .set('Authorization',helper.getAccessToken())
                .send({
                    code: 12345678,
                    tradingNotifications: true,
                    systemNotifications: true,
                    bonusNotifications: true,
                    promotionNotifications: true
                })
                .expect(200)
        });

        it(`Test /webhook bnp telegram bot webhook API`, async () => {
            await request(server)
                .post('/api/user/webhook/5060344605:AAHuBFdqTZzKg_avhYCRP6DkZrJSXFFAqa4')
                .send({message:{chat:{id: 154090},from:{first_name: 'HasNain'},text: 'hello'}})
                .expect(200)
        });
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});
