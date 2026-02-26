export type tCourse = {
    id: number;
    slug: string;
    title: string;
    description: string;
    lessons: number;
    hours: number;
    created: string;
};

export type tLesson = {
    id: number;
    course_id: number;
    slug: string;
    title: string;
    seconds: number;
    video: string;
    description: string;
    order: number;
    free: number;
};
