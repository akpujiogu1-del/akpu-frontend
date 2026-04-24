"use client";
import { useEffect } from "react";

interface Props {
  person: {
    name: string;
    title?: string;
    photo_url?: string;
    bio?: string;
    leader_type: string;
  };
  onClose: () => void;
}

export default function BiographyModal({ person, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const typeLabel: Record<string, string> = {
    hall_of_fame: "Hall of Fame",
    past_pg: "Past President General",
    community: "Community Leader",
    political: "Political Leader",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20, maxWidth: 480, width: "100%",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          fontFamily: "Outfit, sans-serif",
        }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #2d6a2d, #6b3a1f)",
          padding: "24px 24px 0", borderRadius: "20px 20px 0 0",
          textAlign: "center",
        }}>
          <img
            src={person.photo_url ?? "/avatar-placeholder.png"}
            alt={person.name}
            style={{
              width: 100, height: 100, borderRadius: "50%",
              objectFit: "cover", border: "4px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          />
          <div style={{ padding: "12px 0 20px" }}>
            <p style={{ color: "white", fontWeight: 800, fontSize: 20, margin: "0 0 4px" }}>
              {person.name}
            </p>
            {person.title && (
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: "0 0 8px" }}>
                {person.title}
              </p>
            )}
            <span style={{
              background: "rgba(255,255,255,0.2)", color: "white",
              padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            }}>
              {typeLabel[person.leader_type] ?? person.leader_type}
            </span>
          </div>
        </div>

        {/* Biography */}
        <div style={{ padding: 24 }}>
          <h3 style={{ color: "#2d6a2d", fontWeight: 700, fontSize: 15, margin: "0 0 12px" }}>
            Biography
          </h3>
          {person.bio ? (
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              {person.bio}
            </p>
          ) : (
            <p style={{ color: "#9ca3af", fontSize: 14, fontStyle: "italic" }}>
              Biography not yet available.
            </p>
          )}

          <button
            onClick={onClose}
            style={{
              display: "block", width: "100%", marginTop: 24,
              background: "#2d6a2d", color: "white", border: "none",
              padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
