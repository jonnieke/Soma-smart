import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Scanning syllabus-docs bucket for files...');
    
    // Helper function to recursively list files
    async function listAllFiles(path = '') {
      const { data, error } = await supabaseClient.storage.from('syllabus-docs').list(path, { limit: 100 });
      if (error) {
        console.error('Error listing path', path, error);
        return [];
      }
      
      let files = [];
      for (const item of data) {
        if (!item.id) {
          const subPath = path ? path + '/' + item.name : item.name;
          const subFiles = await listAllFiles(subPath);
          files = files.concat(subFiles);
        } else {
          const filePath = path ? path + '/' + item.name : item.name;
          if (item.name !== '.emptyFolderPlaceholder') {
             files.push({ ...item, path: filePath });
          }
        }
      }
      return files;
    }

    const files = await listAllFiles();
    console.log('Found ' + files.length + ' files in storage.');
    
    if (files.length === 0) {
      return new Response(JSON.stringify({ message: 'No files to recover.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
    
    const recordsToInsert = [];
    
    for (const file of files) {
      const parts = file.path.split('/');
      let grade = 'All';
      let subject = 'None';
      let filename = file.name;
      
      if (parts.length >= 3) {
        grade = parts[0];
        subject = parts[1];
        filename = parts[parts.length - 1];
      } else if (parts.length === 2) {
        grade = parts[0];
        filename = parts[1];
      }
      
      const title = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const { data: { publicUrl } } = supabaseClient.storage.from('syllabus-docs').getPublicUrl(file.path);
      
      recordsToInsert.push({
        title: title,
        grade: grade,
        subject: subject,
        type: 'NOTES',
        file_url: publicUrl,
        file_path: file.path,
        created_at: file.created_at
      });
    }
    
    console.log('Preparing to insert records into knowledge_base...');
    
    const { data, error } = await supabaseClient.from('knowledge_base').insert(recordsToInsert).select();
    
    if (error) {
      console.error('Failed to insert records:', error);
      throw error;
    }

    return new Response(JSON.stringify({ message: 'Successfully recovered documents!', count: data?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.log('Edge function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
