import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoursesAndLessons1761700000000
  implements MigrationInterface
{
  name = 'CreateCoursesAndLessons1761700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── course ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "course" (
        "id"           SERIAL NOT NULL,
        "slug"         character varying NOT NULL,
        "order"        integer NOT NULL DEFAULT 1,
        "isPublished"  boolean NOT NULL DEFAULT false,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_course_slug" ON "course" ("slug")`,
    );

    // ── course_translation ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "course_translation" (
        "id"          SERIAL NOT NULL,
        "course_id"   integer NOT NULL,
        "locale"      character varying(10) NOT NULL DEFAULT 'vi',
        "title"       character varying NOT NULL,
        "description" text,
        CONSTRAINT "PK_course_translation" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_course_translation_course_locale"
        ON "course_translation" ("course_id", "locale")
    `);
    await queryRunner.query(`
      ALTER TABLE "course_translation"
        ADD CONSTRAINT "FK_course_translation_course"
        FOREIGN KEY ("course_id") REFERENCES "course"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // ── lesson ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lesson" (
        "id"         SERIAL NOT NULL,
        "course_id"  integer NOT NULL,
        "slug"       character varying NOT NULL,
        "order"      integer NOT NULL DEFAULT 1,
        "is_preview" boolean NOT NULL DEFAULT false,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lesson" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lesson_slug" ON "lesson" ("slug")`,
    );
    await queryRunner.query(`
      ALTER TABLE "lesson"
        ADD CONSTRAINT "FK_lesson_course"
        FOREIGN KEY ("course_id") REFERENCES "course"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // ── lesson_translation ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lesson_translation" (
        "id"         SERIAL NOT NULL,
        "lesson_id"  integer NOT NULL,
        "locale"     character varying(10) NOT NULL DEFAULT 'vi',
        "title"      character varying NOT NULL,
        "content_md" text NOT NULL,
        CONSTRAINT "PK_lesson_translation" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_lesson_translation_lesson_locale"
        ON "lesson_translation" ("lesson_id", "locale")
    `);
    await queryRunner.query(`
      ALTER TABLE "lesson_translation"
        ADD CONSTRAINT "FK_lesson_translation_lesson"
        FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // ── lesson_progress ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lesson_progress" (
        "id"           SERIAL NOT NULL,
        "user_id"      integer NOT NULL,
        "lesson_id"    integer NOT NULL,
        "completed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lesson_progress" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_lesson_progress_user_lesson"
        ON "lesson_progress" ("user_id", "lesson_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "lesson_progress"
        ADD CONSTRAINT "FK_lesson_progress_user"
        FOREIGN KEY ("user_id") REFERENCES "user"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "lesson_progress"
        ADD CONSTRAINT "FK_lesson_progress_lesson"
        FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_lesson_progress_lesson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_lesson_progress_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_lesson_progress_user_lesson"`,
    );
    await queryRunner.query(`DROP TABLE "lesson_progress"`);

    await queryRunner.query(
      `ALTER TABLE "lesson_translation" DROP CONSTRAINT "FK_lesson_translation_lesson"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_lesson_translation_lesson_locale"`,
    );
    await queryRunner.query(`DROP TABLE "lesson_translation"`);

    await queryRunner.query(
      `ALTER TABLE "lesson" DROP CONSTRAINT "FK_lesson_course"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_lesson_slug"`);
    await queryRunner.query(`DROP TABLE "lesson"`);

    await queryRunner.query(
      `ALTER TABLE "course_translation" DROP CONSTRAINT "FK_course_translation_course"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_course_translation_course_locale"`,
    );
    await queryRunner.query(`DROP TABLE "course_translation"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_course_slug"`);
    await queryRunner.query(`DROP TABLE "course"`);
  }
}
