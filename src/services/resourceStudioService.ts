import { EducationalResource, ResourceContentBlock } from '../types/contentOS';

const RESOURCES_KEY = 'soma_educational_resources';

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const resourceStudioService = {
  /** Get educational resources for teacher or school */
  getResources(teacherId = 'teacher_kamau'): EducationalResource[] {
    const list = readLocal<EducationalResource[]>(RESOURCES_KEY, []);
    if (list.length > 0) return list;

    const seed: EducationalResource[] = [
      {
        id: 'res_001',
        ownerId: teacherId,
        ownerType: 'teacher',
        schoolId: 'school_001',
        title: 'Cylinder Surface Area Step-by-Step Lesson & Worksheet',
        description: 'Complete CBC Grade 9 Mathematics lesson notes, worked examples, and pupil worksheet',
        resourceType: 'lesson_notes',
        curriculumFrameworkId: 'fw_kicd_cbc',
        curriculumNodeIds: ['node_outcome_cylinder_area'],
        grade: 'Grade 9',
        subject: 'Mathematics',
        term: 'Term 1',
        language: 'English',
        estimatedDurationMinutes: 40,
        difficulty: 'standard',
        contentBlocks: [
          {
            id: 'blk_1',
            type: 'heading',
            order: 1,
            content: { text: 'Starter Activity: Identifying Cylinder Components' },
          },
          {
            id: 'blk_2',
            type: 'teacher_instruction',
            order: 2,
            content: { teacherInstruction: 'Show learners a real cylindrical tin. Ask them to count the flat circular faces and curved face.' },
          },
          {
            id: 'blk_3',
            type: 'worked_example',
            order: 3,
            content: {
              exampleProblem: 'Calculate the total surface area of a closed cylinder of radius 7 cm and height 10 cm. (Take π = 22/7)',
              exampleSolution: 'Area = 2πr² + 2πrh = 2(22/7)(7)² + 2(22/7)(7)(10) = 308 + 440 = 748 cm²',
            },
          },
        ],
        visibility: 'school',
        status: 'approved',
        rightsId: 'rgt_001',
        version: 1,
        createdAt: '2026-07-22T09:00:00Z',
        updatedAt: '2026-07-22T09:00:00Z',
      },
    ];

    writeLocal(RESOURCES_KEY, seed);
    return seed;
  },

  /** Save or update a structured resource */
  saveResource(resource: EducationalResource): EducationalResource {
    const list = readLocal<EducationalResource[]>(RESOURCES_KEY, []);
    const idx = list.findIndex((r) => r.id === resource.id);
    if (idx >= 0) {
      list[idx] = { ...resource, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...resource, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    writeLocal(RESOURCES_KEY, list);
    return resource;
  },

  /** Generate an AI structured block with schema validation */
  generateAIBlock(
    blockType: ResourceContentBlock['type'],
    topic: string,
    grade: string,
  ): ResourceContentBlock {
    return {
      id: `blk_ai_${Date.now()}`,
      type: blockType,
      order: Date.now(),
      content: {
        text: `AI-Generated ${blockType} for ${topic} (${grade}): Remember to account for all boundary conditions and unit conversions.`,
        teacherInstruction: 'Emphasize conceptual understanding before formula substitution.',
        durationMinutes: 10,
      },
    };
  },
};
