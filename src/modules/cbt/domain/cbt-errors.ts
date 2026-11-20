/**
 * Ruang Pintar — CBT Domain Errors (M14)
 */

export class CbtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CbtError";
  }
}

export class CbtNotFoundError extends CbtError {
  constructor(entity: string, identifier?: string) {
    super(`${entity} tidak ditemukan${identifier ? `: ${identifier}` : ""}.`);
    this.name = "CbtNotFoundError";
  }
}

export class CbtValidationError extends CbtError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "CbtValidationError";
    this.errors = errors;
  }
}

export class CbtUnauthorizedError extends CbtError {
  constructor(
    message = "Akses ditolak: Anda tidak memiliki izin untuk mengelola atau mengakses CBT ini."
  ) {
    super(message);
    this.name = "CbtUnauthorizedError";
  }
}

export class CbtAttemptClosedError extends CbtError {
  constructor(
    message = "Sesi ujian ini telah ditutup atau dikumpulkan, tidak dapat menerima jawaban lagi."
  ) {
    super(message);
    this.name = "CbtAttemptClosedError";
  }
}

export class CbtTimerExpiredError extends CbtError {
  constructor(
    message = "Batas waktu pengerjaan server telah habis. Sesi ujian otomatis diselesaikan."
  ) {
    super(message);
    this.name = "CbtTimerExpiredError";
  }
}

export class CbtOneActiveAttemptViolationError extends CbtError {
  constructor(
    message = "Anda sudah memiliki sesi ujian aktif yang sedang berlangsung. Harap lanjutkan sesi tersebut."
  ) {
    super(message);
    this.name = "CbtOneActiveAttemptViolationError";
  }
}

export class CbtExamNotAvailableError extends CbtError {
  constructor(
    message = "Ujian ini belum dibuka, sudah berakhir, atau belum siap untuk dikerjakan."
  ) {
    super(message);
    this.name = "CbtExamNotAvailableError";
  }
}

export class CbtTransferError extends CbtError {
  constructor(message: string) {
    super(`Gagal mentransfer nilai CBT ke Buku Nilai: ${message}`);
    this.name = "CbtTransferError";
  }
}

export class CbtAccessDeniedError extends CbtError {
  constructor(
    message = "Akses ditolak: Anda tidak memiliki izin untuk mengelola atau mengakses CBT ini."
  ) {
    super(message);
    this.name = "CbtAccessDeniedError";
  }
}

export class CbtExamNotActiveError extends CbtError {
  constructor(
    message = "Ujian ini belum dibuka, sudah berakhir, atau belum siap untuk dikerjakan."
  ) {
    super(message);
    this.name = "CbtExamNotActiveError";
  }
}

export class CbtAttemptLockedError extends CbtError {
  constructor(message = "Sesi ujian Anda telah terkunci karena indikasi pelanggaran integritas.") {
    super(message);
    this.name = "CbtAttemptLockedError";
  }
}

export class CbtSnapshotImmutableError extends CbtError {
  constructor(
    message = "Snapshot ujian telah berstatus beku (immutable) dan tidak dapat dimodifikasi atau dihapus."
  ) {
    super(message);
    this.name = "CbtSnapshotImmutableError";
  }
}

export class CbtInvalidTransitionError extends CbtError {
  constructor(fromStatus: string, toStatus: string, reason?: string) {
    super(
      `Transisi status publikasi tidak diizinkan dari '${fromStatus}' ke '${toStatus}'${
        reason ? `: ${reason}` : "."
      }`
    );
    this.name = "CbtInvalidTransitionError";
  }
}

export class CbtInvalidTokenError extends CbtError {
  constructor(message = "Token ujian tidak valid, salah, atau telah kedaluwarsa.") {
    super(message);
    this.name = "CbtInvalidTokenError";
  }
}

export class CbtStudentNotEligibleError extends CbtError {
  constructor(reasons: string[]) {
    super(`Siswa tidak berhak mengikuti ujian: ${reasons.join(", ")}`);
    this.name = "CbtStudentNotEligibleError";
  }
}

export class CbtSessionClosedError extends CbtError {
  constructor(
    message = "Sesi ujian ini belum dibuka, telah ditutup, atau berada di luar rentang jadwal aktif."
  ) {
    super(message);
    this.name = "CbtSessionClosedError";
  }
}

export class CbtSessionInvalidatedError extends CbtError {
  constructor(
    message = "Sesi pengerjaan ujian Anda telah dibuka di perangkat lain. Akses pada perangkat ini telah dinonaktifkan."
  ) {
    super(message);
    this.name = "CbtSessionInvalidatedError";
  }
}
