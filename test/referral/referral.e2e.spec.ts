import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { CoinMarketMock, KlaytnServiceMock, LoggerMock, MailerMock } from '../mocks/mocks';
import { AppService } from '../../src/modules/main/app.service';
import { Helper } from '../helper';
import { CoinGeckoMarket } from '../../src/modules/scheduler/coingecko.service';
import { KlaytnService } from '../../src/modules/klaytn/klaytn.service';

describe('BinancePlus referrals test', () => {
    let app: INestApplication;
    let helper: Helper;
    let token: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(LoggerService)
            .useValue(LoggerMock)
            .overrideProvider(MailService)
            .useValue(MailerMock)
            .overrideProvider(CoinGeckoMarket)
            .useValue(CoinMarketMock)
            .overrideProvider(KlaytnService)
            .useValue(KlaytnServiceMock)
            .compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        helper = new Helper(app);
        await AppService.startup();
        token = await helper.init();
    });

    it(`Test referrals`, async() => {
        
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});