import { Body, Controller, Headers, Post, UseGuards, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 15 * 60 * 1000, // 15 mins
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    private clearAuthCookies(res: Response) {
        res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'none' });
        res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
    }

    @Public()
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('login')
    @ApiHeader({
        name: 'user-agent',
        required: false,
        description: 'Thông tin thiết bị (mặc định trình duyệt tự gửi)',
    })
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
        @Headers('user-agent') userAgent?: string,
    ) {
        const tokens = await this.authService.login(loginDto, userAgent || 'Unknown Device');
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        return tokens;
    }

    @Public()
    @Post('refresh')
    async refreshTokens(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body('refreshToken') bodyToken?: string,
    ) {
        const refreshToken = bodyToken || req.cookies?.refreshToken;
        const tokens = await this.authService.refreshTokens(refreshToken);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        return tokens;
    }

    @ApiBearerAuth('JWT')
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body('refreshToken') bodyToken?: string,
    ) {
        const refreshToken = bodyToken || req.cookies?.refreshToken;
        if (refreshToken) {
            await this.authService.logout(refreshToken);
        }
        this.clearAuthCookies(res);
        return { message: 'Logged out successfully' };
    }

    @ApiBearerAuth('JWT')
    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    async logoutAll(
        @GetUser() user: { id: string },
        @Res({ passthrough: true }) res: Response
    ) {
        await this.authService.revokeAllUserTokens(user.id);
        this.clearAuthCookies(res);
        return { message: 'Logged out of all devices' };
    }
}
