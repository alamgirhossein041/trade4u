import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Helper } from '../helper';
import request from 'supertest';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { MailerMock, LoggerMock } from '../mocks/mocks';
import { ResponseMessage } from '../../src/utils/enum';
import { AppService } from '../../src/modules/main/app.service';

describe('BinancePlus auth test', () => {
    let app: INestApplication;
    let helper: Helper;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(MailService)
            .useValue(MailerMock)
            .overrideProvider(LoggerService)
            .useValue(LoggerMock)
            .compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        helper = new Helper(app);
    });

    it(`Test register /genesis_user API`, async () => {
        await helper.register();
        await helper.updateEmailConfirmation(`testuser@yopmail.com`)
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
            balance: 0,
            phoneNumber: "+14842918831",
            planIsActive: false,
            referralLink: process.env.APP_URL + `signup?referrer=john58`,
            refereeUuid: null
        }

        await request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Authorization', helper.getAccessToken())
            .expect(200)
            .expect(({ body }) => {
                const { uuid, createdAt, updatedAt,plan, ...response } = body;
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

        await request(app.getHttpServer())
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

    it(`Test /me bnp user API`, async () => {
        const expectedbnpuser = {
            userName: "bnptestuser32",
            fullName: "bnp user",
            country: "United States",
            email: "bnptestuser@yopmail.com",
            emailConfirmed: true,
            apiKey: null,
            apiSecret: null,
            balance: 0,
            phoneNumber: "+14842918831",
            planIsActive: false,
            referralLink: process.env.APP_URL + `signup?referrer=bnptestuser32`
        }

        await request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Authorization', helper.getAccessToken())
            .expect(200)
            .expect(({ body }) => {
                const { uuid,refereeUuid,createdAt, updatedAt,plan, ...response } = body;
                expect(response).toEqual(expectedbnpuser)
            });
    });

    it(`Test /forgot_password bnp user API`, async () => {
        await request(app.getHttpServer())
            .get('/api/auth/forgot_password?email=bnptestuser@yopmail.com')
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.FORGOT_PASSWORD_EMAIL);
            });
    });

    it(`Test /confirm_forgot_password bnp user API`, async () => {
        await request(app.getHttpServer())
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
