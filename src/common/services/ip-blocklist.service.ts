import { Injectable, Logger } from '@nestjs/common';

interface FailEntry {
    count: number;
    blockedUntil?: Date;
}

const MAX_FAILURES = 10;
const BLOCK_DURATION_MIN = 30;

const WHITELISTED_IPS: Set<string> = new Set(
    (process.env.AGENT_IP_WHITELIST ?? '127.0.0.1,::1,::ffff:127.0.0.1')
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean),
);

@Injectable()
export class IpBlocklistService {
    private readonly logger = new Logger(IpBlocklistService.name);
    private readonly attempts = new Map<string, FailEntry>();

    getBlockedUntil(ip: string): Date | null {
        if (WHITELISTED_IPS.has(ip)) return null;

        const entry = this.attempts.get(ip);
        if (!entry?.blockedUntil) return null;

        if (new Date() > entry.blockedUntil) {
            this.attempts.delete(ip);
            return null;
        }
        return entry.blockedUntil;
    }

    isBlocked(ip: string): boolean {
        return this.getBlockedUntil(ip) !== null;
    }

    minutesUntilUnblock(ip: string): number {
        const blockedUntil = this.getBlockedUntil(ip);
        if (!blockedUntil) return 0;
        return Math.ceil((blockedUntil.getTime() - Date.now()) / 60000);
    }

    recordFailure(ip: string): void {
        if (WHITELISTED_IPS.has(ip)) return;

        const entry = this.attempts.get(ip) ?? { count: 0 };
        entry.count++;

        if (entry.count >= MAX_FAILURES && !entry.blockedUntil) {
            entry.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MIN * 60 * 1000);
            this.logger.warn(
                `[IpBlocklist] IP ${ip} BLOCKED for ${BLOCK_DURATION_MIN}min after ${entry.count} failed agent auth attempts`,
            );
        } else if (!entry.blockedUntil) {
            this.logger.debug(
                `[IpBlocklist] IP ${ip} failed attempt ${entry.count}/${MAX_FAILURES}`,
            );
        }

        this.attempts.set(ip, entry);
    }

    resetFailures(ip: string): void {
        if (this.attempts.has(ip)) {
            this.logger.debug(`[IpBlocklist] Counter reset for IP ${ip} after successful auth`);
            this.attempts.delete(ip);
        }
    }
}
