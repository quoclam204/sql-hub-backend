import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthGithubLoginDto {
  @ApiProperty({ example: 'gho_example_access_token' })
  @IsNotEmpty()
  accessToken: string;
}
