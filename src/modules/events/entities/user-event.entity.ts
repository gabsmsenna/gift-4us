import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from 'src/modules/groups/entities/group.entity';
import { Gift } from 'src/modules/gifts/entities/gift.entity';

export enum EventType {
  SECRET_FRIEND = 'SECRET_FRIEND',
  REGULAR = 'REGULAR',
}

@Entity('user_events')
export class UserEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'event_date', type: 'timestamp' })
  eventDate: Date;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'event_type', type: 'enum', enum: EventType, default: EventType.REGULAR })
  eventType: EventType;

  @ManyToMany(() => Group, (group) => group.events)
  @JoinTable({ name: 'group_events' })
  groups: Group[];

  @ManyToMany(() => Gift, (gift) => gift.events)
  gifts: Gift[];
}
