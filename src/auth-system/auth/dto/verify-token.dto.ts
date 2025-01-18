import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyTokenDto {
    @ApiProperty({ type: "string", description: 'Token' })
    @IsString()
    @IsNotEmpty()
    token: string;
}