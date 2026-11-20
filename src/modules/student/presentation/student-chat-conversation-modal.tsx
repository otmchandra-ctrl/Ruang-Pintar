"use client";

/**
 * Ruang Pintar — Student Chat Conversation Modal (Academic Glass UI v1.2)
 *
 * STAGE UX-04: Student Academic Directory & Academic Health Monitoring
 * Future ready for:
 * - Teacher ↔ Student
 * - Teacher ↔ Parent / Guardian
 */

import React, { useState } from "react";
import { X, Send, MessageSquare, User, Users, CheckCheck, Info } from "lucide-react";
import { StudentAcademicDirectoryItemDTO } from "../domain/student-academic-directory-types";

interface StudentChatConversationModalProps {
  student: StudentAcademicDirectoryItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentChatConversationModal({
  student,
  isOpen,
  onClose,
}: StudentChatConversationModalProps) {
  const [channel, setChannel] = useState<"STUDENT" | "PARENT">("STUDENT");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<
    Array<{ id: string; sender: "TEACHER" | "OTHER"; text: string; time: string }>
  >([]);

  if (!isOpen || !student) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: "TEACHER" as const,
      text: messageText.trim(),
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full bg-white dark:bg-slate-900 flex flex-col overflow-hidden max-w-lg h-[90vh] sm:h-[580px] rounded-t-3xl sm:rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-2xl">
        {/* Header Dialog */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
              {student.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.foto_url}
                  alt={student.nama_lengkap}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <span>
                  {student.nama_lengkap
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                Percakapan: {student.nama_lengkap}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {student.nisn
                  ? `NISN ${student.nisn}`
                  : student.nis
                    ? `NIS ${student.nis}`
                    : "Siswa"}{" "}
                • {student.rombel_nama}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Percakapan"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Channel Selector: Siswa vs Orang Tua */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Saluran Komunikasi:
          </span>

          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 font-mono text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChannel("STUDENT")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                channel === "STUDENT"
                  ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel("PARENT")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                channel === "PARENT"
                  ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Orang Tua</span>
            </button>
          </div>
        </div>

        {/* Chat History Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col">
          <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-[11px] font-mono text-blue-700 dark:text-blue-300 flex items-start gap-2.5 shrink-0">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
            <span>
              Kanal komunikasi akademik langsung Guru ↔{" "}
              {channel === "STUDENT" ? "Siswa" : "Orang Tua/Wali"}. Pesan terkirim ke notifikasi
              aplikasi Ruang Pintar.
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2.5 my-auto">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Belum Ada Pesan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Mulai percakapan langsung dengan{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {channel === "STUDENT"
                    ? student.nama_lengkap
                    : `Orang Tua ${student.nama_lengkap}`}
                </strong>{" "}
                mengenai perkembangan belajar, tugas, atau presensi.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === "TEACHER";
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? "bg-[#2563EB] text-white rounded-br-xs"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs"
                    }`}
                  >
                    <p>{m.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] font-mono mt-1 ${
                        isMe ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      <span>{m.time}</span>
                      {isMe && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-2"
        >
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              channel === "STUDENT"
                ? `Tulis pesan kepada ${student.nama_lengkap}...`
                : `Tulis pesan kepada Orang Tua ${student.nama_lengkap}...`
            }
            className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          <button
            type="submit"
            disabled={!messageText.trim()}
            className="h-11 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
}
