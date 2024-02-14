import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from 'src/user/user.entity'
import { MailerService } from './mailer.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule { }
