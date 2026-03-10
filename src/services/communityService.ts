import { supabase } from '../lib/supabase';
import { Post, Comment, EducationLevel } from '../types';

export const createPost = async (
    authorId: string,
    authorName: string,
    educationLevel: EducationLevel,
    content: string,
    subject?: string,
    imageUrl?: string
): Promise<Post> => {
    const { data, error } = await supabase
        .from('community_posts')
        .insert([{
            author_id: authorId,
            author_name: authorName,
            education_level: educationLevel,
            content,
            subject,
            image_url: imageUrl
        }])
        .select()
        .single();

    if (error) throw error;
    return {
        id: data.id,
        authorId: data.author_id,
        authorName: data.author_name,
        educationLevel: data.education_level,
        subject: data.subject,
        content: data.content,
        imageUrl: data.image_url,
        createdAt: data.created_at,
        upvotes: data.upvotes,
        commentCount: data.comment_count,
        isPinned: data.is_pinned
    };
};

export const fetchPosts = async (level?: EducationLevel, subject?: string): Promise<Post[]> => {
    let query = supabase
        .from('community_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (level) {
        query = query.eq('education_level', level);
    }
    if (subject) {
        query = query.eq('subject', subject);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(post => ({
        id: post.id,
        authorId: post.author_id,
        authorName: post.author_name,
        educationLevel: post.education_level,
        subject: post.subject,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        upvotes: post.upvotes,
        commentCount: post.comment_count,
        isPinned: post.is_pinned
    }));
};

export const createComment = async (
    postId: string,
    authorId: string,
    authorName: string,
    content: string
): Promise<Comment> => {
    const { data, error } = await supabase
        .from('community_comments')
        .insert([{
            post_id: postId,
            author_id: authorId,
            author_name: authorName,
            content
        }])
        .select()
        .single();

    if (error) throw error;
    return {
        id: data.id,
        postId: data.post_id,
        authorId: data.author_id,
        authorName: data.author_name,
        content: data.content,
        createdAt: data.created_at,
        upvotes: data.upvotes
    };
};

export const fetchComments = async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(comment => ({
        id: comment.id,
        postId: comment.post_id,
        authorId: comment.author_id,
        authorName: comment.author_name,
        content: comment.content,
        createdAt: comment.created_at,
        upvotes: comment.upvotes
    }));
};

export const toggleVote = async (
    targetId: string,
    targetType: 'POST' | 'COMMENT',
    userId: string,
    voteType: 'UP' | 'DOWN'
): Promise<void> => {
    // Check for existing vote
    const { data: existingVote } = await supabase
        .from('community_votes')
        .select('vote_type')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .eq('user_id', userId)
        .single();

    if (existingVote) {
        if (existingVote.vote_type === voteType) {
            // Remove vote if clicking same one
            await supabase
                .from('community_votes')
                .delete()
                .eq('target_id', targetId)
                .eq('target_type', targetType)
                .eq('user_id', userId);
        } else {
            // Change vote
            await supabase
                .from('community_votes')
                .update({ vote_type: voteType })
                .eq('target_id', targetId)
                .eq('target_type', targetType)
                .eq('user_id', userId);
        }
    } else {
        // Insert new vote
        await supabase
            .from('community_votes')
            .insert([{
                target_id: targetId,
                target_type: targetType,
                user_id: userId,
                vote_type: voteType
            }]);
    }
};
