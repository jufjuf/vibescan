import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join, basename, extname } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'

// For now, we'll use mock scanning until we properly integrate VibeScan
// In production, you would properly link to the parent VibeScan project
// or install it as a dependency

// Security constants
const ALLOWED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB total
const MAX_FILES = 100 // Maximum number of files per upload

// Rate limiting storage (in-memory, for production use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute

function checkRateLimit(clientId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const existing = rateLimitMap.get(clientId)

  if (!existing || now > existing.resetTime) {
    // New window or expired window
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: existing.resetTime }
  }

  existing.count++
  return { allowed: true }
}

function sanitizeFilename(filename: string): string {
  // Get base filename without directory traversal
  const base = basename(filename)

  // Remove any characters that could be dangerous
  // Allow only alphanumeric, dash, underscore, and dot
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Ensure it doesn't start with dot (hidden files)
  return sanitized.startsWith('.') ? 'file' + sanitized : sanitized
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    const rateLimit = checkRateLimit(clientId)
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime! - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() }
        }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate number of files
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} files allowed.` },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    let totalSize = 0
    for (const file of files) {
      // Check file extension
      const ext = extname(file.name).toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid file type "${ext}". Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
          { status: 400 }
        )
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 413 }
        )
      }

      totalSize += file.size
    }

    // Check total upload size
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: `Total upload size too large. Maximum is ${MAX_TOTAL_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    // Create temporary directory for uploaded files
    const scanId = randomUUID()
    const uploadDir = join(process.cwd(), 'uploads', scanId)

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save uploaded files with sanitized names
    const savedFiles: string[] = []
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Sanitize filename to prevent path traversal
      const safeName = sanitizeFilename(file.name)
      const filePath = join(uploadDir, safeName)

      await writeFile(filePath, buffer)
      savedFiles.push(safeName)
    }

    // Schedule cleanup after 1 hour
    setTimeout(async () => {
      try {
        await rm(uploadDir, { recursive: true, force: true })
      } catch (error) {
        console.error(`Failed to cleanup upload directory ${scanId}:`, error)
      }
    }, 60 * 60 * 1000) // 1 hour

    // Mock scan result for now
    // In production, integrate with VibeScan scanner:
    // const { Scanner } = require('../../../../dist/scanner')
    // const scanner = new Scanner()
    // const result = await scanner.scan({ directory: uploadDir })

    const mockResult = {
      id: scanId,
      filesScanned: files.length,
      totalIssues: Math.floor(Math.random() * 20) + 5,
      issues: [
        {
          category: 'Security',
          severity: 'HIGH',
          message: 'Potential security vulnerability detected',
          file: files[0].name,
          line: 42,
          suggestion: 'Use parameterized queries instead'
        }
      ],
      securityScore: 7.5 + Math.random() * 2,
      qualityScore: 7.0 + Math.random() * 2,
      aiPatternScore: 6.5 + Math.random() * 2,
      timestamp: new Date().toISOString(),
      projectName: 'Uploaded Files'
    }

    // In production, save to database here
    // await saveScanResult(mockResult)

    return NextResponse.json({
      success: true,
      scanId,
      result: mockResult
    })
  } catch (error) {
    // Log detailed error server-side
    console.error('Scan error:', error)

    // Return generic error to client (security: don't leak internal details)
    return NextResponse.json(
      { error: 'Scan failed. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const scanId = searchParams.get('id')

  if (!scanId) {
    return NextResponse.json(
      { error: 'Scan ID required' },
      { status: 400 }
    )
  }

  // In production, retrieve from database
  // const result = await getScanResult(scanId)

  return NextResponse.json({
    success: true,
    result: {
      id: scanId,
      // Mock result for now
      filesScanned: 0,
      totalIssues: 0,
      issues: [],
      securityScore: 10,
      qualityScore: 10,
      aiPatternScore: 10
    }
  })
}
