import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/main/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Helper } from '../helper';

describe('BinancePlus referrals test', () => {
    let app: INestApplication;
    let helper: Helper;
    let token: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
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