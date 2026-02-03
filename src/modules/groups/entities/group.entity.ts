import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from './group-member.entity';

export enum GroupStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GroupStatus, default: GroupStatus.PENDING })
  status: GroupStatus;

  @Column({ name: 'event_date', type: 'timestamp' })
  eventDate: Date;

  // Relacionamento com Owner (Dono do grupo)
  @Column({ name: 'owner_id' }) // Coluna física
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];
}