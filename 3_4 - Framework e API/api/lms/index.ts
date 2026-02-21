import { Api } from "../../core/utils/abstract.ts";
import RouteError from "../../core/utils/route-error.ts";
import { lmsTables } from "./tables.ts";
import { LmsQuery } from "./querys.ts";

import type { tCourse, tLesson } from "../@types/index.d.ts";
import NotFoundError from "../../core/utils/errors/not-found-error.ts";

export class LmsApi extends Api {
    query = new LmsQuery(this.db);

    handlers = {
        getCourses: (req, res) => {
            const courses = this.query.selectCourses();

            res.status(200).json(courses);
        },

        getCourse: (req, res) => {
            const { slug } = req.params;

            if (!slug) {
                throw new RouteError(400, "Slug descohecido");
            }

            const course = this.query.selectOneCourseBySlug(slug);

            if (!course) {
                throw new NotFoundError(`Curso com o slug: "${slug}", não encontrado!`);
            }

            const lesson = this.query.selectLessons(slug);

            const userId = 1;
            let completed: {
                lesson_id: number;
                completed: string;
            }[] = [];

            if (userId) {
                completed = this.query.selectLessonsCompleted(userId, course.id);
            }

            res.status(200).json({ course, lesson, completed });
        },

        postCourse: (req, res) => {
            const { slug, title, description, lessons, hours } = req.body as tCourse;

            const writeResult = this.query.insertCourse({
                slug,
                title,
                description,
                lessons,
                hours,
            });

            if (writeResult.changes === 0) {
                throw new RouteError(400, "Curso já existente ou informações incorretas");
            }

            res.status(201).json({
                id: writeResult.lastInsertRowid,
                changes: writeResult.changes,
                message: "Curso criado com sucesso",
            });
        },

        getLesson: (req, res) => {
            const { courseSlug, lessonSlug } = req.params;

            const queryResult = this.query.selectLesson(courseSlug, lessonSlug);

            if (!queryResult) {
                throw new NotFoundError("Aula não encontrada!");
            }

            const nav = this.query.selectLessonNav(courseSlug, lessonSlug);

            const i = nav.findIndex((l) => l.slug === queryResult.slug);
            const prev = i === 0 ? null : nav.at(i - 1)?.slug;
            const next = nav.at(i + 1)?.slug ?? null;

            const userId = 1;
            let completed = "";

            if (userId) {
                const lessonCompleted = this.query.selectLessonCompleted(userId, queryResult.id);

                if (lessonCompleted) {
                    completed = lessonCompleted.completed;
                }
            }

            res.json({ ...queryResult, prev, next, completed });
        },

        postLesson: (req, res) => {
            const { courseSlug, slug, title, seconds, video, description, order, free } = req.body as tLesson & {
                courseSlug: string;
            };

            const writeResult = this.query.insertLesson({
                courseSlug,
                slug,
                title,
                seconds,
                video,
                description,
                order,
                free,
            });

            if (writeResult.changes === 0) {
                throw new RouteError(400, "Aula já existente ou informações incorretas");
            }

            res.status(201).json({
                id: writeResult.lastInsertRowid,
                changes: writeResult.changes,
                message: "Aula criada com sucesso",
            });
        },

        postCompleteLesson: (req, res) => {
            try {
                const userId = 1;
                const { courseId, lessonId } = req.body;

                const writeResult = this.query.completeLesson(userId, courseId, lessonId);

                if (writeResult.changes === 0) {
                    throw new RouteError(400, "Erro ao completar aula");
                }

                const progress = this.query.selectProgress(userId, courseId);
                const incompleteLessons = progress.filter((item) => !item.completed);

                if (progress.length > 0 && incompleteLessons.length === 0) {
                    const certificate = this.query.insertCertificate(userId, courseId);

                    if (!certificate) {
                        throw new RouteError(400, "Erro ao gerar certificado");
                    }

                    res.status(201).json({
                        certificate: certificate.id,
                        message: "Aula completada com sucesso",
                    });
                    return;
                }

                res.status(201).json({
                    certificate: null,
                    message: "Aula completada com sucesso",
                });
            } catch (e) {
                res.status(400).json({
                    message: "Aula não encontrada",
                });
            }
        },

        resetCompleteCourse: (req, res) => {
            try {
                const userId = 1;
                const { courseId } = req.body;

                const writeResult = this.query.deleteCompleteLessons(userId, courseId);

                if (writeResult.changes === 0) {
                    throw new RouteError(400, "Erro ao resetar curso");
                }

                res.status(204).json({
                    message: "Curso resetado com sucesso",
                });
            } catch (e) {
                res.status(400).json({
                    message: "Curso não encontrado",
                });
            }
        },

        getAllCertificates: (req, res) => {
            const userId = 1;
            const certificatesResult = this.query.selectCertificates(userId);

            if (certificatesResult.length === 0) {
                throw new RouteError(400, "Nenhum certificado encontrado");
            }

            res.status(200).json(certificatesResult);
        },

        getCertificateById: (req, res) => {
            const { id } = req.params;
            const certificate = this.query.selectCertificateById(id);

            if (!certificate) {
                throw new RouteError(400, "Nenhum certificado encontrado");
            }

            res.status(200).json(certificate);
        },
    } satisfies Api["handlers"];

    tables(): void {
        this.db.exec(lmsTables);
    }

    routes(): void {
        this.router.get("/lms/course", this.handlers.getCourses);
        this.router.post("/lms/course", this.handlers.postCourse);
        this.router.get("/lms/course/:slug", this.handlers.getCourse);
        this.router.delete("/lms/course/reset", this.handlers.resetCompleteCourse);
        this.router.post("/lms/lesson", this.handlers.postLesson);
        this.router.post("/lms/lesson/:courseSlug/:lessonSlug", this.handlers.getLesson);
        this.router.post("/lms/lesson/complete", this.handlers.postCompleteLesson);
        this.router.post("/lms/certificates", this.handlers.postCompleteLesson);
        this.router.post("/lms/certificates/:id", this.handlers.postCompleteLesson);
    }
}
