import { StreamClient } from '@stream-io/node-sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StreamClientProvider {
    private client: StreamClient;

    constructor(apiKey: string, apiSecret: string) {
        this.client = new StreamClient(apiKey, apiSecret, {
            timeout: 10 * 1000, // ms
        });
    }

    getClient(): StreamClient {
        return this.client;
    }
}
