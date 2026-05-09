import {
  pgTable, uuid, varchar, text, boolean, integer, date,
  timestamp, primaryKey,
} from 'drizzle-orm/pg-core';

export const photos = pgTable('photos', {
  id:             uuid('id').primaryKey().defaultRandom(),
  title:          varchar('title', { length: 255 }),
  caption:        text('caption'),
  location:       varchar('location', { length: 255 }),
  shotAt:         date('shot_at'),
  featured:       boolean('featured').notNull().default(false),
  displayOrder:   integer('display_order').notNull().default(0),
  carouselOrder:  integer('carousel_order'),
  s3KeyThumb:     text('s3_key_thumb').notNull(),
  s3KeyMedium:    text('s3_key_medium').notNull(),
  s3KeyFull:      text('s3_key_full').notNull(),
  s3KeyOriginal:  text('s3_key_original').notNull(),
  originalWidth:  integer('original_width'),
  originalHeight: integer('original_height'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const collections = pgTable('collections', {
  id:           uuid('id').primaryKey().defaultRandom(),
  name:         varchar('name', { length: 255 }).notNull(),
  slug:         varchar('slug', { length: 255 }).notNull().unique(),
  description:  text('description'),
  coverPhotoId: uuid('cover_photo_id').references(() => photos.id, { onDelete: 'set null' }),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const photoCollections = pgTable('photo_collections', {
  photoId:      uuid('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.photoId, t.collectionId] }),
}));

export const tags = pgTable('tags', {
  id:   uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

export const photoTags = pgTable('photo_tags', {
  photoId: uuid('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  tagId:   uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.photoId, t.tagId] }),
}));

export const contactSubmissions = pgTable('contact_submissions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 255 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull(),
  message:   text('message').notNull(),
  ip:        text('ip'),
  readAt:    timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable('admin_users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
