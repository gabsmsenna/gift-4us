import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEvent } from './user-event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('event_participants')
@Unique(['eventId', 'userId'])
export class EventParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => UserEvent)
  @JoinColumn({ name: 'event_id' })
  event: UserEvent;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
