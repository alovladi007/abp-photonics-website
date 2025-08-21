import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum OrganizationType {
  HOSPITAL = 'HOSPITAL',
  CLINIC = 'CLINIC',
  IMAGING_CENTER = 'IMAGING_CENTER',
  RESEARCH = 'RESEARCH',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: OrganizationType,
    default: OrganizationType.CLINIC,
  })
  type: OrganizationType;

  @Column('jsonb', { default: {} })
  settings: {
    features?: string[];
    maxUsers?: number;
    storageQuota?: number;
    aiModels?: string[];
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  websiteUrl?: string;

  @Column('jsonb', { nullable: true })
  billingInfo?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    plan?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}