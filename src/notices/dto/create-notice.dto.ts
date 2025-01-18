import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateNoticeDto {
    @ApiProperty({ type: "string", description: 'Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: "string", description: 'Description' })
    @IsString()
    @IsNotEmpty()
    description: string;
}
