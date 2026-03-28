import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('purchesed_assign_test')
export class PurchesedAssignTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  testId: string;

  @Column({ type: 'varchar' })
  providerId: string;

  @Column({ type: 'varchar' })
  paypalId: string;

  @Column({ type: 'varchar', default: null })
  invoiceId: string;

  @Column({ type: 'varchar', default: null })
  quantity: string;

  @UpdateDateColumn()
  lastModified: Date;
}
