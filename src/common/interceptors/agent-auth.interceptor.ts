import {
    CallHandler,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NestInterceptor,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IpBlocklistService } from '../services/ip-blocklist.service';

/**
 * Apply to agent-facing public endpoints.
 * - Blocks IPs that have been flagged by IpBlocklistService
 * - Records a failure when the handler throws UnauthorizedException
 * - Resets the failure counter on success
 */
@Injectable()
export class AgentAuthInterceptor implements NestInterceptor {
    constructor(private readonly ipBlocklistService: IpBlocklistService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<{ ip: string }>();
        const ip = request.ip;

        if (this.ipBlocklistService.isBlocked(ip)) {
            const minutes = this.ipBlocklistService.minutesUntilUnblock(ip);
            throw new ForbiddenException(
                `Too many failed authentication attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
            );
        }

        return next.handle().pipe(
            tap(() => this.ipBlocklistService.resetFailures(ip)),
            catchError((err) => {
                if (err instanceof UnauthorizedException) {
                    this.ipBlocklistService.recordFailure(ip);
                }
                return throwError(() => err);
            }),
        );
    }
}
