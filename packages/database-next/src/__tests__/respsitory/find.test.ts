import { mockDatabase } from '../index';
import Database from '@nocobase/database';
import { Collection } from '../../collection';
import { OptionsParser } from '../../optionsParser';

describe('repository find', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  beforeEach(async () => {
    const db = mockDatabase();
    User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'hasMany',
          name: 'comments',
        },
      ],
    });

    Comment = db.collection({
      name: 'comments',
      field: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'posts' },
      ],
    });

    await db.sync();
    const repository = User.repository;

    await repository.createMany({
      records: [
        {
          name: 'u1',
          age: 10,
          posts: [{ title: 'u1t1', comments: ['u1t1c1'] }],
        },
        {
          name: 'u2',
          age: 20,
          posts: [{ title: 'u2t1', comments: ['u2t1c1'] }],
        },
        {
          name: 'u3',
          age: 30,
          posts: [{ title: 'u3t1', comments: ['u3t1c1'] }],
        },
      ],
    });
  });

  describe('findOne', () => {
    test('find one with attribute', async () => {
      const user = await User.repository.findOne({
        filter: {
          name: 'u2',
        },
      });
      expect(user['name']).toEqual('u2');
    });

    test('find one with relation', async () => {
      const user = await User.repository.findOne({
        filter: {
          'posts.title': 'u2t1',
        },
      });
      expect(user['name']).toEqual('u2');
    });

    test('find one with fields', async () => {
      const user = await User.repository.findOne({
        filter: {
          name: 'u2',
        },
        fields: ['id'],
        appends: ['posts'],
        expect: ['posts.id'],
      });

      const data = user.toJSON();
      expect(Object.keys(data)).toEqual(['id', 'posts']);
      expect(Object.keys(data['posts'])).not.toContain('id');
    });
  });

  describe('find', () => {
    test('find with logic or', async () => {
      const users = await User.repository.findAndCount({
        filter: {
          $or: [{ 'posts.title': 'u1t1' }, { 'posts.title': 'u2t1' }],
        },
      });

      expect(users[1]).toEqual(2);
    });

    test('find with fields', async () => {
      let user = await User.repository.findOne({
        fields: ['name'],
      });

      expect(user['name']).toBeDefined();
      expect(user['age']).toBeUndefined();
      expect(user['posts']).toBeUndefined();

      user = await User.repository.findOne({
        fields: ['name', 'posts'],
      });

      expect(user['posts']).toBeDefined();
    });

    describe('find with appends', () => {
      test('filter attribute', async () => {
        const user = await User.repository.findOne({
          filter: {
            name: 'u1',
          },
          appends: ['posts'],
        });

        expect(user['posts']).toBeDefined();
      });

      test('filter association attribute', async () => {
        const user2 = await User.repository.findOne({
          filter: {
            'posts.title': 'u1t1',
          },
          appends: ['posts'],
        });
        expect(user2['posts']).toBeDefined();
      });

      test('without appends', async () => {
        const user3 = await User.repository.findOne({
          filter: {
            'posts.title': 'u1t1',
          },
        });

        expect(user3['posts']).toBeUndefined();
      });
    });

    describe('find all', () => {
      test('without params', async () => {
        expect((await User.repository.find()).length).toEqual(3);
      });
      test('with limit', async () => {
        expect(
          (
            await User.repository.find({
              limit: 1,
            })
          ).length,
        ).toEqual(1);
      });
    });

    describe('find and count', () => {
      test('without params', async () => {
        expect((await User.repository.findAndCount())[1]).toEqual(3);
      });
    });

    test('find with filter', async () => {
      const results = await User.repository.find({
        filter: {
          name: 'u1',
        },
      });

      expect(results.length).toEqual(1);
    });

    test('find with association', async () => {
      const results = await User.repository.find({
        filter: {
          'posts.title': 'u1t1',
        },
      });

      expect(results.length).toEqual(1);
    });
  });
});
