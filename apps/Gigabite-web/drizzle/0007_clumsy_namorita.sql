CREATE TABLE "combo_offer_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"combo_offer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "combo_offer_items_quantity_positive" CHECK ("combo_offer_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "combo_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_percent" integer NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "combo_offers_discount_percent_range" CHECK ("combo_offers"."discount_percent" between 1 and 90)
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_offer_id" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_group_key" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_name" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_discount_percent" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_original_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_final_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "combo_offer_items" ADD CONSTRAINT "combo_offer_items_combo_offer_id_combo_offers_id_fk" FOREIGN KEY ("combo_offer_id") REFERENCES "public"."combo_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_offer_items" ADD CONSTRAINT "combo_offer_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "combo_offer_items_combo_offer_id_idx" ON "combo_offer_items" USING btree ("combo_offer_id");--> statement-breakpoint
CREATE INDEX "combo_offer_items_product_id_idx" ON "combo_offer_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "combo_offers_is_active_idx" ON "combo_offers" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_combo_offer_id_combo_offers_id_fk" FOREIGN KEY ("combo_offer_id") REFERENCES "public"."combo_offers"("id") ON DELETE set null ON UPDATE no action;