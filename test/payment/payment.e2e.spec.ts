import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { CoinMarketMock, LoggerMock, MailerMock, MockOctetServer } from '../mocks/mocks';
import { Helper } from '../helper';
import { CoinGeckoMarket } from '../../src/modules/scheduler/coingecko.service';
import request from 'supertest';
import { AppService } from '../../src/modules/main/app.service';
import { DepositWebHook } from '../../src/modules/payment/commons/payment.dtos';

describe('BinancePlus payment test', () => {
    let app: INestApplication;
    let helper: Helper;
    let token: string;
    let server: any;
    let payment_Id: string;
    let octetServer: MockOctetServer;
    let webhookObject: DepositWebHook = {
        id: 202870,
        coinSymbol: 'KLAY',
        fromAddress: '0x161f205b4e90b3894e296b4c85093e30951d7bb6',
        toAddress: '0x141f205b4e89b3894d296b4b85083e30951d7bb6',
        amount: '123.9669',
        txid: '0x08fb42bfb7dd3ca08d373151c46f465c235b81444a75137eb98bab4f15aca091',
        outputIndex: -1,
        blockHeight: 84635086,
        dwDate: '2022-03-02T16:02:40',
        dwModifiedDate: '2022-03-02T16:02:40',
        type: 'EXTERNAL_TO_INTERNAL'
    }

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
        (async () => {
            return new Promise<void>((resolve, reject) => {
                octetServer = new MockOctetServer(4846, resolve);
            })
        })();
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
                payment_Id = body.data.items[0].paymentId;
                const { paymentId, createdAt, expireAt, paidAt, ...payment } = body.data.items[0];
                expect(payment).toEqual(expected);
            });
    });

    it(`Test /address API`, async () => {
        const expected = {
            position: 1,
            address: '0x141f205b4e89b3894d296b4b85083e30951d7bb6',
            isHalt: true
        }
        await request(server)
            .post('/api/payment/address')
            .query({ paymentId: payment_Id })
            .set('Authorization', helper.getAccessToken())
            .expect(201)
            .expect(({ body }) => {
                expect(body.data).toEqual(expected);
            });
    })

    it(`Test /deposit_webhook API`, async () => {

        const accountBefore = await helper.getAccountByPosition(1);
        expect(accountBefore.isHalt).toBe(true);

        await request(server)
            .post('/api/payment/deposit_webhook')
            .send(webhookObject)
            .expect(200)

        const accountAfter = await helper.getAccountByPosition(1);
        expect(accountAfter.isHalt).toBe(false);
    });

    it(`Test /deposit_recovery_process Routine`, async () => {
        await helper.updateAccountHaltState(1, true);
        await helper.attachAccountToPayment(1,`2`);
        const accountBefore = await helper.getAccountByPosition(1);
        expect(accountBefore.isHalt).toBe(true);

        await request(server)
            .get('/api/payment/deposit_recovery')
            .expect(200)

        const accountAfter = await helper.getAccountByPosition(1);
        expect(accountAfter.isHalt).toBe(false);

    });

    afterAll(async () => {
        octetServer.stop();
        await helper.clearDB();
        await app.close();
    })
});