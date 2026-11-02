import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGithubService } from './auth-github.service';

const jsonResponse = (body: unknown, ok = true, status = 200): Response =>
  ({
    ok,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

describe('AuthGithubService', () => {
  let service: AuthGithubService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthGithubService],
    }).compile();

    service = moduleRef.get(AuthGithubService);
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('should map a GitHub profile that exposes a public email', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 583231,
        login: 'octocat',
        name: 'The Octocat',
        email: 'octocat@github.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/583231',
      }),
    );

    const profile = await service.getProfileByToken({ accessToken: 'token' });

    expect(profile).toEqual({
      id: '583231',
      email: 'octocat@github.com',
      emailVerified: true,
      firstName: 'The',
      lastName: 'Octocat',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      }),
    );
  });

  it('should fall back to the verified primary email from /user/emails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          id: 1,
          login: 'octocat',
          name: null,
          email: null,
          avatar_url: '',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            email: 'primary@example.com',
            primary: true,
            verified: true,
            visibility: 'public',
          },
        ]),
      );

    const profile = await service.getProfileByToken({ accessToken: 'token' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/user/emails',
      expect.any(Object),
    );
    expect(profile.email).toBe('primary@example.com');
    expect(profile.emailVerified).toBe(true);
    expect(profile.firstName).toBe('octocat');
  });

  it('should reject an invalid GitHub access token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 401));

    await expect(
      service.getProfileByToken({ accessToken: 'invalid' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
