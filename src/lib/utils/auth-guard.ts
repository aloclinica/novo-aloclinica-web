import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { UserRole } from '@/types/database.types';
import { error } from './api-response';

/**
 * Get authenticated user from request
 */
export const getUser = async (request: NextRequest) => {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

/**
 * Get user's profile from database
 */
export const getUserProfile = async (request: NextRequest) => {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error: err } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (err) {
    console.error('[getUserProfile]', err);
    return null;
  }

  return profile;
};

/**
 * Require authentication middleware
 * Returns error if not authenticated
 */
export const requireAuth = async (request: NextRequest) => {
  const user = await getUser(request);

  if (!user) {
    return error('Unauthorized', 401);
  }

  return null; // No error
};

/**
 * Require specific role
 * Returns error if user doesn't have required role
 */
export const requireRole = async (
  request: NextRequest,
  allowedRoles: UserRole[],
) => {
  const profile = await getUserProfile(request);

  if (!profile) {
    return error('Unauthorized', 401);
  }

  if (!allowedRoles.includes(profile.role)) {
    return error('Forbidden: insufficient permissions', 403);
  }

  return null; // No error
};

/**
 * Check if request is admin
 */
export const isAdmin = async (request: NextRequest) => {
  const profile = await getUserProfile(request);
  return profile?.role === UserRole.ADMIN;
};

/**
 * Check if request is doctor
 */
export const isDoctor = async (request: NextRequest) => {
  const profile = await getUserProfile(request);
  return profile?.role === UserRole.DOCTOR;
};

/**
 * Check if request is patient
 */
export const isPatient = async (request: NextRequest) => {
  const profile = await getUserProfile(request);
  return profile?.role === UserRole.PATIENT;
};
