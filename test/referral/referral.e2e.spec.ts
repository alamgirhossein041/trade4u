import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from '../../src/utils/logger/logger.service';
import { MailService } from '../../src/utils/mailer/mail.service';
import { LoggerMock, MailerMock, SchedulerMock } from '../mocks/mocks';
import { Helper } from '../helper';
import { SchedulerService } from '../../src/modules/scheduler/scheduler.service';

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
            .overrideProvider(SchedulerService)
            .useValue(SchedulerMock)
            .compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        helper = new Helper(app);
        token = await helper.init();
    });

    it(`Test referrals`, async() => {
        
    });

    afterAll(async () => {
        await helper.clearDB();
        await app.close();
    })
});