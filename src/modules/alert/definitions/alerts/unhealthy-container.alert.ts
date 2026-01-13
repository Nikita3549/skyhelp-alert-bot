import { BaseAlert } from '../base-alert';
import { formatDate } from '../../../../common/utils/formatDate';

interface IUnhealthyContainerAlertData {
    containerName: string;
    logs: string;
}

export class UnhealthyContainerAlert extends BaseAlert {
    data: IUnhealthyContainerAlertData;
    constructor(data: IUnhealthyContainerAlertData) {
        super();
        this.data = data;
    }

    getText(): string {
        const icon = '🛑';
        const title = 'CONTAINER ALERT';

        const message = [
            `${icon} ${title} ${icon}`,
            `────────────────────`,
            `📦 Container: \`${this.data.containerName}\``,
            `📊 Status: 'UNHEALTHY'`,
            `⏰ Time: ${new Date().toLocaleString('ru-RU')}`,
            `────────────────────`,
        ].join('\n');
        return message;
    }

    getAttachment(): { source: Buffer; filename: string } | null {
        return {
            filename: `logs_${this.data.containerName}_${formatDate(new Date(), 'yyyy-mm-dd_hh-mm-ss')}.txt`,
            source: Buffer.from(this.data.logs, 'utf-8'),
        };
    }
}
