import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      organizationId: user.organizationId 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async verifyTotp(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.totpSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async generateTotpSecret(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `MediMetrics (${userId})`,
      issuer: 'MediMetrics',
    });

    await this.usersService.updateTotpSecret(userId, secret.base32);

    return {
      secret: secret.base32,
      qr_code: secret.otpauth_url,
    };
  }
}