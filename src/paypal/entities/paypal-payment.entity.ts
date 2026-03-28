import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('paypal_payment')
export class PayPalPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  paymentId: string;

  @Column({ type: 'varchar' })
  payerId: string;

  @Column({ type: 'varchar', default: null })
  testId: string;

  @Column({ type: 'boolean', default: false })
  is_provider: boolean;

  @Column({ type: 'int', default: 0 })
  total_purchased: number;

  @Column({ type: 'int', default: 0 })
  total_remaining: number;

  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @UpdateDateColumn()
  lastModified: Date;
}
