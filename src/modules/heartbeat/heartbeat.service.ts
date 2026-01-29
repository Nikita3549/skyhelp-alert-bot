import { Injectable } from '@nestjs/common';
import { DockerMonitorService } from '../docker-monitor/docker-monitor.service';
import { AlertService } from '../alert/alert.service';
import { SystemService } from '../system/system.service';
import { SystemReportAlert } from '../alert/definitions/alerts/system-report.alert';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalApiService } from '../external-api/external-api.service';
import { Command, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { IRamStatus } from '../system/interfaces/ram-status.interface';
import { ISSDStatus } from '../system/interfaces/ssd-status.interface';
import { IContainersStatus } from '../docker-monitor/interfaces/system-status.interface';
import { IExternalApiStatus } from '../external-api/interfaces/external-api-status.interface';

@Update()
@Injectable()
export class HeartbeatService {
    constructor(
        private readonly dockerMonitorService: DockerMonitorService,
        private readonly alertService: AlertService,
        private readonly systemService: SystemService,
        private readonly externalApiService: ExternalApiService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    private async sendDailyReport() {
        await this.alertService.sendAlert(
            new SystemReportAlert({
                ...(await this.getAllSystemStats()),
                sayGoodMorning: true,
            }),
        );
    }

    @Command('status')
    async handleStatusRequest(_ctx: Context) {
        await this.alertService.sendAlert(
            new SystemReportAlert({
                ...(await this.getAllSystemStats()),
                sayGoodMorning: false,
            }),
        );
    }

    private async getAllSystemStats(): Promise<{
        ramStatus: IRamStatus;
        ssdStatus: ISSDStatus;
        containersStatus: IContainersStatus;
        externalApisStatus: IExternalApiStatus[];
    }> {
        const [containersStatus, ssdStatus, ramStatus, externalApisStatus] =
            await Promise.all([
                await this.dockerMonitorService.getContainersStatus(),
                await this.systemService.getSSDStatus(),
                await this.systemService.getRamStatus(),
                await this.externalApiService.externalApisStatus(),
            ]);

        return {
            containersStatus,
            ssdStatus,
            ramStatus,
            externalApisStatus,
        };
    }
}
