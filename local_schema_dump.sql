--
-- PostgreSQL database dump
--

\restrict tQOzawAvkBpDkwUXK5opmx9FkITJoYdsjf3J1Q3mjIu6W18htgy9Ye6MLr6trkW

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: invite_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.invite_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'EXPIRED'
);


ALTER TYPE public.invite_status OWNER TO admin;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.user_status AS ENUM (
    'UNVERIFIED',
    'PENDING',
    'ACTIVE',
    'SUSPENDED'
);


ALTER TYPE public.user_status OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    actor_id uuid,
    event_type character varying(100) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO admin;

--
-- Name: invitations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    token_hash character varying(255) NOT NULL,
    invited_by uuid NOT NULL,
    status public.invite_status DEFAULT 'PENDING'::public.invite_status NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.invitations OWNER TO admin;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.modules OWNER TO admin;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    resource character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO admin;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.roles OWNER TO admin;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name character varying(255) NOT NULL,
    custom_domain character varying(255),
    logo_url text,
    theme_color character varying(50) DEFAULT '#000000'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    legal_name character varying(255),
    tax_id character varying(100),
    registration_number character varying(100),
    industry character varying(100),
    org_size character varying(50),
    address_street text,
    address_city character varying(100),
    address_state character varying(100),
    address_pincode character varying(20)
);


ALTER TABLE public.tenants OWNER TO admin;

--
-- Name: user_modules; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_modules (
    user_id uuid NOT NULL,
    module_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    access_level character varying(10) DEFAULT 'READ'::character varying
);


ALTER TABLE public.user_modules OWNER TO admin;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid
);


ALTER TABLE public.user_roles OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    gender character varying(20) NOT NULL,
    country_code character varying(10) DEFAULT '91'::character varying NOT NULL,
    mobile_no character varying(20) NOT NULL,
    date_of_birth date NOT NULL,
    alternate_email character varying(255),
    mother_tongue character varying(100) NOT NULL,
    security_question_1 character varying(255) NOT NULL,
    security_answer_1 character varying(255) NOT NULL,
    security_question_2 character varying(255) NOT NULL,
    security_answer_2 character varying(255) NOT NULL,
    password_hash text NOT NULL,
    status public.user_status DEFAULT 'UNVERIFIED'::public.user_status NOT NULL,
    is_tenant_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO admin;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.audit_logs (id, tenant_id, actor_id, event_type, ip_address, user_agent, metadata, created_at) FROM stdin;
6e36cbd1-8e4a-4b15-8dac-e90b232c050e	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	TENANT_PROVISIONED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"companyName": "Quantum Tech"}	2026-07-16 22:43:44.397369+00
3f65b37b-7218-4329-a154-b0552dc24d7a	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-16 22:43:54.812905+00
2c365000-e457-4169-bc05-8fcc7d63844b	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "mukesh.kumar@mail.com", "expiresAt": "2026-07-17T22:44:08.167Z"}	2026-07-16 22:44:08.196125+00
2aa60573-e0ba-4fa1-8f76-86a51cd48631	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_SIGNUP	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{"inviteId": "b6fb8cca-71f9-4f2c-8453-400a3cbf9826"}	2026-07-16 22:46:22.173754+00
2663ca43-6197-4438-a0ee-5ef7c420e4f3	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-16 22:47:38.495431+00
ecc9859a-c4ba-4be4-8078-0082f47a53ce	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ACCESS_GRANTED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"moduleIds": ["2d4139a9-6d6e-4646-a154-6be91ffcc9c8"], "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-16 22:49:36.819968+00
d735b8d9-ce72-4bd1-9f9b-f2ef3e59e5d8	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "n@s.n", "expiresAt": "2026-07-17T22:50:34.500Z"}	2026-07-16 22:50:34.525611+00
a7214435-bc0e-47ee-8346-d095084b091d	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "ad@d.aw", "expiresAt": "2026-07-17T22:50:42.147Z"}	2026-07-16 22:50:42.151118+00
b838c360-7d0b-4e71-b957-95b61487a17f	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-16 22:51:23.454731+00
329e204e-0610-4981-8983-dbd7e354ab0c	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-16 22:51:30.165429+00
832c3e55-4cef-416c-89b9-ea6b8c39db4d	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-16 22:52:02.071981+00
b9488349-707f-4a56-a27f-24e719622817	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 07:11:12.231315+00
f82e3d51-1055-4332-9c9d-5b5aec47b2e5	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 08:07:28.529157+00
85a96044-23d2-41d7-85cf-8181fc5f5e5a	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 08:08:06.624421+00
3f789270-ceff-4e13-8195-a2c08441069e	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-17 08:08:27.098125+00
ef924a59-94ba-401a-a6e4-66e01600fa9a	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-17 08:08:28.693026+00
85fc2483-b754-4484-8032-01d77e71303e	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "7164fdde-92e1-4470-9058-f2b794252695"}	2026-07-17 08:08:30.5243+00
fdae4a75-a805-4632-b15e-5b630f751a37	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "7164fdde-92e1-4470-9058-f2b794252695"}	2026-07-17 08:08:38.879057+00
a12054a2-9812-4598-869e-23acde475b60	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 08:18:02.637925+00
1e2fdcd1-4942-4545-a6d2-f65e0fca498b	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "lakshya.sen@mail.com", "expiresAt": "2026-07-18T08:18:58.351Z"}	2026-07-17 08:18:58.375908+00
9239cce3-f8ca-4086-9eb2-f670b76ee39e	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_SIGNUP	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{"inviteId": "86dfbfbf-6d90-4fb9-9d2c-1dbef24a6612"}	2026-07-17 08:21:40.397378+00
9c9e55ef-77e9-405f-9124-844db5775553	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 08:22:05.76777+00
9daf4c90-5e59-4c4f-9811-c061c4652e03	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ACCESS_GRANTED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"moduleIds": ["1fd9b51e-c800-4274-b2ef-a8b1dbaa41a5", "910b93c8-a275-4da1-8a9b-163da31e62ab", "e149c3db-f111-40ba-865f-9cd6608d6f01"], "targetUserId": "bb9c41c6-5929-423a-809a-d74b9ee4f098"}	2026-07-17 08:23:06.601446+00
2c185e82-a7d7-4fe8-b9b4-d682f2333b13	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 08:24:53.690608+00
7865f610-f33a-4387-9579-ecc71ee8b5c9	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 08:33:25.350715+00
ab51d0a5-e76c-4c76-9f5e-cc52f206f590	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 08:34:22.212524+00
7bfd0fb6-1d62-487c-9d61-ca7f4b8d60b8	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 08:58:37.864489+00
29e4557b-dbf2-4c9e-86dd-9a69a46b6130	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 08:58:59.627041+00
8074ccbe-ee5e-4520-9797-0b3e130992e5	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ACCESS_GRANTED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"moduleIds": ["2d4139a9-6d6e-4646-a154-6be91ffcc9c8", "1fd9b51e-c800-4274-b2ef-a8b1dbaa41a5"], "targetUserId": "bb9c41c6-5929-423a-809a-d74b9ee4f098"}	2026-07-17 08:59:24.721098+00
c2e7a76d-f97c-4dcf-bfa8-f1b5cbec008d	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 08:59:40.231802+00
c1a32b84-3c42-470c-a882-93b24c7065da	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 09:33:18.196439+00
4e6fb141-602b-4367-b79e-0cca4fda6c66	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 10:53:48.188314+00
6035b41c-e7ef-4082-aa5b-4a8b0a40ee93	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 10:54:28.157318+00
ed3bffe4-68df-44c3-975d-735f4f6d1834	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 11:14:57.264056+00
9c2265d2-8941-4f93-8636-0bbd97960fc9	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 11:25:44.418918+00
b53715fd-e2dc-491f-bcad-43cd3211e405	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 11:30:17.661842+00
4c257d8a-423a-47a6-90d2-7c5f9db8a90a	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 13:24:43.057458+00
24bba590-a5c5-4a5b-9a2e-03c0128c7d03	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 13:56:25.750058+00
274cb450-3c58-4cb9-81c0-94a840178396	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 14:17:46.917417+00
3ba675c4-7601-422d-863f-67be892fb1cc	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 14:18:45.077371+00
02a99d9d-5335-4e74-8eac-987498781a34	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "irfan@mail.com", "expiresAt": "2026-07-18T14:20:35.285Z"}	2026-07-17 14:20:35.312566+00
0628f116-7193-49b1-9ee5-78e73a50d001	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 17:35:35.968246+00
4e024bf6-9729-429f-91ee-1c06be630a56	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 17:51:45.489798+00
f28baef6-ec1c-49af-9e47-958ff466bb4f	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 18:12:48.542277+00
f3e9a1e8-3950-477d-ba26-fda3c1fff6d2	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 18:15:26.308912+00
af44c10a-e630-461f-9851-0d88230c7398	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "sanu@mail.com", "expiresAt": "2026-07-18T18:22:57.114Z"}	2026-07-17 18:22:57.143192+00
dcbb9b08-b262-47ff-b8cc-be40dd83170a	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 19:37:22.546683+00
786acac4-9299-49b0-b5c8-e0eb9d0dd79f	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "sany@mail.com", "expiresAt": "2026-07-18T19:38:06.590Z"}	2026-07-17 19:38:06.614584+00
da41f2b7-139b-48fb-af02-6855e1a82b69	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-17 20:01:51.016328+00
918f6fc3-da84-42b9-a42c-db4fc49bbcce	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "raju@mail.com", "expiresAt": "2026-07-18T20:02:03.951Z"}	2026-07-17 20:02:03.975556+00
6de1fcb7-cd55-48c6-b471-ad28272a4a00	65613b44-64e8-4e01-b534-28083b28619c	57071207-8474-4198-b069-be09d10085ed	USER_SIGNUP	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{"inviteId": "51233b28-adab-4eca-9ba5-0083b8a250d2"}	2026-07-17 20:05:23.483702+00
959c3311-b614-40aa-9070-2922a4295401	65613b44-64e8-4e01-b534-28083b28619c	57071207-8474-4198-b069-be09d10085ed	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 20:05:33.146861+00
a7ca9875-aa6c-4a50-9df1-4dea714179c5	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ACCESS_GRANTED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"moduleIds": ["1fd9b51e-c800-4274-b2ef-a8b1dbaa41a5", "e149c3db-f111-40ba-865f-9cd6608d6f01"], "targetUserId": "57071207-8474-4198-b069-be09d10085ed"}	2026-07-17 20:05:50.789275+00
9e4ad0aa-d845-4644-85b7-e6b4168449a0	65613b44-64e8-4e01-b534-28083b28619c	57071207-8474-4198-b069-be09d10085ed	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 20:06:26.523062+00
5755bad4-f383-4822-b9ed-50e85d428e2a	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-17 20:31:49.037354+00
d612f9a9-d9a9-4f70-a55d-ea107d40898a	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-18 10:12:34.426048+00
34df222f-a96c-4d4a-a41c-a1aaa6ab76b7	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "rakhi@mail.com", "expiresAt": "2026-07-19T10:24:09.024Z"}	2026-07-18 10:24:09.042938+00
63447843-cfd0-4527-a9e3-160e236896b1	65613b44-64e8-4e01-b534-28083b28619c	a5237741-7572-473f-b0fc-1786e7903aff	USER_SIGNUP	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{"inviteId": "b8f286bc-cf11-4841-9a74-2db6e3504f43"}	2026-07-18 10:44:59.371344+00
d2977fc3-e1a4-4b49-83dc-515957de5546	65613b44-64e8-4e01-b534-28083b28619c	a5237741-7572-473f-b0fc-1786e7903aff	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-18 10:45:09.78617+00
b9925621-83c7-459b-acfa-9fde3399a87e	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ACCESS_GRANTED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"moduleIds": ["2d4139a9-6d6e-4646-a154-6be91ffcc9c8", "910b93c8-a275-4da1-8a9b-163da31e62ab", "e149c3db-f111-40ba-865f-9cd6608d6f01"], "targetUserId": "a5237741-7572-473f-b0fc-1786e7903aff"}	2026-07-18 10:46:14.172712+00
00c0431b-57f1-417c-a995-f8865dfaa602	65613b44-64e8-4e01-b534-28083b28619c	a5237741-7572-473f-b0fc-1786e7903aff	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-18 10:46:51.286718+00
c5cd9c11-f7cd-4676-a5c8-eb508e1aab6d	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "a5237741-7572-473f-b0fc-1786e7903aff"}	2026-07-18 10:47:50.691339+00
6727530c-c987-4d86-b443-72ab1c2f2513	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "a5237741-7572-473f-b0fc-1786e7903aff"}	2026-07-18 10:48:12.44432+00
4395426b-5e08-4900-b281-9a82534c0549	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "a5237741-7572-473f-b0fc-1786e7903aff"}	2026-07-18 10:50:27.183172+00
508f539b-aaf4-4814-b8fa-94f9a774794c	65613b44-64e8-4e01-b534-28083b28619c	a5237741-7572-473f-b0fc-1786e7903aff	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-18 11:12:04.664539+00
8474ff7f-af5d-4cd4-a970-27281bb0c996	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-18 12:09:59.283259+00
1f7807f4-5006-4550-a094-1a1695229155	65613b44-64e8-4e01-b534-28083b28619c	bb9c41c6-5929-423a-809a-d74b9ee4f098	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-18 12:12:12.221959+00
da320a05-04d4-4dc1-8dec-7d7b6e3e1b0a	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "a5237741-7572-473f-b0fc-1786e7903aff"}	2026-07-18 13:39:21.261552+00
9294cb6b-079c-4bd3-a83d-3c63d809c365	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "ratna.sen@mail.com", "expiresAt": "2026-07-19T15:36:19.089Z"}	2026-07-18 15:36:19.110415+00
bd322899-fbb3-4038-a6b3-dbe817eae8f0	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-19 12:47:18.287521+00
445c0b8b-4603-41e7-b20e-76d67485a06c	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "abc@mail.com", "expiresAt": "2026-07-20T12:53:16.796Z"}	2026-07-19 12:53:16.800793+00
7a98d497-4f4f-4f8a-bb77-b6c542102d47	65613b44-64e8-4e01-b534-28083b28619c	b84a9236-ddf9-4d80-b81b-5116b9907cb0	USER_SIGNUP	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{"inviteId": "eadd4906-dae9-4761-86c8-593b90d4eaff"}	2026-07-19 13:14:58.673837+00
06a50685-fb30-4100-8a24-315e0d9e0f6d	65613b44-64e8-4e01-b534-28083b28619c	b84a9236-ddf9-4d80-b81b-5116b9907cb0	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-19 13:15:15.947635+00
d538d0be-ffcb-497e-97f2-11f6d23a4657	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ACCESS_GRANTED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"moduleIds": ["1fd9b51e-c800-4274-b2ef-a8b1dbaa41a5", "910b93c8-a275-4da1-8a9b-163da31e62ab"], "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 13:16:08.089307+00
bc56ba9d-3f69-46d0-89b1-f8e4292f06b9	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "a5237741-7572-473f-b0fc-1786e7903aff"}	2026-07-19 13:35:31.700027+00
f7d85a47-782e-4f7f-9d19-2729ad280f98	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "a5237741-7572-473f-b0fc-1786e7903aff"}	2026-07-19 13:36:00.850855+00
0f481860-9fdd-46e8-8621-48cb43f17af4	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_LOGIN	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{}	2026-07-19 13:53:38.938647+00
69c84dad-6117-40cf-af9f-4ed4e5293252	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ACCESS_GRANTED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"roleIds": ["d5d806a9-7068-4d34-bfed-e07fa79f125e"], "moduleIds": ["910b93c8-a275-4da1-8a9b-163da31e62ab", "e149c3db-f111-40ba-865f-9cd6608d6f01"], "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 14:33:21.790819+00
ccac5e4f-331e-49a0-86b8-1d292b48443f	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 14:41:45.471182+00
b4669933-aeb5-4dee-a8a3-3c1e49e15713	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 14:58:28.872971+00
4ac00554-a399-48a3-8739-965956d94927	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:00:21.512175+00
4d08cc02-9fed-40d3-87d4-5e297ddc193e	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:00:42.463972+00
06bf15c2-30b2-416d-8728-fd1a64f81729	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:02:04.238341+00
8f7783c0-d526-43ae-8f5f-f00678f72f30	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:02:43.576433+00
06294ce9-c0dd-4e71-9304-b3358737ba06	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-19 15:03:37.929932+00
1e9b0c0c-1d73-435b-aeab-8aae18f506af	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-19 15:06:43.669923+00
ea995ca4-e2ba-48f4-b699-be04ae5a135f	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-19 15:06:57.518269+00
a3f64be7-2049-424b-b44d-48f2e97eea13	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-19 15:08:20.633309+00
0de19def-7731-42d7-89ab-df6bbbf3d7aa	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-19 15:09:14.380818+00
c693196d-1990-4c46-9b1b-478d06912fc2	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-19 15:09:38.958079+00
cf1220d5-94c0-4f56-8779-9e205b8022b1	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ADMIN_FORCED_PASSWORD_RESET	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-19 15:09:52.94906+00
e67e4497-3fe8-4bc4-9b07-baf94b5e5009	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-19 15:11:15.468187+00
2178f8e6-6709-4c5a-bfad-09441e530f95	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	SECURITY_LOCKOUT_CLEARED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"targetUserId": "d2eba32f-fcaf-4807-8b37-aea0af51e295"}	2026-07-19 15:17:01.034925+00
68d7701c-76b5-45a1-a723-1b38dce7c17a	65613b44-64e8-4e01-b534-28083b28619c	d2eba32f-fcaf-4807-8b37-aea0af51e295	USER_LOGIN	::ffff:127.0.0.1	Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0	{}	2026-07-19 15:17:10.823549+00
9dc29d9b-40bb-4440-a6fa-116bdd318c87	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "kailash@mail.com", "expiresAt": "2026-07-20T15:23:18.121Z"}	2026-07-19 15:23:25.048506+00
95feaa96-8f6d-4c1b-a078-9d64913b9fc1	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:27:14.334096+00
fedef290-c21d-4b76-a927-2f275e3c0870	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:29:39.62115+00
07b1b2bf-ca87-45aa-8b2e-41ed1c86ef12	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	SECURITY_LOCKOUT_CLEARED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:29:44.422484+00
f0d07b4a-ad32-49db-85cb-f0fa29b9393c	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	ADMIN_FORCED_PASSWORD_RESET	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:29:53.229314+00
2500ca37-e680-4a91-b712-1bbbe30bad34	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "abcd@mail.com", "expiresAt": "2026-07-20T15:30:39.359Z"}	2026-07-19 15:30:44.742484+00
fafec0d3-b9e0-4bcb-bdd7-fdeff9a8c022	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "SUSPENDED", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:36:43.627666+00
bbfef871-69c7-4ab1-aa1d-62d92e7880fe	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_STATUS_CHANGED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"newStatus": "ACTIVE", "targetUserId": "b84a9236-ddf9-4d80-b81b-5116b9907cb0"}	2026-07-19 15:36:56.088033+00
89dfc673-9b64-4b85-a6fc-fd3b2607d8e3	65613b44-64e8-4e01-b534-28083b28619c	7164fdde-92e1-4470-9058-f2b794252695	USER_INVITED	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "abcd@mail.com", "expiresAt": "2026-07-20T15:55:22.030Z"}	2026-07-19 15:55:28.43764+00
\.


--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.invitations (id, tenant_id, email, token_hash, invited_by, status, expires_at, created_at) FROM stdin;
b6fb8cca-71f9-4f2c-8453-400a3cbf9826	65613b44-64e8-4e01-b534-28083b28619c	mukesh.kumar@mail.com	904098b7f1f057089659e69bd65507457f32a240b6fa17ad928e7197abea4850	7164fdde-92e1-4470-9058-f2b794252695	ACCEPTED	2026-07-17 22:44:08.167+00	2026-07-16 22:44:08.18544+00
db7b604f-5a98-4235-b24f-047770e2a24f	65613b44-64e8-4e01-b534-28083b28619c	n@s.n	bfe8f3189ab3f4c7f1ea447f6cc98d2e2895c29c6a9e8014aed04a36aa7288d1	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-17 22:50:34.5+00	2026-07-16 22:50:34.51344+00
31ab20a7-e2af-4b3a-b52c-b24933766238	65613b44-64e8-4e01-b534-28083b28619c	ad@d.aw	04f3968071aa3267034ddeefddd57b23969ba5ec8543007bc8b5f7c82d84bc79	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-17 22:50:42.147+00	2026-07-16 22:50:42.14836+00
86dfbfbf-6d90-4fb9-9d2c-1dbef24a6612	65613b44-64e8-4e01-b534-28083b28619c	lakshya.sen@mail.com	23a5479c7e83956c680cbe3b51ae9c22f04b794594e2d3c5990af990dc7f68c6	7164fdde-92e1-4470-9058-f2b794252695	ACCEPTED	2026-07-18 08:18:58.351+00	2026-07-17 08:18:58.364567+00
57aabf06-21b0-40d6-8aaa-06f17ac207e3	65613b44-64e8-4e01-b534-28083b28619c	irfan@mail.com	4cb4892d18edb8631c7dd4ce13adbb5341e1b1cd5c424a8be5930ad7a471bf66	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-18 14:20:35.285+00	2026-07-17 14:20:35.301937+00
7893074f-5156-4a7f-80b1-03f0370c77bf	65613b44-64e8-4e01-b534-28083b28619c	sanu@mail.com	70106f5e9fbf941c88977f7aba309729eebfc0430ae10f9d39b9bb9b386b6ad8	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-18 18:22:57.114+00	2026-07-17 18:22:57.130476+00
5dbf3e3f-c86b-4112-891e-ae152290ce8f	65613b44-64e8-4e01-b534-28083b28619c	sany@mail.com	230e344bc7da4435c75729c8700ecd37890e8e03311deb5bf1ccf0c101a03a39	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-18 19:38:06.59+00	2026-07-17 19:38:06.604868+00
51233b28-adab-4eca-9ba5-0083b8a250d2	65613b44-64e8-4e01-b534-28083b28619c	raju@mail.com	74f0950fb5a293250916aeb4301fc483a7ee897a3116ff6c55290a0cf0af4ab4	7164fdde-92e1-4470-9058-f2b794252695	ACCEPTED	2026-07-18 20:02:03.951+00	2026-07-17 20:02:03.965894+00
b8f286bc-cf11-4841-9a74-2db6e3504f43	65613b44-64e8-4e01-b534-28083b28619c	rakhi@mail.com	1b2c6b8b7f04270f4582b974b8ecfbfe00b40709e61df46587a5a2337e6f93d0	7164fdde-92e1-4470-9058-f2b794252695	ACCEPTED	2026-07-19 10:24:09.024+00	2026-07-18 10:24:09.029915+00
6479398c-0fee-4491-b6e7-ace618243d55	65613b44-64e8-4e01-b534-28083b28619c	ratna.sen@mail.com	8420269373de39178ac80dc8b0810d04f2c17936696bd31d4e46b0cb00604497	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-19 15:36:19.089+00	2026-07-18 15:36:19.102582+00
eadd4906-dae9-4761-86c8-593b90d4eaff	65613b44-64e8-4e01-b534-28083b28619c	abc@mail.com	8e4234c1e199fcb8ab1d1f15d8a986a21deb5900515d4173f1f6cd93ff355b14	7164fdde-92e1-4470-9058-f2b794252695	ACCEPTED	2026-07-20 12:53:16.796+00	2026-07-19 12:53:16.796592+00
1ab5d80a-dd77-4fbe-8fe7-d7c27f182c8a	65613b44-64e8-4e01-b534-28083b28619c	kailash@mail.com	89144cd9b2ee21b927a82e21acb0f032d1556592b68b188d1091e084591b8b7c	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-20 15:23:18.121+00	2026-07-19 15:23:18.136227+00
cad97948-4149-4fb4-8482-d59f1f31695f	65613b44-64e8-4e01-b534-28083b28619c	abcd@mail.com	8f14aff893c1428e4b81c9e585fb2aab3c533495b173613120f3ab8f2c8261b4	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-20 15:30:39.359+00	2026-07-19 15:30:39.35985+00
2c0ac09e-061a-47e7-a1f0-e37d0fc9e20e	65613b44-64e8-4e01-b534-28083b28619c	abcd@mail.com	20a60e961ae61f220903889fd02814651b96454e493df874c7b1eddbfa579e6e	7164fdde-92e1-4470-9058-f2b794252695	PENDING	2026-07-20 15:55:22.03+00	2026-07-19 15:55:22.031236+00
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.modules (id, tenant_id, name, description, created_at) FROM stdin;
2d4139a9-6d6e-4646-a154-6be91ffcc9c8	65613b44-64e8-4e01-b534-28083b28619c	Expense Reimbursement	Submit, review, and process business expenses and travel claims	2026-07-16 22:48:18.035779+00
1fd9b51e-c800-4274-b2ef-a8b1dbaa41a5	65613b44-64e8-4e01-b534-28083b28619c	Performance Management	Handle annual appraisals, goal tracking, and peer reviews	2026-07-16 22:48:31.620408+00
910b93c8-a275-4da1-8a9b-163da31e62ab	65613b44-64e8-4e01-b534-28083b28619c	Benefits Administration	Manage healthcare plans, retirement funds, and perks enrollment	2026-07-16 22:48:44.683893+00
e149c3db-f111-40ba-865f-9cd6608d6f01	65613b44-64e8-4e01-b534-28083b28619c	Time & Attendance	Track employee check-ins, shift schedules, and working hours	2026-07-16 22:49:00.079026+00
4396e0c2-e5bd-44c1-aed6-a6d719a9e26f	65613b44-64e8-4e01-b534-28083b28619c	Core HR Directory	Centralized database for employee profiles and organizational charts	2026-07-16 22:49:11.513977+00
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.permissions (id, tenant_id, name, resource, description, created_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.refresh_tokens (id, user_id, tenant_id, token_hash, is_revoked, expires_at, created_at) FROM stdin;
50f3106a-3cfb-4747-84cd-9c7b54768d11	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	5bb4fa9ba5d19c719a3d6ffec01766348d2566703dac2c93172f729a59461b5c	f	2026-07-23 22:43:54.801+00	2026-07-16 22:43:54.80263+00
3e63fef3-b664-4b09-b79a-c66b124bc5b8	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	fe5b8dfd5e0bd066a83dd646f0b5f0d5390c14b1c74728dd661a27997b3bd2e7	f	2026-07-24 07:11:12.227+00	2026-07-17 07:11:12.228132+00
79231599-8a76-415f-be5c-3ea2419a634c	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	9fd19837c2a83c8d9358125e4648755b9cdc62368835337bda196e0e915e7166	f	2026-07-24 08:08:06.621+00	2026-07-17 08:08:06.621911+00
01cd3fe9-477d-4a3a-8944-69ed40f296d8	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	52f13468a1c1b52d950284cbc0ea85f3ab33999de0f633b7984a424158fc5896	f	2026-07-24 08:18:02.629+00	2026-07-17 08:18:02.630479+00
2f9a8a33-2033-46d3-a67f-b197c563d37d	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	12e5f15cb6c9ad5e41c08123b50b84d5b432abcc60dddaffcf88e266873756ec	f	2026-07-24 08:22:05.76+00	2026-07-17 08:22:05.760716+00
070ce0d0-33a5-4a2b-8e8f-26d7d00df1c9	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	52ad6b394a624decc2c3149a9953a8eec9464cbf4c72a95789469bd67c4ac0ec	f	2026-07-24 08:24:53.682+00	2026-07-17 08:24:53.683444+00
d0ca5525-ed8f-4e34-ba2d-260717b88764	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	84681413ef2f455a20147b334409ac17b4d145a25a4523bff507a1f2ce1bf1f7	f	2026-07-24 08:33:25.342+00	2026-07-17 08:33:25.343293+00
226a7e1b-d6fd-40cf-ae40-cea4feca8147	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	bd04617deb598f79f3ff04f3b6df8c1a69afd12c12fa49aa14abaf7e173a59fb	f	2026-07-24 08:34:22.207+00	2026-07-17 08:34:22.208519+00
d915ba08-60e9-4383-9cb3-598a9f8be231	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	ffd49a7ca4f85a815c6992de499b1d55bcaf9fdd6b1740b02f2b2fbae64d6187	f	2026-07-24 08:58:37.855+00	2026-07-17 08:58:37.856368+00
892441ae-0898-4e26-8407-e1242643a961	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	cafeea43a9be77a333e847885c88fbc6d424b07dd2c80f69d057a1c5304a45fa	f	2026-07-24 08:58:59.616+00	2026-07-17 08:58:59.617374+00
05fe9882-de67-4f70-97cb-746a50eedab5	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	5bad8fcfdd641b48a508edefbfcc5620d5f4dd55b4c0dd0b82954f9844fd2228	f	2026-07-24 08:59:40.223+00	2026-07-17 08:59:40.224534+00
4a2283b5-cd4c-4445-8a6a-fef8df2f312e	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	176636db1a891dfcefedcab6f936c41a9c4b159eae00307c51303870003051df	f	2026-07-24 09:33:18.187+00	2026-07-17 09:33:18.188257+00
3a0678b6-a6bf-4cb6-a9b0-1119471cc0f1	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	ba235910ce257930f9dc13e16ad18a7db5dfa5e8efef8121f611c83d7bbbadd5	t	2026-07-24 10:54:28.149+00	2026-07-17 10:54:28.149753+00
7ced1213-d04a-4c1c-b4af-6291fb1fd5e2	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	5f3a0b7d88fd9fd78364a8b4c41ec1b7b62664eaa3c5164f5e3afbbfeef0a31a	t	2026-07-24 10:53:48.179+00	2026-07-17 10:53:48.181126+00
98d71f42-4953-4999-ae50-2837d3c23b71	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	e443c63413b70e4af3c8d5214d551cb5fffc335dd32aa2aba1d17d9f19a6d30a	f	2026-07-24 11:14:57.257+00	2026-07-17 11:14:57.257988+00
4e6bca40-3223-49b4-92da-590dd7daf459	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	7ca8b567149a59af1c84b7d125bc611f3f11da9ffd69f07e52ae2dafbb6fffee	t	2026-07-24 11:25:44.409+00	2026-07-17 11:25:44.410626+00
4faf175c-be57-4ccc-b992-f455b74fea7e	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	ee83aa82b06999a47b0d3d80adaea2558886356e3c386ec37bd1f486587f434f	f	2026-07-24 11:30:17.653+00	2026-07-17 11:30:17.654475+00
9596e3b2-1866-44b8-8c7b-a2d9c69c312d	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	dbfb2820d78ff3baf23e3379ff999dd2d113340aa819b6caa807ab101b32b29f	f	2026-07-24 13:24:43.046+00	2026-07-17 13:24:43.047074+00
5c633f95-1312-41ad-b052-7171bd9dce75	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	7c89510b80b1517fb20043e08ffd8e55df095e01e6f8b6dbd47033b617a2e92d	f	2026-07-24 13:56:25.742+00	2026-07-17 13:56:25.744286+00
a944d90d-dfbd-460d-8fe1-f614bc34cde8	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	4f87e2e5f2c85d9ac39a2aa986badb3e351d038b2a4911581f1733a4e09570ef	f	2026-07-24 14:17:46.909+00	2026-07-17 14:17:46.9103+00
f3dc61c9-095d-47a9-a421-e6990fffed4b	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	f600fa0feebbc75b09745e06d329bfb64ed00bcf5091cb30b1f1d70e91332d98	t	2026-07-24 14:18:45.069+00	2026-07-17 14:18:45.070079+00
e212b2d8-633b-49b1-8484-a89bc220c554	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	4a87fdcf4174de673455d9d4b3fb87c6b6c3dc354103c43972269845ee7ee29e	f	2026-07-24 17:35:35.957+00	2026-07-17 17:35:35.958952+00
bf935f0a-d96e-4927-80f6-925d36ab378b	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	3484a2473b5e2e86751a436a07a2e3652b897b6602449f50824f2dd807761e01	f	2026-07-24 17:51:45.481+00	2026-07-17 17:51:45.482387+00
fb7e48b6-64bf-4b3d-8058-8c741322d755	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	b531ac2972355c094c051c8a8855d53b14007d55efba1dceaa863b2fa2b5cfbb	f	2026-07-24 18:12:48.534+00	2026-07-17 18:12:48.535119+00
8aafe9ac-d74a-4ebd-8944-d9894268c2b5	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	0ee518f24b6478c378523cb9e9312640b4f9652b236ba341faa8ca38c90e5571	f	2026-07-24 19:37:22.537+00	2026-07-17 19:37:22.538701+00
8e5a9337-0e48-4b70-ab42-8b84bf855ca0	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	6a1363ee42b107086ec5ba728f3504828acaf4ebb9567fcc83ee95f669d373b3	f	2026-07-24 20:01:51.004+00	2026-07-17 20:01:51.005694+00
d73a7c04-78c8-4653-8ab6-6157f4dc15d3	57071207-8474-4198-b069-be09d10085ed	65613b44-64e8-4e01-b534-28083b28619c	a92e9aff563a2c764d37534c4c38b564360179e4e721ab02b274f76f9f0d6ec8	f	2026-07-24 20:05:33.139+00	2026-07-17 20:05:33.139916+00
d1e3d2f3-922d-4bb4-b3a6-9d2017c65180	57071207-8474-4198-b069-be09d10085ed	65613b44-64e8-4e01-b534-28083b28619c	5a38ca68435365d1b321b8922ff6cbfe7c8adf04b520c79dcce9b2dc62d15ef4	t	2026-07-24 20:06:26.514+00	2026-07-17 20:06:26.515583+00
a1e3fd44-363f-4bad-8e0b-6ee577536017	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	879dc91d5fff802f35f88086649f46334d6d8be83103c866f82d967527f1014a	t	2026-07-24 20:31:49.027+00	2026-07-17 20:31:49.02894+00
b4329d9a-4254-4bc4-9e5e-339ad7d1a82d	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	96e826bc025db247a07d1e82d72673ae702d0b05aab57749605d96761a57e8b9	f	2026-07-25 10:12:34.416+00	2026-07-18 10:12:34.417826+00
f889ee37-302b-44b6-8cf2-833bb76c4f18	a5237741-7572-473f-b0fc-1786e7903aff	65613b44-64e8-4e01-b534-28083b28619c	ac297ed1297cd55e27b1b9cc4bab3b41ca7a79b627ade8287e4820498a2b4015	f	2026-07-25 10:45:09.783+00	2026-07-18 10:45:09.783854+00
89a3eb59-7261-4b74-a342-2d832330f34d	a5237741-7572-473f-b0fc-1786e7903aff	65613b44-64e8-4e01-b534-28083b28619c	29b7cd036702dd86104d159f99be647d028d1847db3d2490ad13f36770772f22	t	2026-07-25 10:46:51.284+00	2026-07-18 10:46:51.284924+00
0f04650c-a4fd-4a6a-a80f-8025010a404a	a5237741-7572-473f-b0fc-1786e7903aff	65613b44-64e8-4e01-b534-28083b28619c	3e8ee17103931824e91dc897561a74246de38e2269d87d0ee526f2ce85939929	f	2026-07-25 11:12:04.661+00	2026-07-18 11:12:04.661338+00
e3de7627-056f-4036-85ac-7050c62bbbb1	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	39bb8493835641fe9921f4875bea84e5bf3f26e59a1328d36aecda969c7d94ef	f	2026-07-25 12:09:59.28+00	2026-07-18 12:09:59.281022+00
7e1aea06-1bdd-412c-ab57-e47f74ab2b6d	bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	753df558a30283ed412b92a303dbb0667795e0b6e270af1eb565e74b4f64d4ed	t	2026-07-25 12:12:12.22+00	2026-07-18 12:12:12.220207+00
892e708b-59ae-437f-ae1b-13cff2ae98d3	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	743efb4430cb0ee6ba5214bef1831891bcd131e272bc10ecbb6f4f36f2c92290	t	2026-07-26 12:47:18.283+00	2026-07-19 12:47:18.283729+00
3683e103-89b5-44f2-ae95-f627afe545d6	b84a9236-ddf9-4d80-b81b-5116b9907cb0	65613b44-64e8-4e01-b534-28083b28619c	8cbc5c9029f0fe7cf18ea8c929384318ebf4cbca8b1e24ebf044a805a2e3c2e3	t	2026-07-26 13:15:15.937+00	2026-07-19 13:15:15.938566+00
f11eda9e-9c6e-46a6-9d9e-3e20c4999067	7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	109a5b79953cfe980419e63b1d8cb3c4267f619ede326ae7d147ea109a4513ff	t	2026-07-26 13:53:38.929+00	2026-07-19 13:53:38.93016+00
29c5019f-2bb4-4062-b114-79b11fa15bb8	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	70ee04b57413914e9869d368199ba8fe9c7cb5b60f932b0f9c56d91109a195ce	t	2026-07-23 22:47:38.487+00	2026-07-16 22:47:38.488491+00
e64bb0c5-ca52-460c-b264-e6c1674a3469	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	9d8f4fb4b8c4ead0f949b64119f302377cc5df74799c28ff7ece2cba530da3a9	t	2026-07-23 22:52:02.062+00	2026-07-16 22:52:02.063122+00
c8d1aebe-188f-483e-97ed-81cbedaafdfd	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	712a5bf68d700f6375f9e010673349cdc0762af4aa36db5f633d189765b62a48	t	2026-07-24 08:07:28.524+00	2026-07-17 08:07:28.52531+00
3a0d81c7-461b-4264-b24c-9fd6fe3d4f21	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	ad7ccec706b33189d973436a4b1a9aa98b7abbc8757ccab857a9f5c86bd9ca86	t	2026-07-24 18:15:26.3+00	2026-07-17 18:15:26.301528+00
3f52f06e-1d62-42c6-b1e8-71263bb10567	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	b0763762337e5e5f9eecc2f693424794cc550e5e7d45df3559af88b323ca3104	t	2026-07-26 15:03:37.918+00	2026-07-19 15:03:37.919984+00
cf3c1604-632b-4401-bf1f-bb2933cae8c3	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	3188abe25aab71898d46c230511ce00021cb8eca911950f79b6bfe800f7c9919	t	2026-07-26 15:08:20.624+00	2026-07-19 15:08:20.625748+00
f9e8a53d-be51-4caa-a87f-0b68c5529f88	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	4950bb116336c248f17fe28ae6e2ba226d00884c5017fead9212193aad59412a	t	2026-07-26 15:11:15.46+00	2026-07-19 15:11:15.460651+00
6b9bd2ec-b9be-4ca9-9c93-3379f316b3c5	d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	e1ef729bb4610f78b923d618c9fb88d77c30f702e0f90898f4fdc5c5d405ec22	t	2026-07-26 15:17:10.816+00	2026-07-19 15:17:10.817405+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.roles (id, tenant_id, name, description, created_at) FROM stdin;
3a7215aa-f959-49e9-bd77-8154a8b82981	65613b44-64e8-4e01-b534-28083b28619c	Host Admin	Highest access level with full system control and configuration rights	2026-07-17 11:35:26.357123+00
88f7b36a-a4f1-4a65-99b6-c48b78aa0e58	65613b44-64e8-4e01-b534-28083b28619c	HR Specialist	Access to employee files, recruitment tools, and onboarding pipelines	2026-07-17 11:35:38.486957+00
25dc896d-8fe2-4fd1-98de-0ccf28c31c8d	65613b44-64e8-4e01-b534-28083b28619c	Finance Manager	Full permission to view, edit, and approve payroll and expense data	2026-07-17 11:35:48.817867+00
dac35a4a-3419-4886-aea0-e0c22428fac7	65613b44-64e8-4e01-b534-28083b28619c	Team Lead	Access to team performance reviews, attendance tracking, and shift approvals	2026-07-17 11:36:01.583068+00
d5d806a9-7068-4d34-bfed-e07fa79f125e	65613b44-64e8-4e01-b534-28083b28619c	Law Adviser	Inspect and Manage the law related aspects of the organisation	2026-07-19 12:58:40.561552+00
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.tenants (id, company_name, custom_domain, logo_url, theme_color, created_at, updated_at, legal_name, tax_id, registration_number, industry, org_size, address_street, address_city, address_state, address_pincode) FROM stdin;
65613b44-64e8-4e01-b534-28083b28619c	Quantum Tech	quantumtech.io	/uploads/logo-65613b44-64e8-4e01-b534-28083b28619c-1784469679769-376173910.png	#545086	2026-07-16 22:43:44.228819+00	2026-07-16 22:43:44.228819+00	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: user_modules; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.user_modules (user_id, module_id, assigned_by, assigned_at, access_level) FROM stdin;
bb9c41c6-5929-423a-809a-d74b9ee4f098	1fd9b51e-c800-4274-b2ef-a8b1dbaa41a5	7164fdde-92e1-4470-9058-f2b794252695	2026-07-17 08:23:06.585248+00	READ
bb9c41c6-5929-423a-809a-d74b9ee4f098	910b93c8-a275-4da1-8a9b-163da31e62ab	7164fdde-92e1-4470-9058-f2b794252695	2026-07-17 08:23:06.595119+00	READ
57071207-8474-4198-b069-be09d10085ed	1fd9b51e-c800-4274-b2ef-a8b1dbaa41a5	7164fdde-92e1-4470-9058-f2b794252695	2026-07-17 20:05:50.776129+00	READ
57071207-8474-4198-b069-be09d10085ed	e149c3db-f111-40ba-865f-9cd6608d6f01	7164fdde-92e1-4470-9058-f2b794252695	2026-07-17 20:05:50.784282+00	READ
a5237741-7572-473f-b0fc-1786e7903aff	2d4139a9-6d6e-4646-a154-6be91ffcc9c8	7164fdde-92e1-4470-9058-f2b794252695	2026-07-18 10:46:14.148877+00	READ
a5237741-7572-473f-b0fc-1786e7903aff	910b93c8-a275-4da1-8a9b-163da31e62ab	7164fdde-92e1-4470-9058-f2b794252695	2026-07-18 10:46:14.165097+00	READ
7164fdde-92e1-4470-9058-f2b794252695	4396e0c2-e5bd-44c1-aed6-a6d719a9e26f	7164fdde-92e1-4470-9058-f2b794252695	2026-07-18 14:56:45.671394+00	WRITE
bb9c41c6-5929-423a-809a-d74b9ee4f098	e149c3db-f111-40ba-865f-9cd6608d6f01	7164fdde-92e1-4470-9058-f2b794252695	2026-07-17 08:23:06.597144+00	WRITE
bb9c41c6-5929-423a-809a-d74b9ee4f098	2d4139a9-6d6e-4646-a154-6be91ffcc9c8	7164fdde-92e1-4470-9058-f2b794252695	2026-07-18 15:03:03.797883+00	READ
b84a9236-ddf9-4d80-b81b-5116b9907cb0	910b93c8-a275-4da1-8a9b-163da31e62ab	7164fdde-92e1-4470-9058-f2b794252695	2026-07-19 14:33:21.770708+00	READ
b84a9236-ddf9-4d80-b81b-5116b9907cb0	e149c3db-f111-40ba-865f-9cd6608d6f01	7164fdde-92e1-4470-9058-f2b794252695	2026-07-19 14:33:21.781262+00	READ
d2eba32f-fcaf-4807-8b37-aea0af51e295	2d4139a9-6d6e-4646-a154-6be91ffcc9c8	7164fdde-92e1-4470-9058-f2b794252695	2026-07-19 15:08:51.306834+00	READ
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.user_roles (user_id, role_id, assigned_by) FROM stdin;
57071207-8474-4198-b069-be09d10085ed	dac35a4a-3419-4886-aea0-e0c22428fac7	7164fdde-92e1-4470-9058-f2b794252695
d2eba32f-fcaf-4807-8b37-aea0af51e295	dac35a4a-3419-4886-aea0-e0c22428fac7	7164fdde-92e1-4470-9058-f2b794252695
7164fdde-92e1-4470-9058-f2b794252695	88f7b36a-a4f1-4a65-99b6-c48b78aa0e58	7164fdde-92e1-4470-9058-f2b794252695
bb9c41c6-5929-423a-809a-d74b9ee4f098	88f7b36a-a4f1-4a65-99b6-c48b78aa0e58	7164fdde-92e1-4470-9058-f2b794252695
57071207-8474-4198-b069-be09d10085ed	25dc896d-8fe2-4fd1-98de-0ccf28c31c8d	7164fdde-92e1-4470-9058-f2b794252695
7164fdde-92e1-4470-9058-f2b794252695	3a7215aa-f959-49e9-bd77-8154a8b82981	7164fdde-92e1-4470-9058-f2b794252695
a5237741-7572-473f-b0fc-1786e7903aff	25dc896d-8fe2-4fd1-98de-0ccf28c31c8d	7164fdde-92e1-4470-9058-f2b794252695
b84a9236-ddf9-4d80-b81b-5116b9907cb0	d5d806a9-7068-4d34-bfed-e07fa79f125e	7164fdde-92e1-4470-9058-f2b794252695
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, tenant_id, email, first_name, middle_name, last_name, gender, country_code, mobile_no, date_of_birth, alternate_email, mother_tongue, security_question_1, security_answer_1, security_question_2, security_answer_2, password_hash, status, is_tenant_admin, created_at, updated_at) FROM stdin;
d2eba32f-fcaf-4807-8b37-aea0af51e295	65613b44-64e8-4e01-b534-28083b28619c	mukesh.kumar@mail.com	Mukesh	Kumar	Patel	Male	91	1234567890	1997-02-05	mukesh@mail.com	Hindi	What is your pets name?	Roxie	Who is your favorite player?	Messi	$argon2id$v=19$m=65536,t=3,p=4$P93gj0b0ivsYe/HweHEz/w$spWo7S6UVysTn6bxAehYVqoMjvE2VWDOWCNmoM21db8	ACTIVE	f	2026-07-16 22:46:22.163526+00	2026-07-19 15:16:24.099803+00
a5237741-7572-473f-b0fc-1786e7903aff	65613b44-64e8-4e01-b534-28083b28619c	rakhi@mail.com	Rakhi	\N	Singhania	Female	91	4561237890	2000-11-05	rakhi.2000@mail.com	Hindi	What city were you born in?	Pune	What is your mothers maiden name?	Ammi	$argon2id$v=19$m=65536,t=3,p=4$6d/X9gz7JU+cir3Cv+P48A$e4AOMW+9ns2LD+MHYCJ1jq7Bo0zcNK8DneRFMQRfQH8	ACTIVE	f	2026-07-18 10:44:59.36661+00	2026-07-19 13:36:00.845039+00
bb9c41c6-5929-423a-809a-d74b9ee4f098	65613b44-64e8-4e01-b534-28083b28619c	lakshya.sen@mail.com	Lakshya	Jeet	Sen	Male	91	7894561230	2000-07-13	lakshya@mail.com	Assamese	What is your pets name?	Billu	Who is your favorite player?	Rolando	$argon2id$v=19$m=65536,t=3,p=4$ILc3TS6nUKTEj8p+VSNTEQ$k1TejWCDSvoleuayHds8miOV3ktFjM+4tgiN3QWyJpE	ACTIVE	f	2026-07-17 08:21:40.386174+00	2026-07-17 08:59:24.71808+00
7164fdde-92e1-4470-9058-f2b794252695	65613b44-64e8-4e01-b534-28083b28619c	johny.wilson@apexsolutions.com	Johny	\N	Wilson	Male	91	9876543210	1990-05-14	\N	English	What is your pets name?	Max	Who is your favorite player?	Michael Jordan	$argon2id$v=19$m=65536,t=3,p=4$BZkTfTAZv6z+tRQBuOJ60A$2DGuH2e1B63Q+Z8Lz5LrXHsUFvTc2/mNlfbXw+PCErs	ACTIVE	t	2026-07-16 22:43:44.386505+00	2026-07-17 14:18:34.125081+00
57071207-8474-4198-b069-be09d10085ed	65613b44-64e8-4e01-b534-28083b28619c	raju@mail.com	Raju	\N	Kohli	Male	91	1234506789	1987-12-05	raju.1987@mail.com	Hindi	What is your pets name?	Jony	Who is your favorite player?	Nadal	$argon2id$v=19$m=65536,t=3,p=4$mpre44xws82l3jj/7mGf5g$M5knrONyfBOy5Xvtu2LNSmjvnfBWh4D8HYXmfg8Sl4c	ACTIVE	f	2026-07-17 20:05:23.475551+00	2026-07-17 20:05:50.78695+00
b84a9236-ddf9-4d80-b81b-5116b9907cb0	65613b44-64e8-4e01-b534-28083b28619c	abc@mail.com	Abc	\N	Def	Male	91	1230456789	2002-08-15	\N	English	What is your pets name?	xyz	Who is your favorite player?	pqr	$argon2id$v=19$m=65536,t=3,p=4$K29gkHFNZhOswj/mttTNjQ$kbn8AWMzTKBk/s+37Y5pWt/tM7lttWRcmWTmwtalCEk	ACTIVE	f	2026-07-19 13:14:58.662714+00	2026-07-19 15:36:51.121656+00
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_hash_key UNIQUE (token_hash);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: modules modules_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_tenant_id_name_resource_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_tenant_id_name_resource_key UNIQUE (tenant_id, name, resource);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: tenants tenants_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_custom_domain_key UNIQUE (custom_domain);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: user_modules user_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_pkey PRIMARY KEY (user_id, module_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_tenant_id_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email);


--
-- Name: users users_tenant_id_mobile_no_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_mobile_no_key UNIQUE (tenant_id, mobile_no);


--
-- Name: idx_audit_logs_tenant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_tenant ON public.audit_logs USING btree (tenant_id);


--
-- Name: idx_invitations_hash; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_invitations_hash ON public.invitations USING btree (token_hash);


--
-- Name: idx_modules_tenant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_modules_tenant ON public.modules USING btree (tenant_id);


--
-- Name: idx_permissions_tenant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_permissions_tenant ON public.permissions USING btree (tenant_id);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_roles_tenant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_roles_tenant ON public.roles USING btree (tenant_id);


--
-- Name: idx_users_tenant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: modules modules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: permissions permissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_modules user_modules_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_modules user_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: user_modules user_modules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tQOzawAvkBpDkwUXK5opmx9FkITJoYdsjf3J1Q3mjIu6W18htgy9Ye6MLr6trkW

