import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Helper } from '../helper';
import * as request from 'supertest';
import { MailService } from '../../src/utils/mailer/mail.service';
import { MailerMock } from '../mocks/mocks';

describe('BinancePlus auth test', () => {
    let app: INestApplication;
    let helper: Helper;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideProvider(MailService)
        .useValue(MailerMock)
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
            phoneNumber: "+14842918831"
        }

        await request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Authorization', helper.getAccessToken())
            .expect(200)
            .expect(({ body }) => {
                const { uuid, ...response } = body;
                expect(response).toEqual(expected)
            });
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});
