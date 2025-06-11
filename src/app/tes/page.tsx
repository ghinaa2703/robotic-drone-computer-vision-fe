"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { FormEvent, ChangeEvent } from "react"
import {
  DrillIcon as Drone,
  Loader2,
  Zap,
  Shield,
  Wifi,
  Camera,
  Settings,
  Play,
  MousePointer2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [streamUrl, setStreamUrl] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
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

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 box-border relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-slate-500/5 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header with interactive elements */}
        <div className="flex items-center justify-center mb-8 group">
          <div className="relative">
            <Drone className="h-16 w-16 text-cyan-400 mr-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-cyan-300" />
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-blue-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-slate-300 bg-clip-text text-transparent hover:from-cyan-300 hover:via-blue-300 hover:to-slate-200 transition-all duration-500 cursor-default">
              Drone Stream
            </h1>
            <p className="text-slate-400 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Advanced Control Interface
            </p>
          </div>
        </div>

        {/* Interactive feature cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Shield, label: "Secure", color: "text-green-400" },
            { icon: Zap, label: "Fast", color: "text-yellow-400" },
            { icon: Wifi, label: "Connected", color: "text-blue-400" },
          ].map((feature, index) => (
            <div
              key={feature.label}
              className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center hover:bg-slate-800/50 hover:border-slate-600/50 hover:scale-105 transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <feature.icon
                className={`h-6 w-6 mx-auto mb-1 ${feature.color} group-hover:scale-110 transition-transform duration-300`}
              />
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors duration-300">
                {feature.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main interactive card */}
        <Card
          ref={cardRef}
          className={`border-slate-700/50 bg-slate-900/30 backdrop-blur-xl shadow-2xl shadow-blue-900/20 transition-all duration-500 hover:shadow-cyan-900/30 hover:border-slate-600/50 relative overflow-hidden ${isDragging ? "scale-105 rotate-1" : ""}`}
          onMouseMove={handleMouseMove}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
          }}
        >
          {/* Hover effect overlay */}
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.05) 0%, transparent 40%)`,
            }}
          />

          <CardHeader className="relative z-10">
            <CardTitle className="text-center text-2xl text-slate-200 flex items-center justify-center gap-2 group">
              <Camera className="h-6 w-6 text-cyan-400 group-hover:animate-pulse" />
              Connect to Your Drone
              <MousePointer2 className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </CardTitle>
          </CardHeader>

          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="streamUrl" className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-400" />
                  Enter Drone Stream URL
                </label>
                <div className="relative group">
                  <Input
                    type="text"
                    id="streamUrl"
                    value={streamUrl}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStreamUrl(e.target.value)}
                    placeholder="e.g., rtsp://your_drone_ip/stream or test/video.mp4"
                    className="bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-500 focus:border-cyan-500 hover:bg-slate-800/70 hover:border-slate-500/50 transition-all duration-300 pr-10"
                  />
                  <Wifi className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors duration-300" />
                </div>
                {errorMessage && (
                  <p className="text-red-400 text-sm animate-pulse flex items-center gap-1">
                    <span className="h-2 w-2 bg-red-400 rounded-full animate-ping"></span>
                    {errorMessage}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95 group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Establishing Connection...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Launch Dashboard
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-700/30 pt-4 relative z-10">
            <div className="text-slate-500 text-xs flex items-center gap-2 hover:text-slate-400 transition-colors duration-300 cursor-default">
              <Drone className="h-3 w-3 animate-pulse" />
              Powered by Next.js & FastAPI
              <div className="flex gap-1">
                <div className="h-1 w-1 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                <div className="h-1 w-1 bg-slate-400 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Interactive bottom elements */}
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div
                key={dot}
                className="h-2 w-2 bg-slate-600 rounded-full hover:bg-cyan-400 hover:scale-150 transition-all duration-300 cursor-pointer"
                style={{ animationDelay: `${dot * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
