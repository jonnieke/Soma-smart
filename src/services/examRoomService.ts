import { supabase } from '../lib/supabase';
import {
    ExamRoom,
    ExamRoomMessage,
    ExamRoomMember,
    ExamRoomVote,
    ExamRoomType,
    EducationLevel
} from '../types';

export const examRoomService = {
    // ==========================================
    // Room Management
    // ==========================================

    async fetchRooms(level?: EducationLevel, roomType?: ExamRoomType): Promise<ExamRoom[]> {
        try {
            let query = supabase
                .from('exam_rooms')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (level) {
                query = query.eq('education_level', level);
            }

            if (roomType) {
                query = query.eq('room_type', roomType);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as ExamRoom[];
        } catch (error) {
            console.error('Error fetching exam rooms:', error);
            return [];
        }
    },

    async getRoomById(roomId: string): Promise<ExamRoom | null> {
        try {
            const { data, error } = await supabase
                .from('exam_rooms')
                .select('*')
                .eq('id', roomId)
                .single();

            if (error) throw error;
            return data as ExamRoom;
        } catch (error) {
            console.error('Error fetching room:', error);
            return null;
        }
    },

    async createRoom(room: Partial<ExamRoom>): Promise<ExamRoom | null> {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error("Not authenticated");

            const insertData = {
                ...room,
                created_by: userData.user.id,
            };

            const { data, error } = await supabase
                .from('exam_rooms')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;

            // Auto-join the creator as admin
            if (data) {
                await this.joinRoom(data.id, userData.user.id, 'ADMIN');
            }

            return data as ExamRoom;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    },

    // ==========================================
    // Membership
    // ==========================================

    async joinRoom(roomId: string, userId: string, role: 'MEMBER' | 'MODERATOR' | 'ADMIN' = 'MEMBER'): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('exam_room_members')
                .upsert([{
                    room_id: roomId,
                    user_id: userId,
                    role: role
                }]);

            if (error) throw error;

            // Increment member count in room
            await supabase.rpc('increment_room_member', { row_id: roomId });

            return true;
        } catch (error) {
            console.error('Error joining room:', error);
            return false;
        }
    },

    async leaveRoom(roomId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('exam_room_members')
                .delete()
                .match({ room_id: roomId, user_id: userId });

            if (error) throw error;

            // Decrement member count
            await supabase.rpc('decrement_room_member', { row_id: roomId });

            return true;
        } catch (error) {
            console.error('Error leaving room:', error);
            return false;
        }
    },

    async getRoomMembers(roomId: string): Promise<ExamRoomMember[]> {
        try {
            const { data, error } = await supabase
                .from('exam_room_members')
                .select('*')
                .eq('room_id', roomId);

            if (error) throw error;
            return data as ExamRoomMember[];
        } catch (error) {
            console.error('Error fetching members:', error);
            return [];
        }
    },

    // ==========================================
    // Messaging
    // ==========================================

    async fetchMessages(roomId: string, limit = 50): Promise<ExamRoomMessage[]> {
        try {
            const { data, error } = await supabase
                .from('exam_room_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data as ExamRoomMessage[]).reverse(); // Return chronological
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },

    async sendMessage(message: Omit<ExamRoomMessage, 'id' | 'created_at' | 'upvotes'>): Promise<ExamRoomMessage | null> {
        try {
            const { data, error } = await supabase
                .from('exam_room_messages')
                .insert([message])
                .select()
                .single();

            if (error) throw error;
            return data as ExamRoomMessage;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // ==========================================
    // Voting and Pinning
    // ==========================================

    async voteMessage(messageId: string, userId: string, voteType: 'UP' | 'DOWN'): Promise<boolean> {
        try {
            // Upsert the vote
            const { error: voteError } = await supabase
                .from('exam_room_votes')
                .upsert([{
                    message_id: messageId,
                    user_id: userId,
                    vote_type: voteType
                }]);

            if (voteError) throw voteError;
            return true;
        } catch (error) {
            console.error('Error voting:', error);
            return false;
        }
    },

    async pinMessage(roomId: string, messageId: string | null): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('exam_rooms')
                .update({ pinned_message_id: messageId })
                .eq('id', roomId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error pinning message:', error);
            return false;
        }
    },

    // ==========================================
    // Realtime Subscriptions
    // ==========================================

    subscribeToMessages(roomId: string, callback: (message: ExamRoomMessage) => void) {
        return supabase
            .channel(`room_${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'exam_room_messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    callback(payload.new as ExamRoomMessage);
                }
            )
            .subscribe();
    }
};
