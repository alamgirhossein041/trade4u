import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Helper } from '../helper';
import request from 'supertest';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { MailerMock, LoggerMock, CoinMarketMock, KlaytnServiceMock, TelegramBotMock } from '../mocks/mocks';
import { AppService } from '../../src/modules/main/app.service';
import { ResponseMessage } from '../../src/utils/enum';
import { CoinGeckoMarket } from '../../src/modules/scheduler/coingecko.service';
import { KlaytnService } from '../../src/modules/klaytn/klaytn.service';
import { TelegramService } from '../../src/utils/telegram/telegram-bot.service';

describe('BinancePlus auth test', () => {
    let app: INestApplication;
    let helper: Helper;
    let server: any;

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
            .overrideProvider(TelegramService)
            .useValue(TelegramBotMock)
            .compile();
            
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        helper = new Helper(app);
        server = app.getHttpServer();
        await AppService.startup();
    });

    it(`Test /genesis_user register API`, async () => {
        await helper.register();
    });

    it(`Test /login genesis user API`, async () => {
        await helper.login('testuser@yopmail.com','Test@1234');
    });

    it(`Test /me genesis user API`, async () => {
        const expected = {
            userName: "john58",
            fullName: "john smith",
            country: "United States",
            email: "testuser@yopmail.com",
            emailConfirmed: true,
            apiKey: null,
            apiSecret: null,
            tradingSystem: null,
            balance: 0,
            phoneNumber: "+14842918831",
            klayWallet: null,
            planIsActive: true,
            referralLink: process.env.APP_URL + `register?referrer=john58`,
            refereeUuid: null,
            userTelegram: null
        }

        await request(server)
            .get('/api/auth/me')
            .set('Authorization', helper.getAccessToken())
            .expect(200)
            .expect(({ body }) => {
                const { uuid, createdAt, updatedAt,plan,userStats, ...response } = body;
                expect(response).toEqual(expected)
            });
    });

    it(`Test /register bnp user API`, async () => {
        const regDto = {
            userName: "bnptestuser32",
            fullName: "bnp user",
            country: "United States",
            email: "bnptestuser@yopmail.com",
            phoneNumber: "+14842918831",
            password: "Rnssol@21",
            passwordConfirmation: "Rnssol@21"
        }

        await request(server)
            .post('/api/auth/register?referrer=john58')
            .send(regDto)
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
            });
    });

    it(`Test /confirmEmail of bnp user`, async () => {
        await helper.updateEmailConfirmation(`bnptestuser@yopmail.com`);
    });

    it(`Test /update plan of bnp user`, async () => {
        await helper.updateUserPlan(`bnptestuser@yopmail.com`);
    });

    it(`Test /login bnp user API`, async () => {
        await helper.login('bnptestuser@yopmail.com','Rnssol@21');
    });

    it(`Test /forgot_password bnp user API`, async () => {
        await request(server)
            .post('/api/auth/forgot_password')
            .send({email:`bnptestuser@yopmail.com`})
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.FORGOT_PASSWORD_EMAIL);
            });
    });

    it(`Test /confirm_forgot_password bnp user API`, async () => {
        await request(server)
            .post('/api/auth/confirm_forgot_password')
            .set('Authorization', helper.getAccessToken())
            .send({password: 'Rnssol@12'})
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.SUCCESS);
            });
    });

    it(`Test /login bnp user after forgot password change API`, async () => {
        await helper.login('bnptestuser@yopmail.com','Rnssol@12');
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});
