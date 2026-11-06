import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  display_name: text('display_name').notNull(),
  bio: text('bio').notNull().default(''),
  avatar_id: integer('avatar_id').notNull().default(4),
  avatar_color: text('avatar_color').notNull().default('#6258D9'),
  avatar_shape_id: integer('avatar_shape_id').notNull().default(4),
  avatar_mark_id: integer('avatar_mark_id').notNull().default(4),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
