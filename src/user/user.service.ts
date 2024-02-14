import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Not, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { DefaultUserDto, SignInUserDto } from './user.dto';
import { Response } from 'express'
import { Role } from 'src/role/role.entity';
import { sha512 } from 'js-sha512';
import { env } from 'process';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(User) private userRepository: Repository<User>,
        private jwtService: JwtService,
        private mailerService: MailerService,
    ) { }

    async getUser(userId, role) {

    }

    async addUser(addUserParams: DefaultUserDto) {
        if (!addUserParams.email || !addUserParams.lastname || !addUserParams.firstname || !addUserParams.password || !addUserParams.roleId) {
            throw new HttpException("ERROR_PARAMS", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        const userEmail = await this.userRepository.findOneBy({ email: addUserParams.email })
        if (userEmail) {
            throw new HttpException("EMAIL_ALREADY_EXIST", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        const password = sha512(addUserParams.password + env.USER_PASSWORD_KEY).slice(10, 40)
        const role = await this.roleRepository.findOneBy({ id: addUserParams.roleId })
        if (!role) {
            throw new HttpException("ROLE_NOT_FOUND", HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const user = this.userRepository.create({
            email: addUserParams.email,
            lastname: addUserParams.lastname,
            firstname: addUserParams.firstname,
            password: password,
            role: role,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const userSave = await this.userRepository.save(user)
        if (!userSave) {
            throw new HttpException("ERROR_USER_CREATION", HttpStatus.INTERNAL_SERVER_ERROR)
        } else {
            throw new HttpException("USER_CREATED", HttpStatus.CREATED)
        }
    }

    async updateUser(id: number, updateUserParams: DefaultUserDto) {
        if (
            !updateUserParams.email ||
            !updateUserParams.lastname ||
            !updateUserParams.firstname ||
            !updateUserParams.roleId
        ) {
            throw new HttpException("ERROR_PARAMS", HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const userExist = await this.userRepository.findOneBy({ id })
        if (!userExist) {
            throw new HttpException("USER_NOT_FOUND", HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const userEmail = await this.userRepository.findOneBy({
            id: Not(id),
            email: updateUserParams.email,
        })
        if (userEmail) {
            throw new HttpException("EMAIL_ALREADY_USE", HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const role = await this.roleRepository.findOneBy({ id: updateUserParams.roleId })
        if (!role) {
            throw new HttpException("ROLE_NOT_FOUND", HttpStatus.UNPROCESSABLE_ENTITY)
        }

        userExist.role = role
        userExist.email = updateUserParams.email
        userExist.lastname = updateUserParams.lastname
        userExist.firstname = updateUserParams.firstname
        userExist.updatedAt = new Date()

        if (updateUserParams.password !== null && updateUserParams.password !== undefined) {
            const password = sha512(updateUserParams.password + env.USER_PASSWORD_KEY).slice(10, 40)
            userExist.password = password
        }

        await this.userRepository.save(userExist)
        const userUpdate = await this.userRepository.save(userExist)

        if (!userUpdate) {
            throw new HttpException("ERROR_USER_UPDATING", HttpStatus.INTERNAL_SERVER_ERROR)
        } else {
            throw new HttpException("USER_UPDATED", HttpStatus.OK)
        }
    }

    async deleteUser(id: number) {
        const user = await this.userRepository.findOneBy({ id: id })
        if (!user) {
            throw new HttpException("USER_NOT_FOUND", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        await this.userRepository.save(user)
        const userDelete = await this.userRepository.delete({ id })
        if (!userDelete) {
            throw new HttpException("ERROR_USER_DELETING", HttpStatus.INTERNAL_SERVER_ERROR)
        } else {
            throw new HttpException("USER_DELETED", HttpStatus.OK)
        }
    }

    async signInUser(signInUserParams: SignInUserDto, response: Response) {
        if (!signInUserParams.email || !signInUserParams.password) {
            throw new HttpException('ERROR_PARAMS', HttpStatus.UNPROCESSABLE_ENTITY)
        }
        const user = await this.userRepository.findOne({
            where: {
                email: signInUserParams.email
            },
            relations: {
                role: true
            }
        })
        if (!user) {
            throw new HttpException('USER_NOT_FOUND', HttpStatus.UNPROCESSABLE_ENTITY)
        }
        const password = sha512(signInUserParams.password + env.USER_PASSWORD_KEY).slice(10, 40)
        if (password != user.password) {
            throw new HttpException('ERROR_PASS', HttpStatus.UNPROCESSABLE_ENTITY)
        }
        const tokenJWT = await this.jwtService.signAsync({ id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, role: user.role })
        if (!tokenJWT) {
            throw new HttpException('ERROR_TOKENJWT', HttpStatus.INTERNAL_SERVER_ERROR)
        }
        response.cookie('tokenJWT', tokenJWT, { httpOnly: true })
        throw new HttpException(tokenJWT, HttpStatus.OK)
    }

    async verifSignInUser(signInUserParams: SignInUserDto, response: Response) {
        try {
            if (!signInUserParams.tokenJWT) {
                throw new HttpException('ERROR_PARAMS', HttpStatus.UNPROCESSABLE_ENTITY);
            }

            const decodedToken = await this.jwtService.verifyAsync(signInUserParams.tokenJWT);

            if (!decodedToken) {
                throw new HttpException('ERROR_TOKENJWT', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            response.cookie('tokenJWT', signInUserParams.tokenJWT, { httpOnly: true });

            return 'TOKENJWT_VERIFIED';
        } catch (err) {
            if (err.message == 'jwt expired') {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            } else {
                throw new HttpException('ERROR_TOKENJWT', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    async signOutUser(response: Response) {
        response.clearCookie('tokenJWT')
        throw new HttpException("DECONNECTED", HttpStatus.OK)
    }

    async requestPasswordReset(email: string) {
        //check user exists
        const user = await this.userRepository.findOne({
            where: {
                email: email
            }
        })
        if (!user) {
            throw new HttpException('USER_NOT_FOUND', HttpStatus.UNPROCESSABLE_ENTITY)
        }
        //create token
        const tokenResetPassword = await this.jwtService.sign({ email: email }, { secret: env.RESET_PASSWORD_KEY, expiresIn: '15m' })

        //send mail reset password
        try {
            await this.mailerService.sendResetPasswordEmail(user.firstname, tokenResetPassword, [email])
            return {
                statusCode: 201,
                message: 'REQUEST_SENT'
            }
        } catch (err) {
            throw new HttpException('REQUEST_NOT_SENT', HttpStatus.BAD_REQUEST)
        }
    }

    async resetPassword(resetpasswordParams: any) {
        //verify token
        try {
            this.jwtService.verify(resetpasswordParams.token, { secret: env.RESET_PASSWORD_KEY })

        } catch (error) {
            throw new HttpException("TOKEN_INVALID", HttpStatus.BAD_REQUEST)
        }
        const decodedToken = this.jwtService.verify(resetpasswordParams.token, { secret: env.RESET_PASSWORD_KEY })
        //check user existe
        const userExist = await this.userRepository.findOne({
            where: {
                email: decodedToken.email
            }
        })
        if (!userExist) {
            throw new HttpException('USER_NOT_FOUND', HttpStatus.FORBIDDEN)
        }
        //update password
        const password = sha512(resetpasswordParams.password + env.USER_PASSWORD_KEY).slice(10, 40)
        if (password == userExist.password) {
            throw new HttpException("OLD_PASSWORD_NOT_ACCEPTED", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        const user: Partial<User> = {
            password: password,
            updatedAt: new Date(),
        }
        const userUpdate = await this.userRepository.update({ id: userExist.id }, { ...user })
        if (!userUpdate) {
            throw new HttpException("ERROR_USER_UPDATING", HttpStatus.INTERNAL_SERVER_ERROR)
        } else {
            throw new HttpException("USER_UPDATED", HttpStatus.OK)
        }
    }
}