import * as http from "http";
import express, { Request, Response } from "express";

export const MailerMock = {
    sendEmailConfirmation: jest.fn(),
    sendForgotPasswordMail: jest.fn(),
     sendEmailProfileVerificationCode:jest.fn(() => {
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
    sendNotificationsMessage:jest.fn(() => {
        return;
    }),
    sendCommunicationMessage:jest.fn(() => {
        return;
    }),
    sendAlreadyActivatedMessage:jest.fn(() => {
        return;
    }),
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
    validateKlaytnAddress:jest.fn((val) => {
        if(val=="0xbd6405a7f14f57ecea4a6ffe774ee26d051f7eed13257c9a574055b20e42bab0e8beba92e2e675101eb2a55ba4693080d0bf14548beae7bc93b18b72d10dd350"){
            return true
        }else{
            return false;
        }
        
    }),
};
