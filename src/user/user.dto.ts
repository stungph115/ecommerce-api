import { ApiProperty } from '@nestjs/swagger';

class DefaultUserDto {

    @ApiProperty()
    email: string

    @ApiProperty()
    lastname: string

    @ApiProperty()
    firstname: string

    @ApiProperty()
    password: string

    @ApiProperty()
    roleId: number

}

class SignInUserDto {

    @ApiProperty()
    email: string

    @ApiProperty()
    password: string

    @ApiProperty()
    tokenJWT: string

}

export { DefaultUserDto, SignInUserDto }
