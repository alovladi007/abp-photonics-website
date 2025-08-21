import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('signal_chunks')
@Index(['patientId', 'channel', 'tStart'])
export class SignalChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  patientId!: string;

  @Column()
  channel!: string;

  @Column({ type: 'timestamptz', name: 't_start' })
  tStart!: Date;

  @Column({ type: 'timestamptz', name: 't_end' })
  tEnd!: Date;

  @Column({ type: 'real' })
  fs!: number;

  @Column('double precision', { array: true })
  values!: number[];
}