CREATE TABLE "tentativas_pin" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"erros" integer DEFAULT 0 NOT NULL,
	"ultimo_erro" bigint DEFAULT 0 NOT NULL
);
