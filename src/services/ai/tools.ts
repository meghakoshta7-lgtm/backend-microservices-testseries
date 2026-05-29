import mongoose from 'mongoose';
import { ExamCategory } from '@/models/ExamCategory';
import { Exam } from '@/models/Exam';
import { ExamSection } from '@/models/ExamSection';
import { Test } from '@/models/Test';
import { Subject } from '@/models/Subject';
import { Topic } from '@/models/Topic';
import { User } from '@/models/User';

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
];
