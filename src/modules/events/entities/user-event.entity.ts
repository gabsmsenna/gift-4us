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

  @ManyToMany(() => Group, (group) => group.events)
  @JoinTable({ name: 'group_events' })
  groups: Group[];
}
