import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfig } from 'src/config/typeorm.config';
import { BotModule } from './bot/bot.module';
import { SemesterPlanModule } from './semester-plan/semester-plan.module';

@Module({
  imports: [ 
    ConfigModule.forRoot({
    isGlobal : true ,
    envFilePath : join(process.cwd() , ".env")
    }), 
    TypeOrmModule.forRoot(TypeOrmConfig()),
    AuthModule,
    UserModule,
    BotModule,
    SemesterPlanModule
  ], 
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
