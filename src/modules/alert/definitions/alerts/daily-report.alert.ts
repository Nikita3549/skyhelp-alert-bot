import { BaseAlert } from '../base-alert';
import { IRamStatus } from '../../../system/interfaces/ram-status.interface';
import { IContainersStatus } from '../../../docker-monitor/interfaces/system-status.interface';
import { ISSDStatus } from '../../../system/interfaces/ssd-status.interface';
import { ISendAlertOptions } from '../../interfaces/send-alert-options.interface';
import { getSystemResourcesMessage } from '../../utils/get-system-resources-message.util';

interface IDailyReportData {
    ramStatus: IRamStatus;
    ssdStatus: ISSDStatus;
    containersStatus: IContainersStatus;
}

export class DailyReportAlert extends BaseAlert {
    private readonly data: IDailyReportData;
    constructor(data: IDailyReportData) {
        super();
        this.data = data;
    }

    getText(): string {
        const ssd = this.data.ssdStatus;
        const ram = this.data.ramStatus;
        const containers = this.data.containersStatus;

        const message = [
            `☀️ *Good morning!*`,
            '',
            `📦 *Containers:* ${containers.running} / ${containers.total}`,
            `🟢 *Healthy:* ${containers.total - containers.unhealthy}`,
            '',
            getSystemResourcesMessage(ssd, ram),
            '',
            `_All systems are monitored_`,
        ].join('\n');

        return message;
    }

    getOptions(): ISendAlertOptions | undefined {
        return {
            parse_mode: 'Markdown',
        };
    }
}
