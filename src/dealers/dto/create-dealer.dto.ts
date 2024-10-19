import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Length } from "class-validator";

export class CreateDealerDto {
    @ApiProperty({ type: String, description: 'Name of the dealer' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ type: String, description: 'Contact number of the dealer' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 14)
    contact: string;

    @ApiProperty({ type: Number, description: 'PAN number of the dealer' })
    @IsNotEmpty()
    @IsNumber()
    panNo: number;

    @ApiProperty({ type: String, description: 'Address of the dealer' })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty({ type: String, description: 'Account name of the dealer' })
    @IsNotEmpty()
    @IsString()
    accountName: string;

    @ApiProperty({ type: String, description: 'Account number of the dealer' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 30)
    accountNumber: string;

    @ApiProperty({ type: String, description: 'Bank name of the dealer' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    bankName: string;
}
