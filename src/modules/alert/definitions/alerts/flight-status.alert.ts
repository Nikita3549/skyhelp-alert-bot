import { ISendAlertOptions } from '../../interfaces/send-alert-options.interface';
import { FlightStatusSource } from '../../../flight-status/enums/flight-status-source.enum';
import { IFlightStatusStats } from '../../../flight-status/interfaces/flight-status-stats.interface';
import { BaseAlert } from '../base-alert';

export class FlightStatusAlert extends BaseAlert {
    private readonly stats: IFlightStatusStats;

    constructor(stats: IFlightStatusStats) {
        super();
        this.stats = stats;
    }

    private escape(text: string | number): string {
        return String(text).replace(/[-._*+?^${}()|[\]\\]/g, '\\$&');
    }

    getText(): string {
        const { total, monthly } = this.stats;

        const totalBySource = {} as Record<FlightStatusSource, number>;
        Object.values(FlightStatusSource).forEach(
            (s) => (totalBySource[s] = 0),
        );

        const monthsMap = new Map<string, Record<FlightStatusSource, number>>();

        monthly.forEach((item) => {
            if (!monthsMap.has(item.month)) {
                const initialSources = {} as Record<FlightStatusSource, number>;
                Object.values(FlightStatusSource).forEach(
                    (s) => (initialSources[s] = 0),
                );
                monthsMap.set(item.month, initialSources);
            }
            const monthData = monthsMap.get(item.month)!;
            monthData[item.source] = item.amount;
            totalBySource[item.source] += item.amount;
        });

        const formatSourceName = (source: string): string => {
            if (source === FlightStatusSource.OAG) {
                return 'OAG';
            }

            return source
                .toLowerCase()
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        const formatLine = (source: string, amount: number, indent = '') => {
            const name = formatSourceName(source);
            return `${indent}· ${this.escape(name)}: ${this.escape(amount)}`;
        };

        const totalLines = Object.entries(totalBySource)
            .map(([source, amount]) => formatLine(source, amount))
            .join('\n');

        const monthlySections: string[] = [];
        monthsMap.forEach((sources, month) => {
            const sourceLines = Object.entries(sources)
                .map(([source, amount]) => formatLine(source, amount, ''))
                .join('\n');

            monthlySections.push(`*${this.escape(month)}:*\n${sourceLines}`);
        });

        return [
            `✈️ *Flight Status Requests*`,
            '',
            `📊 *Total Requests:* ${this.escape(total)}`,
            totalLines,
            '',
            `🗓 *Monthly requests breakdown:*`,
            '',
            ...monthlySections,
        ].join('\n');
    }

    getOptions(): ISendAlertOptions | undefined {
        return {
            parse_mode: 'Markdown',
        };
    }
}
