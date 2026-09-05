"""Seeds realistic Malaysian-university dummy data for local testing/demo:
three tenants representative of the PRD's target users (a rural UiTM branch
campus, an East Malaysia university, and a distance-learning university),
each with a policy admin, two students, and its own tailored AI-use/academic
integrity policy already chunked and indexed -- so the Integrity Advisor has
real, *different* institution-specific answers to give from the first run.

Run with: python -m app.seed
"""
from app.database import Base, SessionLocal, engine, is_sqlite
from app.models import PolicyDocument, Tenant, User
from app.security import hash_password
from app.services.document_parser import chunk_pages
from app.services.rag_service import index_policy_document
from sqlalchemy import text

UITM_SABAH_POLICY = """UiTM Cawangan Sabah — Dasar Penggunaan AI dan Integriti Akademik (v1.0)

Seksyen 1: Penggunaan AI Yang Dibenarkan
Pelajar dibenarkan menggunakan alat AI generatif (seperti ChatGPT, Claude) untuk sumbang saran idea, menyemak tatabahasa, dan memahami konsep sukar. Penggunaan AI untuk menjana jawapan penuh bagi kuiz, tugasan berformat esei, atau kod atur cara yang diserahkan sebagai hasil kerja asli pelajar adalah DILARANG sama sekali, walaupun dengan pengakuan.

Seksyen 2: Pengisytiharan Penggunaan AI
Berbeza daripada sesetengah universiti lain, UiTM Cawangan Sabah TIDAK membenarkan pengisytiharan sebagai jalan keluar bagi kandungan substantif yang dijana AI. Pengisytiharan hanya dibenarkan untuk penggunaan sokongan (semakan tatabahasa, terjemahan).

Seksyen 3: Definisi Plagiarisme
Plagiarisme termasuk menyalin idea, data, atau hasil kerja (termasuk output AI) tanpa pengiktirafan yang sewajarnya, serta menyerahkan kandungan yang dijana sepenuhnya oleh AI sebagai hasil kerja asli.

Seksyen 4: Piawaian Petikan
Semua tugasan bertulis mesti mengikut gaya petikan APA edisi ke-7, selaras dengan garis panduan MQA (Malaysian Qualifications Agency) untuk program di bawah Cawangan Sabah.

Seksyen 5: Akibat Salah Laku Akademik
Kesalahan pertama: gred sifar bagi komponen berkenaan dan rujukan kepada Penyelaras Program. Kesalahan kedua: rujukan kepada Jawatankuasa Integriti Akademik Fakulti, yang boleh membawa kepada kegagalan kursus. Kesalahan serius (contohnya menyerahkan esei yang dijana sepenuhnya oleh AI sebagai kerja asli): rujukan terus kepada Lembaga Tatatertib Universiti, yang boleh membawa kepada penggantungan pengajian -- ini sejajar dengan Rangka Kerja Etika AI Kebangsaan (NAGI).

Seksyen 6: Panduan Kawasan Kelabu
Jika pelajar tidak pasti sama ada penggunaan AI dibenarkan untuk sesuatu tugasan, andaian asas ialah TIDAK dibenarkan sehingga pensyarah kursus mengesahkan sebaliknya secara bertulis.
"""

UMS_POLICY = """Universiti Malaysia Sabah (UMS) — AI Use and Academic Integrity Guidelines (v2.1)

Section 1: Permitted AI Use
UMS adopts a disclosure-based model, consistent with MQA's Code of Practice for Programme Accreditation and the national NAGI AI ethics framework. Students MAY use generative AI tools (ChatGPT, Claude, Gemini) for brainstorming, summarizing their own already-read material, and improving grammar, PROVIDED that any assignment-level use is disclosed in an AI Usage Statement appended to the submission.

Section 2: AI Usage Statement Requirement
The AI Usage Statement must specify: (a) which tool was used, (b) for what purpose, and (c) an estimate of what percentage of the final submitted text originated from AI output versus the student's own writing. Submissions with an undisclosed AI Usage Statement where AI-generated text is later detected are treated as a Section 5 misconduct case, not merely a formatting error.

Section 3: Plagiarism Definition
Plagiarism is presenting another's ideas, words, data, or AI-generated output as one's own without proper acknowledgement, including via an incomplete or misleading AI Usage Statement.

Section 4: Citation Standard
APA 7th edition is mandatory for all Faculty of Science and Natural Resources and Faculty of Business, Economics and Accountancy submissions. Some professional programmes (e.g. Law) require a different standard specified in the course syllabus -- check with your lecturer if unsure.

Section 5: Consequences of Academic Misconduct
First offense: mandatory resubmission with capped grade (maximum 50%) on the affected component, and a formal advisory meeting with the course coordinator. Second offense: referral to the Faculty Academic Integrity Panel; possible course failure. Severe or repeated cases (e.g. contract cheating, wholesale AI-generated theses/dissertations): referral to the University Disciplinary Board under the Universities and University Colleges Act 1971, which may result in suspension or expulsion.

Section 6: Distance and Off-Campus Students
Students enrolled in off-campus or distance-access programmes are held to the identical standard as on-campus students; lack of physical access to the library or a writing centre is not a mitigating factor in a misconduct proceeding, but IS grounds for requesting an extension if raised proactively before a deadline.
"""

OUM_POLICY = """Open University Malaysia (OUM) — Panduan Etika AI dan Integriti Akademik Pembelajaran Jarak Jauh (v1.3)

Section 1: Context for Distance Learners
As a distance-learning institution, OUM recognises that its learners -- many balancing work, family, and limited access to physical campus resources -- rely more heavily on digital tools, including AI, than typical full-time on-campus students. This policy is written with that context in mind, in line with MQA's Distance Learning Guidelines and the national NAGI AI ethics framework.

Section 2: Permitted AI Use
Learners may use AI tools to: clarify difficult concepts from module materials, get feedback on the structure of a draft (not its content), check grammar, and translate between English and Bahasa Malaysia for their own comprehension. AI must NOT be used to generate content for graded Tutor-Marked Assignments (TMAs), online forum discussion posts, or final examinations.

Section 3: Plagiarism and AI-Generated Content
Submitting AI-generated text as original TMA content -- even if lightly edited -- constitutes plagiarism under OUM's Academic Integrity Policy, identical in severity to copying from a published source without citation.

Section 4: Citation Standard
APA 7th edition is the required citation style across all OUM programmes. Learners are strongly encouraged to use the Source Organiser and citation tools available on this platform given limited access to a physical library.

Section 5: Consequences of Academic Misconduct
First offense: zero mark for the affected TMA and a mandatory academic integrity briefing (online). Second offense: referral to the Programme Academic Integrity Committee; may result in failing the course. Third or severe offense (e.g. AI-generated final year project): referral to the OUM Senate Disciplinary Committee, which may result in suspension or termination of studies.

Section 6: Getting Help Without Campus Access
Learners who do not have access to a physical library or a human tutor should use this platform's Research Discovery and Writing Support tools as their first line of support, and should email their assigned e-tutor for any question this platform cannot answer with confidence.
"""

TENANTS = [
    {
        "name": "UiTM Cawangan Sabah",
        "locale_default": "ms",
        "policy_title": "Dasar Penggunaan AI dan Integriti Akademik v1.0",
        "policy_text": UITM_SABAH_POLICY,
        "admin_email": "admin@uitmsabah.demo.edu.my",
        "students": [
            ("nurul.aisyah@uitmsabah.demo.edu.my", "ms"),
            ("azman.rahman@uitmsabah.demo.edu.my", "ms"),
        ],
    },
    {
        "name": "Universiti Malaysia Sabah (UMS)",
        "locale_default": "en",
        "policy_title": "AI Use and Academic Integrity Guidelines v2.1",
        "policy_text": UMS_POLICY,
        "admin_email": "admin@ums.demo.edu.my",
        "students": [
            ("melissa.jaimin@ums.demo.edu.my", "en"),
            ("hafiz.osman@ums.demo.edu.my", "en"),
        ],
    },
    {
        "name": "Open University Malaysia (OUM)",
        "locale_default": "en",
        "policy_title": "Panduan Etika AI dan Integriti Akademik PJJ v1.3",
        "policy_text": OUM_POLICY,
        "admin_email": "admin@oum.demo.edu.my",
        "students": [
            ("siti.zulaikha@oum.demo.edu.my", "ms"),
            ("kumaran.veloo@oum.demo.edu.my", "en"),
        ],
    },
]

DEMO_PASSWORD = "DemoPass123!"


def run() -> None:
    if not is_sqlite:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print(f"Database: {'SQLite (local dev)' if is_sqlite else 'Postgres'}\n")

        for spec in TENANTS:
            existing = db.query(Tenant).filter(Tenant.name == spec["name"]).first()
            if existing:
                print(f"'{spec['name']}' already seeded, skipping.")
                continue

            tenant = Tenant(name=spec["name"], locale_default=spec["locale_default"])
            db.add(tenant)
            db.flush()

            admin = User(
                tenant_id=tenant.id,
                email=spec["admin_email"],
                hashed_password=hash_password(DEMO_PASSWORD),
                role="policy_admin",
                language_pref=spec["locale_default"],
            )
            db.add(admin)

            for email, lang in spec["students"]:
                db.add(
                    User(
                        tenant_id=tenant.id,
                        email=email,
                        hashed_password=hash_password(DEMO_PASSWORD),
                        role="student",
                        language_pref=lang,
                    )
                )
            db.flush()

            document = PolicyDocument(
                tenant_id=tenant.id,
                title=spec["policy_title"],
                doc_type="ai_use_policy",
                storage_path="seeded_in_memory",
            )
            db.add(document)
            db.flush()

            chunks = chunk_pages([(1, spec["policy_text"])])
            index_policy_document(db, document, chunks)

            db.commit()
            print(f"Seeded '{spec['name']}' (tenant ID: {tenant.id})")
            print(f"  Policy admin: {spec['admin_email']} / {DEMO_PASSWORD}")
            for email, lang in spec["students"]:
                print(f"  Student ({lang}):    {email} / {DEMO_PASSWORD}")
            print()

        # One super-admin across all tenants, attached to the first tenant for FK purposes.
        if not db.query(User).filter(User.email == "superadmin@aasp.demo").first():
            first_tenant = db.query(Tenant).first()
            db.add(
                User(
                    tenant_id=first_tenant.id,
                    email="superadmin@aasp.demo",
                    hashed_password=hash_password(DEMO_PASSWORD),
                    role="super_admin",
                    language_pref="en",
                )
            )
            db.commit()
            print(f"Super-admin: superadmin@aasp.demo / {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
