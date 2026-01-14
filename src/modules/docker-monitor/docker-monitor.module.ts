import { Module } from '@nestjs/common';
import { DockerMonitorService } from './docker-monitor.service';
import { AlertModule } from '../alert/alert.module';
import { SystemModule } from '../system/system.module';

@Module({
    imports: [AlertModule, SystemModule],
    providers: [DockerMonitorService],
    exports: [DockerMonitorService],
})
export class DockerMonitorModule {}
