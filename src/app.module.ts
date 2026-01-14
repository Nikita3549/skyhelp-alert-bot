import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { DockerMonitorModule } from './modules/docker-monitor/docker-monitor.module';
import { ConfigModule } from '@nestjs/config';
import { AlertModule } from './modules/alert/alert.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HeartbeatModule } from './modules/heartbeat/heartbeat.module';
import { SystemModule } from './modules/system/system.module';
import { ControlModule } from './modules/control/control.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TelegrafModule.forRoot({
            token: process.env.TELEGRAM_BOT_TOKEN!,
        }),
        DockerMonitorModule,
        AlertModule,
        ScheduleModule.forRoot(),
        HeartbeatModule,
        SystemModule,
        ControlModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
