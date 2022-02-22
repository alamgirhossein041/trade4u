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

    beforeAll(async () => {
        await helper.removeDefaultUser();
    })

    it(`Test /genesis_user API`, async () => {
        await helper.register();
    });

    it(`Test /login API`, async () => {
        await helper.login();
    });

    it(`Test /me API`, async () => {
        const expected = {
            userName: "john58",
            fullName: "john smith",
            country: "United States",
            email: "testuser@yopmail.com",
            emailConfirmed: false,
            apiKey: null,
            apiSecret: null,
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
                const { uuid, createdAt, updatedAt, ...response } = body;
                expect(response).toEqual(expected)
            });
    });

    it(`Test /register API`, async () => {
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


    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});
