import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyTokenDto {
    @ApiProperty({ type: "string", description: 'Verification token' })
    @IsString()
    @IsNotEmpty()
    token: string;
}