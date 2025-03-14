import { UserEntity } from './User.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'user_companies' })
export class UserCompanyEntity {
  constructor(partial: Partial<UserCompanyEntity>) {
    const data = { ...partial, active: partial?.active ?? true };
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, default: true })
  active: boolean;

  @Column({ nullable: false, name: 'company_value' })
  companyValue: number;

  @Column({ nullable: false, name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  deletedAt: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.userCompanies)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
