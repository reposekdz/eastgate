import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, branchId } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const staff = await prisma.staff.findUnique({
      where: { email },
      include: { branch: true }
    })

    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, staff.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (branchId && staff.branchId !== branchId && !['super_admin', 'super_manager'].includes(staff.role)) {
      return NextResponse.json({ error: 'No access to this branch' }, { status: 403 })
    }

    const tokenPayload = {
      userId: staff.id,
      email: staff.email,
      role: staff.role,
      branchId: staff.branchId
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    await prisma.activityLog.create({
      data: {
        staffId: staff.id,
        action: 'LOGIN',
        entity: 'AUTH',
        entityId: staff.id,
        details: `User logged in from ${req.headers.get('user-agent')}`
      }
    })

    const response = NextResponse.json({
      user: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
        branchId: staff.branchId,
        branchName: staff.branch.name,
        avatar: staff.avatar
      },
      accessToken,
      refreshToken
    })

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 900
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
