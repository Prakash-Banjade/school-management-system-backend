import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateNoticeDto {
    @ApiProperty({ type: String, description: 'Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: String, description: 'Description' })
    @IsString()
    @IsNotEmpty()
    description: string;
}
