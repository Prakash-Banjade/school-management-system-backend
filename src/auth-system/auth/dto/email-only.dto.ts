import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class EmailOnlyDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email!: string;
}