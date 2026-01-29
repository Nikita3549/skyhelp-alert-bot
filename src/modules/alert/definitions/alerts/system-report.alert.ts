import { BaseAlert } from '../base-alert';
import { IRamStatus } from '../../../system/interfaces/ram-status.interface';
import { IContainersStatus } from '../../../docker-monitor/interfaces/system-status.interface';
import { ISSDStatus } from '../../../system/interfaces/ssd-status.interface';
import { ISendAlertOptions } from '../../interfaces/send-alert-options.interface';
import { getSystemResourcesMessage } from '../../utils/get-system-resources-message.util';
import { HealthStatus } from '../../../external-api/enums/health-status.enum';
import { IExternalApiStatus } from '../../../external-api/interfaces/external-api-status.interface';

interface ISystemReportData {
    ramStatus: IRamStatus;
    ssdStatus: ISSDStatus;
    containersStatus: IContainersStatus;
    externalApisStatus: IExternalApiStatus[];
    sayGoodMorning: boolean;
}

export class SystemReportAlert extends BaseAlert {
    private readonly data: ISystemReportData;

    constructor(data: ISystemReportData) {
        super();
        this.data = data;
    }

    getText(): string {
        const {
            ssdStatus,
            ramStatus,
            containersStatus,
            externalApisStatus,
            sayGoodMorning,
        } = this.data;

        const apiSection = externalApisStatus.map((item) => {
            const icon = item.status === HealthStatus.OK ? '✅' : '❌';
            return `${icon} *${item.api}:* ${item.status}`;
        });

        const message = [
            sayGoodMorning && `☀️ *Good morning!*`,
            sayGoodMorning && '',
            `📦 *Containers:* ${containersStatus.running} / ${containersStatus.total}`,
            `🟢 *Healthy:* ${containersStatus.total - containersStatus.unhealthy}`,
            '',
            getSystemResourcesMessage(ssdStatus, ramStatus),
            '',
            `🌐 *External APIs:*`,
            ...apiSection,
            '',
            `_All systems are monitored_`,
        ]
            .filter((m) => typeof m == 'string')
            .join('\n');

        return message;
    }

    getOptions(): ISendAlertOptions | undefined {
        return {
            parse_mode: 'Markdown',
        };
    }
}
