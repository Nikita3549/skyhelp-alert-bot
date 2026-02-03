import { BaseAlert } from '../base-alert';
import { ISendAlertOptions } from '../../interfaces/send-alert-options.interface';
import { IFlightStatusStats } from '../../../flight-status/interfaces/flight-status-stats.interface';

export class FlightStatusAlert extends BaseAlert {
    private readonly stats: IFlightStatusStats;

    constructor(stats: IFlightStatusStats) {
        super();
        this.stats = stats;
    }

    getText(): string {
        const { total, monthly } = this.stats;

        const monthlySection = monthly.map((item) => {
            return `*${item.month}:* ${item.amount}`;
        });

        const message = [
            `✈️ *Flight Status Requests*`,
            '',
            `📊 *Total Requests:* ${total}`,
            '',
            `🗓 *Monthly requests:*`,
            ...monthlySection,
        ]
            .filter((m) => typeof m === 'string')
            .join('\n');

        return message;
    }

    getOptions(): ISendAlertOptions | undefined {
        return {
            parse_mode: 'Markdown',
        };
    }
}
