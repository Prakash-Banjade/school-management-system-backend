import { ApiProperty } from "@nestjs/swagger";
import { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { IsDefined, IsNotEmpty, IsString } from "class-validator";

export class UpdateWebAuthnCredentialDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;
}

export class VerifyRegisterPassKeyDto {
    @ApiProperty({ type: 'object', description: 'Registration response after passkey register prompt has completed.' })
    @IsNotEmpty({ message: 'Registration response is required' })
    @IsDefined()
    registrationResponse: RegistrationResponseJSON
}

export class AuthenticatePassKeyDto {
    @ApiProperty({ type: 'object', description: 'Authentication response after passkey login prompt has completed.' })
    @IsNotEmpty({ message: 'Authentication response is required' })
    @IsDefined()
    authenticationResponse: AuthenticationResponseJSON
}