import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateMessageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500, { message: 'Message must be at most 500 characters long' })
    content: string;

    @ApiProperty()
    @IsUUID()
    conversationId: string;
}
