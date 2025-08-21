import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('features')
@Index(['patientId', 'windowStart', 'name'])
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  patientId!: string;

  @Column({ type: 'timestamptz', name: 'window_start' })
  windowStart!: Date;

  @Column({ type: 'timestamptz', name: 'window_end' })
  windowEnd!: Date;

  @Column()
  name!: string;

  @Column({ type: 'double precision' })
  value!: number;

  @Column({ default: 'demo' })
  method!: string;
}