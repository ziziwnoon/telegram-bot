import { Global, Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../user/entities/user.entity";
import { AuthService } from "../auth/auth.service";
import { OtpEntity } from "../user/entities/otp.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity , OtpEntity])],
  providers: [BotService , AuthService],
  exports: []
})
export class BotModule { }