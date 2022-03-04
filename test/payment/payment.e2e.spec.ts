import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { CoinMarketMock, LoggerMock, MailerMock } from '../mocks/mocks';
import { Helper } from '../helper';
import { CoinGeckoMarket } from '../../src/modules/scheduler/coingecko.service';
import request from 'supertest';
import { AppService } from '../../src/modules/main/app.service';

describe('BinancePlus payment test', () => {
    let app: INestApplication;
    let helper: Helper;
    let token: string;
    let server: any;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(LoggerService)
            .useValue(LoggerMock)
            .overrideProvider(MailService)
            .useValue(MailerMock)
            .overrideProvider(CoinGeckoMarket)
            .useValue(CoinMarketMock)
            .compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        helper = new Helper(app);
        token = await helper.init();
        server = app.getHttpServer();
        await AppService.startup();
    });

    it(`Test /order_plan API`, async () => {
        await request(server)
            .post('/api/payment/order_plan/1')
            .set('Authorization', helper.getAccessToken())
            .expect(201);
    });

    it(`Test /payment_list API`, async () => {
        const expected = { amountUSD: 150, amountKLAY: 123.9669, status: 'pending' };
        await request(server)
            .get('/api/payment/payment_list')
            .set('Authorization', helper.getAccessToken())
            .expect(200)
            .expect(({ body }) => {
                const { paymentId, createdAt, expireAt, paidAt, ...payment } = body.data.items[0];
                expect(payment).toEqual(expected);
            });
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});