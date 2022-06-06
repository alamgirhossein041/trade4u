import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { CaverMock, CoinMarketMock, EventEmitterMock, GcpSmMock, LoggerMock, MailerMock } from '../mocks/mocks';
import { Helper } from '../helper';
import { CoinGeckoMarket } from '../../src/modules/price/coingecko.service';
import request from 'supertest';
import { AppService } from '../../src/modules/main/app.service';
import { BlockProcessor } from '../../src/modules/scheduler/block.processor';
import { BlockProcess } from '../../src/utils/enum';
import { CaverService } from '../../src/modules/klaytn/caver.service';
import { EventEmitter } from '../../src/modules/scheduler/event.emitter';
import { CompensationTransaction } from '../../src/modules/payment/compensation.transaction';
import { GcpSecretService } from '../../src/utils/secret-manager/gcp.sm.service';
var rimraf = require("rimraf");

describe('Trade4u payment test', () => {
    let app: INestApplication;
    let helper: Helper;
    let blockProcessService: BlockProcessor;
    let compensationTransaction: CompensationTransaction;
    let server: any;
    let job: any = {};
    let payment_Id: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(LoggerService)
            .useValue(LoggerMock)
            .overrideProvider(MailService)
            .useValue(MailerMock)
            .overrideProvider(CoinGeckoMarket)
            .useValue(CoinMarketMock)
            .overrideProvider(CaverService)
            .useClass(CaverMock)
            .overrideProvider(EventEmitter)
            .useValue(EventEmitterMock)
            .overrideProvider(GcpSecretService)
            .useValue(GcpSmMock)
            .compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        blockProcessService = app.get(BlockProcessor);
        compensationTransaction = app.get(CompensationTransaction);
        helper = new Helper(app);
        helper.startTestWebSocketServer();
        await AppService.startup();
        await helper.init();
        server = app.getHttpServer();
    });
    it(`Test /register bnp user affiliates API`, async () => {
        await helper.insertUserTree();
        await helper.login('bnptestuser3@yopmail.com', 'Rnssol@21');
    });

    it(`Test /order_plan API`, async () => {
        await request(server)
            .post('/api/payment/order_plan/2')
            .set('Authorization', helper.getAccessToken())
            .expect(201);
    });

    it(`Test /payment_list API`, async () => {
        const expected = { amountUSD: 200, amountKLAY: 165.2893, status: 'pending', type: 'Activation-Gold' };
        await request(server)
            .get('/api/payment/payment_list')
            .set('Authorization', helper.getAccessToken())
            .expect(200)
            .expect(({ body }) => {
                payment_Id = body.data.items[0].paymentId;
                const { paymentId, createdAt, expireAt, paidAt, pdf, ...payment } = body.data.items[0];
                expect(payment).toEqual(expected);
            });
    });

    it(`Test /address API`, async () => {
        await request(server)
            .post('/api/payment/address')
            .query({ paymentId: payment_Id })
            .set('Authorization', helper.getAccessToken())
            .expect(201)
            .expect(({ body }) => {
                CaverMock.accountAddress = body.data.address;
            })
    });

    it(`Test Transaction Processing Function`, async () => {
        const jobData = helper.getJob();
        job.data = { block: jobData };
        await blockProcessService.handleBlock(job).then((result) => {
            expect(result).toEqual(BlockProcess.PROCESS_COMPLETED);
        });
    });

    it(`Test Check Earning Limit Of license purchaser`, async () => {
        const user = await helper.getUserByEmail('bnptestuser3@yopmail.com');
        expect(user.balance).toEqual(0);
        expect(user.userStats.consumed_amount).toEqual(0);
        expect(user.userStats.earning_limit).toEqual(1000);
    });

    it(`Test Compensation Transaction Processing Function`, async () => {
        const eventObj = await helper.getEventObject('bnptestuser3@yopmail.com');
        await compensationTransaction.initCompensationTransaction(eventObj).then(async () => {
            const parent1 = await helper.getUserByEmail('bnptestuser2@yopmail.com');
            const parent2 = await helper.getUserByEmail('bnptestuser1@yopmail.com');
            const parent3 = await helper.getUserByEmail('bnptestuser@yopmail.com');
            expect(parent1.balance).toEqual(20)
            expect(parent1.userStats.consumed_amount).toEqual(20);
            expect(parent2.balance).toEqual(10)
            expect(parent2.userStats.consumed_amount).toEqual(10);
            expect(parent3.balance).toEqual(8)
            expect(parent3.userStats.consumed_amount).toEqual(8);
        })
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
        rimraf.sync(process.env.KEY_STORE_PATH);
        helper.stopTestWebSocketServer();
    })
});