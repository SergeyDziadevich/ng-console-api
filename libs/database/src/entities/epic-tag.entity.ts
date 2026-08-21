import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class EpicTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
