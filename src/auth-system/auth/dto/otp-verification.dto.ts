import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class OtpVerificationDto {
    @ApiProperty({ type: Number, description: "6 digit OTP" })
    @Transform(({ value }) => {
        if (isNaN(parseInt(value))) throw new BadRequestException('Invalid OTP')
        return parseInt(value)
    })
    @IsInt()
    @IsNotEmpty()
    otp: number

    @ApiProperty({ type: String, description: "Verification token" })
    @IsString()
    @IsNotEmpty()
    verificationToken: string;
}