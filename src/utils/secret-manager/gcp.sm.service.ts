import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { HttpException, Injectable } from '@nestjs/common';
import { ResponseCode, ResponseMessage } from '../../utils/enum';

@Injectable()
export class GcpSecretService {

    private secretServiceClient: SecretManagerServiceClient;

    constructor() {
        this.secretServiceClient = new SecretManagerServiceClient({
            projectId: process.env.GCP_PROJECT_ID,
            keyFilename: process.env.GCP_KEY_PATH
        });
    }
    /**
     * Get The Wallet Secret From Secret Manager
     * @param name
     * @returns
     */
    public async getWalletSecret(name: string) {
        try {
            const [version] = await this.secretServiceClient.accessSecretVersion({ name });
            const payload = version.payload.data.toString();
            return payload;
        } catch (err) {
            throw new HttpException(
                ResponseMessage.GCP_ERROR,
                ResponseCode.BAD_REQUEST,
            );
        }
    }
}
