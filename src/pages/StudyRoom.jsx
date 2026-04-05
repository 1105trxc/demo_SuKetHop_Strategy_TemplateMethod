import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronDown, ChevronRight, CheckCircle2, Lock, PlayCircle,
    BookOpen, AlertTriangle, Loader2, Clock
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────── */

export default function StudyRoom() {
    const { courseId } = useParams();
    const navigate     = useNavigate();
    const { isAuthenticated } = useAuth();

    // ── State ──────────────────────────────────────────────────────────────────
    const [studyMap,       setStudyMap]       = useState(null);
    const [activeLesson,   setActiveLesson]   = useState(null);   // full lesson content
    const [activeLessonId, setActiveLessonId] = useState(null);
    const [openChapters,   setOpenChapters]   = useState({});     // accordion open state
    const [loading,        setLoading]        = useState(true);
    const [lessonLoading,  setLessonLoading]  = useState(false);
    const [videoError,     setVideoError]     = useState(false);

    const videoRef        = useRef(null);
    const saveProgressRef = useRef(null); // debounce ref cho lưu tiến độ

    // ── Load study map ─────────────────────────────────────────────────────────
    const fetchStudyMap = useCallback(async () => {
        try {
            const res = await axiosClient.get(`/learning/courses/${courseId}/study-map`);
            const map = res.data;
            setStudyMap(map);

            // Mở chapter đầu tiên mặc định
            if (map.chapters?.length > 0) {
                setOpenChapters({ [map.chapters[0].chapterId]: true });
            }
        } catch {
            toast.error('Không thể tải nội dung khóa học.');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => { fetchStudyMap(); }, [fetchStudyMap]);

    // ── Load lesson content khi click vào bài ─────────────────────────────────
    const handleSelectLesson = async (lesson) => {
        if (lesson.isLocked) return; // chặn click bài khóa
        if (lesson.lessonId === activeLessonId) return; // tránh reload cùng bài

        // Lưu thời gian xem hiện tại trước khi chuyển
        await saveCurrentProgress();

        setActiveLessonId(lesson.lessonId);
        setVideoError(false);
        setLessonLoading(true);

        try {
            // Bài free preview cho phép xem kể cả chưa đăng nhập
            if (lesson.isFreePreview && !isAuthenticated) {
                // Dùng dữ liệu từ study map (không cần gọi thêm API lesson content)
                setActiveLesson({
                    lessonId:        lesson.lessonId,
                    title:           lesson.title,
                    videoUrl:        lesson.videoUrl,
                    durationSeconds: lesson.durationSeconds,
                    isFreePreview:   true,
                    status:          null,
                    lastWatchedSecond: 0,
                });
                return;
            }

            const res = await axiosClient.get(`/learning/lessons/${lesson.lessonId}`);
            setActiveLesson(res.data);
        } catch (err) {
            const status = err.response?.status;
            if (status === 403 || status === 401) {
                toast.error('Bạn cần đăng ký khóa học để xem bài này.');
            } else {
                toast.error('Không thể tải nội dung bài học.');
            }
        } finally {
            setLessonLoading(false);
        }
    };

    // ── Lưu tiến độ xem ───────────────────────────────────────────────────────
    const saveCurrentProgress = useCallback(async (status = 'LEARNING') => {
        if (!activeLessonId || !isAuthenticated || !videoRef.current) return;
        const elapsed = Math.floor(videoRef.current.currentTime);
        if (elapsed < 1) return;
        try {
            await axiosClient.patch(`/learning/lessons/${activeLessonId}/progress`, {
                lastWatchedSecond: elapsed,
                status,
            });
        } catch {
            // silent fail — không làm gián đoạn UX
        }
    }, [activeLessonId, isAuthenticated]);

    // ── Khi video kết thúc → đánh dấu COMPLETED ────────────────────────────────
    const handleVideoEnded = async () => {
        if (!isAuthenticated || !activeLessonId) return;
        try {
            await axiosClient.patch(`/learning/lessons/${activeLessonId}/progress`, {
                lastWatchedSecond: activeLesson?.durationSeconds ?? 0,
                status: 'COMPLETED',
            });
            toast.success('✅ Bài học hoàn thành!', { duration: 2000 });
            // Cập nhật studyMap local — đánh dấu lesson này COMPLETED
            setStudyMap(prev => ({
                ...prev,
                chapters: prev.chapters.map(ch => ({
                    ...ch,
                    lessons: ch.lessons.map(l =>
                        l.lessonId === activeLessonId
                            ? { ...l, status: 'COMPLETED', isLocked: false }
                            : l
                    ),
                })),
            }));
            // Tự động mở khóa bài tiếp theo sau 1s
            const nextLesson = findNextLesson(activeLessonId);
            if (nextLesson && !nextLesson.isLocked) {
                setTimeout(() => handleSelectLesson(nextLesson), 1000);
            }
        } catch {
            toast.error('Lỗi cập nhật tiến độ.');
        }
    };

    // ── Tìm bài tiếp theo trong danh sách ─────────────────────────────────────
    const findNextLesson = (currentId) => {
        if (!studyMap) return null;
        const allLessons = studyMap.chapters.flatMap(ch => ch.lessons);
        const idx = allLessons.findIndex(l => l.lessonId === currentId);
        return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
    };

    // ── Lưu tiến độ khi người dùng rời trang ──────────────────────────────────
    useEffect(() => {
        const handleBeforeUnload = () => saveCurrentProgress();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveCurrentProgress(); // lưu khi component unmount
        };
    }, [saveCurrentProgress]);

    // ── Seek video đến lastWatchedSecond khi load ──────────────────────────────
    const handleVideoLoadedMetadata = () => {
        if (activeLesson?.lastWatchedSecond && videoRef.current) {
            videoRef.current.currentTime = activeLesson.lastWatchedSecond;
        }
    };

    // ── Toggle accordion chapter ───────────────────────────────────────────────
    const toggleChapter = (chapterId) => {
        setOpenChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
    };

    // ── Format giây → mm:ss ────────────────────────────────────────────────────
    const formatDuration = (secs) => {
        if (!secs) return '';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    // ─────────────────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
            </div>
        );
    }

    if (!studyMap) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <p className="text-xl font-bold">Không tìm thấy khóa học</p>
                    <button onClick={() => navigate('/courses')}
                        className="mt-4 px-6 py-2 bg-violet-600 rounded-xl hover:bg-violet-700 transition">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* ── Top Bar ──────────────────────────────────────────────────────── */}
            <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center px-6 gap-4 flex-shrink-0">
                <button onClick={() => navigate('/courses')}
                    className="text-slate-400 hover:text-white transition">
                    <ChevronRight className="rotate-180" size={20} />
                </button>
                <BookOpen className="text-violet-400" size={20} />
                <span className="text-white font-semibold truncate">{studyMap.courseTitle}</span>
                {studyMap.enrolled && (
                    <span className="ml-auto text-slate-400 text-sm font-medium">
                        Tiến độ: <span className="text-violet-400 font-bold">{studyMap.progressPercent ?? 0}%</span>
                    </span>
                )}
            </div>

            {/* ── Main content: 2 cột ───────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ═══ CỘT TRÁI: VIDEO PLAYER ═══════════════════════════════════ */}
                <div className="flex-1 flex flex-col bg-black overflow-hidden">
                    {lessonLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                        </div>
                    ) : activeLesson ? (
                        <>
                            {/* Video hoặc fallback */}
                            {videoError ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-300 px-8 text-center">
                                    <AlertTriangle className="w-14 h-14 text-yellow-400" />
                                    <h3 className="text-xl font-bold text-white">Nội dung không khả dụng</h3>
                                    <p className="text-slate-400 text-sm max-w-md">
                                        Video bài học này hiện không thể phát. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
                                    </p>
                                    <button
                                        onClick={() => { setVideoError(false); videoRef.current?.load(); }}
                                        className="px-6 py-2 bg-violet-600 rounded-xl text-white hover:bg-violet-700 transition text-sm font-semibold">
                                        Thử lại
                                    </button>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    key={activeLesson.videoUrl}       /* force remount khi đổi bài */
                                    src={activeLesson.videoUrl}
                                    controls
                                    className="w-full max-h-[calc(100vh-14rem)] object-contain"
                                    onEnded={handleVideoEnded}
                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                    onError={() => setVideoError(true)}
                                    onTimeUpdate={() => {
                                        // Debounce lưu progress mỗi 15s
                                        if (saveProgressRef.current) clearTimeout(saveProgressRef.current);
                                        saveProgressRef.current = setTimeout(() => saveCurrentProgress(), 15000);
                                    }}
                                />
                            )}

                            {/* Thông tin bài học */}
                            <div className="px-8 py-5 border-t border-slate-700">
                                <h2 className="text-white text-lg font-bold">{activeLesson.title}</h2>
                                <div className="flex items-center gap-4 mt-1 text-slate-400 text-sm">
                                    {activeLesson.durationSeconds && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> {formatDuration(activeLesson.durationSeconds)}
                                        </span>
                                    )}
                                    {activeLesson.isFreePreview && (
                                        <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                            Học thử
                                        </span>
                                    )}
                                    {activeLesson.status === 'COMPLETED' && (
                                        <span className="flex items-center gap-1 text-violet-400 font-semibold">
                                            <CheckCircle2 size={14} /> Đã hoàn thành
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Chưa chọn bài */
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-slate-400">
                            <PlayCircle className="w-20 h-20 text-slate-600" />
                            <div className="text-center">
                                <p className="text-white text-xl font-bold mb-2">Chọn bài học để bắt đầu</p>
                                <p className="text-slate-400 text-sm">Chọn một bài học từ danh sách bên phải</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ CỘT PHẢI: ACCORDION DANH SÁCH BÀI ═══════════════════════ */}
                <div className="w-80 xl:w-96 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="px-4 py-3 border-b border-slate-700">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                            Nội dung khoá học
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {studyMap.chapters?.reduce((acc, ch) => acc + ch.lessons.length, 0)} bài học
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {studyMap.chapters?.map((chapter, chIdx) => {
                            const isOpen = !!openChapters[chapter.chapterId];
                            const completedCount = chapter.lessons.filter(l => l.status === 'COMPLETED').length;

                            return (
                                <div key={chapter.chapterId} className="border-b border-slate-700">
                                    {/* Chapter header */}
                                    <button
                                        onClick={() => toggleChapter(chapter.chapterId)}
                                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-700/60 transition text-left">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold truncate">
                                                {chIdx + 1}. {chapter.title}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                {completedCount}/{chapter.lessons.length} đã xong
                                            </p>
                                        </div>
                                        {isOpen
                                            ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                                            : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                                        }
                                    </button>

                                    {/* Lesson list */}
                                    {isOpen && (
                                        <div className="bg-slate-900/40">
                                            {chapter.lessons.map((lesson, lIdx) => {
                                                const isActive    = lesson.lessonId === activeLessonId;
                                                const isCompleted = lesson.status === 'COMPLETED';
                                                const isLocked    = lesson.isLocked;

                                                return (
                                                    <button
                                                        key={lesson.lessonId}
                                                        onClick={() => handleSelectLesson(lesson)}
                                                        disabled={isLocked}
                                                        className={`w-full flex items-start gap-3 px-5 py-3 text-left transition group
                                                            ${isActive    ? 'bg-violet-600/20 border-l-2 border-violet-500'   : 'border-l-2 border-transparent'}
                                                            ${isLocked    ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50 cursor-pointer'}
                                                        `}>
                                                        {/* Status icon */}
                                                        <div className="mt-0.5 flex-shrink-0">
                                                            {isLocked     ? <Lock      size={14} className="text-slate-500" />   :
                                                             isCompleted  ? <CheckCircle2 size={14} className="text-violet-400" /> :
                                                                            <PlayCircle size={14} className="text-slate-400 group-hover:text-white transition" />
                                                            }
                                                        </div>
                                                        {/* Text */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate
                                                                ${isActive ? 'text-violet-300' : 'text-slate-300'}`}>
                                                                {lIdx + 1}. {lesson.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {lesson.durationSeconds && (
                                                                    <span className="text-slate-500 text-xs">
                                                                        {formatDuration(lesson.durationSeconds)}
                                                                    </span>
                                                                )}
                                                                {lesson.isFreePreview && (
                                                                    <span className="text-emerald-500 text-xs font-semibold">Thử</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
