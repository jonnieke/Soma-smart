INSERT INTO public.knowledge_base (id, title, description, subject, grade, type, file_url, created_at) VALUES 
('kb-1', 'KCSE Mathematics Past Paper 2023', 'Official KCSE Past Paper for Mathematics', 'Mathematics', 'Form 4', 'PAST_PAPER', 'https://example.com/math.pdf', CURRENT_TIMESTAMP),
('kb-2', 'Photosynthesis Notes', 'Comprehensive notes on photosynthesis for CBC', 'Science', 'Grade 7', 'NOTES', 'https://example.com/science.pdf', CURRENT_TIMESTAMP);

INSERT INTO public.marketplace_materials (id, teacher_id, teacher_name, title, description, price, grade, subject, category, file_url, preview_url, download_count, rating, created_at) VALUES 
('mm-1', 'teacher-1', 'Mr. Omondi', 'Form 2 Chemistry Revision Guidelines', 'Complete revision package', 150, 'Form 2', 'Chemistry', 'NOTES', 'https://example.com/chem.pdf', 'https://example.com/preview.pdf', 45, 4.8, CURRENT_TIMESTAMP),
('mm-2', 'teacher-2', 'Mwalimu Jane', 'CBC Grade 6 Creative Arts', 'Creative arts guide for Grade 6 learners', 50, 'Grade 6', 'Creative Arts', 'NOTES', 'https://example.com/arts.pdf', 'https://example.com/arts_preview.pdf', 120, 5.0, CURRENT_TIMESTAMP);
