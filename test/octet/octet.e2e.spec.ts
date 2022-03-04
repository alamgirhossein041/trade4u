import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { CoinMarketMock, LoggerMock, MailerMock, MockOctetServer } from '../mocks/mocks';
import { Helper } from '../helper';
import request from 'supertest';
import { CoinGeckoMarket } from '../../src/modules/scheduler/coingecko.service';

describe('BinancePlus octet test', () => {
    let app: INestApplication;
    let helper: Helper;
    let token: string;
    let server: any;
    let octectServer: MockOctetServer;

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
        (async () => {
            return new Promise<void>((resolve, reject) => {
                octectServer = new MockOctetServer(4846, resolve);
            })
        })();
    });

    it(`Test /account API`, async () => {
        const expected = {
            position: 1,
            address: '0x141f205b4e89b3894d296b4b85083e30951d7bb6',
            isHalt: false
        }
        await request(server)
            .get('/api/octet/account')
            .set('Authorization', helper.getAccessToken())
            .expect(201)
            .expect(({ body }) => {
                expect(body.data).toEqual(expected);
            });
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});