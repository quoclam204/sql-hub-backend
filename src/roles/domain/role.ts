import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class Role {
  @Allow()
  @ApiProperty({
    type: Number,
  })
  id: number | string;

  @Allow()
  @ApiProperty({
    type: String,
    example: 'admin',
  })
  name?: string;
}
