import { INestApplication } from "@nestjs/common";
import request from 'supertest';
import { getConnection } from 'typeorm';
import { Plan } from "../src/modules/seed/plan.entity";
import { User } from "../src/modules/user/user.entity";
import { Account } from "../src/modules/klaytn/account.entity";
const RedisServer = require('redis-server');

export class Helper {
    private app: INestApplication;
    private token: string;

    constructor(app) {
        this.app = app;
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
        return await repository.findOne({ email });
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
    public async startLocalRedisServer() {
        const MOCK_SERVER_PORT = 6379;
        try {
            const server = new RedisServer();
            await server.open({ port: MOCK_SERVER_PORT });
        } catch (e) {
            console.error('unable to start local redis-server', e);
            process.exit(1);
        }
        return MOCK_SERVER_PORT;

    }
}