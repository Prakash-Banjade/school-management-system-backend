import { Module } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { StreamClientProvider } from "./stream-client-provider";

@Module({
    providers: [
        {
            provide: StreamClientProvider,
            useFactory: (configService: ConfigService) => {
                const apiKey = configService.get<string>('STREAM_VIDEO_API_KEY');
                const apiSecret = configService.get<string>('STREAM_VIDEO_API_SECRET');
                return new StreamClientProvider(apiKey, apiSecret);
            },
            inject: [ConfigService],
        },
    ],
    exports: [StreamClientProvider],

})
export class StreamClientModule { }