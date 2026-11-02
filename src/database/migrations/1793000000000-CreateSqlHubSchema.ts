import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSqlHubSchema1793000000000 implements MigrationInterface {
  name = 'CreateSqlHubSchema1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "locale" character varying NOT NULL DEFAULT 'vi'`,
    );

    await queryRunner.query(
      `CREATE TABLE "course" ("id" SERIAL NOT NULL, "slug" character varying NOT NULL, "order" integer NOT NULL DEFAULT '1', "isPublished" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_course" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_course_slug" ON "course" ("slug")`,
    );

    await queryRunner.query(
      `CREATE TABLE "course_translation" ("id" SERIAL NOT NULL, "course_id" integer NOT NULL, "locale" character varying(10) NOT NULL DEFAULT 'vi', "title" character varying NOT NULL, "description" text, CONSTRAINT "PK_course_translation" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_course_translation_course_locale" ON "course_translation" ("course_id", "locale")`,
    );

    await queryRunner.query(
      `CREATE TABLE "lesson" ("id" SERIAL NOT NULL, "course_id" integer NOT NULL, "slug" character varying NOT NULL, "order" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_lesson" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lesson_slug" ON "lesson" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_course" ON "lesson" ("course_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "lesson_translation" ("id" SERIAL NOT NULL, "lesson_id" integer NOT NULL, "locale" character varying(10) NOT NULL DEFAULT 'vi', "title" character varying NOT NULL, "content_md" text NOT NULL, CONSTRAINT "PK_lesson_translation" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lesson_translation_lesson_locale" ON "lesson_translation" ("lesson_id", "locale")`,
    );

    await queryRunner.query(
      `CREATE TABLE "lesson_progress" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "lesson_id" integer NOT NULL, "completed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_lesson_progress" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lesson_progress_user_lesson" ON "lesson_progress" ("user_id", "lesson_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "quiz" ("id" SERIAL NOT NULL, "lesson_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_quiz" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_lesson" ON "quiz" ("lesson_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "quiz_translation" ("id" SERIAL NOT NULL, "quiz_id" integer NOT NULL, "locale" character varying(10) NOT NULL DEFAULT 'vi', "title" character varying NOT NULL, "description" text, CONSTRAINT "PK_quiz_translation" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_quiz_translation_quiz_locale" ON "quiz_translation" ("quiz_id", "locale")`,
    );

    await queryRunner.query(
      `CREATE TABLE "quiz_question" ("id" SERIAL NOT NULL, "quiz_id" integer NOT NULL, "order" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_quiz_question" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_question_quiz" ON "quiz_question" ("quiz_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "quiz_question_translation" ("id" SERIAL NOT NULL, "question_id" integer NOT NULL, "locale" character varying(10) NOT NULL DEFAULT 'vi', "question_text" text NOT NULL, "explanation" text, CONSTRAINT "PK_quiz_question_translation" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_quiz_question_translation_question_locale" ON "quiz_question_translation" ("question_id", "locale")`,
    );

    await queryRunner.query(
      `CREATE TABLE "question_option" ("id" SERIAL NOT NULL, "question_id" integer NOT NULL, "is_correct" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_question_option" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_option_question" ON "question_option" ("question_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "question_option_translation" ("id" SERIAL NOT NULL, "option_id" integer NOT NULL, "locale" character varying(10) NOT NULL DEFAULT 'vi', "option_text" character varying NOT NULL, CONSTRAINT "PK_question_option_translation" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_question_option_translation_option_locale" ON "question_option_translation" ("option_id", "locale")`,
    );

    await queryRunner.query(
      `CREATE TABLE "quiz_attempt" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "quiz_id" integer NOT NULL, "score" integer NOT NULL DEFAULT '0', "answers" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_quiz_attempt" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_attempt_user" ON "quiz_attempt" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_attempt_quiz" ON "quiz_attempt" ("quiz_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "dataset" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "setup_sql" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dataset" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "lab" ("id" SERIAL NOT NULL, "lesson_id" integer, "dataset_id" integer NOT NULL, "expected_query" text NOT NULL, "order_sensitive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_lab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lab_lesson" ON "lab" ("lesson_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lab_dataset" ON "lab" ("dataset_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "lab_translation" ("id" SERIAL NOT NULL, "lab_id" integer NOT NULL, "locale" character varying(10) NOT NULL DEFAULT 'vi', "title" character varying NOT NULL, "description" text NOT NULL, "hint" text, CONSTRAINT "PK_lab_translation" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_lab_translation_lab_locale" ON "lab_translation" ("lab_id", "locale")`,
    );

    await queryRunner.query(
      `CREATE TABLE "lab_submission" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "lab_id" integer NOT NULL, "query" text NOT NULL, "passed" boolean NOT NULL DEFAULT false, "runtime_ms" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_lab_submission" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lab_submission_user" ON "lab_submission" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lab_submission_lab" ON "lab_submission" ("lab_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "course_translation" ADD CONSTRAINT "FK_course_translation_course" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson" ADD CONSTRAINT "FK_lesson_course" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_translation" ADD CONSTRAINT "FK_lesson_translation_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_progress" ADD CONSTRAINT "FK_lesson_progress_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_progress" ADD CONSTRAINT "FK_lesson_progress_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz" ADD CONSTRAINT "FK_quiz_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_translation" ADD CONSTRAINT "FK_quiz_translation_quiz" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_question" ADD CONSTRAINT "FK_quiz_question_quiz" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_question_translation" ADD CONSTRAINT "FK_quiz_question_translation_question" FOREIGN KEY ("question_id") REFERENCES "quiz_question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_option" ADD CONSTRAINT "FK_question_option_question" FOREIGN KEY ("question_id") REFERENCES "quiz_question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_option_translation" ADD CONSTRAINT "FK_question_option_translation_option" FOREIGN KEY ("option_id") REFERENCES "question_option"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempt" ADD CONSTRAINT "FK_quiz_attempt_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempt" ADD CONSTRAINT "FK_quiz_attempt_quiz" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab" ADD CONSTRAINT "FK_lab_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab" ADD CONSTRAINT "FK_lab_dataset" FOREIGN KEY ("dataset_id") REFERENCES "dataset"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_translation" ADD CONSTRAINT "FK_lab_translation_lab" FOREIGN KEY ("lab_id") REFERENCES "lab"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_submission" ADD CONSTRAINT "FK_lab_submission_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_submission" ADD CONSTRAINT "FK_lab_submission_lab" FOREIGN KEY ("lab_id") REFERENCES "lab"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_submission" DROP CONSTRAINT "FK_lab_submission_lab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_submission" DROP CONSTRAINT "FK_lab_submission_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_translation" DROP CONSTRAINT "FK_lab_translation_lab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab" DROP CONSTRAINT "FK_lab_dataset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab" DROP CONSTRAINT "FK_lab_lesson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempt" DROP CONSTRAINT "FK_quiz_attempt_quiz"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempt" DROP CONSTRAINT "FK_quiz_attempt_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_option_translation" DROP CONSTRAINT "FK_question_option_translation_option"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_option" DROP CONSTRAINT "FK_question_option_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_question_translation" DROP CONSTRAINT "FK_quiz_question_translation_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_question" DROP CONSTRAINT "FK_quiz_question_quiz"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_translation" DROP CONSTRAINT "FK_quiz_translation_quiz"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz" DROP CONSTRAINT "FK_quiz_lesson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_lesson_progress_lesson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_lesson_progress_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_translation" DROP CONSTRAINT "FK_lesson_translation_lesson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson" DROP CONSTRAINT "FK_lesson_course"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_translation" DROP CONSTRAINT "FK_course_translation_course"`,
    );

    await queryRunner.query(`DROP INDEX "IDX_lab_submission_lab"`);
    await queryRunner.query(`DROP INDEX "IDX_lab_submission_user"`);
    await queryRunner.query(`DROP TABLE "lab_submission"`);
    await queryRunner.query(`DROP INDEX "IDX_lab_translation_lab_locale"`);
    await queryRunner.query(`DROP TABLE "lab_translation"`);
    await queryRunner.query(`DROP INDEX "IDX_lab_dataset"`);
    await queryRunner.query(`DROP INDEX "IDX_lab_lesson"`);
    await queryRunner.query(`DROP TABLE "lab"`);
    await queryRunner.query(`DROP TABLE "dataset"`);
    await queryRunner.query(`DROP INDEX "IDX_quiz_attempt_quiz"`);
    await queryRunner.query(`DROP INDEX "IDX_quiz_attempt_user"`);
    await queryRunner.query(`DROP TABLE "quiz_attempt"`);
    await queryRunner.query(
      `DROP INDEX "IDX_question_option_translation_option_locale"`,
    );
    await queryRunner.query(`DROP TABLE "question_option_translation"`);
    await queryRunner.query(`DROP INDEX "IDX_question_option_question"`);
    await queryRunner.query(`DROP TABLE "question_option"`);
    await queryRunner.query(
      `DROP INDEX "IDX_quiz_question_translation_question_locale"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_question_translation"`);
    await queryRunner.query(`DROP INDEX "IDX_quiz_question_quiz"`);
    await queryRunner.query(`DROP TABLE "quiz_question"`);
    await queryRunner.query(`DROP INDEX "IDX_quiz_translation_quiz_locale"`);
    await queryRunner.query(`DROP TABLE "quiz_translation"`);
    await queryRunner.query(`DROP INDEX "IDX_quiz_lesson"`);
    await queryRunner.query(`DROP TABLE "quiz"`);
    await queryRunner.query(`DROP INDEX "IDX_lesson_progress_user_lesson"`);
    await queryRunner.query(`DROP TABLE "lesson_progress"`);
    await queryRunner.query(
      `DROP INDEX "IDX_lesson_translation_lesson_locale"`,
    );
    await queryRunner.query(`DROP TABLE "lesson_translation"`);
    await queryRunner.query(`DROP INDEX "IDX_lesson_course"`);
    await queryRunner.query(`DROP INDEX "IDX_lesson_slug"`);
    await queryRunner.query(`DROP TABLE "lesson"`);
    await queryRunner.query(
      `DROP INDEX "IDX_course_translation_course_locale"`,
    );
    await queryRunner.query(`DROP TABLE "course_translation"`);
    await queryRunner.query(`DROP INDEX "IDX_course_slug"`);
    await queryRunner.query(`DROP TABLE "course"`);

    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "locale"`);
  }
}
