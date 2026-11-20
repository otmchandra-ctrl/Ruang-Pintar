/**
 * Ruang Pintar — M14 CBT: CBT Delivery Foundation Facade
 *
 * Fasad terpadu yang menyatukan seluruh sub-engine CBT Delivery:
 * 1. Assessment Publication Engine (9-State Lifecycle)
 * 2. Exam Snapshot Engine (Immutable & Cryptographic Hash)
 * 3. CBT Session Engine (Time Window & Room Orchestration)
 * 4. Exam Token Engine (MVP 6-Char Alphanumeric)
 * 5. Student Eligibility Engine (Multi-Factor Verification)
 * 6. Assessment Attempt Engine (5-State Foundation & Authoritative Timer)
 *
 * Boundary & Authorization Hardening:
 * - TEACHER: Kelola ujian & sesi pada rombel yang diampu, token, audit kelas.
 * - STUDENT: Cek kelayakan sendiri, inisiasi & submit attempt miliknya sendiri. Kunci jawaban tidak pernah bocor.
 * - SCHOOL_STAFF: Jadwalkan dan pantau sesi sekolah, kelola token darurat.
 * - HEADMASTER: Supervisi sekolah luas, telaah dan pengesahan REVIEW -> FINAL.
 * - Tenant isolation: Wajib terikat sekolah_id actor.
 */

import {
  AssessmentPublicationEngine,
  assessmentPublicationEngine,
} from "./assessment-publication-engine";
import { ExamSnapshotEngine, examSnapshotEngine } from "./exam-snapshot-engine";
import { CbtSessionEngine, cbtSessionEngine } from "./cbt-session-engine";
import { ExamTokenEngine, examTokenEngine } from "./exam-token-engine";
import { StudentEligibilityEngine, studentEligibilityEngine } from "./student-eligibility-engine";
import { AssessmentAttemptEngine, assessmentAttemptEngine } from "./assessment-attempt-engine";

export class CbtDeliveryFacade {
  readonly publication: AssessmentPublicationEngine;
  readonly snapshot: ExamSnapshotEngine;
  readonly session: CbtSessionEngine;
  readonly token: ExamTokenEngine;
  readonly eligibility: StudentEligibilityEngine;
  readonly attempt: AssessmentAttemptEngine;

  constructor(dependencies?: {
    publication?: AssessmentPublicationEngine;
    snapshot?: ExamSnapshotEngine;
    session?: CbtSessionEngine;
    token?: ExamTokenEngine;
    eligibility?: StudentEligibilityEngine;
    attempt?: AssessmentAttemptEngine;
  }) {
    this.publication = dependencies?.publication || assessmentPublicationEngine;
    this.snapshot = dependencies?.snapshot || examSnapshotEngine;
    this.session = dependencies?.session || cbtSessionEngine;
    this.token = dependencies?.token || examTokenEngine;
    this.eligibility = dependencies?.eligibility || studentEligibilityEngine;
    this.attempt = dependencies?.attempt || assessmentAttemptEngine;
  }
}

export const cbtDeliveryFacade = new CbtDeliveryFacade();
