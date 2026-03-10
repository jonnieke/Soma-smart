import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, Image as ImageIcon, MessageCircle, Heart, Share2, AlertCircle, Filter, Loader2, Pin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Post, Comment, EducationLevel } from '../../types';
import { fetchPosts, createPost, fetchComments, createComment, toggleVote } from '../../services/communityService';
import { supabase } from '../../lib/supabase';

// Custom time formatter to avoid external dependency
const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${Math.floor(diffInMonths / 12)}y ago`;
};

export const Community: React.FC = () => {
    const { studentProfile, educationLevel } = useApp();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New Post State
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostSubject, setNewPostSubject] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Comments State
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
    const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadPosts();

        // Setup real-time subscription for posts
        const postsSubscription = supabase
            .channel('public:community_posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
                loadPosts(); // Simple reload on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(postsSubscription);
        };
    }, [educationLevel]);

    const loadPosts = async () => {
        try {
            const data = await fetchPosts(educationLevel);
            setPosts(data);
        } catch (err: any) {
            console.error('Error loading posts:', err);
            setError('Could not load community feed.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!studentProfile?.id) return;
        if (!newPostContent.trim()) return;

        setIsPosting(true);
        try {
            await createPost(
                studentProfile.id,
                studentProfile.name,
                educationLevel,
                newPostContent,
                newPostSubject || undefined
            );
            setNewPostContent('');
            setNewPostSubject('');
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError('Failed to create post.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleToggleComments = async (postId: string) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
            return;
        }

        setExpandedPostId(postId);
        if (!comments[postId]) {
            try {
                const data = await fetchComments(postId);
                setComments(prev => ({ ...prev, [postId]: data }));
            } catch (err: any) {
                console.error('Error loading comments:', err);
            }
        }
    };

    const handleCreateComment = async (postId: string) => {
        if (!studentProfile?.id) return;
        const commentContent = newCommentContent[postId];
        if (!commentContent?.trim()) return;

        setIsCommenting(prev => ({ ...prev, [postId]: true }));
        try {
            const newComment = await createComment(
                postId,
                studentProfile.id,
                studentProfile.name,
                commentContent
            );

            // Optimistic update
            setComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));

            // Clear input
            setNewCommentContent(prev => ({ ...prev, [postId]: '' }));

            // Reload post to get updated comment count
            loadPosts();

        } catch (err: any) {
            console.error('Error creating comment:', err);
        } finally {
            setIsCommenting(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleVotePost = async (postId: string, voteType: 'UP' | 'DOWN') => {
        if (!studentProfile?.id) return;
        try {
            await toggleVote(postId, 'POST', studentProfile.id, voteType);
            loadPosts(); // Reload to get updated votes
        } catch (err) {
            console.error('Error voting on post:', err);
        }
    };

    const handleVoteComment = async (commentId: string, postId: string, voteType: 'UP' | 'DOWN') => {
        if (!studentProfile?.id) return;
        try {
            await toggleVote(commentId, 'COMMENT', studentProfile.id, voteType);
            // Reload comments for this post
            const data = await fetchComments(postId);
            setComments(prev => ({ ...prev, [postId]: data }));
        } catch (err) {
            console.error('Error voting on comment:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                        <Users className="w-8 h-8" /> Soma Community
                    </h1>
                    <p className="text-indigo-100 max-w-xl text-lg">
                        Connect with other {educationLevel.toLowerCase()} students. Ask questions, share study tips, and help each other learn.
                    </p>
                </div>
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 blur-3xl rounded-full -mr-20 -mt-20"></div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Create Post Area */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center font-bold text-indigo-700 uppercase shrink-0">
                        {studentProfile?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 space-y-3">
                        <textarea
                            placeholder="Share a question, study tip, or resource..."
                            className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px]"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Subject (Optional)"
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-48"
                                    value={newPostSubject}
                                    onChange={(e) => setNewPostSubject(e.target.value)}
                                />
                                <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Attach Image">
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={handleCreatePost}
                                disabled={isPosting || !newPostContent.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feed Filters */}
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-slate-800">Recent Posts</h2>
                <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                    <Filter className="w-4 h-4" /> Filter
                </button>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
                <AnimatePresence>
                    {posts.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No posts yet. Be the first to start a discussion!</p>
                        </motion.div>
                    ) : (
                        posts.map((post) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                            >
                                {/* Post Header */}
                                <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase">
                                            {post.authorName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900">{post.authorName}</h3>
                                                {post.subject && (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                                        {post.subject}
                                                    </span>
                                                )}
                                                {post.isPinned && (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Pin className="w-3 h-3" /> Pinned
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {formatDistanceToNow(new Date(post.createdAt))}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="p-5">
                                    <p className="text-slate-800 whitespace-pre-wrap">{post.content}</p>
                                    {post.imageUrl && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                                            <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto max-h-96 object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Post Actions */}
                                <div className="px-5 py-3 bg-slate-50 flex items-center gap-4">
                                    <button
                                        onClick={() => handleVotePost(post.id, 'UP')}
                                        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors"
                                    >
                                        <Heart className={`w-5 h-5 ${post.upvotes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                                        {post.upvotes}
                                    </button>
                                    <button
                                        onClick={() => handleToggleComments(post.id)}
                                        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                                    >
                                        <MessageCircle className={`w-5 h-5 ${expandedPostId === post.id ? 'fill-indigo-100 text-indigo-600' : ''}`} />
                                        {post.commentCount} Comments
                                    </button>
                                    <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors ml-auto">
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                </div>

                                {/* Comments Section */}
                                <AnimatePresence>
                                    {expandedPostId === post.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-100 bg-white"
                                        >
                                            <div className="p-5 space-y-4">
                                                {/* Comment Input */}
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0">
                                                        {studentProfile?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex-1 flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Write a comment..."
                                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            value={newCommentContent[post.id] || ''}
                                                            onChange={(e) => setNewCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleCreateComment(post.id);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleCreateComment(post.id)}
                                                            disabled={isCommenting[post.id] || !newCommentContent[post.id]?.trim()}
                                                            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {isCommenting[post.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Comment List */}
                                                <div className="space-y-3 mt-4 pl-4 border-l-2 border-slate-100">
                                                    {comments[post.id]?.length === 0 ? (
                                                        <p className="text-xs text-slate-400">No comments yet.</p>
                                                    ) : (
                                                        comments[post.id]?.map((comment) => (
                                                            <div key={comment.id} className="flex gap-3 text-sm">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 mt-1">
                                                                    {comment.authorName.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none p-3 border border-slate-100">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-bold text-slate-900">{comment.authorName}</span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {formatDistanceToNow(new Date(comment.createdAt))}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-slate-700">{comment.content}</p>
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleVoteComment(comment.id, post.id, 'UP')}
                                                                            className="text-xs font-medium text-slate-500 hover:text-rose-500 flex items-center gap-1"
                                                                        >
                                                                            <Heart className={`w-3 h-3 ${comment.upvotes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                                            {comment.upvotes}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-slate-400 mt-8">
                Remember to be respectful and follow the Soma AI community guidelines.
            </p>
        </div>
    );
};
