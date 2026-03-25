import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
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

    @Public()
    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('login')
    @ApiHeader({
        name: 'user-agent',
        required: false,
        description: 'Thông tin thiết bị (mặc định trình duyệt tự gửi)',
    })
    login(
        @Body() loginDto: LoginDto,
        @Headers('user-agent') userAgent?: string,
    ) {
        return this.authService.login(loginDto, userAgent || 'Unknown Device');
    }

    @Public()
    @Post('refresh')
    refreshTokens(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshTokens(refreshToken);
    }

    @ApiBearerAuth('JWT')
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(@Body('refreshToken') refreshToken: string) {
        return this.authService.logout(refreshToken);
    }

    @ApiBearerAuth('JWT')
    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    logoutAll(@GetUser() user: { id: string }) {
        return this.authService.revokeAllUserTokens(user.id);
    }
}
