import { Injectable } from '@nestjs/common';
import { DockerMonitorService } from '../docker-monitor/docker-monitor.service';
import { AlertService } from '../alert/alert.service';
import { SystemService } from '../system/system.service';
import { DailyReportAlert } from '../alert/definitions/alerts/daily-report.alert';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class HeartbeatService {
    constructor(
        private readonly dockerMonitorService: DockerMonitorService,
        private readonly alertService: AlertService,
        private readonly systemService: SystemService,
    ) {}
    async onModuleInit() {
        await this.sendDailyReport();
    }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    private async sendDailyReport() {
        const containersStatus =
            await this.dockerMonitorService.getContainersStatus();
        const ssdStatus = await this.systemService.getSSDStatus();
        const ramStatus = await this.systemService.getRamStatus();

        await this.alertService.sendAlert(
            new DailyReportAlert({ containersStatus, ssdStatus, ramStatus }),
            { parse_mode: 'Markdown' },
        );
    }
}
