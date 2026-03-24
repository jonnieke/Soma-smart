import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowLeft, User, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { supabase } from '../../lib/supabase';

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    cover_image_url: string;
    author_name: string;
    read_time_minutes: number;
    published_at: string;
}

export const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return;
            try {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) {
                    console.error("Failed to fetch blog post, using fallback", error);
                    if (slug === 'how-to-prepare-for-kcse-mathematics') {
                        setPost({
                            id: 'mock-1',
                            slug: 'how-to-prepare-for-kcse-mathematics',
                            title: 'How to Prepare for KCSE Mathematics: A Comprehensive Guide',
                            excerpt: 'Discover proven strategies and techniques to master KCSE Mathematics. From understanding core concepts to practicing past papers efficiently, this guide covers everything you need to score an A.',
                            content: '# How to Prepare for KCSE Mathematics\n\nMathematics is often considered a challenging subject, but with the right preparation strategy, you can easily secure top marks in your KCSE exams.\n\n## 1. Understand the Syllabus\nThe first step is to thoroughly review the KNEC syllabus. Make sure you cover all topics from Form 1 to Form 4.\n\n## 2. Practice Past Papers\nPracticing past papers is crucial. It familiarizes you with the exam format and the types of questions commonly asked.\n\n## 3. Focus on Weak Areas\nUse Somo Smart analytics to identify topics where you struggle the most and dedicate more time to them.\n\n## 4. Seek Help\nDon’t hesitate to ask your teachers or use the **Somo Smart AI Explainer** whenever you get stuck.\n\n## Conclusion\nConsistency is key. Practice daily and stay positive. You got this!',
                            cover_image_url: 'https://images.unsplash.com/photo-1632559646295-c1e14afb8e5c?w=1200&q=80',
                            author_name: 'Somo Education Team',
                            read_time_minutes: 4,
                            published_at: new Date().toISOString()
                        });
                    }
                    return;
                }
                if (data) setPost(data);
            } catch (err) {
                console.error("Failed to fetch blog post", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col pt-20">
                <div className="max-w-3xl mx-auto w-full px-4 animate-pulse">
                    <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-12"></div>
                    <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                    <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mb-12"></div>
                    <div className="h-96 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl mb-12"></div>
                    <div className="space-y-4">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">Article Not Found</h1>
                <p className="text-slate-500 mb-8">The article you are looking for does not exist or has been removed.</p>
                <button onClick={() => navigate('/blog')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                    Back to Blog
                </button>
            </div>
        );
    }

    const shareUrl = window.location.href;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors selection:bg-blue-100 dark:selection:bg-blue-900/40">
            <Helmet>
                <title>{post.title} | Somo Smart Blog</title>
                <meta name="description" content={post.excerpt} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt} />
                <meta property="og:image" content={post.cover_image_url} />
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-transparent transition-all">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/blog')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-bold transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Back to Journal
                    </button>
                    
                    <button onClick={handleShare} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors" title="Share Article">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-24">
                {/* --- ARTICLE HEADER --- */}
                <header className="mb-12 text-center">
                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 tracking-wide uppercase">
                        <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> {new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-500" /> {post.read_time_minutes} min read</div>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-8">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-200">{post.author_name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Author</div>
                        </div>
                    </div>
                </header>

                {/* --- COVER IMAGE --- */}
                {post.cover_image_url && (
                    <div className="mb-14 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <img 
                            src={post.cover_image_url} 
                            alt={post.title} 
                            className="w-full h-auto max-h-[500px] object-cover"
                        />
                    </div>
                )}

                {/* --- CONTENT --- */}
                <div className="prose prose-lg md:prose-xl dark:prose-invert prose-blue max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight 
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-2xl prose-img:shadow-lg
                    prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                ">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {post.content}
                    </ReactMarkdown>
                </div>

                {/* --- FOOTER CTA --- */}
                <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Did you find this helpful?</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                        Put these strategies into practice immediately with Somo Smart's AI Revision Assistant.
                    </p>
                    <button onClick={() => navigate('/learner')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-600/30 hover:-translate-y-1">
                        Start Learning Free
                    </button>
                </div>
            </article>
        </div>
    );
};
