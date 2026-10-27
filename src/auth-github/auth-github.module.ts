import { Module } from '@nestjs/common';
import { AuthGithubService } from './auth-github.service';
import { AuthGithubController } from './auth-github.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AuthGithubController],
  providers: [AuthGithubService],
  exports: [AuthGithubService],
})
export class AuthGithubModule {}
