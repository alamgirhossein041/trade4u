import { INestApplication } from "@nestjs/common";
import request from 'supertest';
import { getConnection } from 'typeorm';
import { Plan } from "../src/modules/seed/plan.entity";
import { User } from "../src/modules/user/user.entity";
import { Account } from "../src/modules/klaytn/account.entity";
import { WebSocketServer } from 'ws';
import { ResponseMessage } from '../src/utils/enum';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { BonusType } from "../src/modules/payment/commons/payment.enum";
import { DepositCompletedEvent } from "../src/modules/scheduler/deposit.complete.event";
import { Events } from "../src/modules/scheduler/commons/scheduler.enum";

export class Helper {
    private app: INestApplication;
    private testWebSocketServer: WebSocketServer;
    private eventEmitter: EventEmitter2;
    private token: string;

    constructor(app) {
        this.app = app;
        this.eventEmitter = new EventEmitter2();
    }

    /**
     * Initialize testsuite
     * @returns accessToken
     */
    public async init() {
        const email = `testuser@yopmail.com`;
        const repository = getConnection().getRepository(User);
        const exists = await repository.findOne({ email });
        if (!exists) {
            await this.register();
        }
        await this.login(email, 'Test@1234');
        return this.token;
    }

    /**
     * Get Jwt Token of User
     * @returns JwtToken
     */
    public getAccessToken() {
        return `Bearer ${this.token}`;
    }

    /**
     * Register a test user
     * @returns 
     */
    public async register() {

        const testUserDto = {
            userName: 'john58',
            fullName: 'john smith',
            email: 'testuser@yopmail.com',
            country: 'United States',
            phoneNumber: '+14842918831',
            password: 'Test@1234',
            passwordConfirmation: 'Test@1234'
        }

        await request(this.app.getHttpServer())
            .post('/api/auth/genesis_user')
            .send(testUserDto)
            .expect(201);
        return;
    }

    /**
    * Update Email Confirmation of user
    * @returns 
    */
    public async updateEmailConfirmation(email: string) {
        const repository = getConnection().getRepository(User);
        return await repository.update({ email }, { emailConfirmed: true });
    }

    /**
    * Update Email Confirmation of user
    * @returns 
    */
    public async getPlan() {
        const repository = getConnection().getRepository(Plan);
        return await repository.findOne({ planId: 1 });
    }

    /**
    * Update Plan of user
    * @returns 
    */
    public async updateUserPlan(email: string) {
        const plan = await this.getPlan();
        const repository = getConnection().getRepository(User);
        return await repository.update({ email }, { plan: plan, planIsActive: true });
    }

    /**
    * Create Account
    * @returns 
    */
    public async createAccount(position: number) {
        const account = new Account();
        account.address = `0x141f205b4e89b3894d296b4b85083e30951d7bb6`;
        account.isHalt = false;
        const repository = getConnection().getRepository(Account);
        return await repository.save(account);
    }

    /**
    * Get Plan By Id
    * @returns 
    */
    public async getUserByEmail(email: string) {
        const repository = getConnection().getRepository(User);
        return await repository.findOne({ email },{relations:['userStats']});
    }

    /**
     * Login a test user
     * @returns 
     */
    public async login(mail: string, pass: string) {
        const testUserDto = {
            email: mail,
            password: pass,
        }
        await request(this.app.getHttpServer())
            .post('/api/auth/login')
            .send(testUserDto)
            .expect(201)
            .expect(({ body }) => {
                expect(body.accessToken).toBeDefined();
                this.token = body.accessToken;
            });
    }

    /**
     * Login a test user
     * @returns 
     */
    public async insertUserTree() {
        const regDto = {
        userName: "bnptestuser32",
        fullName: "bnp user",
        country: "United States",
        email: "bnptestuser@yopmail.com",
        phoneNumber: "+14842918831",
        password: "Rnssol@21",
        passwordConfirmation: "Rnssol@21",
        profileCode: "123456"
    }
        await request(this.app.getHttpServer())
            .post('/api/auth/register?referrer=john58')
            .send(regDto)
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
            });
        await this.updateEmailConfirmation(`bnptestuser@yopmail.com`);
        await this.updateUserPlan(`bnptestuser@yopmail.com`);

        regDto.userName = `testuser1`;
        regDto.email = `bnptestuser1@yopmail.com`;
        await request(this.app.getHttpServer())
            .post('/api/auth/register?referrer=bnptestuser32')
            .send(regDto)
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
            });

        await this.updateEmailConfirmation(`bnptestuser1@yopmail.com`);
        await this.updateUserPlan(`bnptestuser1@yopmail.com`);

        regDto.userName = `testuser2`;
        regDto.email = `bnptestuser2@yopmail.com`;
        await request(this.app.getHttpServer())
            .post('/api/auth/register?referrer=testuser1')
            .send(regDto)
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
            });
        await this.updateEmailConfirmation(`bnptestuser2@yopmail.com`);
        await this.updateUserPlan(`bnptestuser2@yopmail.com`);

        regDto.userName = `testuser3`;
        regDto.email = `bnptestuser3@yopmail.com`;
        await request(this.app.getHttpServer())
            .post('/api/auth/register?referrer=testuser2')
            .send(regDto)
            .expect(200)
            .expect(({ body }) => {
                expect(body.message).toEqual(ResponseMessage.CONFIRAMATION_EMAIL_SENT);
            });
        await this.updateEmailConfirmation(`bnptestuser3@yopmail.com`);
    }

    public async getEventObject(email: string) {
        const user = await this.getUserByEmail(email);
        const depositCompletedEvent = new DepositCompletedEvent();
        depositCompletedEvent.bonusType = BonusType.LISENCE;
        depositCompletedEvent.user = user; 
        return depositCompletedEvent;
    }

    /**
     * Remove Default user i.e testuser
     */
    public async removeUser(email: string) {
        const repository = getConnection().getRepository(User);
        return await repository.delete({ email });
    }

    /**
     * clear `test` database
     */
    public async clearDB() {
        const entities = getConnection().entityMetadatas;
        for (const entity of entities) {
            const repository = getConnection().getRepository(entity.name);
            await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
        }
    }

    /**
     * 
     */
    public startTestWebSocketServer() {
        try {
            this.testWebSocketServer = new WebSocketServer({ port: 1234 });
        } catch (e) {
            console.error('Unable to start Mock WebSocketServer', e);
        }
    }

    public getJob() {
        try {
            const block = {
                baseFeePerGas: "0x0",
                blockScore: "0x1",
                extraData: "0xd883010801846b6c617988676f312e31352e37856c696e757800000000000000f90164f85494571e53df607be97431a5bbefca1dffe5aef56f4d945cb1a7dccbd0dc446e3640898ede8820368554c89499fb17d324fa0e07f23b49d09028ac0919414db694b74ff9dea397fe9e231df545eb53fe2adf776cb2b841cb3a800ba5ed625411532fa3e21c90f22e56dbda4b3c296a9b84f79c8fb36ab32bc31dc449a081ec4a872079c6021c59baf9109d20dd246c10503ccb61ae4e7b00f8c9b841fe82ff1f389fb684759dee4c72d48382c99e3308158d18037e4ed2ec1874ed1f6b9fcfc180ca2cce53f0d724afe95a8bd5811ca3d38231c84ec911f1540cbeb300b841b5cbf25e3dd684b5238846e833f4a584936d60a1091039d801979791144013a36d625b27f42b114b565c45bf9659076604a151162e1f574314d956e4005ea8b801b84150b8c3ed7cf7c8f8d96c78fa6347ee1328265209d0a0ad306cc5e58356bb08e754f713b24f12b61a0a785eb21069e68dd00c649c26c4cc18993dd99def6a451a00",
                gasUsed: "0x0",
                governanceData: "0x",
                hash: "0x60d8aa4167e7eca1a196654c8e2ed80a5d10f74834399be6cecf184b7b6b1cda",
                logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                number: "0x528a0c8",
                parentHash: "0x12545bc685f8633b264a4d4b6738ca0bdc6b6b1c79a585b181640f54d704938d",
                receiptsRoot: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
                reward: "0xa86fd667c6a340c53cc5d796ba84dbe1f29cb2f7",
                stateRoot: "0x718a80ccf97b5183da398d3b3e06a2d124e4c0dc4a3d3e36cf4a2fc22aee2192",
                timestamp: "0x623c4c2a",
                timestampFoS: "0x0",
                transactionsRoot: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
            };
            return block;
        } catch (e) {
            console.error('Unable to start Mock WebSocketServer', e);
        }
    }

    /**
     * 
     */
    public stopTestWebSocketServer() {
        try {
            this.testWebSocketServer.close();
        } catch (e) {
            console.error('Unable to stop Mock WebSocketServer', e);
        }
    }
}