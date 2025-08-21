import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  mrn?: string;

  @Column({ type: 'jsonb', default: {} })
  demographics!: Record<string, unknown>;
}