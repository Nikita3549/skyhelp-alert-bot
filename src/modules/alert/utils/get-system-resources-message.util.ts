import { ISSDStatus } from '../../system/interfaces/ssd-status.interface';
import { IRamStatus } from '../../system/interfaces/ram-status.interface';

export function getSystemResourcesMessage(
    ssd: ISSDStatus,
    ram: IRamStatus,
): string {
    const systemStatusIcon =
        Number(ssd.usedPercentage) >= 90 || Number(ram.usedPercentage) >= 90
            ? '⚠️'
            : '✅';
    const getStatusEmoji = (percentage: number | string) => {
        const p = Number(percentage);
        if (p >= 90) return '🔴';
        if (p >= 75) return '🟡';
        return '🟢';
    };
    const message = [
        `🖥 *System Resources ${systemStatusIcon}:*`,

        `${getStatusEmoji(ssd.usedPercentage)} *Disk:* ${ssd.usedPercentage}% — ${ssd.usedGB}/${ssd.totalGB} GB (${ssd.freeGB}GB free)`,

        `${getStatusEmoji(ram.usedPercentage)} *RAM:* ${ram.usedPercentage}% — ${ram.usedGB}/${ram.totalGB} GB (${ram.availableGB}GB available)`,

        ...(Number(ram.availableGB) < 0.5
            ? ['', '‼️ *Low RAM warning!* Check your containers.']
            : []),
    ].join('\n');

    return message;
}
