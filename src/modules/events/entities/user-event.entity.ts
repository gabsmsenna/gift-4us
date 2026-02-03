import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EventType {
  BIRTHDAY = 'BIRTHDAY',
  WEDDING = 'WEDDING',
  OTHER = 'OTHER',
}

@Entity('user_events')
export class UserEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'event_date', type: 'date' }) // Spec diz DATE, não TIMESTAMP
  eventDate: string;

  @Column({ type: 'enum', enum: EventType })
  type: EventType;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}