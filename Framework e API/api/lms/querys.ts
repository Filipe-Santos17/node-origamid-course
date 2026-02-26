import { Query } from "../../core/utils/abstract.ts";
import type { tCourse, tLesson } from "../@types/index.d.ts";

type tNewCourse = Omit<tCourse, "id" | "created">;
type tNewLesson = Omit<tLesson, "id" | "course_id"> & { courseSlug: string };

type tCertificateFullData = {
    id: string;
    name: string;
    title: string;
    hours: number;
    lessons: number;
    completed: string;
};

export class LmsQuery extends Query {
    //Nota: Cria um curso caso a slug seja nova, se não atualiza o curso
    insertCourse({ slug, title, description, lessons, hours }: tNewCourse) {
        const writeResult = this.db
            .query(
                /*sql*/ `
                        INSERT OR IGNORE INTO "courses"
                        ("slug", "title", "description", "lessons", "hours")
                        VALUES (?,?,?,?,?) ON CONFLICT ("slug") DO UPDATE SET
                        "title" = excluded."title",
                        "description" = excluded."description",
                        "lessons" = excluded."lessons",
                        "hours" = excluded."hours",
                    `,
            )
            .run(slug, title, description, lessons, hours);

        return writeResult;
    }

    insertLesson({ courseSlug, slug, title, seconds, video, description, order, free }: tNewLesson) {
        const writeResult = this.db
            .query(
                /*sql*/ `
                        INSERT OR IGNORE INTO "lessons"
                        ("course_id", "slug", "title", "seconds", 
                        "video", "description", "order", "free")
                        VALUES ((SELECT "id" FROM "courses" WHERE "slug" = ?), ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT ("course_id", "slug") DO UPDATE SET
                        "title" = excluded."title",
                        "description" = excluded."description",
                        "seconds" = excluded."seconds",
                        "order" = excluded."order",
                        "free" = excluded."free",
                        "video" = excluded."video",
                    `,
            )
            .run(courseSlug, slug, title, seconds, video, description, order, free);

        return writeResult;
    }

    selectCourses() {
        return this.db.prepare(/*sql*/ `SELECT * FROM "courses" ORDER BY "created" ASC LIMIT 100`).all() as tCourse[];
    }

    selectOneCourseBySlug(slug: string) {
        return this.db.prepare(/*sql*/ `SELECT * FROM "courses" WHERE "slug" = ?`).get(slug) as tCourse | undefined;
    }

    selectLessons(slug: string) {
        return this.db
            .prepare(
                /*sql*/ `SELECT * FROM "lessons" WHERE "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?) ORDER BY "order" ASC`,
            )
            .get(slug) as tLesson | undefined;
    }

    selectAllLessons() {
        return this.db
            .query(
                /*sql*/
                `SELECT "l".*, "c"."slug" as "course_slug" FROM "lessons" as "l" 
                JOIN "courses" as "c" ON "c"."id" = "l"."course_id" 
                ORDER BY "l"."course_id" ASC, "l"."order" ASC LIMIT 100`,
            )
            .all();
    }

    selectLesson(courseSlug: string, lessonSlug: string) {
        return this.db
            .prepare(
                /*sql*/ `SELECT * FROM "lessons" WHERE "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?) AND "lessonSlug" = ?`,
            )
            .get(courseSlug, lessonSlug) as tLesson | undefined;
    }

    selectLessonNav(courseSlug: string, lessonSlug: string) {
        return this.db
            .prepare(
                /*sql*/ `SELECT * FROM "lessons" WHERE "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?) AND "current_slug" = ?`,
            )
            .all(courseSlug, lessonSlug) as { slug: string }[];
    }

    completeLesson(userId: number, courseId: string, lessonId: string) {
        const writeResult = this.db
            .query(
                /*sql*/ `
                INSERT OR IGNORE INTO "lessons_completed" ("user_id", "course_id", "lesson_id") VALUES (?,?,?)`,
            )
            .run(userId, courseId, lessonId);

        return writeResult;
    }

    deleteCompleteLessons(userId: number, courseId: string) {
        const writeResult = this.db
            .query(
                /*sql*/ `
                DELETE FROM "lessons_completed" WHERE "user_id" = ? AND "course_id" = ?`,
            )
            .run(userId, courseId);

        return writeResult;
    }

    deleteCertificate(userId: number, courseId: string) {
        const writeResult = this.db
            .query(
                /*sql*/ `
                DELETE FROM "certificates" WHERE "user_id" = ? AND "course_id" = ?`,
            )
            .run(userId, courseId);

        return writeResult;
    }

    selectLessonCompleted(userId: number, lessonId: number) {
        const writeResult = this.db
            .prepare(
                /*sql*/ `
                SELECT "completed" FROM "lessons_completed" WHERE "user_id" = ? AND "lesson_id" = ?`,
            )
            .get(userId, lessonId) as { completed: string };

        return writeResult;
    }

    selectLessonsCompleted(userId: number, courseId: number) {
        const writeResult = this.db
            .prepare(
                /*sql*/ `
                SELECT "completed", "lesson_id" FROM "lessons_completed" WHERE "user_id" = ? AND "course_id" = ?`,
            )
            .all(userId, courseId) as { lesson_id: number; completed: string }[];

        return writeResult;
    }

    selectProgress(userId: number, courseId: number) {
        return this.db
            .prepare(
                /*sql*/ `
                SELECT "l"."id", "lc"."completed" 
                FROM "lessons" as "l"
                LEFT JOIN "lessons_completed" as "lc"
                ON "l"."id" = "lc"."lesson_id"
                AND "lc"."user_id" = ?
                WHERE "l"."course_id" = ?`,
            )
            .all(userId, courseId);
    }

    insertCertificate(userId: number, courseId: number) {
        return this.db
            .prepare(
                /*sql*/ `
                INSERT OR IGNORE INTO "certificates"
                ("user_id", "course_id") VALUES (?,?)
                RETURNING "id`,
            )
            .get(userId, courseId) as { id: string } | undefined;
        /*Nota: .run() sempre retorna um obj com {lastInsertRowid: ultimo id, changes: num de mudanças} */
        /*Nota: Returing para retornar após inserção  */
    }

    selectCertificates(userId: number) {
        return this.db
            .prepare(
                /*sql*/ `
            SELECT * FROM "certificates_full" WHERE "user_id" = ?`,
            )
            .all(userId) as tCertificateFullData[];
    }

    selectCertificateById(certificateId: string) {
        return this.db
            .prepare(
                /*sql*/ `
            SELECT * FROM "certificates_full" WHERE "id" = ?`,
            )
            .get(certificateId) as tCertificateFullData | undefined;
    }
}
