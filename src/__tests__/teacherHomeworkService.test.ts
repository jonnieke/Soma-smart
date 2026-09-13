import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn(), classroom: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: mocks.from, auth: { getUser: mocks.getUser } } }));
vi.mock('../services/classroomService', () => ({ classroomService: { getOrCreateClassByName: mocks.classroom } }));
import { publishTeacherHomework } from '../services/teacherHomeworkService';

const homework = { id: 'assignment-1', title: 'Fractions', questions: [
    { number: 1, text: 'What is half of 8?', marks: 2, topic: 'Fractions', modelAnswerOutline: 'PRIVATE ANSWER: 4' },
] };
const post = { id: homework.id, author_id: 'teacher-1', class_id: 'class-1', post_type: 'ASSIGNMENT' };
const call = () => publishTeacherHomework('teacher-1', 'Grade 6', 'Maths', homework, '2026-09-20');

describe('confirmed homework publishing', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
        mocks.getUser.mockResolvedValue({ data: { user: { id: 'teacher-1' } }, error: null });
        mocks.classroom.mockResolvedValue({ id: 'class-1' });
    });
    function query(result: unknown) {
        const builder: any = { single: vi.fn().mockResolvedValue(result) };
        for (const method of ['insert', 'select', 'eq']) builder[method] = vi.fn().mockReturnValue(builder);
        return builder;
    }
    it('publishes full questions and due date but not private model answers', async () => {
        const builder = query({ data: post, error: null });
        mocks.from.mockReturnValue(builder);
        expect(await call()).toEqual(post);
        const inserted = builder.insert.mock.calls[0][0];
        expect(inserted).toMatchObject(post);
        expect(inserted.content).toContain('What is half of 8?');
        expect(inserted.content).toContain('2026-09-20');
        expect(inserted.content).not.toContain('PRIVATE ANSWER');
    });
    it('does not turn a server failure into local success', async () => {
        mocks.from.mockReturnValue(query({ data: null, error: { code: '42501' } }));
        await expect(call()).rejects.toThrow('Posting could not be confirmed');
    });
    it('reconciles a retry only when the saved assignment matches', async () => {
        const failed = query({ data: null, error: { code: '23505' } });
        mocks.from.mockImplementationOnce(() => failed).mockImplementationOnce(() =>
            query({ data: { ...post, content: failed.insert.mock.calls[0][0].content }, error: null }));
        expect(await call()).toMatchObject(post);
        expect(mocks.from).toHaveBeenCalledTimes(2);
    });
    it('does not acknowledge an unrelated duplicate ID', async () => {
        mocks.from.mockReturnValueOnce(query({ data: null, error: { code: '23505' } }))
            .mockReturnValueOnce(query({ data: { ...post, content: 'different work' }, error: null }));
        await expect(call()).rejects.toThrow('Posting could not be confirmed');
    });
    it('rejects an account mismatch before creating a classroom', async () => {
        mocks.getUser.mockResolvedValue({ data: { user: { id: 'someone-else' } } });
        await expect(call()).rejects.toThrow('Sign in');
        expect(mocks.classroom).not.toHaveBeenCalled();
    });
    it('rejects a device-only classroom', async () => {
        mocks.classroom.mockResolvedValue({ id: 'local-class:teacher:grade', is_local_fallback: true });
        await expect(call()).rejects.toThrow('Nothing was posted');
        expect(mocks.from).not.toHaveBeenCalled();
    });
    it('does not send offline', async () => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
        await expect(call()).rejects.toThrow('Connect to the internet');
        expect(mocks.getUser).not.toHaveBeenCalled();
    });
});
