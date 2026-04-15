--
-- PostgreSQL database dump
--

\restrict 3TX5rEQXNEul8aMc6fCWP96lbfkMLe2kg8cBBeihdsfkbZvy9Wh7Aj84hdzHuWy

-- Dumped from database version 17.9 (Homebrew)
-- Dumped by pg_dump version 17.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Currency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Currency" AS ENUM (
    'ARS',
    'USD'
);


--
-- Name: InvestmentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvestmentType" AS ENUM (
    'STOCK',
    'CRYPTO'
);


--
-- Name: SessionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SessionStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'SHOT',
    'DELIVERED',
    'PAID',
    'COMPLETED'
);


--
-- Name: SessionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SessionType" AS ENUM (
    'SPORT',
    'EVENT',
    'OTHER'
);


--
-- Name: TransactionSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionSource" AS ENUM (
    'PERSONAL',
    'PHOTOGRAPHY'
);


--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionType" AS ENUM (
    'EXPENSE',
    'INCOME',
    'STOCK_PURCHASE',
    'CRYPTO_PURCHASE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Budget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Budget" (
    id text NOT NULL,
    "userId" text NOT NULL,
    category text NOT NULL,
    "monthlyLimit" double precision NOT NULL,
    currency public."Currency" DEFAULT 'ARS'::public."Currency" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    name text NOT NULL,
    instagram text,
    phone text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


--
-- Name: ForeignAccount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ForeignAccount" (
    id text NOT NULL,
    name text NOT NULL,
    currency public."Currency" NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


--
-- Name: Investment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Investment" (
    id text NOT NULL,
    ticker text NOT NULL,
    name text,
    type public."InvestmentType" NOT NULL,
    quantity double precision NOT NULL,
    "avgBuyPrice" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


--
-- Name: RecurringExpense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RecurringExpense" (
    id text NOT NULL,
    "userId" text NOT NULL,
    description text NOT NULL,
    amount double precision NOT NULL,
    currency public."Currency" DEFAULT 'ARS'::public."Currency" NOT NULL,
    category text NOT NULL,
    source public."TransactionSource" DEFAULT 'PERSONAL'::public."TransactionSource" NOT NULL,
    "dayOfMonth" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastApplied" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "foreignAccountId" text,
    "walletId" text,
    "transactionType" public."TransactionType" DEFAULT 'EXPENSE'::public."TransactionType" NOT NULL
);


--
-- Name: SavingsGoal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavingsGoal" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "targetAmount" double precision NOT NULL,
    currency public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    notes text,
    "targetDate" timestamp(3) without time zone,
    "isAchieved" boolean DEFAULT false NOT NULL,
    "walletId" text,
    "foreignAccountId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    type public."SessionType" NOT NULL,
    "eventName" text,
    date timestamp(3) without time zone NOT NULL,
    "durationMinutes" integer,
    price double precision NOT NULL,
    currency public."Currency" NOT NULL,
    "photosDelivered" integer,
    status public."SessionStatus" DEFAULT 'PENDING'::public."SessionStatus" NOT NULL,
    "googleCalendarId" text,
    "driveUrl" text,
    "instagramThreadId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    type public."TransactionType" NOT NULL,
    amount double precision NOT NULL,
    currency public."Currency" NOT NULL,
    category text NOT NULL,
    description text,
    source public."TransactionSource" NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "sessionId" text,
    "userId" text NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    "displayName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Wallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallet" (
    id text NOT NULL,
    name text NOT NULL,
    currency public."Currency" NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


--
-- Name: WealthSnapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WealthSnapshot" (
    id text NOT NULL,
    "userId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "walletsARS" double precision NOT NULL,
    "foreignUSD" double precision NOT NULL,
    "portfolioUSD" double precision NOT NULL,
    "totalARS" double precision NOT NULL,
    "totalUSD" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Budget; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Budget" (id, "userId", category, "monthlyLimit", currency, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Client" (id, name, instagram, phone, notes, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: ForeignAccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ForeignAccount" (id, name, currency, balance, "createdAt", "updatedAt", "userId") FROM stdin;
cmnyluc1w0000luy7yddxw4z2	Payoneer	USD	3039.27	2026-04-14 12:35:41.06	2026-04-14 12:35:41.06	user_tomas
cmnylum2m0001luy7upfos269	First Security Bank	USD	6.52	2026-04-14 12:35:54.046	2026-04-14 12:35:54.046	user_tomas
\.


--
-- Data for Name: Investment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Investment" (id, ticker, name, type, quantity, "avgBuyPrice", "createdAt", "updatedAt", "userId") FROM stdin;
cmnqt62xg0003h3y7ubnis3i4	KO	Coca-Cola	STOCK	3.97732	75.39	2026-04-09 01:38:37.012	2026-04-09 01:38:37.012	user_tomas
cmnqtfp0e0005h3y70cxaq5g9	ETH-USD	Ethereum	STOCK	0.1975	3027.9559	2026-04-09 01:46:05.534	2026-04-09 01:46:05.534	user_tomas
cmnqth34c0006h3y70mhz72el	BTC-USD	Bitcoin	CRYPTO	0.00546	91522.79	2026-04-09 01:47:10.476	2026-04-09 01:49:22.912	user_tomas
cmnqtkv360007h3y75npmnfz6	VOO	S&P 500	STOCK	1.99725	626.15	2026-04-09 01:50:06.69	2026-04-09 01:50:06.69	user_tomas
cmnxtf4o00003xay77zv11oqv	AAPL	Apple Inc.	STOCK	3	181.5	2026-04-13 23:20:02.4	2026-04-13 23:20:02.4	user_demo
cmnxtf4o00004xay7n7hxc8e6	NVDA	NVIDIA Corp.	STOCK	2	492	2026-04-13 23:20:02.4	2026-04-13 23:20:02.4	user_demo
cmnxtf4o00005xay7f1hfqfog	AMZN	Amazon.com Inc.	STOCK	1	178	2026-04-13 23:20:02.4	2026-04-13 23:20:02.4	user_demo
cmnxtf4o00006xay7lxh7isgk	BTC	Bitcoin	CRYPTO	0.018	41500	2026-04-13 23:20:02.4	2026-04-13 23:20:02.4	user_demo
cmnxtf4o00007xay76xzelk7b	ETH	Ethereum	CRYPTO	0.25	2200	2026-04-13 23:20:02.4	2026-04-13 23:20:02.4	user_demo
\.


--
-- Data for Name: RecurringExpense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RecurringExpense" (id, "userId", description, amount, currency, category, source, "dayOfMonth", "isActive", "lastApplied", "createdAt", "updatedAt", "foreignAccountId", "walletId", "transactionType") FROM stdin;
cmnyx75ds0004szy779a10jg6	user_tomas	Apple 50GB	1810	ARS	Suscripciones	PERSONAL	6	t	2026-04-14 17:53:34.846	2026-04-14 17:53:34.72	2026-04-14 17:53:34.909	\N	cmnqsuzos0000h3y7e27o2em1	EXPENSE
cmnyxa5hn0006szy7xbqn75hu	user_tomas	Adobe	13019.6	ARS	Suscripciones	PERSONAL	14	t	2026-04-14 17:55:54.938	2026-04-14 17:55:54.827	2026-04-14 17:55:54.977	\N	cmnqsuzos0000h3y7e27o2em1	EXPENSE
cmnyxbfuz0008szy70x69xkac	user_tomas	Calude Code	20	USD	Suscripciones	PERSONAL	28	t	\N	2026-04-14 17:56:54.923	2026-04-14 17:56:54.923	cmnyluc1w0000luy7yddxw4z2	\N	EXPENSE
\.


--
-- Data for Name: SavingsGoal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SavingsGoal" (id, "userId", name, "targetAmount", currency, notes, "targetDate", "isAchieved", "walletId", "foreignAccountId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "clientId", type, "eventName", date, "durationMinutes", price, currency, "photosDelivered", status, "googleCalendarId", "driveUrl", "instagramThreadId", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, type, amount, currency, category, description, source, date, "createdAt", "updatedAt", "sessionId", "userId") FROM stdin;
cmnym875b0002luy7jn3prcfe	INCOME	318283	ARS	Otro	\N	PERSONAL	2025-11-20 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0003luy7pxpjcu1r	INCOME	90000	ARS	Sueldo	Fotos Domingo 16-11 CUBB	PERSONAL	2025-11-20 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0004luy718cm6eqy	EXPENSE	47000	ARS	Salida	Finde en Bahia	PERSONAL	2025-11-23 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnti3zub0000igy73b2fex62	EXPENSE	8000	ARS	Entretenimiento	Entrada partido de basquet Independiente	PERSONAL	2026-04-10 22:52:22.44	2026-04-10 22:52:22.451	2026-04-10 22:52:22.451	\N	user_tomas
cmnx6q34x0000x0y70ndpcm1s	EXPENSE	9000	ARS	Otro	Regalo de Flor	PERSONAL	2026-04-13 12:44:42.441	2026-04-13 12:44:42.465	2026-04-13 12:44:42.465	\N	user_tomas
cmnx6r81z0001x0y7zgscs7pf	EXPENSE	8500	ARS	Educación	Libro 'El arte de la Sabiduria'	PERSONAL	2026-04-13 12:45:35.49	2026-04-13 12:45:35.495	2026-04-13 12:45:35.495	\N	user_tomas
cmnx6seb90002x0y7wm9fadh1	EXPENSE	2500	ARS	Alimentación	Bizcochos	PERSONAL	2026-04-13 12:46:30.259	2026-04-13 12:46:30.261	2026-04-13 12:46:30.261	\N	user_tomas
cmnxravjr0000osy7y27t2jbr	INCOME	50000	ARS	Fotografía	Pago por fotos a Farsa Fem	PERSONAL	2026-04-13 22:20:44.706	2026-04-13 22:20:44.727	2026-04-13 22:31:12.228	\N	user_tomas
cmnxtf4of0008xay7qzgzo4mt	INCOME	320000	ARS	Sueldo	Sueldo enero	PERSONAL	2026-01-02 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of0009xay7o6oh7t18	EXPENSE	95000	ARS	Servicios	Alquiler enero	PERSONAL	2026-01-03 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000axay7qwtsia40	EXPENSE	13400	ARS	Alimentación	Supermercado Disco	PERSONAL	2026-01-07 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000bxay7i37x9apf	EXPENSE	3200	ARS	Transporte	SUBE + Uber	PERSONAL	2026-01-10 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000cxay7tme422wr	EXPENSE	9800	ARS	Alimentación	Verdulería + carnicería	PERSONAL	2026-01-14 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000dxay72hpwmoqu	EXPENSE	22	USD	Suscripciones	Netflix + Spotify	PERSONAL	2026-01-15 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000exay7hn3kcsla	INCOME	120	USD	Freelance	Proyecto landing page	PERSONAL	2026-01-18 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000fxay7cjhfpur7	EXPENSE	16800	ARS	Entretenimiento	Salida + restaurant	PERSONAL	2026-01-20 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000gxay7vm1wv1f5	EXPENSE	4500	ARS	Salud	Farmacia	PERSONAL	2026-01-24 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000hxay7s3pqxeb7	EXPENSE	11200	ARS	Servicios	Internet + luz	PERSONAL	2026-01-28 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000ixay7bnz2iwgc	INCOME	320000	ARS	Sueldo	Sueldo febrero	PERSONAL	2026-02-03 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000jxay7n28al6vg	EXPENSE	95000	ARS	Servicios	Alquiler febrero	PERSONAL	2026-02-04 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000kxay7kcgfao1g	EXPENSE	11800	ARS	Alimentación	Supermercado Carrefour	PERSONAL	2026-02-08 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000lxay7qj62rnre	EXPENSE	22500	ARS	Ropa	Zapatillas + remeras	PERSONAL	2026-02-11 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000mxay7x17qzymk	EXPENSE	22	USD	Suscripciones	Netflix + Spotify	PERSONAL	2026-02-15 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000nxay77ihxw728	INCOME	200	USD	Freelance	Diseño web cliente	PERSONAL	2026-02-17 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000oxay7qwqdw9cu	EXPENSE	7600	ARS	Entretenimiento	Cine + helados	PERSONAL	2026-02-22 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000pxay7njbb725m	EXPENSE	14300	ARS	Servicios	Internet + luz + gas	PERSONAL	2026-02-25 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000qxay7dhi8ogtg	EXPENSE	8900	ARS	Alimentación	Mercado semanal	PERSONAL	2026-02-27 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000rxay7srm8c9mm	INCOME	355000	ARS	Sueldo	Sueldo marzo (aumento)	PERSONAL	2026-03-03 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000sxay7mn5928lj	EXPENSE	95000	ARS	Servicios	Alquiler marzo	PERSONAL	2026-03-04 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000txay7wuxicz7x	EXPENSE	14200	ARS	Alimentación	Supermercado Día	PERSONAL	2026-03-07 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000uxay7k6byclgc	EXPENSE	35000	ARS	Educación	Curso de diseño UX	PERSONAL	2026-03-10 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000vxay7g7dv5o6f	EXPENSE	22	USD	Suscripciones	Netflix + Spotify	PERSONAL	2026-03-15 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000wxay70faub6ul	EXPENSE	4100	ARS	Transporte	Nafta + peajes	PERSONAL	2026-03-17 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000xxay7r1ugb0eh	INCOME	150	USD	Freelance	Mantenimiento web	PERSONAL	2026-03-19 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000yxay7nyyp0e5d	EXPENSE	9800	ARS	Alimentación	Feria + verdulería	PERSONAL	2026-03-22 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of000zxay7di2sood8	EXPENSE	13800	ARS	Servicios	Internet + luz	PERSONAL	2026-03-26 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of0010xay7t17xqo23	EXPENSE	18400	ARS	Entretenimiento	Viaje de fin de semana	PERSONAL	2026-03-29 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of0011xay78yygzvjq	INCOME	355000	ARS	Sueldo	Sueldo abril	PERSONAL	2026-04-01 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of0012xay71brpobho	EXPENSE	95000	ARS	Servicios	Alquiler abril	PERSONAL	2026-04-02 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of0013xay7vkc8ybfg	EXPENSE	10500	ARS	Alimentación	Supermercado	PERSONAL	2026-04-06 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnxtf4of0014xay76ckl0czm	EXPENSE	22	USD	Suscripciones	Netflix + Spotify	PERSONAL	2026-04-10 03:00:00	2026-04-13 23:20:02.415	2026-04-13 23:20:02.415	\N	user_demo
cmnym875b0005luy7707060gs	EXPENSE	125000	ARS	Salud	Tratamiento Capilar	PERSONAL	2025-11-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0006luy7q1j2cyy6	EXPENSE	14400	ARS	Compras	Vino	PERSONAL	2025-11-30 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0007luy7thnrntrx	EXPENSE	3500	ARS	Hogar	Sticker Garage	PERSONAL	2025-11-30 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0008luy7iy082xcq	EXPENSE	1800	ARS	Hogar	Cepillo de dientes	PERSONAL	2025-12-05 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0009luy77xl2va1v	EXPENSE	2500	ARS	Deporte	Turnito	PERSONAL	2025-12-05 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000aluy7frxw8aux	EXPENSE	1838	ARS	Suscripciones	Apple 50GB	PERSONAL	2025-12-09 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000bluy7483e5pb9	EXPENSE	1280	ARS	Suscripciones	Youtube, ultimo mes	PERSONAL	2025-12-09 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000cluy79bkioz6u	EXPENSE	6000	ARS	Café	Hielos	PERSONAL	2025-12-09 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000dluy7o1ernl78	INCOME	60000	ARS	Fotografía	Fotos Universitario	PERSONAL	2025-12-07 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000eluy79vou8xpg	INCOME	90000	ARS	Fotografía	LigaCubb	PERSONAL	2025-12-09 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000fluy7zipzs2mh	INCOME	36000	ARS	Fotografía	Mitad Fotos Pacifico	PERSONAL	2025-12-09 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000gluy7vhhpsm8i	EXPENSE	8900	ARS	Compras	Birras Columbus	PERSONAL	2025-12-12 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000hluy7e1utsgwx	EXPENSE	37000	ARS	Salud	Pastillas y Shampoo Pelo	PERSONAL	2025-12-10 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000iluy7bh9n8sj4	EXPENSE	8800	ARS	Suscripciones	ADOBE	PERSONAL	2025-12-14 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000jluy7g8oqos0f	INCOME	12000	ARS	Fotografía	Pacífico	PERSONAL	2025-12-18 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000kluy7tu6mmgbp	EXPENSE	7000	ARS	Compras	Pizzas Mateo	PERSONAL	2025-12-18 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000lluy7z2pc3jdj	EXPENSE	15000	ARS	Compras	Fernet Tuca	PERSONAL	2025-12-18 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000mluy7m2ukn18i	EXPENSE	11000	ARS	Compras	Yerba	PERSONAL	2025-12-18 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000nluy74dk8jqeu	EXPENSE	6100	ARS	Compras	Birras Col	PERSONAL	2025-12-19 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000oluy7xulhkppb	EXPENSE	12000	ARS	Compras	Birra Columbus	PERSONAL	2025-12-23 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000pluy71tia00vv	EXPENSE	24900	ARS	Compras	Asado Gabba	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000qluy79lxb7aya	EXPENSE	8600	ARS	Familia	Comida Sasuke	PERSONAL	2025-12-23 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000rluy7wqqdv2jc	EXPENSE	30000	ARS	Compras	Asado Ateneo	PERSONAL	2025-12-21 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000sluy70mnuy7hl	EXPENSE	12000	ARS	Entretenimiento	Entradas Abril de dios	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000tluy7iy4ukgfs	EXPENSE	17000	ARS	Compras	Postre Zama Mama	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000uluy746xzn85z	INCOME	50000	ARS	Regalo	Regalo Tia	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000vluy7p8t272wg	INCOME	5463	ARS	Otro	\N	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000wluy7jry0ej5e	EXPENSE	5463	ARS	Otro	\N	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000xluy7pq410ei4	INCOME	2348	USD	Otro	\N	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000yluy74xjdebvp	INCOME	1511	USD	Otro	\N	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b000zluy78uyeu3rz	EXPENSE	3000	ARS	Salud	Turno Basquet	PERSONAL	2025-12-26 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0010luy7lwp1laj2	EXPENSE	14000	ARS	Salud	Peluquería	PERSONAL	2025-12-27 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0011luy7aleuuis2	EXPENSE	2500	ARS	Regalos	Regalo Valen	PERSONAL	2025-12-27 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0012luy7cbu2q8t6	EXPENSE	1840	ARS	Suscripciones	Apple 50GB	PERSONAL	2026-01-06 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0013luy7kheu6ym6	EXPENSE	2500	ARS	Regalos	Regalo Valen	PERSONAL	2025-12-27 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0014luy77df6114s	EXPENSE	4000	ARS	Salud	Turno Repo	PERSONAL	2025-12-28 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0015luy7iw92h6wj	EXPENSE	9000	ARS	Compras	Pizzas Gabba	PERSONAL	2025-12-28 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875b0016luy7f7oqbo3i	EXPENSE	40000	ARS	Compras	Comida Carrito	PERSONAL	2025-12-30 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0017luy7srnmllhm	EXPENSE	6100	ARS	Compras	Vinito Walas	PERSONAL	2026-01-06 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0018luy7ymxxsztl	EXPENSE	9500	ARS	Transporte	Cambio Pico Cubierta	PERSONAL	2026-01-07 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0019luy7bvm8hqb2	EXPENSE	6000	ARS	Regalos	Regalo Walas	PERSONAL	2026-01-08 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001aluy7kjj9nnye	EXPENSE	56900	ARS	Entretenimiento	Jodita Año nuevo	PERSONAL	2025-12-31 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001bluy7hgvq88vu	EXPENSE	3480	ARS	Compras	Birra	PERSONAL	2026-01-09 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001cluy7xxys5bj9	EXPENSE	5200	ARS	Compras	Facturas	PERSONAL	2026-01-10 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001dluy7xwh36ptv	EXPENSE	23000	ARS	Compras	Fernet Monte	PERSONAL	2026-01-10 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001eluy72tt0rfkj	EXPENSE	43000	ARS	Entretenimiento	Bronx	PERSONAL	2026-01-10 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001fluy7th7awkl3	INCOME	214106	ARS	Sueldo	-142usd Alpha	PERSONAL	2026-01-13 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001gluy7pzldez8e	EXPENSE	15000	ARS	Compras	Asado Monte	PERSONAL	2026-01-13 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001hluy7cncj9gnk	EXPENSE	6700	ARS	Compras	Facturas La Perla	PERSONAL	2026-01-15 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001iluy7rwm2iz79	EXPENSE	8580	ARS	Café	Cafe Sorti	PERSONAL	2026-01-16 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001jluy7bhck1u7j	EXPENSE	41000	ARS	Compras	Burgas Niomo	PERSONAL	2026-01-16 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001kluy780868ag7	EXPENSE	14500	ARS	Compras	Cerraja	PERSONAL	2026-01-12 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001lluy72bdl4cqv	EXPENSE	4500	ARS	Compras	Empanadas Mateo	PERSONAL	2026-01-09 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001mluy7wt7thu4z	EXPENSE	8800	ARS	Suscripciones	ADOBE	PERSONAL	2026-01-14 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001nluy7papnm4lu	EXPENSE	32500	ARS	Entretenimiento	Ogham	PERSONAL	2026-01-18 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001oluy7dk3ma6oo	EXPENSE	25500	ARS	Compras	Asado Buda	PERSONAL	2026-01-21 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001pluy7sm7h9vkv	EXPENSE	14000	ARS	Regalos	Planta Mateo	PERSONAL	2026-01-20 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001qluy76c8prn3g	EXPENSE	27500	ARS	Compras	Borneo	PERSONAL	2026-01-22 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001rluy7o7xj9bu8	EXPENSE	9000	ARS	Suscripciones	MELI+	PERSONAL	2026-01-23 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001sluy71e93wvpn	EXPENSE	1840	ARS	Suscripciones	Apple 50GB	PERSONAL	2026-02-06 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001tluy7l3t9n3cq	EXPENSE	9000	ARS	Entretenimiento	Birrita Edu Pili	PERSONAL	2026-01-29 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001uluy7r3ou5als	EXPENSE	14000	ARS	Salud	Peluquería	PERSONAL	2026-01-30 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001vluy70uhz0o4u	INCOME	108232	ARS	Cambio de Payoneer	Payoneer	PERSONAL	2026-01-30 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001wluy7u9d1mkrb	EXPENSE	32000	ARS	Entretenimiento	Birra Cerrajería	PERSONAL	2026-01-31 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001xluy7bnr3b1s2	EXPENSE	83142	ARS	Compras	Asado  + Bronx	PERSONAL	2026-02-01 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001yluy737rlxbj8	INCOME	73339	ARS	Cambio de Payoneer	Cambio Payoneer	PERSONAL	2026-02-08 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c001zluy7nywg796d	EXPENSE	30000	ARS	Compras	Cena Bodegon	PERSONAL	2026-02-05 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0020luy73q5k7skd	INCOME	220000	ARS	Regalo	Cumpleaños	PERSONAL	2026-02-10 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0021luy7w02lmn6w	EXPENSE	40000	ARS	Compras	Cena Torre Pehuen	PERSONAL	2026-02-13 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0022luy76so5yb21	EXPENSE	8800	ARS	Suscripciones	ADOBE	PERSONAL	2026-02-14 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0023luy70b3zb1tq	EXPENSE	7280	ARS	Otro	Publicidad FB	PERSONAL	2026-02-14 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0024luy7ejbse8fb	EXPENSE	39000	ARS	Café	Comida Pehuen	PERSONAL	2026-02-16 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0025luy7400w8uv2	EXPENSE	6000	ARS	Compras	Birra Pancho	PERSONAL	2026-02-15 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0026luy7ko2vzu9n	EXPENSE	18400	ARS	Compras	Panchitos	PERSONAL	2026-02-20 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0027luy7v6rbvyna	EXPENSE	20	USD	Suscripciones	\N	PERSONAL	2026-02-22 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0028luy703yu0z6i	EXPENSE	1840	ARS	Suscripciones	Apple 50GB	PERSONAL	2026-03-06 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c0029luy754dwgi0d	EXPENSE	11500	ARS	Suscripciones	ADOBE	PERSONAL	2026-03-14 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002aluy7lezd14wv	EXPENSE	4200	ARS	Compras	Coca	PERSONAL	2026-02-20 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002bluy7db7rg9di	INCOME	35000	ARS	Fotografía	Fotos Deto FC	PERSONAL	2026-02-23 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002cluy7o5wav9da	INCOME	279000	ARS	Regalo	Regalo Cumple	PERSONAL	2026-02-24 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002dluy7ukywaro4	EXPENSE	92000	ARS	Salida	Entrada Calamaro	PERSONAL	2026-02-24 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002eluy7vbxdcin9	EXPENSE	11500	ARS	Compras	Columbus	PERSONAL	2026-02-28 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002fluy7r7ewlrd9	INCOME	75000	ARS	Fotografía	Panchas Fotos	PERSONAL	2026-02-28 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002gluy7lupz1gsc	EXPENSE	13350	ARS	Compras	Pollos al Disco	PERSONAL	2026-03-01 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002hluy77ydeli4c	INCOME	10000	ARS	Sueldo	Pipe escabio	PERSONAL	2026-03-01 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002iluy79chtnut3	INCOME	50000	ARS	Fotografía	Fotos Las Mulas	PERSONAL	2026-03-04 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002jluy737lqetq4	EXPENSE	27000	ARS	Compras	Asado Repo	PERSONAL	2026-03-08 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002kluy7w181dvhf	EXPENSE	3000	ARS	Compras	Gaseosa Uni	PERSONAL	2026-03-15 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002lluy7oh4ade02	EXPENSE	6000	ARS	Compras	Ñoquis Gasti	PERSONAL	2026-03-12 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002mluy75500jo7c	INCOME	400000	ARS	Fotografía	LigaCubb	PERSONAL	2026-03-13 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002nluy7lhwu9dhi	EXPENSE	32000	ARS	Compras	Columbus + Caponi	PERSONAL	2026-03-13 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002oluy7iwvkn16j	INCOME	65000	ARS	Fotografía	Fotos Puerto	PERSONAL	2026-03-14 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002pluy75ekc4v9k	EXPENSE	11900	ARS	Compras	Birras Columbus	PERSONAL	2026-03-22 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002qluy78ultqig1	EXPENSE	6000	ARS	Otro	Partidos Basquet	PERSONAL	2026-03-22 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002rluy7h9c41pni	EXPENSE	15000	ARS	Deporte	Peluquería	PERSONAL	2026-03-16 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002sluy77r5s3s5d	EXPENSE	11500	ARS	Compras	Yerba	PERSONAL	2026-03-16 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnym875c002tluy7rzqszh7y	EXPENSE	1840	ARS	Suscripciones	Apple 50GB	PERSONAL	2026-04-06 00:00:00	2026-04-14 12:46:27.887	2026-04-14 12:46:27.887	\N	user_tomas
cmnymxu0x0001szy7san88u8r	EXPENSE	1810	ARS	Suscripciones	Apple 50GB	PERSONAL	2026-04-06 03:00:00	2026-04-14 13:06:23.938	2026-04-14 13:06:23.938	\N	user_tomas
cmnymz3z10003szy7ro00zsqv	EXPENSE	13019.6	ARS	Suscripciones	Adobe	PERSONAL	2026-04-14 03:00:00	2026-04-14 13:07:23.485	2026-04-14 13:07:23.485	\N	user_tomas
cmnyx75i50005szy7p1teuzei	EXPENSE	1810	ARS	Suscripciones	Apple 50GB	PERSONAL	2026-04-06 03:00:00	2026-04-14 17:53:34.878	2026-04-14 17:53:34.878	\N	user_tomas
cmnyxa5lc0007szy7uwxzuvl3	EXPENSE	13019.6	ARS	Suscripciones	Adobe	PERSONAL	2026-04-14 03:00:00	2026-04-14 17:55:54.96	2026-04-14 17:55:54.96	\N	user_tomas
cmnz8qftq000dszy7xkid41zm	EXPENSE	8794.28	ARS	Suscripciones	Adobe	PERSONAL	2026-04-14 00:00:00	2026-04-14 23:16:30.494	2026-04-14 23:16:30.494	\N	user_tomas
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, username, "passwordHash", "displayName", "createdAt") FROM stdin;
user_tomas	tomas	$2b$12$Q8QsvVU8B3qVvO2isFH1lOOkluABUhXh1c7yB6r/qFuh1L5b6BNce	Tomas	2026-04-13 19:43:00.634
user_demo	demo	$2b$12$abJBijCsKmKJU3LxDeYnlOQdG2ZCpZPq./51fxyb.22OILnT0GTjy	Demo	2026-04-13 22:45:31.537
cmnz9rxh8000eszy73t63q70w	demo2	$2b$12$iUX6wJxhBsnf88NjkWqbS.W4yngeClfCEIv2rznbOMJWVdso83Dvi	Demo 2	2026-04-14 23:45:39.644
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Wallet" (id, name, currency, balance, "createdAt", "updatedAt", "userId") FROM stdin;
cmnxtf4nt0000xay7679ol95x	Mercado Pago	ARS	61200	2026-04-13 23:20:02.394	2026-04-13 23:20:02.394	user_demo
cmnxtf4nu0001xay7imhelzn6	Brubank	ARS	24500	2026-04-13 23:20:02.394	2026-04-13 23:20:02.394	user_demo
cmnxtf4nu0002xay72cgo8p5u	Wise	USD	420	2026-04-13 23:20:02.394	2026-04-13 23:20:02.394	user_demo
cmnqsuzos0000h3y7e27o2em1	Mercado Pago	ARS	613074.12	2026-04-09 01:29:59.596	2026-04-14 23:16:30.498	user_tomas
\.


--
-- Data for Name: WealthSnapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WealthSnapshot" (id, "userId", date, "walletsARS", "foreignUSD", "portfolioUSD", "totalARS", "totalUSD", "createdAt") FROM stdin;
cmnz1f3120009szy7uopmu9q0	user_demo	2026-04-01 03:00:00	85700	0	1422.1408500000002	85700	1422.1408500000002	2026-04-14 19:51:43.383
cmnz8ppnz000bszy7zpszjt3r	user_tomas	2026-04-01 03:00:00	621868.4	3045.79	2438.6675378	621868.4	5484.4575378	2026-04-14 23:15:56.591
cmnz9rxmg000fszy7qotqfgjk	cmnz9rxh8000eszy73t63q70w	2026-04-01 03:00:00	0	0	0	0	0	2026-04-14 23:45:39.832
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9f03cefc-ce39-4e8c-95df-dd00205484a9	1cc72a918537e575c25df1e39ff52b5a1ec2d80c7198a3554bdb7378516f7c51	2026-04-08 22:27:41.129881-03	20260409012741_init	\N	\N	2026-04-08 22:27:41.120853-03	1
25557040-e291-414c-96a7-6fbd9a77fb2a	b82304ed6a8e9b3e093ca2c21266884dd6d4dfc75e20aa1993c81544f1c7ff83	2026-04-13 19:43:00.640525-03	20260413224243_add_user_auth	\N	\N	2026-04-13 19:43:00.623962-03	1
d66f6c72-d7ef-470d-8403-70fa6c00ba23	25f58e91c4ac7ffa77765ad78938cbd9d9993f65c401c7fd4f027278c09de99d	2026-04-13 20:28:13.718224-03	20260413232813_add_budget	\N	\N	2026-04-13 20:28:13.713101-03	1
9b81e73e-283a-4d45-a278-1cc031a8b6a5	c499b2a01ea56b379543f42813e5a31cc615d477384ae2abcbff578d220e6e5f	2026-04-14 10:01:04.991458-03	20260414130104_add_recurring_expenses	\N	\N	2026-04-14 10:01:04.984666-03	1
0ee88666-e63f-48b6-b7f2-43c88ec68991	0114e21573fe0b56fdb604e17cbbb77a70fa09c1e458358e97e9161ab204242f	2026-04-14 10:08:48.015839-03	20260414130848_recurring_expense_account	\N	\N	2026-04-14 10:08:48.011959-03	1
e236359a-ea93-44f0-ab3d-d93754a8f39b	12ab1fbb2617d6c4f3c21a111c942b859f433e9ec85fe8c185f8ce0f2cc65329	2026-04-14 16:51:03.829468-03	20260414195103_recurring_income_goals_snapshots	\N	\N	2026-04-14 16:51:03.812322-03	1
\.


--
-- Name: Budget Budget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: ForeignAccount ForeignAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ForeignAccount"
    ADD CONSTRAINT "ForeignAccount_pkey" PRIMARY KEY (id);


--
-- Name: Investment Investment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Investment"
    ADD CONSTRAINT "Investment_pkey" PRIMARY KEY (id);


--
-- Name: RecurringExpense RecurringExpense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY (id);


--
-- Name: SavingsGoal SavingsGoal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Wallet Wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY (id);


--
-- Name: WealthSnapshot WealthSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WealthSnapshot"
    ADD CONSTRAINT "WealthSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Budget_userId_category_currency_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Budget_userId_category_currency_key" ON public."Budget" USING btree ("userId", category, currency);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: WealthSnapshot_userId_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WealthSnapshot_userId_date_key" ON public."WealthSnapshot" USING btree ("userId", date);


--
-- Name: Budget Budget_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Client Client_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ForeignAccount ForeignAccount_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ForeignAccount"
    ADD CONSTRAINT "ForeignAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Investment Investment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Investment"
    ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecurringExpense RecurringExpense_foreignAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_foreignAccountId_fkey" FOREIGN KEY ("foreignAccountId") REFERENCES public."ForeignAccount"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RecurringExpense RecurringExpense_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecurringExpense RecurringExpense_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."Wallet"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SavingsGoal SavingsGoal_foreignAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_foreignAccountId_fkey" FOREIGN KEY ("foreignAccountId") REFERENCES public."ForeignAccount"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SavingsGoal SavingsGoal_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SavingsGoal SavingsGoal_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."Wallet"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Wallet Wallet_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WealthSnapshot WealthSnapshot_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WealthSnapshot"
    ADD CONSTRAINT "WealthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 3TX5rEQXNEul8aMc6fCWP96lbfkMLe2kg8cBBeihdsfkbZvy9Wh7Aj84hdzHuWy

