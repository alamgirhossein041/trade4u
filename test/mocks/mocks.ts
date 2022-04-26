import * as http from "http";
import express, { Request, Response } from "express";
import { TxType } from "../../src/modules/scheduler/commons/scheduler.enum";

export const MailerMock = {
    sendEmailConfirmation: jest.fn(() => {
        return;
    }),
    sendForgotPasswordMail: jest.fn(() => {
        return;
    }),
    sendEmailProfileVerificationCode: jest.fn(() => {
        return;
    }),
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
    }),
    debug: jest.fn(() => {
        return;
    })
}

export const BinanceMock = {
    verifyApiKey: jest.fn((value: string) => {
        return;
    })
}

export const TelegramBotMock = {
    getTelegramCode: jest.fn(() => {
        return 12345678;
    }),
    sendResponseToUser: jest.fn(() => {
        return;
    }),
    sendNotificationsMessage: jest.fn(() => {
        return;
    }),
    sendCommunicationMessage: jest.fn(() => {
        return;
    }),
    sendAlreadyActivatedMessage: jest.fn(() => {
        return;
    }),
    sendReferralNotification: jest.fn(() => {
        return;
    }),
    sendBonusNotification: jest.fn(() => {
        return;
    })
}

export const CoinMarketMock = {
    ping: jest.fn((value: string) => {
        return true;
    }),
    getPrice: jest.fn((value: string) => {
        if (value === 'bitcoin') {
            let object = {};
            object['bitcoin'] = {};
            object['bitcoin']['usd'] = 40548.90
            object['bitcoin']['last_updated_at'] = 1646304806;
            return object;
        }
        else if (value === 'klay-token') {
            let object = {};
            object['klay-token'] = {};
            object['klay-token']['usd'] = 1.21
            object['klay-token']['last_updated_at'] = 1646304807;
            return object;
        }
    })
};

export const EventEmitterMock = {
    emit: jest.fn(() => {
        return;
    })
}

export class CaverMock {
    public static accountAddress: string;

    newKeyRing() {
        return;
    }
    generateKeyRing(): any {
        return {
            address: '0x7d620335d5184cdacda9ffb93c8de69201bf6dce',
            key: { privateKey: '0x98d3a90c9d18f93de36b65e784ba5d95a45eaa326377a6d2a3693a898310f44d' }
        };
    }
    isWalletAddressExisted() {
        return true;
    }
    async getLatestBlock() {
        return 80456789;
    }

    removeAddressFromWallet() {
        return;
    }
    async getBlock(): Promise<any> {
        return {
            "baseFeePerGas": "0x0",
            "blockScore": "0x1",
            "extraData": "0xd883010801846b6c617988676f312e31352e37856c696e757800000000000000f90164f85494571e53df607be97431a5bbefca1dffe5aef56f4d945cb1a7dccbd0dc446e3640898ede8820368554c89499fb17d324fa0e07f23b49d09028ac0919414db694b74ff9dea397fe9e231df545eb53fe2adf776cb2b841cb3a800ba5ed625411532fa3e21c90f22e56dbda4b3c296a9b84f79c8fb36ab32bc31dc449a081ec4a872079c6021c59baf9109d20dd246c10503ccb61ae4e7b00f8c9b841fe82ff1f389fb684759dee4c72d48382c99e3308158d18037e4ed2ec1874ed1f6b9fcfc180ca2cce53f0d724afe95a8bd5811ca3d38231c84ec911f1540cbeb300b841b5cbf25e3dd684b5238846e833f4a584936d60a1091039d801979791144013a36d625b27f42b114b565c45bf9659076604a151162e1f574314d956e4005ea8b801b84150b8c3ed7cf7c8f8d96c78fa6347ee1328265209d0a0ad306cc5e58356bb08e754f713b24f12b61a0a785eb21069e68dd00c649c26c4cc18993dd99def6a451a00",
            "gasUsed": "0x0",
            "governanceData": "0x",
            "hash": "0x60d8aa4167e7eca1a196654c8e2ed80a5d10f74834399be6cecf184b7b6b1cda",
            "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "number": "0x528a0c8",
            "parentHash": "0x12545bc685f8633b264a4d4b6738ca0bdc6b6b1c79a585b181640f54d704938d",
            "receiptsRoot": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
            "reward": "0xa86fd667c6a340c53cc5d796ba84dbe1f29cb2f7",
            "stateRoot": "0x718a80ccf97b5183da398d3b3e06a2d124e4c0dc4a3d3e36cf4a2fc22aee2192",
            "timestamp": "0x623c4c2a",
            "timestampFoS": "0x0",
            "transactionsRoot": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        }
    }
    async getBlockTransactionCount(): Promise<string> {
        return '0xw4334dsfs';
    }
    async getBlockReceipts(): Promise<any> {
        return [{
            type: TxType.VALUE_TRANSFER, to: CaverMock.accountAddress,
            transactionHash: '0xadasdf32descscdfsd434rfdcsdfsdsade', from: '0x87ac99835e67168d4f9a40580f8f5c33550ba88b'
        }];
    }
    hexToNumber() {
        return 80456789;
    }

    fromPeb() {
        return '89.0000';
    }

    async getAccountBalance() {
        return '300.0000';
    }

    async moveToMasterWallet() {
        return;
    }
    isAddress(val) {
        if (val == "0xef76f8177198119e1bb97111e673ca0afcc25f19") {
            return true
        } else {
            return false;
        }
    }
};

export class MockBotServer {
    private server: http.Server;

    private app: express.Application;

    constructor(port: number, done: () => void) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.server.listen(port, () => {
            done();
        });

        this.app.post('/api/bot/create', (req: Request, res: Response) => {
            const success = {
                "success": true,
                "code": 1000,
                "message": "successfully created bot",
                "data": {
                    "botId": "c8osjqqn29gvroogkdi0",
                    "botName": "Jeffrey The Colossal Barnacle",
                    "uid": "c8osjqqn29gvroogkdi0",
                    "pid": -1,
                    "strategy": "BUYSELL",
                    "status": "stopped",
                    "exchange": "BINANCE",
                    "apiKey": "9cIbTxgbQW3xDLBk8xgTRiIjmkhEvbHqiBS9YepNYdYIOX07aq94Vatvw1N6GBTK",
                    "apiSecret": "ztEWCq6NocEjCJ6tYiX93TAaNeJOHx2euT0FU1pErIwjXdnAxnzdVlAm7gbtnioM",
                    "riskLevel": "LOW",
                    "baseAsset": "USDT",
                    "quoteAsset": "BTC"
                }
            }
            return res.status(200).send(success);
        });

        this.app.get('/api/bot/:id/start', (req: Request, res: Response) => {
            const success = {
                "success": true,
                "code": 1000,
                "message": "successfully started bot",
                "data": null
            }
            return res.status(200).send(success);
        })
    }
}

export const KlaytnServiceMock = {
    validateKlaytnAddress: jest.fn((val) => {
        if (val == "0xef76f8177198119e1bb97111e673ca0afcc25f19") {
            return true
        } else {
            return false;
        }
    }),
};
