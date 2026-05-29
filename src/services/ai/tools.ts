import mongoose from 'mongoose';
import { ExamCategory } from '@/models/ExamCategory';
import { Exam } from '@/models/Exam';
import { ExamSection } from '@/models/ExamSection';
import { Test } from '@/models/Test';
import { Subject } from '@/models/Subject';
import { Topic } from '@/models/Topic';
import { User } from '@/models/User';
import { Question } from '@/models/Question';

interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
  handler: (args: Record<string, any>) => Promise<any>;
}

const toId = (v: string) => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);

export const tools: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'dashboard_stats',
      description: 'Get admin dashboard statistics (users, exams, tests, categories count)',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    handler: async () => {
      const [users, exams, tests, categories] = await Promise.all([
        User.countDocuments(), Exam.countDocuments(), Test.countDocuments(), ExamCategory.countDocuments(),
      ]);
      return { users, exams, tests, categories };
    },
  },
  {
    type: 'function',
    function: {
      name: 'category_list',
      description: 'List all exam categories',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    handler: async () => {
      const cats = await ExamCategory.find().sort({ order: 1 }).lean();
      return cats.map((c: any) => ({ _id: c._id, name: c.name, slug: c.slug, description: c.description }));
    },
  },
  {
    type: 'function',
    function: {
      name: 'category_create',
      description: 'Create a new exam category',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Category name' },
          slug: { type: 'string', description: 'URL slug (lowercase, hyphens)' },
          description: { type: 'string', description: 'Short description' },
          icon: { type: 'string', description: 'Icon name (e.g. BookOpen, Calculator)', default: 'BookOpen' },
          color: { type: 'string', description: 'Gradient color (e.g. from-blue-500 to-blue-700)', default: 'from-blue-500 to-blue-700' },
          order: { type: 'number', description: 'Display order', default: 0 },
        },
        required: ['name', 'slug'],
      },
    },
    handler: async (args) => {
      const cat = await ExamCategory.create(args);
      return { _id: cat._id, name: cat.name, slug: cat.slug };
    },
  },
  {
    type: 'function',
    function: {
      name: 'category_update',
      description: 'Update an exam category',
      parameters: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Category ID' },
          name: { type: 'string' }, slug: { type: 'string' },
          description: { type: 'string' }, icon: { type: 'string' },
          color: { type: 'string' }, order: { type: 'number' },
        },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const { _id, ...data } = args;
      const cat = await ExamCategory.findByIdAndUpdate(_id, data, { new: true, runValidators: true });
      if (!cat) throw new Error('Category not found');
      return { _id: cat._id, name: cat.name, slug: cat.slug };
    },
  },
  {
    type: 'function',
    function: {
      name: 'category_delete',
      description: 'Delete an exam category',
      parameters: {
        type: 'object',
        properties: { _id: { type: 'string', description: 'Category ID' } },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const cat = await ExamCategory.findByIdAndDelete(args._id);
      if (!cat) throw new Error('Category not found');
      return { deleted: true, name: cat.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'exam_list',
      description: 'List all exams, optionally filtered by categoryId',
      parameters: {
        type: 'object',
        properties: { categoryId: { type: 'string', description: 'Filter by category ID (optional)' } },
        required: [],
      },
    },
    handler: async (args) => {
      const filter: any = {};
      if (args.categoryId) filter.categoryId = toId(args.categoryId);
      const exams = await Exam.find(filter).populate('categoryId', 'name').sort({ order: 1 }).lean();
      return exams.map((e: any) => ({ _id: e._id, name: e.name, slug: e.slug, category: e.categoryId?.name || '', group: e.group, subCategories: e.subCategories }));
    },
  },
  {
    type: 'function',
    function: {
      name: 'exam_create',
      description: 'Create a new exam under a category',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Exam name' },
          slug: { type: 'string', description: 'URL slug' },
          categoryId: { type: 'string', description: 'Category ID the exam belongs to' },
          description: { type: 'string', default: '' },
          icon: { type: 'string', default: 'FileText' },
          color: { type: 'string', default: 'from-blue-500 to-blue-600' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], default: 'medium' },
          group: { type: 'string', enum: ['national', 'state', ''], default: '', description: 'Engineering page group' },
          subCategories: { type: 'array', items: { type: 'string' }, description: 'Sub-categories like CHSL, CGL, MTS' },
          order: { type: 'number', default: 0 },
        },
        required: ['name', 'slug', 'categoryId'],
      },
    },
    handler: async (args) => {
      const exam = await Exam.create(args);
      return { _id: exam._id, name: exam.name, slug: exam.slug };
    },
  },
  {
    type: 'function',
    function: {
      name: 'exam_update',
      description: 'Update an exam',
      parameters: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Exam ID' },
          name: { type: 'string' }, slug: { type: 'string' },
          description: { type: 'string' }, icon: { type: 'string' }, color: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          group: { type: 'string', enum: ['national', 'state', ''] },
          subCategories: { type: 'array', items: { type: 'string' } },
          order: { type: 'number' },
          isActive: { type: 'boolean' },
        },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const { _id, ...data } = args;
      const exam = await Exam.findByIdAndUpdate(_id, data, { new: true, runValidators: true });
      if (!exam) throw new Error('Exam not found');
      return { _id: exam._id, name: exam.name, slug: exam.slug };
    },
  },
  {
    type: 'function',
    function: {
      name: 'exam_delete',
      description: 'Delete an exam',
      parameters: {
        type: 'object',
        properties: { _id: { type: 'string', description: 'Exam ID' } },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const exam = await Exam.findByIdAndDelete(args._id);
      if (!exam) throw new Error('Exam not found');
      return { deleted: true, name: exam.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'exam_section_list',
      description: 'List exam sections, optionally filtered by categoryId',
      parameters: {
        type: 'object',
        properties: { categoryId: { type: 'string', description: 'Filter by category ID' } },
        required: [],
      },
    },
    handler: async (args) => {
      const filter: any = {};
      if (args.categoryId) filter.categoryId = toId(args.categoryId);
      const sections = await ExamSection.find(filter).populate('categoryId', 'name').sort({ order: 1 }).lean();
      return sections.map((s: any) => ({ _id: s._id, title: s.title, subtitle: s.subtitle, icon: s.icon, order: s.order, category: s.categoryId?.name }));
    },
  },
  {
    type: 'function',
    function: {
      name: 'exam_section_create',
      description: 'Create an exam section for grouping exams on category pages',
      parameters: {
        type: 'object',
        properties: {
          categoryId: { type: 'string', description: 'Category ID' },
          title: { type: 'string', description: 'Section heading like National Level Exams' },
          subtitle: { type: 'string', description: 'Subtitle text' },
          icon: { type: 'string', default: 'BookOpen' },
          order: { type: 'number', default: 0 },
        },
        required: ['categoryId', 'title'],
      },
    },
    handler: async (args) => {
      const section = await ExamSection.create(args);
      return { _id: section._id, title: section.title };
    },
  },
  {
    type: 'function',
    function: {
      name: 'exam_section_delete',
      description: 'Delete an exam section',
      parameters: {
        type: 'object',
        properties: { _id: { type: 'string', description: 'Section ID' } },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const section = await ExamSection.findByIdAndDelete(args._id);
      if (!section) throw new Error('Section not found');
      return { deleted: true, title: section.title };
    },
  },
  {
    type: 'function',
    function: {
      name: 'test_list',
      description: 'List tests, optionally filtered by category (exam name)',
      parameters: {
        type: 'object',
        properties: { category: { type: 'string', description: 'Filter by exam name' } },
        required: [],
      },
    },
    handler: async (args) => {
      const filter: any = {};
      if (args.category) filter.category = args.category;
      const tests = await Test.find(filter).sort({ createdAt: -1 }).limit(20).lean();
      return tests.map((t: any) => ({ _id: t._id, name: t.name, category: t.category, subCategory: t.subCategory, subject: t.subject, testType: t.testType, difficulty: t.difficulty, isActive: t.isActive, isPremium: t.isPremium }));
    },
  },
  {
    type: 'function',
    function: {
      name: 'test_create',
      description: 'Create a new test',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Test title' },
          description: { type: 'string', default: '' },
          category: { type: 'string', description: 'Exam name this test belongs to' },
          subject: { type: 'string', description: 'Subject name' },
          subCategory: { type: 'string', description: 'Sub-category like CHSL, CGL, MTS (optional)' },
          testType: { type: 'string', enum: ['subject', 'chapter', 'full'], default: 'subject' },
          class: { type: 'string', enum: ['11', '12', 'all'], default: 'all' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], default: 'medium' },
          duration: { type: 'number', description: 'Duration in minutes', default: 60 },
          totalQuestions: { type: 'number', default: 0 },
          totalMarks: { type: 'number', default: 100 },
          passingMarks: { type: 'number', default: 40 },
          isPremium: { type: 'boolean', default: false },
          price: { type: 'number', default: 0 },
        },
        required: ['name', 'category', 'subject'],
      },
    },
    handler: async (args) => {
      const test = await Test.create({ ...args, isActive: true });
      return { _id: test._id, name: test.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'test_update',
      description: 'Update a test',
      parameters: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Test ID' },
          name: { type: 'string' }, description: { type: 'string' },
          subCategory: { type: 'string' }, difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          duration: { type: 'number' }, totalQuestions: { type: 'number' },
          isActive: { type: 'boolean' }, isPremium: { type: 'boolean' },
          price: { type: 'number' },
        },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const { _id, ...data } = args;
      const test = await Test.findByIdAndUpdate(_id, data, { new: true, runValidators: true });
      if (!test) throw new Error('Test not found');
      return { _id: test._id, name: test.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'test_delete',
      description: 'Delete a test',
      parameters: {
        type: 'object',
        properties: { _id: { type: 'string', description: 'Test ID' } },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const test = await Test.findByIdAndDelete(args._id);
      if (!test) throw new Error('Test not found');
      return { deleted: true, name: test.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'user_list',
      description: 'List users with pagination',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
        },
        required: [],
      },
    },
    handler: async (args) => {
      const page = args.page || 1;
      const limit = args.limit || 10;
      const users = await User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
      const total = await User.countDocuments();
      return { users: users.map((u: any) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive })), total, page };
    },
  },

  // ─── SUBJECTS ───
  {
    type: 'function',
    function: {
      name: 'subject_list',
      description: 'List subjects, optionally filtered by categoryId',
      parameters: {
        type: 'object',
        properties: { categoryId: { type: 'string', description: 'Filter by category ID' } },
        required: [],
      },
    },
    handler: async (args) => {
      const filter: any = {};
      if (args.categoryId) filter.categoryId = toId(args.categoryId);
      const subjects = await Subject.find(filter).populate('categoryId', 'name').sort({ order: 1 }).lean();
      return subjects.map((s: any) => ({ _id: s._id, name: s.name, icon: s.icon, category: s.categoryId?.name, order: s.order }));
    },
  },
  {
    type: 'function',
    function: {
      name: 'subject_create',
      description: 'Create a new subject under a category',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Subject name' },
          categoryId: { type: 'string', description: 'Category ID' },
          icon: { type: 'string', default: 'BookOpen' },
          color: { type: 'string', default: '#3273e6' },
          description: { type: 'string', default: '' },
          order: { type: 'number', default: 0 },
        },
        required: ['name', 'categoryId'],
      },
    },
    handler: async (args) => {
      const existing = await Subject.findOne({ name: args.name, categoryId: args.categoryId });
      if (existing) throw new Error(`Subject "${args.name}" already exists in this category`);
      const subject = await Subject.create(args);
      return { _id: subject._id, name: subject.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'subject_update',
      description: 'Update a subject',
      parameters: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Subject ID' },
          name: { type: 'string' }, icon: { type: 'string' }, color: { type: 'string' },
          description: { type: 'string' }, order: { type: 'number' },
        },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const { _id, ...data } = args;
      const subject = await Subject.findByIdAndUpdate(_id, data, { new: true, runValidators: true });
      if (!subject) throw new Error('Subject not found');
      return { _id: subject._id, name: subject.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'subject_delete',
      description: 'Delete a subject (fails if topics exist under it)',
      parameters: {
        type: 'object',
        properties: { _id: { type: 'string', description: 'Subject ID' } },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const topicCount = await Topic.countDocuments({ subjectId: args._id });
      if (topicCount > 0) throw new Error(`Cannot delete: ${topicCount} topic(s) exist under this subject. Delete topics first.`);
      const subject = await Subject.findByIdAndDelete(args._id);
      if (!subject) throw new Error('Subject not found');
      return { deleted: true, name: subject.name };
    },
  },

  // ─── TOPICS ───
  {
    type: 'function',
    function: {
      name: 'topic_list',
      description: 'List topics, optionally filtered by subjectId',
      parameters: {
        type: 'object',
        properties: { subjectId: { type: 'string', description: 'Filter by subject ID' } },
        required: [],
      },
    },
    handler: async (args) => {
      const filter: any = {};
      if (args.subjectId) filter.subjectId = toId(args.subjectId);
      const topics = await Topic.find(filter).populate('subjectId', 'name').sort({ order: 1 }).lean();
      return topics.map((t: any) => ({ _id: t._id, name: t.name, slug: t.slug, subject: t.subjectId?.name, order: t.order }));
    },
  },
  {
    type: 'function',
    function: {
      name: 'topic_create',
      description: 'Create a new topic under a subject',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Topic name' },
          slug: { type: 'string', description: 'URL slug (lowercase, hyphens)' },
          subjectId: { type: 'string', description: 'Subject ID' },
          description: { type: 'string', default: '' },
          order: { type: 'number', default: 0 },
        },
        required: ['name', 'slug', 'subjectId'],
      },
    },
    handler: async (args) => {
      const topic = await Topic.create(args);
      return { _id: topic._id, name: topic.name, slug: topic.slug };
    },
  },
  {
    type: 'function',
    function: {
      name: 'topic_update',
      description: 'Update a topic',
      parameters: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Topic ID' },
          name: { type: 'string' }, slug: { type: 'string' },
          description: { type: 'string' }, order: { type: 'number' },
        },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const { _id, ...data } = args;
      const topic = await Topic.findByIdAndUpdate(_id, data, { new: true, runValidators: true });
      if (!topic) throw new Error('Topic not found');
      return { _id: topic._id, name: topic.name };
    },
  },
  {
    type: 'function',
    function: {
      name: 'topic_delete',
      description: 'Delete a topic',
      parameters: {
        type: 'object',
        properties: { _id: { type: 'string', description: 'Topic ID' } },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const topic = await Topic.findByIdAndDelete(args._id);
      if (!topic) throw new Error('Topic not found');
      return { deleted: true, name: topic.name };
    },
  },

  // ─── QUESTIONS ───
  {
    type: 'function',
    function: {
      name: 'question_list',
      description: 'List questions with optional filters',
      parameters: {
        type: 'object',
        properties: {
          testId: { type: 'string', description: 'Filter by test ID' },
          category: { type: 'string', description: 'Filter by category/exam name' },
          subject: { type: 'string', description: 'Filter by subject name' },
          topic: { type: 'string', description: 'Filter by topic name' },
          search: { type: 'string', description: 'Search in question text' },
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
        },
        required: [],
      },
    },
    handler: async (args) => {
      const query: Record<string, any> = {};
      if (args.testId) query.testId = toId(args.testId);
      if (args.category) query.category = args.category;
      if (args.subject) query.subject = args.subject;
      if (args.topic) query.topic = args.topic;
      if (args.search) query.text = { $regex: args.search, $options: 'i' };
      const page = args.page || 1;
      const limit = args.limit || 20;
      const [questions, total] = await Promise.all([
        Question.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Question.countDocuments(query),
      ]);
      return { questions: questions.map((q: any) => ({ _id: q._id, text: q.text?.substring(0, 100), type: q.type, subject: q.subject, topic: q.topic, difficulty: q.difficulty, marks: q.marks })), total, page, totalPages: Math.ceil(total / limit) };
    },
  },
  {
    type: 'function',
    function: {
      name: 'question_create',
      description: 'Create a single question',
      parameters: {
        type: 'object',
        properties: {
          testId: { type: 'string', description: 'Test ID (optional)' },
          text: { type: 'string', description: 'Question text' },
          options: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' } }, required: ['label', 'text'] }, description: 'MCQ options' },
          correctAnswer: { type: 'string', description: 'Correct answer label(s) — single letter like "A" or comma-separated "A,B"' },
          type: { type: 'string', enum: ['mcq', 'single', 'multiple', 'subjective', 'descriptive', 'integer'], default: 'mcq' },
          category: { type: 'string', description: 'Category/exam name' },
          subject: { type: 'string', description: 'Subject name' },
          topic: { type: 'string', description: 'Topic name (optional)' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], default: 'medium' },
          marks: { type: 'number', default: 1 },
          negativeMarks: { type: 'number', default: 0 },
        },
        required: ['text', 'category', 'subject'],
      },
    },
    handler: async (args) => {
      const q = await Question.create(args);
      if (q.testId) {
        const count = await Question.countDocuments({ testId: q.testId, isActive: true });
        await Test.findByIdAndUpdate(q.testId, { questionCount: count, totalQuestions: count });
      }
      return { _id: q._id, text: q.text?.substring(0, 80), type: q.type };
    },
  },
  {
    type: 'function',
    function: {
      name: 'question_update',
      description: 'Update a question',
      parameters: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Question ID' },
          text: { type: 'string' }, correctAnswer: { type: 'string' },
          options: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' } } } },
          type: { type: 'string', enum: ['mcq', 'single', 'multiple', 'subjective', 'descriptive', 'integer'] },
          subject: { type: 'string' }, topic: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          marks: { type: 'number' }, negativeMarks: { type: 'number' },
        },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const { _id, ...data } = args;
      const q = await Question.findByIdAndUpdate(_id, data, { new: true, runValidators: true });
      if (!q) throw new Error('Question not found');
      return { _id: q._id, text: q.text?.substring(0, 80) };
    },
  },
  {
    type: 'function',
    function: {
      name: 'question_delete',
      description: 'Delete a question',
      parameters: {
        type: 'object',
        properties: { _id: { type: 'string', description: 'Question ID' } },
        required: ['_id'],
      },
    },
    handler: async (args) => {
      const q = await Question.findByIdAndDelete(args._id);
      if (!q) throw new Error('Question not found');
      if (q.testId) {
        const count = await Question.countDocuments({ testId: q.testId, isActive: true });
        await Test.findByIdAndUpdate(q.testId, { questionCount: count, totalQuestions: count });
      }
      return { deleted: true };
    },
  },
  {
    type: 'function',
    function: {
      name: 'question_bulk_import',
      description: 'Bulk import questions from a JSON array. Each question can have: text, options (array of {label, text}), correctAnswer, type, category, subject, topic, difficulty, marks, negativeMarks, testId.',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                options: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' } } } },
                correctAnswer: { type: 'string' },
                type: { type: 'string', enum: ['mcq', 'single', 'multiple', 'subjective', 'descriptive', 'integer'] },
                category: { type: 'string' },
                subject: { type: 'string' },
                topic: { type: 'string' },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                marks: { type: 'number' },
                negativeMarks: { type: 'number' },
                testId: { type: 'string' },
              },
              required: ['text', 'category', 'subject'],
            },
            description: 'Array of question objects to import',
          },
        },
        required: ['questions'],
      },
    },
    handler: async (args) => {
      const { questions } = args;
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('Questions array is required');
      const created = await Question.insertMany(questions.map((q: any) => ({
        ...q,
        correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer),
      })));
      const testIds = [...new Set(created.filter((q: any) => q.testId).map((q: any) => q.testId.toString()))];
      for (const testId of testIds) {
        const count = await Question.countDocuments({ testId, isActive: true });
        await Test.findByIdAndUpdate(testId, { questionCount: count, totalQuestions: count });
      }
      return { count: created.length, message: `Successfully imported ${created.length} questions` };
    },
  },
];
