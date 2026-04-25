"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BiographyModal from "@/components/BiographyModal";

const SOCIAL = [
  { key: "tiktok_url",    label: "TikTok",    icon: "🎵" },
  { key: "facebook_url",  label: "Facebook",  icon: "👥" },
  { key: "instagram_url", label: "Instagram", icon: "📸" },
  { key: "youtube_url",   label: "YouTube",   icon: "▶️" },
];

function toYTEmbed(url: string) {
  const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

interface Props {
  session: any;
  settings: Record<string, string>;
  hallOfFame: any[];
  community: any[];
  political: any[];
  pastPGs: any[];
  news: any[];
}

export default function LandingClient({ session, settings: s, hallOfFame, community, political, pastPGs, news }: Props) {
  const [bioPerson, setBioPerson] = useState<any | null>(null);

  return (
    <div style={{ fontFamily: "Outfit, Segoe UI, sans-serif" }}>
      <Navbar session={session} />

      {/* HERO */}
      <section style={{ background: "#eaf5ea", display: "grid", gridTemplateColumns: "1fr", gap: 16, padding: 16 }} className="md:grid-cols-2 md:p-10">
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          {s.landing_video_url ? (
            <iframe src={toYTEmbed(s.landing_video_url)} className="w-full h-full" allowFullScreen title="Akpu Community Video" />
          ) : (
            <div style={{ background: "#c8e6c9", color: "#2d6a2d" }} className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-2">
              <span className="text-5xl">🎬</span>
              <p className="font-semibold">Community Video</p>
              <p className="text-sm opacity-70">Set by admin in settings</p>
            </div>
          )}
        </div>
        <div>
          <p style={{ color: "#6b3a1f" }} className="font-bold text-lg mb-1">Our Location</p>
          <p className="text-sm text-gray-600 mb-1">Akpu Town, Orumba South LGA</p>
          <p className="text-sm text-gray-600 mb-3">Anambra State, Nigeria</p>
          {s.map_image_url ? (
            <img
              src={s.map_image_url}
              alt="Akpu Town Map"
              style={{ width: "100%", height: 256, objectFit: "cover", borderRadius: 12, border: "2px solid #2d6a2d" }}
            />
          ) : (
            <div style={{ background: "#eaf5ea", border: "2px dashed #2d6a2d", color: "#2d6a2d", width: "100%", height: 256, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 36 }}>🗺️</span>
              <p style={{ fontWeight: 600, margin: 0 }}>Map</p>
              <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Upload map image in Admin Settings</p>
            </div>
          )}
        </div>
      </section>

      {/* WELCOME */}
      <section className="text-center py-16" style={{ background: "white" }}>
        <h1 style={{ color: "#2d6a2d" }} className="text-4xl md:text-5xl font-extrabold mb-2">Welcome to Akpu</h1>
        <p style={{ color: "#6b3a1f" }} className="text-xl font-light mb-8">The Land of the Ancients</p>
        <Link href="/auth/register" style={{ background: "#6b3a1f", color: "white" }}
          className="inline-block px-10 py-4 rounded-full text-lg font-semibold shadow-lg hover:opacity-90 transition">
          Join Community
        </Link>
      </section>

      {/* HALL OF FAME */}
      <section style={{ background: "#eaf5ea" }} className="py-12">
        <h2 style={{ color: "#2d6a2d" }} className="text-2xl font-bold text-center mb-8">Hall of Fame</h2>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {hallOfFame.length > 0 ? hallOfFame.map((l) => (
            <div key={l.id} className="bg-white rounded-xl shadow p-4 text-center">
              <img src={l.photo_url ?? "/avatar-placeholder.png"} alt={l.name}
                className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                style={{ border: "4px solid #2d6a2d" }} />
              <p className="font-semibold text-gray-800 text-sm">{l.name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs mb-2">{l.title}</p>
              <button
                onClick={() => setBioPerson(l)}
                style={{ background: "#2d6a2d", color: "white", border: "none", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Biography
              </button>
            </div>
          )) : ["Community Champion", "Distinguished Elder", "Youth Icon", "Cultural Ambassador"].map((name, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
                style={{ background: "#eaf5ea", border: "4px solid #2d6a2d" }}>👤</div>
              <p className="font-semibold text-gray-400 text-sm">{name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">Add via Admin</p>
            </div>
          ))}
        </div>
      </section>

      {/* OUR LEADERS */}
      <section className="py-12" style={{ background: "white" }}>
        <h2 style={{ color: "#2d6a2d" }} className="text-2xl font-bold text-center mb-8">Our Leaders</h2>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px 8px", display: "flex", gap: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {community.length > 0 ? community.map((l) => (
            <div key={l.id} className="min-w-[160px] rounded-xl p-4 text-center shrink-0" style={{ background: "#eaf5ea" }}>
              <img src={l.photo_url ?? "/avatar-placeholder.png"} alt={l.name}
                className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
                style={{ border: "4px solid #2d6a2d" }} />
              <p className="font-semibold text-sm">{l.name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{l.title}</p>
            </div>
          )) : ["President General", "Vice President", "Secretary", "Treasurer", "Financial Sec."].map((title, i) => (
            <div key={i} className="min-w-[160px] rounded-xl p-4 text-center shrink-0" style={{ background: "#eaf5ea" }}>
              <div className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl"
                style={{ background: "white", border: "4px solid #2d6a2d" }}>👤</div>
              <p className="font-semibold text-sm text-gray-400">Leader Name</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POLITICAL LEADERS */}
      <section className="py-12" style={{ background: "#f8f0e8" }}>
        <h2 style={{ color: "#6b3a1f" }} className="text-2xl font-bold text-center mb-8">Our Political Leaders</h2>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          {political.length > 0 ? political.map((l) => (
            <div key={l.id} className="bg-white rounded-xl shadow p-4 text-center">
              <img src={l.photo_url ?? "/avatar-placeholder.png"} alt={l.name}
                className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
                style={{ border: "4px solid #6b3a1f" }} />
              <p className="font-semibold text-sm">{l.name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{l.title}</p>
            </div>
          )) : ["Senator", "House of Reps Member", "Councilor"].map((title, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl"
                style={{ background: "#f8f0e8", border: "4px solid #6b3a1f" }}>👤</div>
              <p className="font-semibold text-gray-400 text-sm">Leader Name</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PAST PGs */}
      {pastPGs.length > 0 && (
        <section className="py-12" style={{ background: "white" }}>
          <h2 style={{ color: "#2d6a2d" }} className="text-2xl font-bold text-center mb-8">Past Presidents General</h2>
          <div className="max-w-5xl mx-auto px-6 space-y-4">
            {pastPGs.map((l, index) => (
              <div key={l.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <img src={l.photo_url ?? "/avatar-placeholder.png"} alt={l.name}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid #2d6a2d", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: 16, color: "#2d6a2d", margin: "0 0 2px" }}>{l.name}</p>
                  <p style={{ fontSize: 13, color: "#6b3a1f", margin: "0 0 4px" }}>{l.title}</p>
                  <span style={{ fontSize: 11, background: "#eaf5ea", color: "#2d6a2d", padding: "2px 10px", borderRadius: 10, fontWeight: 600 }}>
                    #{index + 1}
                  </span>
                </div>
                <button
                  onClick={() => setBioPerson(l)}
                  style={{ background: "#2d6a2d", color: "white", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  Biography
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LATEST NEWS */}
      <section className="py-12" style={{ background: "#eaf5ea" }}>
        <h2 style={{ color: "#2d6a2d" }} className="text-2xl font-bold text-center mb-8">Latest News</h2>
        <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {news.length > 0 ? news.map((n) => (
            <div key={n.id} className="rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition bg-white">
              {n.image_url && <img src={n.image_url} alt={n.title} className="w-full h-36 object-cover" />}
              <div className="p-4">
                <p style={{ color: "#2d6a2d" }} className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.body}</p>
              </div>
            </div>
          )) : ["Community Meeting", "Development Update", "Cultural Festival", "Youth Program"].map((title, i) => (
            <div key={i} className="rounded-xl border overflow-hidden shadow-sm bg-white">
              <div className="w-full h-36 flex items-center justify-center text-4xl" style={{ background: "#eaf5ea" }}>📰</div>
              <div className="p-4">
                <p style={{ color: "#2d6a2d" }} className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-400 mt-1">News will appear here once posted by admin</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-white text-center" style={{ background: "#2d6a2d" }}>
        <p className="font-semibold mb-4 text-lg">Social Handles</p>
        <div className="flex justify-center gap-4 flex-wrap mb-6">
          {SOCIAL.map(({ key, label, icon }) => {
            const url = s[key];
            return url ? (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <span>{icon}</span><span>{label}</span>
              </a>
            ) : (
              <span key={key} className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.1)", opacity: 0.5 }}>
                <span>{icon}</span><span>{label}</span>
              </span>
            );
          })}
        </div>
        <p className="text-xs opacity-80 mb-1">{`© ${new Date().getFullYear()} Akpu Community Portal · Land of the Ancients`}</p>
        <p className="text-xs opacity-60 mb-3">Platform brought to you by One Nation Agency Services</p>
        <div className="flex justify-center gap-6 text-xs opacity-70">
          <a href="/terms" className="hover:underline text-white">Terms of Use</a>
          <a href="/privacy" className="hover:underline text-white">Privacy Policy</a>
        </div>
      </footer>

      {/* Biography Modal */}
      {bioPerson && (
        <BiographyModal person={bioPerson} onClose={() => setBioPerson(null)} />
      )}
    </div>
  );
}
