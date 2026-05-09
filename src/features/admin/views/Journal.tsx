import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Edit2, Trash2, Calendar, User, Clock, 
    ExternalLink, Save, X, Image as ImageIcon, FileText,
    CheckCircle2, AlertCircle, Loader2, ArrowLeft, Sparkles
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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

export const JournalView: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('published_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setStatus({ type: 'error', message: 'Failed to load journal entries.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentPost?.title || !currentPost?.slug || !currentPost?.content) {
            setStatus({ type: 'error', message: 'Please fill in all required fields (Title, Slug, Content).' });
            return;
        }

        setIsSaving(true);
        try {
            const postData = {
                ...currentPost,
                updated_at: new Date().toISOString(),
                published_at: currentPost.published_at || new Date().toISOString()
            };

            const { error } = currentPost.id 
                ? await supabase.from('blog_posts').update(postData).eq('id', currentPost.id)
                : await supabase.from('blog_posts').insert([postData]);

            if (error) throw error;

            setStatus({ type: 'success', message: `Article ${currentPost.id ? 'updated' : 'published'} successfully!` });
            setIsEditing(false);
            setCurrentPost(null);
            fetchPosts();
        } catch (err) {
            console.error('Error saving post:', err);
            setStatus({ type: 'error', message: 'Failed to save article. Check slug uniqueness.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;

        try {
            const { error } = await supabase.from('blog_posts').delete().eq('id', id);
            if (error) throw error;
            setStatus({ type: 'success', message: 'Article deleted.' });
            fetchPosts();
        } catch (err) {
            console.error('Error deleting post:', err);
            setStatus({ type: 'error', message: 'Failed to delete article.' });
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const filteredPosts = posts.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.author_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isEditing) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => { setIsEditing(false); setCurrentPost(null); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Journal
                    </button>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {currentPost?.id ? 'Update Article' : 'Publish Article'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" /> Article Content
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Article Title</label>
                                    <input 
                                        type="text"
                                        value={currentPost?.title || ''}
                                        onChange={(e) => {
                                            const title = e.target.value;
                                            setCurrentPost(prev => ({ 
                                                ...prev, 
                                                title,
                                                slug: prev?.id ? prev.slug : generateSlug(title)
                                            }));
                                        }}
                                        placeholder="e.g. 10 Tips for KCSE Success"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Slug (URL)</label>
                                        <input 
                                            type="text"
                                            value={currentPost?.slug || ''}
                                            onChange={(e) => setCurrentPost(prev => ({ ...prev, slug: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-slate-500 font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Read Time (mins)</label>
                                        <input 
                                            type="number"
                                            value={currentPost?.read_time_minutes || 5}
                                            onChange={(e) => setCurrentPost(prev => ({ ...prev, read_time_minutes: parseInt(e.target.value) }))}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Excerpt (Short Summary)</label>
                                    <textarea 
                                        value={currentPost?.excerpt || ''}
                                        onChange={(e) => setCurrentPost(prev => ({ ...prev, excerpt: e.target.value }))}
                                        rows={3}
                                        placeholder="A brief summary that appears on the card..."
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium text-sm leading-relaxed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Content (Markdown Supported)</label>
                                    <textarea 
                                        value={currentPost?.content || ''}
                                        onChange={(e) => setCurrentPost(prev => ({ ...prev, content: e.target.value }))}
                                        rows={15}
                                        placeholder="# Introduction..."
                                        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-mono text-sm leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-wider">Publishing Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Author Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text"
                                            value={currentPost?.author_name || 'Somo Smart Team'}
                                            onChange={(e) => setCurrentPost(prev => ({ ...prev, author_name: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cover Image URL</label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text"
                                            value={currentPost?.cover_image_url || ''}
                                            onChange={(e) => setCurrentPost(prev => ({ ...prev, cover_image_url: e.target.value }))}
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium text-xs"
                                        />
                                    </div>
                                </div>
                                {currentPost?.cover_image_url && (
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video">
                                        <img src={currentPost.cover_image_url} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                            <h4 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Pro Tip
                            </h4>
                            <p className="text-indigo-700 text-xs leading-relaxed">
                                Use high-quality images from Unsplash to make your articles stand out. For markdown, use # for headings and **bold** for emphasis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Somo Journal</h1>
                    <p className="text-slate-500 font-medium">Manage your educational articles and curriculum insights.</p>
                </div>
                <button 
                    onClick={() => {
                        setCurrentPost({
                            author_name: 'Somo Smart Team',
                            read_time_minutes: 5,
                            published_at: new Date().toISOString()
                        });
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                    <Plus className="w-5 h-5" /> New Article
                </button>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
                {status && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
                            status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {status.message}
                        <button onClick={() => setStatus(null)} className="ml-auto hover:opacity-70"><X className="w-4 h-4" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search & Stats */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search articles by title or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                    />
                </div>
                <div className="flex items-center gap-6 px-4">
                    <div className="text-center">
                        <div className="text-lg font-black text-slate-900 leading-none">{posts.length}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Articles</div>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="text-center">
                        <div className="text-lg font-black text-indigo-600 leading-none">{posts.reduce((acc, p) => acc + p.read_time_minutes, 0)}m</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Read</div>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Scanning the archives...</p>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-4 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">No articles found</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Start building your knowledge base by creating your first Somo Journal entry.</p>
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        Create Now
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                        <motion.div 
                            key={post.id}
                            layout
                            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                        >
                            <div className="h-40 bg-slate-100 relative">
                                {post.cover_image_url ? (
                                    <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                                        className="p-2 bg-white text-indigo-600 rounded-lg shadow-lg hover:bg-indigo-50"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(post.id)}
                                        className="p-2 bg-white text-red-500 rounded-lg shadow-lg hover:bg-red-50"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(post.published_at).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time_minutes}m</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">{post.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-3 mb-6 font-medium leading-relaxed">{post.excerpt}</p>
                                
                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {post.author_name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-700">{post.author_name}</span>
                                    </div>
                                    <a 
                                        href={`/blog/${post.slug}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-slate-400 hover:text-indigo-600"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
