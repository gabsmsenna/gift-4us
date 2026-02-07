import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventSupply } from './event-supply.entity';
import { User } from '../../users/entities/user.entity';

@Entity('supply_contributions')
export class SupplyContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'supply_id', type: 'uuid' })
  supplyId: string;

  @ManyToOne(() => EventSupply, (supply) => supply.contributions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supply_id' })
  supply: EventSupply;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'quantity_committed', type: 'int' })
  quantityCommitted: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
