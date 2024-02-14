import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleController } from './role.controller'
import { Role } from './role.entity'
import { User } from 'src/user/user.entity'
import { RoleService } from './role.service'
import { JwtModule } from '@nestjs/jwt'
import { env } from '../../env'

@Module({

  imports: [
    TypeOrmModule.forFeature([Role, User]),
    JwtModule.register({
      secret: env.USER_JWT_KEY,
      signOptions: {
        expiresIn: "36h",
      }
    }),
  ],
  controllers: [RoleController],
  providers: [RoleService],

})

export class RoleModule { }
