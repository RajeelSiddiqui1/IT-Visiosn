"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { io } from "socket.io-client"
import { startInterview, endInterview, submitAnswer, getInterviewResults } from "../lib/api"

const isDevTunnel = typeof window !== "undefined" && window.location.origin.includes(".devtunnels.ms");
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const SOCKET_URL = isDevTunnel
  ? "https://d9666bbk-5173.asse.devtunnels.ms"
  : backendUrl;

const useInterviewSession = (interviewId, userId) => {
  const [socket, setSocket] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [transcript, setTranscript] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [interviewDuration, setInterviewDuration] = useState(null)
  const [timerInterval, setTimerInterval] = useState(null)

  const startInterviewMutation = useMutation({
    mutationFn: () => startInterview(interviewId),
  })

  const endInterviewMutation = useMutation({
    mutationFn: () => endInterview(interviewId),
  })

  const submitAnswerMutation = useMutation({
    mutationFn: (answer) =>
      submitAnswer({
        interviewId,
        question: currentQuestion,
        answer,
      }),
  })

  const resultsQuery = useQuery({
    queryKey: ["interviewResults", interviewId],
    queryFn: () => getInterviewResults(interviewId),
    enabled: false,
  })

  useEffect(() => {
    if (!interviewId) return

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
      socketInstance.emit("join-room", interviewId)
    })

    socketInstance.on("question", (question) => {
      setCurrentQuestion(question)
      setTranscript((prev) => [...prev, { type: "ai", text: question }])
    })

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [interviewId, timerInterval])

  const start = useCallback(
    async (duration = 15) => {
      try {
        await startInterviewMutation.mutateAsync()
        setInterviewDuration(duration)
        setTimeRemaining(duration * 60)

        const interval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        setTimerInterval(interval)
      } catch (error) {
        console.error("Failed to start interview:", error)
      }
    },
    [startInterviewMutation],
  )

  const submitUserAnswer = useCallback(
    async (answer) => {
      try {
        setTranscript((prev) => [...prev, { type: "user", text: answer }])

        if (socket) {
          socket.emit("answer", { interviewId, question: currentQuestion, answer })
        }

        await submitAnswerMutation.mutateAsync(answer)
      } catch (error) {
        console.error("Failed to submit answer:", error)
      }
    },
    [interviewId, currentQuestion, socket, submitAnswerMutation],
  )

  const end = useCallback(async () => {
    try {
      await endInterviewMutation.mutateAsync()
      if (timerInterval) clearInterval(timerInterval)
      resultsQuery.refetch()
    } catch (error) {
      console.error("Failed to end interview:", error)
    }
  }, [endInterviewMutation, resultsQuery, timerInterval])

  return {
    currentQuestion,
    transcript,
    isConnected,
    isStarting: startInterviewMutation.isPending,
    isEnding: endInterviewMutation.isPending,
    isSubmitting: submitAnswerMutation.isPending,
    start,
    submitAnswer: submitUserAnswer,
    end,
    results: resultsQuery.data?.data,
    isLoadingResults: resultsQuery.isLoading,
    timeRemaining,
    interviewDuration,
  }
}

export default useInterviewSession