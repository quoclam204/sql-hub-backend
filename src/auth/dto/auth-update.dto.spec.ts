import { validate } from 'class-validator';
import { AuthUpdateDto } from './auth-update.dto';

describe('AuthUpdateDto', () => {
  it.each(['vi', 'en'])('accepts supported locale %s', async (locale) => {
    const dto = Object.assign(new AuthUpdateDto(), { locale });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each(['fr', '', 'VI'])('rejects unsupported locale %s', async (locale) => {
    const dto = Object.assign(new AuthUpdateDto(), { locale });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'locale' })]),
    );
  });
});
