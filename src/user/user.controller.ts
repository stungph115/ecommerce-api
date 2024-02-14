import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Res, SetMetadata, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/auth.jwtGuard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DefaultUserDto, SignInUserDto } from './user.dto';
import { Response } from 'express'

@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }

    //get list user
    @Get()
    @UseGuards(JwtAuthGuard)
    @SetMetadata('role', 'user')
    @SetMetadata('setRole', 'role')
    @SetMetadata('userId', 'userId')
    getUser(@Body() { userId, role }) {

        return this.userService.getUser(userId, role)

    }

    //get user info

    //create new user
    @Post()
    @UseGuards(JwtAuthGuard)
    @SetMetadata('role', 'user')
    addUser(@Body() addUserDto: DefaultUserDto) {

        return this.userService.addUser(addUserDto)

    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @SetMetadata('role', 'admin')
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: DefaultUserDto,
    ) {

        return this.userService.updateUser(id, updateUserDto)

    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @SetMetadata('role', 'admin')
    deleteUser(@Param('id', ParseIntPipe) id: number) {

        return this.userService.deleteUser(id)

    }

    @Post('signIn')
    signInUser(
        @Body() signInUserParams: SignInUserDto,
        @Res({ passthrough: true }) response: Response
    ) {
        return this.userService.signInUser(signInUserParams, response)
    }

    @Post('verifSignIn')
    verifSignInUser(
        @Body() signInUserParams: SignInUserDto,
        @Res({ passthrough: true }) response: Response
    ) {
        return this.userService.verifSignInUser(signInUserParams, response)
    }

    @Post('signOut')
    signOutUser(
        @Res({ passthrough: true }) response: Response
    ) {
        return this.userService.signOutUser(response)
    }

    //forgot-password
    @Post('forgot-password')
    requestPasswordReset(@Body('email') email: string) {
        return this.userService.requestPasswordReset(email)
    }

    @Post('reset-password')
    async resetPassword(@Body() params: any) {
        await this.userService.resetPassword(params)
    }
}
