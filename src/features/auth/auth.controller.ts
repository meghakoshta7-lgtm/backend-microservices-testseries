import { Response } from 'express';
import crypto from 'crypto';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { sendLoginEmail, sendPasswordResetEmail } from '@/services';
import { config } from '@/config';

export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = user.generateTokens();

  user.refreshToken = refreshToken;
  await user.save();

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user: userResponse, token: accessToken, refreshToken },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const { accessToken, refreshToken } = user.generateTokens();

  user.refreshToken = refreshToken;
  user.lastActiveDate = new Date();
  await user.save();
  await sendLoginEmail(user).catch(error => console.error('[Email] Login notification failed:', error));

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: userResponse, token: accessToken, refreshToken },
  });
});

export const googleLogin = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { accessToken } = req.body;

  const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!tokenInfoResponse.ok) {
    throw new AppError('Google sign-in failed. Please try again.', 401);
  }

  const tokenInfo = await tokenInfoResponse.json() as { aud?: string };
  if (process.env.GOOGLE_CLIENT_ID && tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google sign-in is not configured for this app', 401);
  }

  const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!googleResponse.ok) {
    throw new AppError('Google sign-in failed. Please try again.', 401);
  }

  const profile = await googleResponse.json() as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!profile.email || profile.email_verified === false) {
    throw new AppError('Google account email is not verified', 401);
  }

  const email = profile.email.toLowerCase();
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.name || email.split('@')[0],
      email,
      password: crypto.randomBytes(24).toString('hex'),
      avatar: profile.picture || '',
      isEmailVerified: true,
    });
  } else {
    user.isEmailVerified = true;
    if (!user.avatar && profile.picture) user.avatar = profile.picture;
    if (!user.name && profile.name) user.name = profile.name;
  }

  const { accessToken: appAccessToken, refreshToken } = user.generateTokens();

  user.refreshToken = refreshToken;
  user.lastActiveDate = new Date();
  await user.save();
  await sendLoginEmail(user).catch(error => console.error('[Email] Google login notification failed:', error));

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };

  res.json({
    success: true,
    message: 'Google login successful',
    data: { user: userResponse, token: appAccessToken, refreshToken },
  });
});

export const githubLogin = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, redirectUri } = req.body;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError('GitHub sign-in is not configured', 500);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new AppError('GitHub sign-in failed. Please try again.', 401);
  }

  const tokenData = await tokenResponse.json() as { access_token?: string; error_description?: string };
  if (!tokenData.access_token) {
    throw new AppError(tokenData.error_description || 'GitHub sign-in failed. Please try again.', 401);
  }

  const [profileResponse, emailsResponse] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
    }),
  ]);

  if (!profileResponse.ok || !emailsResponse.ok) {
    throw new AppError('Unable to fetch GitHub account details', 401);
  }

  const profile = await profileResponse.json() as { login?: string; name?: string; avatar_url?: string; email?: string };
  const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
  const primaryEmail = emails.find(item => item.primary && item.verified)?.email || emails.find(item => item.verified)?.email || profile.email;

  if (!primaryEmail) {
    throw new AppError('GitHub account does not have a verified public email', 401);
  }

  const email = primaryEmail.toLowerCase();
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.name || profile.login || email.split('@')[0],
      email,
      password: crypto.randomBytes(24).toString('hex'),
      avatar: profile.avatar_url || '',
      isEmailVerified: true,
    });
  } else {
    user.isEmailVerified = true;
    if (!user.avatar && profile.avatar_url) user.avatar = profile.avatar_url;
    if (!user.name && (profile.name || profile.login)) user.name = profile.name || profile.login || user.name;
  }

  const { accessToken: appAccessToken, refreshToken } = user.generateTokens();

  user.refreshToken = refreshToken;
  user.lastActiveDate = new Date();
  await user.save();

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };

  res.json({
    success: true,
    message: 'GitHub login successful',
    data: { user: userResponse, token: appAccessToken, refreshToken },
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    req.user.refreshToken = undefined;
    await req.user.save();
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };

  const user = await User.findById(decoded.userId);
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = user.generateTokens();

  user.refreshToken = newRefreshToken;
  await user.save();

  res.json({
    success: true,
    data: { token: accessToken, refreshToken: newRefreshToken },
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const user = await User.findById(req.user._id).select('-password -refreshToken');

  res.json({
    success: true,
    data: user,
  });
});

const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeResetCode = (code: unknown): string => String(code || '').replace(/\D/g, '').slice(0, 6);

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError('No account found with this email', 404);
  }

  const resetCode = generateResetCode();
  const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.resetPasswordCode = resetCode;
  user.resetPasswordExpires = resetCodeExpires;
  await user.save();

  await sendPasswordResetEmail(user, {
    code: resetCode,
    expiresAt: resetCodeExpires,
  }).catch(error => console.error('[Email] Password reset code failed:', error));

  res.json({
    success: true,
    message: 'Reset code sent to your email',
    data: { email: normalizedEmail, expiresAt: resetCodeExpires },
  });
});

export const verifyResetCode = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new AppError('Email and code are required', 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCode = normalizeResetCode(code);
  if (normalizedCode.length !== 6) {
    throw new AppError('Code must be 6 digits', 400);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError('No account found with this email', 404);
  }

  if (!user.resetPasswordCode || !user.resetPasswordExpires) {
    throw new AppError('No reset code requested. Please request a new code.', 400);
  }

  if (Date.now() > user.resetPasswordExpires.getTime()) {
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new AppError('Reset code expired. Please request a new code.', 400);
  }

  if (user.resetPasswordCode !== normalizedCode) {
    throw new AppError('Invalid reset code. Please try again.', 400);
  }

  res.json({
    success: true,
    message: 'Reset code verified successfully',
    data: { email: normalizedEmail, verified: true },
  });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    throw new AppError('Email, code, and new password are required', 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCode = normalizeResetCode(code);
  if (normalizedCode.length !== 6) {
    throw new AppError('Code must be 6 digits', 400);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError('No account found with this email', 404);
  }

  if (!user.resetPasswordCode || !user.resetPasswordExpires) {
    throw new AppError('No reset code requested. Please request a new code.', 400);
  }

  if (Date.now() > user.resetPasswordExpires.getTime()) {
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new AppError('Reset code expired. Please request a new code.', 400);
  }

  if (user.resetPasswordCode !== normalizedCode) {
    throw new AppError('Invalid reset code. Please try again.', 400);
  }

  user.password = newPassword;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});
