import { Module } from '@nestjs/common';
import { DockerMonitorService } from './docker-monitor.service';
import { AlertModule } from '../alert/alert.module';

@Module({
    imports: [AlertModule],
    providers: [DockerMonitorService],
    exports: [DockerMonitorService],
})
export class DockerMonitorModule {}
