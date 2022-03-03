import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Helper } from '../helper';
import request from 'supertest';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { MailerMock, LoggerMock, SchedulerMock } from '../mocks/mocks';
import { ResponseMessage } from '../../src/utils/enum';
import { AppService } from '../../src/modules/main/app.service';
import { SchedulerService } from '../../src/modules/scheduler/scheduler.service';

describe('BinancePlus auth test', () => {
    let app: INestApplication;
    let helper: Helper;
    let token: string;
    let  server: any;
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
            .overrideProvider(SchedulerService)
            .useValue(SchedulerMock)
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
                { level: 1, fullName: `bnp user`, userName: `testuser1`, balance: 0, plan_name: 'Silver' },
                { level: 2, fullName: `bnp user`, userName: `bnptestuser32`, balance: 0, plan_name: 'Silver' }
            ];
            await request(server)
                .get('/api/user/parents')
                .set('Authorization', helper.getAccessToken())
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data).toEqual(expectedParents);
                });
        });

        it(`Test post user/purchase_plan of bnp user 2  API`, async () => {
            await request(server)
                .post('/api/user/purchase_plan')
                .set('Authorization', helper.getAccessToken())
                .send({ planId: 3 })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.message).toEqual(ResponseMessage.SUCCESS);
                });

        });
        it(`Test get user/parents of bnp user 2 after plan purchase to verify balance  API`, async () => {
            const expectedParents = [
                { level: 1, fullName: `bnp user`, userName: `testuser1`, balance: 0, plan_name: 'Silver' },
                { level: 2, fullName: `bnp user`, userName: `bnptestuser32`, balance: 0, plan_name: 'Silver' }
            ];
            await request(server)
                .get('/api/user/parents')
                .set('Authorization', helper.getAccessToken())
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data).toEqual(expectedParents);
                });
        });
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});
