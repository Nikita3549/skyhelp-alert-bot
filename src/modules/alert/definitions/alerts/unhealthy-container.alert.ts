import { BaseAlert } from '../base-alert';
import { formatDate } from '../../../../common/utils/formatDate';
import { ISendAlertOptions } from '../../interfaces/send-alert-options.interface';
import { ContainerIssue } from 'src/modules/docker-monitor/enums/container-issue.enum';
import { IRamStatus } from '../../../system/interfaces/ram-status.interface';
import { getSystemResourcesMessage } from '../../utils/get-system-resources-message.util';
import { ISSDStatus } from '../../../system/interfaces/ssd-status.interface';

interface IUnhealthyContainerAlertData {
    containerName: string;
    logs: string;
    issue: ContainerIssue;
    ssdStatus: ISSDStatus;
    ramStatus: IRamStatus;
}

export class UnhealthyContainerAlert extends BaseAlert {
    private readonly data: IUnhealthyContainerAlertData;
    constructor(data: IUnhealthyContainerAlertData) {
        super();
        this.data = data;
    }

    getText(): string {
        const icon = '🛑';
        const title = '*CONTAINER ALERT*';
        const status =
            this.data.issue === ContainerIssue.Unhealthy ? 'UNHEALTHY' : 'DEAD';

        const mskTime = new Date()
            .toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            })
            .replace(/\./g, '\.');

        const message = [
            `${icon} ${title} ${icon}`,
            `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
            `📦 *Container:* \`${this.data.containerName}\``,
            `📊 *Status:* \`${status}\``,
            `⏰ *Time:* \`${mskTime}\``,
            '',
            getSystemResourcesMessage(this.data.ssdStatus, this.data.ramStatus),
            `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
        ].join('\n');

        return message;
    }

    getAttachment(): { source: Buffer; filename: string } | null {
        return {
            filename: `logs_${this.data.containerName}_${formatDate(new Date(), 'yyyy-mm-dd_hh-mm-ss')}.txt`,
            source: Buffer.from(this.data.logs, 'utf-8'),
        };
    }

    getOptions(): ISendAlertOptions | undefined {
        return {
            parse_mode: 'Markdown',
        };
    }
}
