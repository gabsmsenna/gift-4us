import { Gift } from 'src/modules/gifts/entities/gift.entity';
import { GroupMember } from 'src/modules/groups/entities/group-member.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Por segurança, não retorna a senha nas buscas padrão
  password: string;

  @Column({ type: 'timestamp' })
  birthday: Date;

  @Column({ name: 'token_version', default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relacionamentos Inversos (para navegação no código)
  @OneToMany(() => Gift, (gift) => gift.user)
  gifts: Gift[];

  @OneToMany(() => GroupMember, (member) => member.user)
  memberships: GroupMember[];
}