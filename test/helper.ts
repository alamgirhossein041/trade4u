import { INestApplication } from "@nestjs/common";
import request from 'supertest';
import { getConnection } from 'typeorm';
import { User } from "../src/modules/user";

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
        await this.login();
        return this.token;
    }

    /**
     * 
     * @returns 
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
     * Login a test user
     * @returns 
     */
    public async login() {
        const testUserDto = {
            email: 'testuser@yopmail.com',
            password: 'Test@1234',
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
    public async removeDefaultUser() {
        const email = `testuser@yopmail.com`;
        const repository = getConnection().getRepository(User);
        return await repository.delete({ email });
    }

    /**
     * clear `test` database
     */
    public async clearDB() {
        const entities = getConnection().entityMetadatas;
        for (const entity of entities) {
            if (entity.name === `User`)
                continue;
            const repository = getConnection().getRepository(entity.name);
            await repository.query(`TRUNCATE ${entity.tableName};`);
        }
    }
}
