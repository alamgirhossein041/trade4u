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

        this.app.get('/KLAY/tx/list', (req: Request, res: Response) => {
            let deposits = [{}];
            deposits = [
                {
                    id: 202870,
                    customer_idx: 932,
                    coin_symbol: "KLAY",
                    from_address: "0x6B7F0A409a17E6009a202d488C69Ad7E55Fd6f1c",
                    to_address: "0x141f205b4e89b3894d296b4b85083e30951d7bb6",
                    amount: "123.9669",
                    txid: "0x08fb42bfb7dd3ca08d373151c46f465c235b81444a75137eb98bab4f15aca091",
                    output_index: -1,
                    data: null,
                    block_height: 84635088,
                    dw_date: "2022-03-02T16:02:40",
                    dw_modified_date: "2022-03-02T16:02:40",
                    tx_hash: "0x08fb42bfb7dd3ca08d373151c46f465c235b81444a75137eb98bab4f15aca091",
                    confirmations: 434940
                },
                {
                    id: 202876,
                    customer_idx: 932,
                    coin_symbol: "KLAY",
                    from_address: "0x6B7F0A409a17E6009a202d488C69Ad7E55Fd6f1c",
                    to_address: "0x141f205b4e89b3894d296b4b85083e30951d7bb6",
                    amount: "123.9669",
                    txid: "0x08fb42bfb7dd3ca08d373151c46f465c235b81444a75137eb98bab4f15aca091",
                    output_index: -1,
                    data: null,
                    block_height: 84635088,
                    dw_date: "2022-03-02T16:02:40",
                    dw_modified_date: "2022-03-02T16:02:40",
                    tx_hash: "0x08fb42bfb7dd3ca08d373151c46f465c235b81444a75137eb98bab4f15aca091",
                    confirmations: 434940
                },
                {
                    id: 202877,
                    customer_idx: 932,
                    coin_symbol: "KLAY",
                    from_address: "0x6B7F0A409a17E6009a202d488C69Ad7E55Fd6f1c",
                    to_address: "0x141f205b4e89b3894d296b4b85083e30951d7bb6",
                    amount: "123.9669",
                    txid: "0x08fb42bfb7dd3ca08d373151c46f465c235b81444a75137eb98bab4f15aca091",
                    output_index: -1,
                    data: null,
                    block_height: 84635088,
                    dw_date: "2022-03-02T16:02:40",
                    dw_modified_date: "2022-03-02T16:02:40",
                    tx_hash: "0x08fb42bfb7dd3ca08d373151c46f465c235b81444a75137eb98bab4f15aca091",
                    confirmations: 434940
                }
            ];
            return res.status(200).send(deposits);
        })

    }

    stop() {
        this.server.close();
    }

}