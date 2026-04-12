import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    getProfile(@GetUser() user: { id: string }) {
        return this.usersService.findOne(user.id);
    }

    @Patch('me')
    updateProfile(@GetUser() user: { id: string }, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(user.id, updateUserDto);
    }

    @Post('me/change-password')
    async changePassword(
        @GetUser() user: { id: string },
        @Body() dto: ChangePasswordDto,
    ) {
        await this.usersService.changePassword(user.id, dto.oldPassword, dto.newPassword);
        return { message: 'Password changed successfully' };
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
