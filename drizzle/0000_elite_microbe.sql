CREATE TABLE "cardapio_dia" (
	"data" date PRIMARY KEY NOT NULL,
	"prato_dia" text,
	"prato_dia_desc" text,
	"veg" text,
	"veg_desc" text
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"telefone" text,
	"endereco" text NOT NULL,
	"bairro" text,
	"leva" smallint DEFAULT 1 NOT NULL,
	"ordem_rota" integer DEFAULT 0 NOT NULL,
	"plano" text DEFAULT 'AVULSO' NOT NULL,
	"marmitao_padrao" boolean DEFAULT false NOT NULL,
	"anotacao_fixa" text,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"data" date NOT NULL,
	"opcao" text NOT NULL,
	"quantidade" smallint DEFAULT 1 NOT NULL,
	"marmitao" boolean DEFAULT false NOT NULL,
	"anotacao" text,
	"entregue_em" timestamp with time zone,
	CONSTRAINT "pedidos_cliente_data" UNIQUE("cliente_id","data")
);
--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;