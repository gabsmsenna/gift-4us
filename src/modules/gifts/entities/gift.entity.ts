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

@Entity('gifts')
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ name: 'price_range', nullable: true })
  priceRange: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  imageUrl: string;

  @ManyToOne(() => User, (user) => user.gifts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToMany(() => Group, (group) => group.gifts)
  @JoinTable({ name: 'group_gifts' })
  groups: Group[];
}
