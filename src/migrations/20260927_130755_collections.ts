import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'reviewer');
  CREATE TYPE "public"."enum_expeditions_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum_expeditions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__expeditions_v_version_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum__expeditions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__expeditions_v_published_locale" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_stations_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum_stations_operational_status" AS ENUM('active', 'historical');
  CREATE TYPE "public"."enum_stations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__stations_v_version_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum__stations_v_version_operational_status" AS ENUM('active', 'historical');
  CREATE TYPE "public"."enum__stations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__stations_v_published_locale" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_reports_report_type" AS ENUM('expedition', 'annual', 'technical', 'other');
  CREATE TYPE "public"."enum_reports_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum_reports_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum_reports_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__reports_v_version_report_type" AS ENUM('expedition', 'annual', 'technical', 'other');
  CREATE TYPE "public"."enum__reports_v_version_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum__reports_v_version_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum__reports_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__reports_v_published_locale" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_datasets_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum_datasets_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum_datasets_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__datasets_v_version_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum__datasets_v_version_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum__datasets_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__datasets_v_published_locale" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_publications_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum_publications_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum_publications_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__publications_v_version_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum__publications_v_version_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum__publications_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__publications_v_published_locale" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_media_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum_media_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum_media_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__media_v_version_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum__media_v_version_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum__media_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__media_v_published_locale" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_events_event_type" AS ENUM('workshop', 'school_outreach', 'launch', 'flag_off', 'conference', 'visit');
  CREATE TYPE "public"."enum_events_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum_events_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_event_type" AS ENUM('workshop', 'school_outreach', 'launch', 'flag_off', 'conference', 'visit');
  CREATE TYPE "public"."enum__events_v_version_region" AS ENUM('antarctic', 'arctic', 'southern_ocean', 'himalaya');
  CREATE TYPE "public"."enum__events_v_version_processing_state" AS ENUM('queued', 'processing', 'ready', 'needs_ocr', 'failed');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_published_locale" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_outreach_posts_platform" AS ENUM('blog', 'x', 'instagram', 'linkedin', 'press_note', 'student_explainer');
  CREATE TYPE "public"."enum_outreach_posts_language" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum_outreach_posts_review_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_outreach_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__outreach_posts_v_version_platform" AS ENUM('blog', 'x', 'instagram', 'linkedin', 'press_note', 'student_explainer');
  CREATE TYPE "public"."enum__outreach_posts_v_version_language" AS ENUM('en', 'hi');
  CREATE TYPE "public"."enum__outreach_posts_v_version_review_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__outreach_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__outreach_posts_v_published_locale" AS ENUM('en', 'hi');
  CREATE TABLE "expeditions_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "expeditions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"region" "enum_expeditions_region",
  	"season_start" numeric,
  	"season_end" numeric,
  	"leader" varchar,
  	"cover_id" integer,
  	"source_url" varchar,
  	"license" varchar,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_expeditions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "expeditions_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "expeditions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "_expeditions_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_expeditions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_number" varchar,
  	"version_region" "enum__expeditions_v_version_region",
  	"version_season_start" numeric,
  	"version_season_end" numeric,
  	"version_leader" varchar,
  	"version_cover_id" integer,
  	"version_source_url" varchar,
  	"version_license" varchar,
  	"version_credit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__expeditions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__expeditions_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_expeditions_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_expeditions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "stations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" "enum_stations_region",
  	"lat" numeric,
  	"lng" numeric,
  	"established" numeric,
  	"decommissioned" numeric,
  	"operational_status" "enum_stations_operational_status" DEFAULT 'active',
  	"cover_id" integer,
  	"source_url" varchar,
  	"license" varchar,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_stations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "stations_locales" (
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_stations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_region" "enum__stations_v_version_region",
  	"version_lat" numeric,
  	"version_lng" numeric,
  	"version_established" numeric,
  	"version_decommissioned" numeric,
  	"version_operational_status" "enum__stations_v_version_operational_status" DEFAULT 'active',
  	"version_cover_id" integer,
  	"version_source_url" varchar,
  	"version_license" varchar,
  	"version_credit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__stations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__stations_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_stations_v_locales" (
  	"version_name" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"report_type" "enum_reports_report_type" DEFAULT 'expedition',
  	"region" "enum_reports_region",
  	"expedition_id" integer,
  	"year" numeric,
  	"page_count" numeric,
  	"source_url" varchar,
  	"license" varchar,
  	"credit" varchar,
  	"processing_state" "enum_reports_processing_state" DEFAULT 'queued',
  	"processing_error" varchar,
  	"ai_generated" boolean DEFAULT false,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_reports_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "reports_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "reports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "reports_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "_reports_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_report_type" "enum__reports_v_version_report_type" DEFAULT 'expedition',
  	"version_region" "enum__reports_v_version_region",
  	"version_expedition_id" integer,
  	"version_year" numeric,
  	"version_page_count" numeric,
  	"version_source_url" varchar,
  	"version_license" varchar,
  	"version_credit" varchar,
  	"version_processing_state" "enum__reports_v_version_processing_state" DEFAULT 'queued',
  	"version_processing_error" varchar,
  	"version_ai_generated" boolean DEFAULT false,
  	"version__objectkey" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__reports_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__reports_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_reports_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_reports_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_reports_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "datasets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"temporal_from" timestamp(3) with time zone,
  	"temporal_to" timestamp(3) with time zone,
  	"region" "enum_datasets_region",
  	"year" numeric,
  	"expedition_id" integer,
  	"bbox_west" numeric,
  	"bbox_south" numeric,
  	"bbox_east" numeric,
  	"bbox_north" numeric,
  	"format" varchar,
  	"external_url" varchar,
  	"doi" varchar,
  	"contact" varchar,
  	"source_url" varchar,
  	"license" varchar,
  	"credit" varchar,
  	"processing_state" "enum_datasets_processing_state" DEFAULT 'queued',
  	"processing_error" varchar,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_datasets_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "datasets_locales" (
  	"title" varchar,
  	"abstract" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "datasets_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "datasets_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "_datasets_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_temporal_from" timestamp(3) with time zone,
  	"version_temporal_to" timestamp(3) with time zone,
  	"version_region" "enum__datasets_v_version_region",
  	"version_year" numeric,
  	"version_expedition_id" integer,
  	"version_bbox_west" numeric,
  	"version_bbox_south" numeric,
  	"version_bbox_east" numeric,
  	"version_bbox_north" numeric,
  	"version_format" varchar,
  	"version_external_url" varchar,
  	"version_doi" varchar,
  	"version_contact" varchar,
  	"version_source_url" varchar,
  	"version_license" varchar,
  	"version_credit" varchar,
  	"version_processing_state" "enum__datasets_v_version_processing_state" DEFAULT 'queued',
  	"version_processing_error" varchar,
  	"version__objectkey" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__datasets_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__datasets_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_datasets_v_locales" (
  	"version_title" varchar,
  	"version_abstract" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_datasets_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_datasets_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "publications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"venue" varchar,
  	"year" numeric,
  	"doi" varchar,
  	"link" varchar,
  	"region" "enum_publications_region",
  	"expedition_id" integer,
  	"source_url" varchar,
  	"license" varchar,
  	"credit" varchar,
  	"processing_state" "enum_publications_processing_state" DEFAULT 'queued',
  	"processing_error" varchar,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_publications_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "publications_locales" (
  	"title" varchar,
  	"abstract" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "publications_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "publications_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "_publications_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_venue" varchar,
  	"version_year" numeric,
  	"version_doi" varchar,
  	"version_link" varchar,
  	"version_region" "enum__publications_v_version_region",
  	"version_expedition_id" integer,
  	"version_source_url" varchar,
  	"version_license" varchar,
  	"version_credit" varchar,
  	"version_processing_state" "enum__publications_v_version_processing_state" DEFAULT 'queued',
  	"version_processing_error" varchar,
  	"version__objectkey" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__publications_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__publications_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_publications_v_locales" (
  	"version_title" varchar,
  	"version_abstract" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_publications_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_publications_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "media_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "_media_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_youtube_url" varchar,
  	"version_region" "enum__media_v_version_region",
  	"version_expedition_id" integer,
  	"version_taken_at" timestamp(3) with time zone,
  	"version_lat" numeric,
  	"version_lng" numeric,
  	"version_source_url" varchar,
  	"version_license" varchar,
  	"version_credit" varchar,
  	"version_processing_state" "enum__media_v_version_processing_state" DEFAULT 'queued',
  	"version_processing_error" varchar,
  	"version_ai_generated" boolean DEFAULT false,
  	"version__objectkey" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__media_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"version_sizes_thumbnail_url" varchar,
  	"version_sizes_thumbnail_width" numeric,
  	"version_sizes_thumbnail_height" numeric,
  	"version_sizes_thumbnail_mime_type" varchar,
  	"version_sizes_thumbnail_filesize" numeric,
  	"version_sizes_thumbnail_filename" varchar,
  	"version_sizes_large_url" varchar,
  	"version_sizes_large_width" numeric,
  	"version_sizes_large_height" numeric,
  	"version_sizes_large_mime_type" varchar,
  	"version_sizes_large_filesize" numeric,
  	"version_sizes_large_filename" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__media_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_media_v_locales" (
  	"version_caption" varchar,
  	"version_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_media_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_media_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"event_type" "enum_events_event_type",
  	"location" varchar,
  	"region" "enum_events_region",
  	"expedition_id" integer,
  	"source_url" varchar,
  	"license" varchar,
  	"credit" varchar,
  	"processing_state" "enum_events_processing_state" DEFAULT 'queued',
  	"processing_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"stations_id" integer
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_date" timestamp(3) with time zone,
  	"version_event_type" "enum__events_v_version_event_type",
  	"version_location" varchar,
  	"version_region" "enum__events_v_version_region",
  	"version_expedition_id" integer,
  	"version_source_url" varchar,
  	"version_license" varchar,
  	"version_credit" varchar,
  	"version_processing_state" "enum__events_v_version_processing_state" DEFAULT 'queued',
  	"version_processing_error" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__events_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_events_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"stations_id" integer
  );
  
  CREATE TABLE "outreach_posts_thread" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "outreach_posts_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer_index" numeric,
  	"explanation" varchar,
  	"chunk_id" numeric
  );
  
  CREATE TABLE "outreach_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum_outreach_posts_platform",
  	"language" "enum_outreach_posts_language",
  	"title" varchar,
  	"body" varchar,
  	"suggested_media_id" integer,
  	"checks" jsonb,
  	"model" varchar,
  	"prompt_version" varchar,
  	"review_status" "enum_outreach_posts_review_status" DEFAULT 'pending',
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"review_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_outreach_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "outreach_posts_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "outreach_posts_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "outreach_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"reports_id" integer,
  	"datasets_id" integer,
  	"publications_id" integer,
  	"media_id" integer,
  	"events_id" integer,
  	"expeditions_id" integer,
  	"stations_id" integer
  );
  
  CREATE TABLE "_outreach_posts_v_version_thread" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_outreach_posts_v_version_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer_index" numeric,
  	"explanation" varchar,
  	"chunk_id" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_outreach_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_platform" "enum__outreach_posts_v_version_platform",
  	"version_language" "enum__outreach_posts_v_version_language",
  	"version_title" varchar,
  	"version_body" varchar,
  	"version_suggested_media_id" integer,
  	"version_checks" jsonb,
  	"version_model" varchar,
  	"version_prompt_version" varchar,
  	"version_review_status" "enum__outreach_posts_v_version_review_status" DEFAULT 'pending',
  	"version_reviewed_by_id" integer,
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_review_note" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__outreach_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__outreach_posts_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_outreach_posts_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_outreach_posts_v_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "_outreach_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"reports_id" integer,
  	"datasets_id" integer,
  	"publications_id" integer,
  	"media_id" integer,
  	"events_id" integer,
  	"expeditions_id" integer,
  	"stations_id" integer
  );
  
  ALTER TABLE "media_locales" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "users" ADD COLUMN "name" varchar;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  ALTER TABLE "media" ADD COLUMN "youtube_url" varchar;
  ALTER TABLE "media" ADD COLUMN "region" "enum_media_region";
  ALTER TABLE "media" ADD COLUMN "expedition_id" integer;
  ALTER TABLE "media" ADD COLUMN "taken_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN "lat" numeric;
  ALTER TABLE "media" ADD COLUMN "lng" numeric;
  ALTER TABLE "media" ADD COLUMN "source_url" varchar;
  ALTER TABLE "media" ADD COLUMN "license" varchar;
  ALTER TABLE "media" ADD COLUMN "credit" varchar;
  ALTER TABLE "media" ADD COLUMN "processing_state" "enum_media_processing_state" DEFAULT 'queued';
  ALTER TABLE "media" ADD COLUMN "processing_error" varchar;
  ALTER TABLE "media" ADD COLUMN "ai_generated" boolean DEFAULT false;
  ALTER TABLE "media" ADD COLUMN "_status" "enum_media_status" DEFAULT 'draft';
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_filename" varchar;
  ALTER TABLE "media_locales" ADD COLUMN "caption" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "expeditions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reports_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "datasets_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "publications_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "outreach_posts_id" integer;
  ALTER TABLE "expeditions_highlights" ADD CONSTRAINT "expeditions_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."expeditions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "expeditions" ADD CONSTRAINT "expeditions_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "expeditions_locales" ADD CONSTRAINT "expeditions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."expeditions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "expeditions_rels" ADD CONSTRAINT "expeditions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."expeditions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "expeditions_rels" ADD CONSTRAINT "expeditions_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_expeditions_v_version_highlights" ADD CONSTRAINT "_expeditions_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_expeditions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_expeditions_v" ADD CONSTRAINT "_expeditions_v_parent_id_expeditions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_expeditions_v" ADD CONSTRAINT "_expeditions_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_expeditions_v_locales" ADD CONSTRAINT "_expeditions_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_expeditions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_expeditions_v_rels" ADD CONSTRAINT "_expeditions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_expeditions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_expeditions_v_rels" ADD CONSTRAINT "_expeditions_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stations" ADD CONSTRAINT "stations_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stations_locales" ADD CONSTRAINT "stations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stations_v" ADD CONSTRAINT "_stations_v_parent_id_stations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stations_v" ADD CONSTRAINT "_stations_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stations_v_locales" ADD CONSTRAINT "_stations_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports_locales" ADD CONSTRAINT "reports_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports_texts" ADD CONSTRAINT "reports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v" ADD CONSTRAINT "_reports_v_parent_id_reports_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reports_v" ADD CONSTRAINT "_reports_v_version_expedition_id_expeditions_id_fk" FOREIGN KEY ("version_expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reports_v_locales" ADD CONSTRAINT "_reports_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_texts" ADD CONSTRAINT "_reports_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "datasets" ADD CONSTRAINT "datasets_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "datasets_locales" ADD CONSTRAINT "datasets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "datasets_texts" ADD CONSTRAINT "datasets_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "datasets_rels" ADD CONSTRAINT "datasets_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "datasets_rels" ADD CONSTRAINT "datasets_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_datasets_v" ADD CONSTRAINT "_datasets_v_parent_id_datasets_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."datasets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_datasets_v" ADD CONSTRAINT "_datasets_v_version_expedition_id_expeditions_id_fk" FOREIGN KEY ("version_expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_datasets_v_locales" ADD CONSTRAINT "_datasets_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_datasets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_datasets_v_texts" ADD CONSTRAINT "_datasets_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_datasets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_datasets_v_rels" ADD CONSTRAINT "_datasets_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_datasets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_datasets_v_rels" ADD CONSTRAINT "_datasets_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications_locales" ADD CONSTRAINT "publications_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_texts" ADD CONSTRAINT "publications_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_parent_id_publications_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_expedition_id_expeditions_id_fk" FOREIGN KEY ("version_expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v_locales" ADD CONSTRAINT "_publications_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_texts" ADD CONSTRAINT "_publications_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_texts" ADD CONSTRAINT "media_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_parent_id_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_version_expedition_id_expeditions_id_fk" FOREIGN KEY ("version_expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v_locales" ADD CONSTRAINT "_media_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_texts" ADD CONSTRAINT "_media_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_expedition_id_expeditions_id_fk" FOREIGN KEY ("version_expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_thread" ADD CONSTRAINT "outreach_posts_thread_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."outreach_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_quiz" ADD CONSTRAINT "outreach_posts_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."outreach_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts" ADD CONSTRAINT "outreach_posts_suggested_media_id_media_id_fk" FOREIGN KEY ("suggested_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outreach_posts" ADD CONSTRAINT "outreach_posts_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outreach_posts_texts" ADD CONSTRAINT "outreach_posts_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."outreach_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_numbers" ADD CONSTRAINT "outreach_posts_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."outreach_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."outreach_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_datasets_fk" FOREIGN KEY ("datasets_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_expeditions_fk" FOREIGN KEY ("expeditions_id") REFERENCES "public"."expeditions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "outreach_posts_rels" ADD CONSTRAINT "outreach_posts_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_version_thread" ADD CONSTRAINT "_outreach_posts_v_version_thread_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_outreach_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_version_quiz" ADD CONSTRAINT "_outreach_posts_v_version_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_outreach_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v" ADD CONSTRAINT "_outreach_posts_v_parent_id_outreach_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."outreach_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v" ADD CONSTRAINT "_outreach_posts_v_version_suggested_media_id_media_id_fk" FOREIGN KEY ("version_suggested_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v" ADD CONSTRAINT "_outreach_posts_v_version_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_texts" ADD CONSTRAINT "_outreach_posts_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_outreach_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_numbers" ADD CONSTRAINT "_outreach_posts_v_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_outreach_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_outreach_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_datasets_fk" FOREIGN KEY ("datasets_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_expeditions_fk" FOREIGN KEY ("expeditions_id") REFERENCES "public"."expeditions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_outreach_posts_v_rels" ADD CONSTRAINT "_outreach_posts_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "expeditions_highlights_order_idx" ON "expeditions_highlights" USING btree ("_order");
  CREATE INDEX "expeditions_highlights_parent_id_idx" ON "expeditions_highlights" USING btree ("_parent_id");
  CREATE INDEX "expeditions_highlights_locale_idx" ON "expeditions_highlights" USING btree ("_locale");
  CREATE INDEX "expeditions_cover_idx" ON "expeditions" USING btree ("cover_id");
  CREATE INDEX "expeditions_updated_at_idx" ON "expeditions" USING btree ("updated_at");
  CREATE INDEX "expeditions_created_at_idx" ON "expeditions" USING btree ("created_at");
  CREATE INDEX "expeditions__status_idx" ON "expeditions" USING btree ("_status");
  CREATE UNIQUE INDEX "expeditions_locales_locale_parent_id_unique" ON "expeditions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "expeditions_rels_order_idx" ON "expeditions_rels" USING btree ("order");
  CREATE INDEX "expeditions_rels_parent_idx" ON "expeditions_rels" USING btree ("parent_id");
  CREATE INDEX "expeditions_rels_path_idx" ON "expeditions_rels" USING btree ("path");
  CREATE INDEX "expeditions_rels_stations_id_idx" ON "expeditions_rels" USING btree ("stations_id");
  CREATE INDEX "_expeditions_v_version_highlights_order_idx" ON "_expeditions_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_expeditions_v_version_highlights_parent_id_idx" ON "_expeditions_v_version_highlights" USING btree ("_parent_id");
  CREATE INDEX "_expeditions_v_version_highlights_locale_idx" ON "_expeditions_v_version_highlights" USING btree ("_locale");
  CREATE INDEX "_expeditions_v_parent_idx" ON "_expeditions_v" USING btree ("parent_id");
  CREATE INDEX "_expeditions_v_version_version_cover_idx" ON "_expeditions_v" USING btree ("version_cover_id");
  CREATE INDEX "_expeditions_v_version_version_updated_at_idx" ON "_expeditions_v" USING btree ("version_updated_at");
  CREATE INDEX "_expeditions_v_version_version_created_at_idx" ON "_expeditions_v" USING btree ("version_created_at");
  CREATE INDEX "_expeditions_v_version_version__status_idx" ON "_expeditions_v" USING btree ("version__status");
  CREATE INDEX "_expeditions_v_created_at_idx" ON "_expeditions_v" USING btree ("created_at");
  CREATE INDEX "_expeditions_v_updated_at_idx" ON "_expeditions_v" USING btree ("updated_at");
  CREATE INDEX "_expeditions_v_snapshot_idx" ON "_expeditions_v" USING btree ("snapshot");
  CREATE INDEX "_expeditions_v_published_locale_idx" ON "_expeditions_v" USING btree ("published_locale");
  CREATE INDEX "_expeditions_v_latest_idx" ON "_expeditions_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_expeditions_v_locales_locale_parent_id_unique" ON "_expeditions_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_expeditions_v_rels_order_idx" ON "_expeditions_v_rels" USING btree ("order");
  CREATE INDEX "_expeditions_v_rels_parent_idx" ON "_expeditions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_expeditions_v_rels_path_idx" ON "_expeditions_v_rels" USING btree ("path");
  CREATE INDEX "_expeditions_v_rels_stations_id_idx" ON "_expeditions_v_rels" USING btree ("stations_id");
  CREATE INDEX "stations_cover_idx" ON "stations" USING btree ("cover_id");
  CREATE INDEX "stations_updated_at_idx" ON "stations" USING btree ("updated_at");
  CREATE INDEX "stations_created_at_idx" ON "stations" USING btree ("created_at");
  CREATE INDEX "stations__status_idx" ON "stations" USING btree ("_status");
  CREATE UNIQUE INDEX "stations_locales_locale_parent_id_unique" ON "stations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_stations_v_parent_idx" ON "_stations_v" USING btree ("parent_id");
  CREATE INDEX "_stations_v_version_version_cover_idx" ON "_stations_v" USING btree ("version_cover_id");
  CREATE INDEX "_stations_v_version_version_updated_at_idx" ON "_stations_v" USING btree ("version_updated_at");
  CREATE INDEX "_stations_v_version_version_created_at_idx" ON "_stations_v" USING btree ("version_created_at");
  CREATE INDEX "_stations_v_version_version__status_idx" ON "_stations_v" USING btree ("version__status");
  CREATE INDEX "_stations_v_created_at_idx" ON "_stations_v" USING btree ("created_at");
  CREATE INDEX "_stations_v_updated_at_idx" ON "_stations_v" USING btree ("updated_at");
  CREATE INDEX "_stations_v_snapshot_idx" ON "_stations_v" USING btree ("snapshot");
  CREATE INDEX "_stations_v_published_locale_idx" ON "_stations_v" USING btree ("published_locale");
  CREATE INDEX "_stations_v_latest_idx" ON "_stations_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_stations_v_locales_locale_parent_id_unique" ON "_stations_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "reports_expedition_idx" ON "reports" USING btree ("expedition_id");
  CREATE INDEX "reports_updated_at_idx" ON "reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");
  CREATE INDEX "reports__status_idx" ON "reports" USING btree ("_status");
  CREATE UNIQUE INDEX "reports_filename_idx" ON "reports" USING btree ("filename");
  CREATE UNIQUE INDEX "reports_locales_locale_parent_id_unique" ON "reports_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "reports_texts_order_parent" ON "reports_texts" USING btree ("order","parent_id");
  CREATE INDEX "reports_rels_order_idx" ON "reports_rels" USING btree ("order");
  CREATE INDEX "reports_rels_parent_idx" ON "reports_rels" USING btree ("parent_id");
  CREATE INDEX "reports_rels_path_idx" ON "reports_rels" USING btree ("path");
  CREATE INDEX "reports_rels_stations_id_idx" ON "reports_rels" USING btree ("stations_id");
  CREATE INDEX "_reports_v_parent_idx" ON "_reports_v" USING btree ("parent_id");
  CREATE INDEX "_reports_v_version_version_expedition_idx" ON "_reports_v" USING btree ("version_expedition_id");
  CREATE INDEX "_reports_v_version_version_updated_at_idx" ON "_reports_v" USING btree ("version_updated_at");
  CREATE INDEX "_reports_v_version_version_created_at_idx" ON "_reports_v" USING btree ("version_created_at");
  CREATE INDEX "_reports_v_version_version__status_idx" ON "_reports_v" USING btree ("version__status");
  CREATE INDEX "_reports_v_version_version_filename_idx" ON "_reports_v" USING btree ("version_filename");
  CREATE INDEX "_reports_v_created_at_idx" ON "_reports_v" USING btree ("created_at");
  CREATE INDEX "_reports_v_updated_at_idx" ON "_reports_v" USING btree ("updated_at");
  CREATE INDEX "_reports_v_snapshot_idx" ON "_reports_v" USING btree ("snapshot");
  CREATE INDEX "_reports_v_published_locale_idx" ON "_reports_v" USING btree ("published_locale");
  CREATE INDEX "_reports_v_latest_idx" ON "_reports_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_reports_v_locales_locale_parent_id_unique" ON "_reports_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_reports_v_texts_order_parent" ON "_reports_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_reports_v_rels_order_idx" ON "_reports_v_rels" USING btree ("order");
  CREATE INDEX "_reports_v_rels_parent_idx" ON "_reports_v_rels" USING btree ("parent_id");
  CREATE INDEX "_reports_v_rels_path_idx" ON "_reports_v_rels" USING btree ("path");
  CREATE INDEX "_reports_v_rels_stations_id_idx" ON "_reports_v_rels" USING btree ("stations_id");
  CREATE INDEX "datasets_expedition_idx" ON "datasets" USING btree ("expedition_id");
  CREATE INDEX "datasets_updated_at_idx" ON "datasets" USING btree ("updated_at");
  CREATE INDEX "datasets_created_at_idx" ON "datasets" USING btree ("created_at");
  CREATE INDEX "datasets__status_idx" ON "datasets" USING btree ("_status");
  CREATE UNIQUE INDEX "datasets_filename_idx" ON "datasets" USING btree ("filename");
  CREATE UNIQUE INDEX "datasets_locales_locale_parent_id_unique" ON "datasets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "datasets_texts_order_parent" ON "datasets_texts" USING btree ("order","parent_id");
  CREATE INDEX "datasets_rels_order_idx" ON "datasets_rels" USING btree ("order");
  CREATE INDEX "datasets_rels_parent_idx" ON "datasets_rels" USING btree ("parent_id");
  CREATE INDEX "datasets_rels_path_idx" ON "datasets_rels" USING btree ("path");
  CREATE INDEX "datasets_rels_stations_id_idx" ON "datasets_rels" USING btree ("stations_id");
  CREATE INDEX "_datasets_v_parent_idx" ON "_datasets_v" USING btree ("parent_id");
  CREATE INDEX "_datasets_v_version_version_expedition_idx" ON "_datasets_v" USING btree ("version_expedition_id");
  CREATE INDEX "_datasets_v_version_version_updated_at_idx" ON "_datasets_v" USING btree ("version_updated_at");
  CREATE INDEX "_datasets_v_version_version_created_at_idx" ON "_datasets_v" USING btree ("version_created_at");
  CREATE INDEX "_datasets_v_version_version__status_idx" ON "_datasets_v" USING btree ("version__status");
  CREATE INDEX "_datasets_v_version_version_filename_idx" ON "_datasets_v" USING btree ("version_filename");
  CREATE INDEX "_datasets_v_created_at_idx" ON "_datasets_v" USING btree ("created_at");
  CREATE INDEX "_datasets_v_updated_at_idx" ON "_datasets_v" USING btree ("updated_at");
  CREATE INDEX "_datasets_v_snapshot_idx" ON "_datasets_v" USING btree ("snapshot");
  CREATE INDEX "_datasets_v_published_locale_idx" ON "_datasets_v" USING btree ("published_locale");
  CREATE INDEX "_datasets_v_latest_idx" ON "_datasets_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_datasets_v_locales_locale_parent_id_unique" ON "_datasets_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_datasets_v_texts_order_parent" ON "_datasets_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_datasets_v_rels_order_idx" ON "_datasets_v_rels" USING btree ("order");
  CREATE INDEX "_datasets_v_rels_parent_idx" ON "_datasets_v_rels" USING btree ("parent_id");
  CREATE INDEX "_datasets_v_rels_path_idx" ON "_datasets_v_rels" USING btree ("path");
  CREATE INDEX "_datasets_v_rels_stations_id_idx" ON "_datasets_v_rels" USING btree ("stations_id");
  CREATE INDEX "publications_expedition_idx" ON "publications" USING btree ("expedition_id");
  CREATE INDEX "publications_updated_at_idx" ON "publications" USING btree ("updated_at");
  CREATE INDEX "publications_created_at_idx" ON "publications" USING btree ("created_at");
  CREATE INDEX "publications__status_idx" ON "publications" USING btree ("_status");
  CREATE UNIQUE INDEX "publications_filename_idx" ON "publications" USING btree ("filename");
  CREATE UNIQUE INDEX "publications_locales_locale_parent_id_unique" ON "publications_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "publications_texts_order_parent" ON "publications_texts" USING btree ("order","parent_id");
  CREATE INDEX "publications_rels_order_idx" ON "publications_rels" USING btree ("order");
  CREATE INDEX "publications_rels_parent_idx" ON "publications_rels" USING btree ("parent_id");
  CREATE INDEX "publications_rels_path_idx" ON "publications_rels" USING btree ("path");
  CREATE INDEX "publications_rels_stations_id_idx" ON "publications_rels" USING btree ("stations_id");
  CREATE INDEX "_publications_v_parent_idx" ON "_publications_v" USING btree ("parent_id");
  CREATE INDEX "_publications_v_version_version_expedition_idx" ON "_publications_v" USING btree ("version_expedition_id");
  CREATE INDEX "_publications_v_version_version_updated_at_idx" ON "_publications_v" USING btree ("version_updated_at");
  CREATE INDEX "_publications_v_version_version_created_at_idx" ON "_publications_v" USING btree ("version_created_at");
  CREATE INDEX "_publications_v_version_version__status_idx" ON "_publications_v" USING btree ("version__status");
  CREATE INDEX "_publications_v_version_version_filename_idx" ON "_publications_v" USING btree ("version_filename");
  CREATE INDEX "_publications_v_created_at_idx" ON "_publications_v" USING btree ("created_at");
  CREATE INDEX "_publications_v_updated_at_idx" ON "_publications_v" USING btree ("updated_at");
  CREATE INDEX "_publications_v_snapshot_idx" ON "_publications_v" USING btree ("snapshot");
  CREATE INDEX "_publications_v_published_locale_idx" ON "_publications_v" USING btree ("published_locale");
  CREATE INDEX "_publications_v_latest_idx" ON "_publications_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_publications_v_locales_locale_parent_id_unique" ON "_publications_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_publications_v_texts_order_parent" ON "_publications_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_publications_v_rels_order_idx" ON "_publications_v_rels" USING btree ("order");
  CREATE INDEX "_publications_v_rels_parent_idx" ON "_publications_v_rels" USING btree ("parent_id");
  CREATE INDEX "_publications_v_rels_path_idx" ON "_publications_v_rels" USING btree ("path");
  CREATE INDEX "_publications_v_rels_stations_id_idx" ON "_publications_v_rels" USING btree ("stations_id");
  CREATE INDEX "media_texts_order_parent" ON "media_texts" USING btree ("order","parent_id");
  CREATE INDEX "media_rels_order_idx" ON "media_rels" USING btree ("order");
  CREATE INDEX "media_rels_parent_idx" ON "media_rels" USING btree ("parent_id");
  CREATE INDEX "media_rels_path_idx" ON "media_rels" USING btree ("path");
  CREATE INDEX "media_rels_stations_id_idx" ON "media_rels" USING btree ("stations_id");
  CREATE INDEX "_media_v_parent_idx" ON "_media_v" USING btree ("parent_id");
  CREATE INDEX "_media_v_version_version_expedition_idx" ON "_media_v" USING btree ("version_expedition_id");
  CREATE INDEX "_media_v_version_version_updated_at_idx" ON "_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_v_version_version_created_at_idx" ON "_media_v" USING btree ("version_created_at");
  CREATE INDEX "_media_v_version_version__status_idx" ON "_media_v" USING btree ("version__status");
  CREATE INDEX "_media_v_version_version_filename_idx" ON "_media_v" USING btree ("version_filename");
  CREATE INDEX "_media_v_version_sizes_thumbnail_version_sizes_thumbnail_idx" ON "_media_v" USING btree ("version_sizes_thumbnail_filename");
  CREATE INDEX "_media_v_version_sizes_large_version_sizes_large_filenam_idx" ON "_media_v" USING btree ("version_sizes_large_filename");
  CREATE INDEX "_media_v_created_at_idx" ON "_media_v" USING btree ("created_at");
  CREATE INDEX "_media_v_updated_at_idx" ON "_media_v" USING btree ("updated_at");
  CREATE INDEX "_media_v_snapshot_idx" ON "_media_v" USING btree ("snapshot");
  CREATE INDEX "_media_v_published_locale_idx" ON "_media_v" USING btree ("published_locale");
  CREATE INDEX "_media_v_latest_idx" ON "_media_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_media_v_locales_locale_parent_id_unique" ON "_media_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_media_v_texts_order_parent" ON "_media_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_media_v_rels_order_idx" ON "_media_v_rels" USING btree ("order");
  CREATE INDEX "_media_v_rels_parent_idx" ON "_media_v_rels" USING btree ("parent_id");
  CREATE INDEX "_media_v_rels_path_idx" ON "_media_v_rels" USING btree ("path");
  CREATE INDEX "_media_v_rels_stations_id_idx" ON "_media_v_rels" USING btree ("stations_id");
  CREATE INDEX "events_expedition_idx" ON "events" USING btree ("expedition_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_media_id_idx" ON "events_rels" USING btree ("media_id");
  CREATE INDEX "events_rels_stations_id_idx" ON "events_rels" USING btree ("stations_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_expedition_idx" ON "_events_v" USING btree ("version_expedition_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_snapshot_idx" ON "_events_v" USING btree ("snapshot");
  CREATE INDEX "_events_v_published_locale_idx" ON "_events_v" USING btree ("published_locale");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_rels_order_idx" ON "_events_v_rels" USING btree ("order");
  CREATE INDEX "_events_v_rels_parent_idx" ON "_events_v_rels" USING btree ("parent_id");
  CREATE INDEX "_events_v_rels_path_idx" ON "_events_v_rels" USING btree ("path");
  CREATE INDEX "_events_v_rels_media_id_idx" ON "_events_v_rels" USING btree ("media_id");
  CREATE INDEX "_events_v_rels_stations_id_idx" ON "_events_v_rels" USING btree ("stations_id");
  CREATE INDEX "outreach_posts_thread_order_idx" ON "outreach_posts_thread" USING btree ("_order");
  CREATE INDEX "outreach_posts_thread_parent_id_idx" ON "outreach_posts_thread" USING btree ("_parent_id");
  CREATE INDEX "outreach_posts_quiz_order_idx" ON "outreach_posts_quiz" USING btree ("_order");
  CREATE INDEX "outreach_posts_quiz_parent_id_idx" ON "outreach_posts_quiz" USING btree ("_parent_id");
  CREATE INDEX "outreach_posts_suggested_media_idx" ON "outreach_posts" USING btree ("suggested_media_id");
  CREATE INDEX "outreach_posts_reviewed_by_idx" ON "outreach_posts" USING btree ("reviewed_by_id");
  CREATE INDEX "outreach_posts_updated_at_idx" ON "outreach_posts" USING btree ("updated_at");
  CREATE INDEX "outreach_posts_created_at_idx" ON "outreach_posts" USING btree ("created_at");
  CREATE INDEX "outreach_posts__status_idx" ON "outreach_posts" USING btree ("_status");
  CREATE INDEX "outreach_posts_texts_order_parent" ON "outreach_posts_texts" USING btree ("order","parent_id");
  CREATE INDEX "outreach_posts_numbers_order_parent_idx" ON "outreach_posts_numbers" USING btree ("order","parent_id");
  CREATE INDEX "outreach_posts_rels_order_idx" ON "outreach_posts_rels" USING btree ("order");
  CREATE INDEX "outreach_posts_rels_parent_idx" ON "outreach_posts_rels" USING btree ("parent_id");
  CREATE INDEX "outreach_posts_rels_path_idx" ON "outreach_posts_rels" USING btree ("path");
  CREATE INDEX "outreach_posts_rels_reports_id_idx" ON "outreach_posts_rels" USING btree ("reports_id");
  CREATE INDEX "outreach_posts_rels_datasets_id_idx" ON "outreach_posts_rels" USING btree ("datasets_id");
  CREATE INDEX "outreach_posts_rels_publications_id_idx" ON "outreach_posts_rels" USING btree ("publications_id");
  CREATE INDEX "outreach_posts_rels_media_id_idx" ON "outreach_posts_rels" USING btree ("media_id");
  CREATE INDEX "outreach_posts_rels_events_id_idx" ON "outreach_posts_rels" USING btree ("events_id");
  CREATE INDEX "outreach_posts_rels_expeditions_id_idx" ON "outreach_posts_rels" USING btree ("expeditions_id");
  CREATE INDEX "outreach_posts_rels_stations_id_idx" ON "outreach_posts_rels" USING btree ("stations_id");
  CREATE INDEX "_outreach_posts_v_version_thread_order_idx" ON "_outreach_posts_v_version_thread" USING btree ("_order");
  CREATE INDEX "_outreach_posts_v_version_thread_parent_id_idx" ON "_outreach_posts_v_version_thread" USING btree ("_parent_id");
  CREATE INDEX "_outreach_posts_v_version_quiz_order_idx" ON "_outreach_posts_v_version_quiz" USING btree ("_order");
  CREATE INDEX "_outreach_posts_v_version_quiz_parent_id_idx" ON "_outreach_posts_v_version_quiz" USING btree ("_parent_id");
  CREATE INDEX "_outreach_posts_v_parent_idx" ON "_outreach_posts_v" USING btree ("parent_id");
  CREATE INDEX "_outreach_posts_v_version_version_suggested_media_idx" ON "_outreach_posts_v" USING btree ("version_suggested_media_id");
  CREATE INDEX "_outreach_posts_v_version_version_reviewed_by_idx" ON "_outreach_posts_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_outreach_posts_v_version_version_updated_at_idx" ON "_outreach_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_outreach_posts_v_version_version_created_at_idx" ON "_outreach_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_outreach_posts_v_version_version__status_idx" ON "_outreach_posts_v" USING btree ("version__status");
  CREATE INDEX "_outreach_posts_v_created_at_idx" ON "_outreach_posts_v" USING btree ("created_at");
  CREATE INDEX "_outreach_posts_v_updated_at_idx" ON "_outreach_posts_v" USING btree ("updated_at");
  CREATE INDEX "_outreach_posts_v_snapshot_idx" ON "_outreach_posts_v" USING btree ("snapshot");
  CREATE INDEX "_outreach_posts_v_published_locale_idx" ON "_outreach_posts_v" USING btree ("published_locale");
  CREATE INDEX "_outreach_posts_v_latest_idx" ON "_outreach_posts_v" USING btree ("latest");
  CREATE INDEX "_outreach_posts_v_texts_order_parent" ON "_outreach_posts_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_outreach_posts_v_numbers_order_parent_idx" ON "_outreach_posts_v_numbers" USING btree ("order","parent_id");
  CREATE INDEX "_outreach_posts_v_rels_order_idx" ON "_outreach_posts_v_rels" USING btree ("order");
  CREATE INDEX "_outreach_posts_v_rels_parent_idx" ON "_outreach_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_outreach_posts_v_rels_path_idx" ON "_outreach_posts_v_rels" USING btree ("path");
  CREATE INDEX "_outreach_posts_v_rels_reports_id_idx" ON "_outreach_posts_v_rels" USING btree ("reports_id");
  CREATE INDEX "_outreach_posts_v_rels_datasets_id_idx" ON "_outreach_posts_v_rels" USING btree ("datasets_id");
  CREATE INDEX "_outreach_posts_v_rels_publications_id_idx" ON "_outreach_posts_v_rels" USING btree ("publications_id");
  CREATE INDEX "_outreach_posts_v_rels_media_id_idx" ON "_outreach_posts_v_rels" USING btree ("media_id");
  CREATE INDEX "_outreach_posts_v_rels_events_id_idx" ON "_outreach_posts_v_rels" USING btree ("events_id");
  CREATE INDEX "_outreach_posts_v_rels_expeditions_id_idx" ON "_outreach_posts_v_rels" USING btree ("expeditions_id");
  CREATE INDEX "_outreach_posts_v_rels_stations_id_idx" ON "_outreach_posts_v_rels" USING btree ("stations_id");
  ALTER TABLE "media" ADD CONSTRAINT "media_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_expeditions_fk" FOREIGN KEY ("expeditions_id") REFERENCES "public"."expeditions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_datasets_fk" FOREIGN KEY ("datasets_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_outreach_posts_fk" FOREIGN KEY ("outreach_posts_id") REFERENCES "public"."outreach_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_expedition_idx" ON "media" USING btree ("expedition_id");
  CREATE INDEX "media__status_idx" ON "media" USING btree ("_status");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "payload_locked_documents_rels_expeditions_id_idx" ON "payload_locked_documents_rels" USING btree ("expeditions_id");
  CREATE INDEX "payload_locked_documents_rels_stations_id_idx" ON "payload_locked_documents_rels" USING btree ("stations_id");
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("reports_id");
  CREATE INDEX "payload_locked_documents_rels_datasets_id_idx" ON "payload_locked_documents_rels" USING btree ("datasets_id");
  CREATE INDEX "payload_locked_documents_rels_publications_id_idx" ON "payload_locked_documents_rels" USING btree ("publications_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_outreach_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("outreach_posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "expeditions_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "expeditions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "expeditions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "expeditions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_expeditions_v_version_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_expeditions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_expeditions_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_expeditions_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stations_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_stations_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_stations_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reports_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reports_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reports_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "datasets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "datasets_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "datasets_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "datasets_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_datasets_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_datasets_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_datasets_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_datasets_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_media_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_media_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_media_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_media_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "outreach_posts_thread" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "outreach_posts_quiz" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "outreach_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "outreach_posts_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "outreach_posts_numbers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "outreach_posts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_outreach_posts_v_version_thread" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_outreach_posts_v_version_quiz" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_outreach_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_outreach_posts_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_outreach_posts_v_numbers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_outreach_posts_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "expeditions_highlights" CASCADE;
  DROP TABLE "expeditions" CASCADE;
  DROP TABLE "expeditions_locales" CASCADE;
  DROP TABLE "expeditions_rels" CASCADE;
  DROP TABLE "_expeditions_v_version_highlights" CASCADE;
  DROP TABLE "_expeditions_v" CASCADE;
  DROP TABLE "_expeditions_v_locales" CASCADE;
  DROP TABLE "_expeditions_v_rels" CASCADE;
  DROP TABLE "stations" CASCADE;
  DROP TABLE "stations_locales" CASCADE;
  DROP TABLE "_stations_v" CASCADE;
  DROP TABLE "_stations_v_locales" CASCADE;
  DROP TABLE "reports" CASCADE;
  DROP TABLE "reports_locales" CASCADE;
  DROP TABLE "reports_texts" CASCADE;
  DROP TABLE "reports_rels" CASCADE;
  DROP TABLE "_reports_v" CASCADE;
  DROP TABLE "_reports_v_locales" CASCADE;
  DROP TABLE "_reports_v_texts" CASCADE;
  DROP TABLE "_reports_v_rels" CASCADE;
  DROP TABLE "datasets" CASCADE;
  DROP TABLE "datasets_locales" CASCADE;
  DROP TABLE "datasets_texts" CASCADE;
  DROP TABLE "datasets_rels" CASCADE;
  DROP TABLE "_datasets_v" CASCADE;
  DROP TABLE "_datasets_v_locales" CASCADE;
  DROP TABLE "_datasets_v_texts" CASCADE;
  DROP TABLE "_datasets_v_rels" CASCADE;
  DROP TABLE "publications" CASCADE;
  DROP TABLE "publications_locales" CASCADE;
  DROP TABLE "publications_texts" CASCADE;
  DROP TABLE "publications_rels" CASCADE;
  DROP TABLE "_publications_v" CASCADE;
  DROP TABLE "_publications_v_locales" CASCADE;
  DROP TABLE "_publications_v_texts" CASCADE;
  DROP TABLE "_publications_v_rels" CASCADE;
  DROP TABLE "media_texts" CASCADE;
  DROP TABLE "media_rels" CASCADE;
  DROP TABLE "_media_v" CASCADE;
  DROP TABLE "_media_v_locales" CASCADE;
  DROP TABLE "_media_v_texts" CASCADE;
  DROP TABLE "_media_v_rels" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_locales" CASCADE;
  DROP TABLE "_events_v_rels" CASCADE;
  DROP TABLE "outreach_posts_thread" CASCADE;
  DROP TABLE "outreach_posts_quiz" CASCADE;
  DROP TABLE "outreach_posts" CASCADE;
  DROP TABLE "outreach_posts_texts" CASCADE;
  DROP TABLE "outreach_posts_numbers" CASCADE;
  DROP TABLE "outreach_posts_rels" CASCADE;
  DROP TABLE "_outreach_posts_v_version_thread" CASCADE;
  DROP TABLE "_outreach_posts_v_version_quiz" CASCADE;
  DROP TABLE "_outreach_posts_v" CASCADE;
  DROP TABLE "_outreach_posts_v_texts" CASCADE;
  DROP TABLE "_outreach_posts_v_numbers" CASCADE;
  DROP TABLE "_outreach_posts_v_rels" CASCADE;
  ALTER TABLE "media" DROP CONSTRAINT "media_expedition_id_expeditions_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_expeditions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reports_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_datasets_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_publications_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_outreach_posts_fk";
  
  DROP INDEX "media_expedition_idx";
  DROP INDEX "media__status_idx";
  DROP INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx";
  DROP INDEX "media_sizes_large_sizes_large_filename_idx";
  DROP INDEX "payload_locked_documents_rels_expeditions_id_idx";
  DROP INDEX "payload_locked_documents_rels_stations_id_idx";
  DROP INDEX "payload_locked_documents_rels_reports_id_idx";
  DROP INDEX "payload_locked_documents_rels_datasets_id_idx";
  DROP INDEX "payload_locked_documents_rels_publications_id_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_outreach_posts_id_idx";
  ALTER TABLE "media_locales" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "users" DROP COLUMN "name";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "media" DROP COLUMN "youtube_url";
  ALTER TABLE "media" DROP COLUMN "region";
  ALTER TABLE "media" DROP COLUMN "expedition_id";
  ALTER TABLE "media" DROP COLUMN "taken_at";
  ALTER TABLE "media" DROP COLUMN "lat";
  ALTER TABLE "media" DROP COLUMN "lng";
  ALTER TABLE "media" DROP COLUMN "source_url";
  ALTER TABLE "media" DROP COLUMN "license";
  ALTER TABLE "media" DROP COLUMN "credit";
  ALTER TABLE "media" DROP COLUMN "processing_state";
  ALTER TABLE "media" DROP COLUMN "processing_error";
  ALTER TABLE "media" DROP COLUMN "ai_generated";
  ALTER TABLE "media" DROP COLUMN "_status";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_url";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_width";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_height";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_large_url";
  ALTER TABLE "media" DROP COLUMN "sizes_large_width";
  ALTER TABLE "media" DROP COLUMN "sizes_large_height";
  ALTER TABLE "media" DROP COLUMN "sizes_large_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_large_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_large_filename";
  ALTER TABLE "media_locales" DROP COLUMN "caption";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "expeditions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reports_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "datasets_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "publications_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "outreach_posts_id";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_expeditions_region";
  DROP TYPE "public"."enum_expeditions_status";
  DROP TYPE "public"."enum__expeditions_v_version_region";
  DROP TYPE "public"."enum__expeditions_v_version_status";
  DROP TYPE "public"."enum__expeditions_v_published_locale";
  DROP TYPE "public"."enum_stations_region";
  DROP TYPE "public"."enum_stations_operational_status";
  DROP TYPE "public"."enum_stations_status";
  DROP TYPE "public"."enum__stations_v_version_region";
  DROP TYPE "public"."enum__stations_v_version_operational_status";
  DROP TYPE "public"."enum__stations_v_version_status";
  DROP TYPE "public"."enum__stations_v_published_locale";
  DROP TYPE "public"."enum_reports_report_type";
  DROP TYPE "public"."enum_reports_region";
  DROP TYPE "public"."enum_reports_processing_state";
  DROP TYPE "public"."enum_reports_status";
  DROP TYPE "public"."enum__reports_v_version_report_type";
  DROP TYPE "public"."enum__reports_v_version_region";
  DROP TYPE "public"."enum__reports_v_version_processing_state";
  DROP TYPE "public"."enum__reports_v_version_status";
  DROP TYPE "public"."enum__reports_v_published_locale";
  DROP TYPE "public"."enum_datasets_region";
  DROP TYPE "public"."enum_datasets_processing_state";
  DROP TYPE "public"."enum_datasets_status";
  DROP TYPE "public"."enum__datasets_v_version_region";
  DROP TYPE "public"."enum__datasets_v_version_processing_state";
  DROP TYPE "public"."enum__datasets_v_version_status";
  DROP TYPE "public"."enum__datasets_v_published_locale";
  DROP TYPE "public"."enum_publications_region";
  DROP TYPE "public"."enum_publications_processing_state";
  DROP TYPE "public"."enum_publications_status";
  DROP TYPE "public"."enum__publications_v_version_region";
  DROP TYPE "public"."enum__publications_v_version_processing_state";
  DROP TYPE "public"."enum__publications_v_version_status";
  DROP TYPE "public"."enum__publications_v_published_locale";
  DROP TYPE "public"."enum_media_region";
  DROP TYPE "public"."enum_media_processing_state";
  DROP TYPE "public"."enum_media_status";
  DROP TYPE "public"."enum__media_v_version_region";
  DROP TYPE "public"."enum__media_v_version_processing_state";
  DROP TYPE "public"."enum__media_v_version_status";
  DROP TYPE "public"."enum__media_v_published_locale";
  DROP TYPE "public"."enum_events_event_type";
  DROP TYPE "public"."enum_events_region";
  DROP TYPE "public"."enum_events_processing_state";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_event_type";
  DROP TYPE "public"."enum__events_v_version_region";
  DROP TYPE "public"."enum__events_v_version_processing_state";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum__events_v_published_locale";
  DROP TYPE "public"."enum_outreach_posts_platform";
  DROP TYPE "public"."enum_outreach_posts_language";
  DROP TYPE "public"."enum_outreach_posts_review_status";
  DROP TYPE "public"."enum_outreach_posts_status";
  DROP TYPE "public"."enum__outreach_posts_v_version_platform";
  DROP TYPE "public"."enum__outreach_posts_v_version_language";
  DROP TYPE "public"."enum__outreach_posts_v_version_review_status";
  DROP TYPE "public"."enum__outreach_posts_v_version_status";
  DROP TYPE "public"."enum__outreach_posts_v_published_locale";`)
}
