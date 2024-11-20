import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsUUID, Min } from "class-validator";

export class CreateFeeStructureDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    chargeHeadId: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    amount: number;
}
