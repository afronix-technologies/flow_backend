import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PasswordService } from './password.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private passwordService: PasswordService,
    ) { }

    async findOne(id: string): Promise<User> {
        return this.userRepository.findOne({
            where: { id },
            relations: ['organization']
        });
    }

    async update(id: string, updateData: Partial<User>): Promise<User> {
        const user = await this.findOne(id);
        if (!user) throw new NotFoundException('User not found');

        // Whitelist updates
        if (updateData.firstName) user.firstName = updateData.firstName;
        if (updateData.lastName) user.lastName = updateData.lastName;

        return this.userRepository.save(user);
    }

    async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'password'] // explicitly select password
        });

        const isMatch = await this.passwordService.compare(currentPass, user.password);
        if (!isMatch) throw new UnauthorizedException('Current password incorrect');

        user.password = await this.passwordService.hash(newPass);
        await this.userRepository.save(user);
    }

    async getOrganizations(userId: string) {
        // We need to fetch UserOrganization relations
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['userOrganizations', 'userOrganizations.organization']
        });

        return user.userOrganizations.map(uo => ({
            ...uo.organization,
            role: uo.role // Attach role in that org
        }));
    }
}
