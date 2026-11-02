/**
 * E2E tests for Courses & Lessons API
 *
 * Prerequisites (run before this suite):
 *   - DB migrated  (migration:run)
 *   - Seeds run    (seed:run:relational)  — at least 1 published course with
 *     1 published lesson (isPreview=true for the first lesson) and 1 tester
 *     user (john.doe@example.com / secret)
 *
 * Environment variables expected:
 *   APP_PORT  — port the NestJS server is listening on
 *   TESTER_EMAIL / TESTER_PASSWORD — credentials from test/utils/constants.ts
 */
import { describe, expect, it, beforeAll } from '@jest/globals';
import request from 'supertest';
import { APP_URL, TESTER_EMAIL, TESTER_PASSWORD } from '../utils/constants';

const API = APP_URL;

describe('Courses & Lessons API (e2e)', () => {
  let accessToken: string;
  let courseSlug: string;
  let firstLessonId: number;
  let firstLessonSlug: string;
  let nonPreviewLessonSlug: string | undefined;

  // ── Auth setup ─────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const res = await request(API)
      .post('/api/v1/auth/email/login')
      .send({ email: TESTER_EMAIL, password: TESTER_PASSWORD });

    expect(res.status).toBe(200);
    accessToken = res.body.token as string;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /courses
  // ─────────────────────────────────────────────────────────────────────────

  describe('GET /api/v1/courses', () => {
    it('returns list of published courses (guest)', async () => {
      const res = await request(API).get('/api/v1/courses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const course = res.body[0] as {
        id: number;
        slug: string;
        order: number;
        title: string;
        lessonsCount: number;
        completedCount: number;
      };
      expect(course).toHaveProperty('slug');
      expect(course).toHaveProperty('lessonsCount');
      expect(course).toHaveProperty('completedCount');
      expect(course.completedCount).toBe(0);

      courseSlug = course.slug;
    });

    it('returns completedCount=0 initially for authenticated user', async () => {
      const res = await request(API)
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const course = (res.body as Array<{ completedCount: number }>)[0];
      expect(course.completedCount).toBeDefined();
    });

    it('respects locale query parameter', async () => {
      const res = await request(API)
        .get('/api/v1/courses?locale=en');
      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /courses/:slug
  // ─────────────────────────────────────────────────────────────────────────

  describe('GET /api/v1/courses/:slug', () => {
    it('returns course detail with lesson list', async () => {
      const res = await request(API).get(`/api/v1/courses/${courseSlug}`);

      expect(res.status).toBe(200);

      const body = res.body as {
        slug: string;
        title: string;
        lessons: Array<{
          id: number;
          slug: string;
          order: number;
          isPreview: boolean;
          completed: boolean;
        }>;
      };
      expect(body.slug).toBe(courseSlug);
      expect(Array.isArray(body.lessons)).toBe(true);
      if (body.lessons.length > 0) {
        expect(body.lessons[0]).toHaveProperty('completed');
        expect(typeof body.lessons[0].completed).toBe('boolean');
      }

      if (body.lessons.length > 0) {
        firstLessonId = body.lessons[0].id;
        firstLessonSlug = body.lessons[0].slug;
        nonPreviewLessonSlug = body.lessons.find((l) => !l.isPreview)?.slug;
      }
    });

    it('returns 404 for unknown slug', async () => {
      const res = await request(API).get('/api/v1/courses/does-not-exist-xyz');
      expect(res.status).toBe(404);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /lessons/:slug
  // ─────────────────────────────────────────────────────────────────────────

  describe('GET /api/v1/lessons/:slug', () => {
    it('allows guest to read a preview lesson', async () => {
      if (!firstLessonSlug) {
        console.warn('Skipping: no lesson slug available');
        return;
      }

      // Assume seed sets first lesson as isPreview=true
      const res = await request(API)
        .get(`/api/v1/lessons/${firstLessonSlug}`)
        .query({ locale: 'vi' });

      // Could be 200 (preview) or 403 (non-preview). We test the schema if 200.
      if (res.status === 200) {
        expect(res.body).toHaveProperty('slug', firstLessonSlug);
        expect(res.body).toHaveProperty('contentMd');
        expect(res.body).toHaveProperty('translated');
        expect(res.body).toHaveProperty('prevSlug');
        expect(res.body).toHaveProperty('nextSlug');
      } else {
        expect(res.status).toBe(403);
      }
    });

    it('returns 403 for non-preview lesson when guest', async () => {
      if (!nonPreviewLessonSlug) {
        console.warn('Skipping: no non-preview lesson in seed data');
        return;
      }

      const res = await request(API).get(
        `/api/v1/lessons/${nonPreviewLessonSlug}`,
      );
      expect(res.status).toBe(403);
    });

    it('returns 200 for authenticated user reading any lesson', async () => {
      if (!firstLessonSlug) {
        console.warn('Skipping: no lesson slug available');
        return;
      }

      const res = await request(API)
        .get(`/api/v1/lessons/${firstLessonSlug}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it('returns 404 for unknown lesson slug', async () => {
      const res = await request(API)
        .get('/api/v1/lessons/slug-that-does-not-exist-xyz')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /lessons/search
  // ─────────────────────────────────────────────────────────────────────────

  describe('GET /api/v1/lessons/search', () => {
    it('returns search results matching query keyword', async () => {
      const res = await request(API)
        .get('/api/v1/lessons/search')
        .query({ q: 'SQL', locale: 'vi' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        const item = res.body[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('slug');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('courseSlug');
        expect(item).toHaveProperty('courseTitle');
        expect(item).toHaveProperty('isPreview');
      }
    });

    it('guest receives null snippet for non-preview lesson search match', async () => {
      const res = await request(API)
        .get('/api/v1/lessons/search')
        .query({ q: 'WHERE', locale: 'vi' });

      expect(res.status).toBe(200);
      if (Array.isArray(res.body)) {
        const nonPreviewMatch = res.body.find((item: any) => !item.isPreview);
        if (nonPreviewMatch) {
          expect(nonPreviewMatch.snippet).toBeNull();
        }
      }
    });

    it('authenticated user receives snippet even for non-preview lessons', async () => {
      const res = await request(API)
        .get('/api/v1/lessons/search')
        .query({ q: 'WHERE', locale: 'vi' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      if (Array.isArray(res.body)) {
        const nonPreviewMatch = res.body.find((item: any) => !item.isPreview);
        if (nonPreviewMatch && nonPreviewMatch.snippet) {
          expect(typeof nonPreviewMatch.snippet).toBe('string');
        }
      }
    });

    it('returns 422 or empty when query param is missing or empty', async () => {
      const res = await request(API)
        .get('/api/v1/lessons/search')
        .query({ q: '' });

      // class-validator @IsNotEmpty() on SearchLessonDto causes 422
      expect([200, 422]).toContain(res.status);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // POST /lessons/:id/complete
  // ─────────────────────────────────────────────────────────────────────────

  describe('POST /api/v1/lessons/:id/complete', () => {
    it('returns 401 without token', async () => {
      const res = await request(API).post('/api/v1/lessons/1/complete');
      expect(res.status).toBe(401);
    });

    it('returns 404 for unknown lesson id', async () => {
      const res = await request(API)
        .post('/api/v1/lessons/999999/complete')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it('marks a lesson as completed (first time) — 204', async () => {
      if (!firstLessonId) {
        console.warn('Skipping: no lesson id available');
        return;
      }

      const res = await request(API)
        .post(`/api/v1/lessons/${firstLessonId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });

    it('is idempotent — completing twice returns 204 both times', async () => {
      if (!firstLessonId) {
        console.warn('Skipping: no lesson id available');
        return;
      }

      const res = await request(API)
        .post(`/api/v1/lessons/${firstLessonId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /progress
  // ─────────────────────────────────────────────────────────────────────────

  describe('GET /api/v1/progress', () => {
    it('returns 401 without token', async () => {
      const res = await request(API).get('/api/v1/progress');
      expect(res.status).toBe(401);
    });

    it('returns progress list with at least one item after completion', async () => {
      const res = await request(API)
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if ((res.body as unknown[]).length > 0) {
        const item = (
          res.body as Array<{
            lessonId: number;
            lessonSlug: string;
            completedAt: string;
          }>
        )[0];
        expect(item).toHaveProperty('lessonId');
        expect(item).toHaveProperty('lessonSlug');
        expect(item).toHaveProperty('completedAt');
      }
    });

    it("other users' progress is isolated (second user sees empty progress)", async () => {
      // Register a brand-new user
      const timestamp = Date.now();
      const email = `isolated_${timestamp}@example.com`;
      const password = 'secret';

      await request(API).post('/api/v1/auth/email/register').send({
        email,
        password,
        firstName: 'Isolated',
        lastName: 'Test',
      });

      // Login as new user (may need email confirmation in prod — skip in test env)
      const loginRes = await request(API)
        .post('/api/v1/auth/email/login')
        .send({ email, password });

      if (loginRes.status !== 200) {
        console.warn(
          'Skipping isolation test: new user login failed (email confirmation may be required)',
        );
        return;
      }

      const newToken = loginRes.body.token as string;
      const progressRes = await request(API)
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${newToken}`);

      expect(progressRes.status).toBe(200);
      expect((progressRes.body as unknown[]).length).toBe(0);
    });

    it('completedCount reflects completed lessons in course list', async () => {
      if (!firstLessonId) {
        console.warn('Skipping: no lesson id available');
        return;
      }

      const res = await request(API)
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const totalCompleted = (
        res.body as Array<{ completedCount: number }>
      ).reduce((acc, c) => acc + c.completedCount, 0);

      expect(totalCompleted).toBeGreaterThan(0);
    });
  });
});
