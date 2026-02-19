-- Drop existing check constraint
ALTER TABLE "public"."knowledge_base" DROP CONSTRAINT IF EXISTS "knowledge_base_type_check";
-- Add new check constraint with all types
ALTER TABLE "public"."knowledge_base"
ADD CONSTRAINT "knowledge_base_type_check" CHECK (
        type IN (
            'SYLLABUS',
            'PAST_PAPER',
            'NOTES',
            'LESSON_PLAN',
            'ASSIGNMENT',
            'REPORT_BOOK',
            'ASSESSMENT_REPORT',
            'SCHEME_OF_WORK',
            'DEVELOPMENT_MODULE',
            'TRAINING_NOTE'
        )
    );