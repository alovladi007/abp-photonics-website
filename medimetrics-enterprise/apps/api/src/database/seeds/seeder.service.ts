import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async seed() {
    await this.seedOrganizations();
    await this.seedUsers();
    await this.seedDemoData();
  }

  private async seedOrganizations() {
    const orgs = [
      {
        name: 'Demo Hospital',
        slug: 'demo-hospital',
        type: 'HOSPITAL',
        settings: {
          features: ['ai_analysis', 'reporting', 'audit_logs'],
          maxUsers: 100,
          storageQuota: 1000000000000, // 1TB
        },
      },
      {
        name: 'Test Clinic',
        slug: 'test-clinic',
        type: 'CLINIC',
        settings: {
          features: ['ai_analysis', 'reporting'],
          maxUsers: 10,
          storageQuota: 100000000000, // 100GB
        },
      },
    ];

    for (const org of orgs) {
      const existing = await this.orgRepository.findOne({
        where: { slug: org.slug },
      });
      
      if (!existing) {
        await this.orgRepository.save(org);
        console.log(`Created organization: ${org.name}`);
      }
    }
  }

  private async seedUsers() {
    const demoOrg = await this.orgRepository.findOne({
      where: { slug: 'demo-hospital' },
    });

    const users = [
      {
        email: 'admin@demo.local',
        password: 'Demo123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: demoOrg.id,
      },
      {
        email: 'radiologist@demo.local',
        password: 'Demo123!',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        role: 'RADIOLOGIST',
        organizationId: demoOrg.id,
      },
      {
        email: 'technologist@demo.local',
        password: 'Demo123!',
        firstName: 'Mike',
        lastName: 'Wilson',
        role: 'TECHNOLOGIST',
        organizationId: demoOrg.id,
      },
    ];

    for (const userData of users) {
      const existing = await this.userRepository.findOne({
        where: { email: userData.email },
      });
      
      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await this.userRepository.save({
          ...userData,
          password: hashedPassword,
          isActive: true,
          emailVerified: true,
        });
        console.log(`Created user: ${userData.email}`);
      }
    }
  }

  private async seedDemoData() {
    // Add sample studies, reports, etc.
    console.log('Demo data seeding completed');
  }
}