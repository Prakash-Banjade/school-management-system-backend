import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreatePurchaseDto {
    @ApiProperty({ type: String, format: 'date-time', description: 'Date of the purchase' })
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @ApiProperty({ type: Number, description: 'Rate of the purchase' })
    @IsNotEmpty()
    @IsNumber()
    rate: number;

    @ApiProperty({ type: Number, description: 'Quantity of the purchase' })
    @IsNotEmpty()
    @IsInt()
    quantity: number;

    @ApiProperty({ type: String, description: 'Name of the product' })
    @IsNotEmpty()
    @IsString()
    productName: string;

    @ApiProperty({ type: String, description: 'Id of the product' })
    @IsNotEmpty()
    @IsString()
    productId: string;

    @ApiProperty({ type: Number, description: 'Discount percentage of the purchase' })
    @IsNotEmpty()
    @IsNumber()
    @Max(100)
    @Min(0)
    @IsOptional()
    discountPercentage: number = 0;

    @ApiProperty({ type: String, description: 'Id of the dealer' })
    @IsNotEmpty()
    @IsUUID()
    dealerId: string;
}
