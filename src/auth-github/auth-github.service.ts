import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SocialInterface } from '../social/interfaces/social.interface';
import { AuthGithubLoginDto } from './dto/auth-github-login.dto';

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

@Injectable()
export class AuthGithubService {
  async getProfileByToken(
    loginDto: AuthGithubLoginDto,
  ): Promise<SocialInterface> {
    const headers = {
      Authorization: `Bearer ${loginDto.accessToken}`,
      'User-Agent': 'SQLHub-Backend',
      Accept: 'application/vnd.github.v3+json',
    };

    let userResponse: GitHubUserResponse;
    try {
      const res = await fetch('https://api.github.com/user', { headers });
      if (!res.ok) {
        throw new Error(`GitHub API returned status ${res.status}`);
      }
      userResponse = (await res.json()) as GitHubUserResponse;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          token: 'invalidGithubToken',
        },
      });
    }

    let email = userResponse.email;
    let emailVerified = false;

    if (!email) {
      try {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers,
        });
        if (emailRes.ok) {
          const emails = (await emailRes.json()) as GitHubEmailResponse[];
          const primaryEmail = emails.find((e) => e.primary && e.verified);
          if (primaryEmail) {
            email = primaryEmail.email;
            emailVerified = true;
          } else if (emails.length > 0) {
            email = emails[0].email;
            emailVerified = emails[0].verified;
          }
        }
      } catch {
        // Fallback to unverified or no email
      }
    } else {
      emailVerified = true;
    }

    const nameParts = (userResponse.name || userResponse.login || '').trim().split(' ');
    const firstName = nameParts[0] || userResponse.login;
    const lastName = nameParts.slice(1).join(' ');

    return {
      id: userResponse.id.toString(),
      email: email ?? undefined,
      emailVerified,
      firstName,
      lastName,
    };
  }
}
