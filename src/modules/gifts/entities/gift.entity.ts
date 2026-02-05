import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from 'src/modules/groups/entities/group.entity';
import { UserEvent } from 'src/modules/events/entities/user-event.entity';

@Entity('gifts')
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { array: true, nullable: true, default: '{}' })
  urls: string[];

  @ManyToOne(() => User, (user) => user.gifts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToMany(() => UserEvent, (event) => event.gifts)
  @JoinTable({
    name: 'event_gifts',
    joinColumn: {
      name: 'gift_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'event_id',
      referencedColumnName: 'id',
    },
  })
  events: UserEvent[];
}
