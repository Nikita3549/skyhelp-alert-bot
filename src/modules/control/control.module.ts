import { Module } from '@nestjs/common';
import { ControlService } from './control.service';
import { DockerMonitorModule } from '../docker-monitor/docker-monitor.module';

@Module({
    imports: [DockerMonitorModule],
    providers: [ControlService],
})
export class ControlModule {}
