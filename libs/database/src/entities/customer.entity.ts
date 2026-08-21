import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

export enum CustomerLevel {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  VIP = 'vip',
  ENTERPRISE = 'enterprise',
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: CustomerLevel,
    default: CustomerLevel.STANDARD,
  })
  level: CustomerLevel;

  @Column({ type: 'jsonb', nullable: true })
  informations?: Record<string, unknown> | string;

  @Column({ nullable: true })
  parentId?: string;

  @ManyToOne(() => Customer, (customer) => customer.subCustomers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Customer;

  @OneToMany(() => Customer, (customer) => customer.parent)
  subCustomers?: Customer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
