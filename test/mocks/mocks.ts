import * as http from "http";
import express, { Request, Response } from "express";

export const MailerMock = {
    sendEmailConfirmation: jest.fn(),
    sendForgotPasswordMail: jest.fn(),
}
export const LoggerMock = {
    log: jest.fn((value: string) => {
        return;
    }),
    error: jest.fn((value: string) => {
        return;
    }),
    setContext: jest.fn((value: string) => {
        return;
    })
}

export const CoinMarketMock = {
    ping: jest.fn((value: string) => {
        return true;
    }),
    getPrice: jest.fn((value: string) => {
        let object = {};
        object['klay-token'] = {};
        object['klay-token']['usd'] = 1.21
        object['klay-token']['last_updated_at'] = 1646304806;
        return object;
    }),
};


export class MockOctetServer {
    private server: http.Server;

    private app: express.Application;

    constructor(port: number, done: () => void) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.server.listen(port, () => {
            done();
        });

        this.app.post('/KLAY/address', (req: Request, res: Response) => {
            const addresses = [{}];
            addresses[0] = {
                keyIndex: 1,
                address: `0x141f205b4e89b3894d296b4b85083e30951d7bb6`,
            }
            return res.status(200).send({ addresses });
        })
    }

}