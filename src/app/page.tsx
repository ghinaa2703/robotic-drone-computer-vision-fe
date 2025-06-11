"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { FormEvent, ChangeEvent } from "react"

export default function Home() {
  const [streamUrl, setStreamUrl] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    if (!streamUrl.trim()) {
      setErrorMessage("Please enter a stream URL.")
      setIsSubmitting(false)
      return
    }

    setTimeout(() => {
      router.push(`/dashboard?url=${encodeURIComponent(streamUrl)}`)
    }, 800)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePosition({ x, y })
    }
  }

  // Styles yang konsisten dengan dashboard
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#0f172a", // Sama dengan dashboard
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#1e293b", // Sama dengan dashboard cards
    border: "1px solid #334155", // Sama dengan dashboard borders
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
    maxWidth: "500px",
    width: "100%",
  }

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "32px",
    gap: "16px",
  }

  const titleStyle: React.CSSProperties = {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#22d3ee", // Cyan seperti dashboard
    margin: 0,
    textAlign: "center",
  }

  const subtitleStyle: React.CSSProperties = {
    color: "#94a3b8", // Gray seperti dashboard
    fontSize: "16px",
    marginTop: "8px",
    textAlign: "center",
  }

  const featureGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "32px",
    width: "100%",
    maxWidth: "500px",
  }

  const featureCardStyle: React.CSSProperties = {
    backgroundColor: "#1e293b", // Sama dengan dashboard cards
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#0f172a", // Background gelap seperti dashboard input areas
    border: "1px solid #475569",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "monospace",
  }

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#3b82f6", // Blue seperti dashboard
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: isSubmitting ? "not-allowed" : "pointer",
    opacity: isSubmitting ? 0.5 : 1,
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    color: "#94a3b8", // Gray seperti dashboard labels
    marginBottom: "8px",
    fontWeight: "500",
  }

  const features = [
    { icon: "🛡️", label: "Secure", color: "#22c55e" },
    { icon: "⚡", label: "Fast", color: "#eab308" },
    { icon: "📡", label: "Connected", color: "#3b82f6" },
  ]

  return (
    <div style={containerStyle}>
      <div style={{ width: "100%", maxWidth: "600px", position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚁</div>
            <h1 style={titleStyle}>Drone Control Center</h1>
            <p style={subtitleStyle}>Advanced Stream Monitoring Interface</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={featureGridStyle}>
          {features.map((feature, index) => (
            <div
              key={feature.label}
              style={featureCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#475569"
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#334155"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{feature.icon}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>{feature.label}</div>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div
          ref={cardRef}
          style={cardStyle}
          onMouseMove={handleMouseMove}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#475569"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#334155"
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#e2e8f0",
                margin: "0 0 8px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📹 Connect to Stream
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Enter your drone stream URL to begin monitoring
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label htmlFor="streamUrl" style={labelStyle}>
                Stream URL
              </label>
              <input
                type="text"
                id="streamUrl"
                value={streamUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStreamUrl(e.target.value)}
                placeholder="rtmp://localhost:1935/live/drone"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "#22d3ee"
                  e.target.style.boxShadow = "0 0 0 3px rgba(34, 211, 238, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#475569"
                  e.target.style.boxShadow = "none"
                }}
              />
              {errorMessage && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#ef4444",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <span style={{ color: "#ef4444", fontSize: "14px" }}>{errorMessage}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={buttonStyle}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = "#2563eb"
                  e.currentTarget.style.transform = "translateY(-1px)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = "#3b82f6"
                  e.currentTarget.style.transform = "translateY(0)"
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid white",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  Connecting...
                </>
              ) : (
                <>▶️ Launch Dashboard</>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #334155",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              <span>🚁 Processing by FastAPI</span>
              <span>•</span>
              <span>📱 Display by Next.js</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
