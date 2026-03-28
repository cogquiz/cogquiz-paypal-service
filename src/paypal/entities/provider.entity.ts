import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: null })
  code: string;

  @Column({ type: 'varchar', length: 40 })
  user_id: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModified: Date;
}
