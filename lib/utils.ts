import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatElapsed(from: string, to?: string | null): string {
  const start = parseISO(from)
  const end = to ? parseISO(to) : new Date()
  const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)

  if (totalSeconds < 60) return `${totalSeconds}s`
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function getSchedulingLink(): { url: string; label: string; reason: string } {
  const month = new Date().getMonth() // 0-indexed: 0=Jan, 1=Feb, 2=Mar...
  const isInOffice = month >= 2 && month <= 7 // March(2) through August(7)
  return isInOffice
    ? {
        url: 'https://calendly.com/swans-santiago-p/summer-spring',
        label: 'In-Office Appointment',
        reason: 'In-office link used March–August',
      }
    : {
        url: 'https://calendly.com/swans-santiago-p/winter-autumn',
        label: 'Virtual Appointment',
        reason: 'Virtual link used September–February',
      }
}

export function getClientFirstName(fullName: string | null): string {
  if (!fullName) return 'Client'
  return fullName.split(' ')[0]
}

export function estimatedHoursSaved(count: number): string {
  const totalMinutes = count * 45
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins}m`
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

