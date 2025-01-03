import { IsNotEmpty, IsString } from "class-validator";

export class UpdateWebAuthnCredentialDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;
}