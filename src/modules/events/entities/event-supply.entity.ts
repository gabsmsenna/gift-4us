import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEvent } from './user-event.entity';
import { SupplyContribution } from './supply-contribution.entity';

@Entity('event_supplies')
export class EventSupply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @ManyToOne(() => UserEvent, (event) => event.supplies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: UserEvent;

  @Column({ name: 'item_name' })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'quantity_needed', type: 'int' })
  quantityNeeded: number;

  @Column()
  unit: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  url: string;

  @OneToMany(() => SupplyContribution, (contribution) => contribution.supply, {
    cascade: true,
  })
  contributions: SupplyContribution[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
