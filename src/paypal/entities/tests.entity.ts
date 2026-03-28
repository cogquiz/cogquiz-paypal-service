import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tests')
export class Tests {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
