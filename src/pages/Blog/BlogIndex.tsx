import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, User, ArrowLeft, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    cover_image_url: string;
    author_name: string;
    read_time_minutes: number;
    published_at: string;
}

export const BlogIndex: React.FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .select('id, slug, title, excerpt, cover_image_url, author_name, read_time_minutes, published_at')
                    .order('published_at', { ascending: false });

                if (error) {
                    console.error("Failed to fetch blog posts, using fallback", error);
                    setPosts([{
                        id: 'mock-1',
                        slug: 'how-to-prepare-for-kcse-mathematics',
                        title: 'How to Prepare for KCSE Mathematics: A Comprehensive Guide',
                        excerpt: 'Discover proven strategies and techniques to master KCSE Mathematics. From understanding core concepts to practicing past papers efficiently, this guide covers everything you need to score an A.',
                        cover_image_url: 'https://images.unsplash.com/photo-1632559646295-c1e14afb8e5c?w=1200&q=80',
                        author_name: 'Somo Education Team',
                        read_time_minutes: 4,
                        published_at: new Date().toISOString()
                    }]);
                    return;
                }
                if (data) setPosts(data);
            } catch (err) {
                console.error("Failed to fetch blog posts", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const featuredPost = posts[0];
    const regularPosts = posts.slice(1);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
            <Helmet>
                <title>Blog | Somo Smart - Insights on Education in Kenya</title>
                <meta name="description" content="Discover study tips, exam strategies, and educational insights tailored for the Kenyan CBC and KCSE curriculum on the Somo Smart Blog." />
            </Helmet>

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold">
                        <ArrowLeft className="w-5 h-5" /> Back to Home
                    </button>
                    <div className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        The Somo Journal
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                
                {/* --- HERO SECTION --- */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        Insights for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Smarter Learning</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Study strategies, platform updates, and deep dives into the Kenyan secondary and primary educational curriculum.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-2xl font-bold mb-2">No Articles Yet</h3>
                        <p>Check back soon for our latest educational content.</p>
                    </div>
                ) : (
                    <>
                        {/* --- FEATURED POST --- */}
                        {featuredPost && (
                            <motion.article 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => navigate(`/blog/${featuredPost.slug}`)}
                                className="group cursor-pointer mb-16 bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row hover:shadow-2xl transition-all duration-300"
                            >
                                <div className="md:w-1/2 h-64 md:h-auto overflow-hidden relative">
                                    <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img 
                                        src={featuredPost.cover_image_url || 'https://images.unsplash.com/photo-1546410531-bea518040081?auto=format&fit=crop&q=80'} 
                                        alt={featuredPost.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 left-4 z-20 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Featured
                                    </div>
                                </div>
                                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
                                        <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(featuredPost.published_at).toLocaleDateString()}</div>
                                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {featuredPost.read_time_minutes} min read</div>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium mb-6 line-clamp-3">
                                        {featuredPost.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{featuredPost.author_name}</span>
                                        </div>
                                        <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Read Article <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </motion.article>
                        )}

                        {/* --- REGULAR POSTS GRID --- */}
                        {regularPosts.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {regularPosts.map((post, index) => (
                                    <motion.article
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => navigate(`/blog/${post.slug}`)}
                                        className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                                    >
                                        <div className="h-48 overflow-hidden relative">
                                            <img 
                                                src={post.cover_image_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80'} 
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
                                                <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(post.published_at).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.read_time_minutes}m</div>
                                            </div>
                                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-3 mb-6">
                                                {post.excerpt}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                                <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{post.author_name}</span>
                                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};
