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

export const BinanceMock = {
    verifyApiKey: jest.fn((value: string) => {
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

export const KlaytnServiceMock = {
};
