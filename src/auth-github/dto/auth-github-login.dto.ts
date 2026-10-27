import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthGithubLoginDto {
  @ApiProperty({ example: 'gho_16C7e42F292c6912E7710c838347Ae178B4a' })
  @IsNotEmpty()
  accessToken: string;
}
