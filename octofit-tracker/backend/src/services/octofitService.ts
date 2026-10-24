import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

const createHttpError = (message: string, status = 400) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const { userId, teamId, type, minutes } = payload;

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw createHttpError('User id is required and must be a valid Mongo ObjectId.', 400);
  }

  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw createHttpError('Team id is required and must be a valid Mongo ObjectId.', 400);
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw createHttpError('Activity type is required.', 400);
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw createHttpError('Activity minutes must be a positive number.', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError('User not found.', 404);
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw createHttpError('Team not found.', 404);
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });

  const payloadDoc = activity.toObject();
  return {
    ...payloadDoc,
    user: payloadDoc.user.toString(),
    team: payloadDoc.team.toString(),
    occurredAt: new Date(payloadDoc.occurredAt).toISOString(),
  };
}

export async function listTeams() {
  const teams = await Team.find().populate('members').lean();
  return teams.map((team) => ({
    ...team,
    members: Array.isArray(team.members)
      ? team.members.map((member) => {
          if (typeof member === 'string') return member;
          if (member && typeof member === 'object' && '_id' in member) {
            return String((member as { _id?: { toString: () => string } })._id ?? '');
          }
          return String(member);
        })
      : [],
  }));
}

export async function createTeam(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';
  const members = Array.isArray(payload.members) ? payload.members : [];

  if (!name) {
    throw createHttpError('Team name is required.', 400);
  }

  if (!mascot) {
    throw createHttpError('Team mascot is required.', 400);
  }

  const normalizedMembers = members.map((member) => String(member));
  for (const memberId of normalizedMembers) {
    if (!mongoose.isValidObjectId(memberId)) {
      throw createHttpError(`Invalid member id: ${memberId}`, 400);
    }
  }

  const existingUsers = await User.find({ _id: { $in: normalizedMembers } }).select('_id');
  const existingIds = existingUsers.map((member) => member._id.toString());
  const missing = normalizedMembers.filter((memberId) => !existingIds.includes(memberId));
  if (missing.length > 0) {
    throw createHttpError('One or more team members were not found.', 404);
  }

  const team = await Team.create({
    name,
    mascot,
    members: normalizedMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: Number(entry.totalPoints || 0),
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail.trim();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    throw createHttpError('User not found.', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const focusPreference = user.fitnessGoal ?? recentActivities[0]?.type ?? 'endurance';
  const recentType = recentActivities[0]?.type ?? focusPreference;
  const workouts = await Workout.find().lean();

  const sorted = [...workouts].sort((left, right) => {
    const leftScore = left.focus.toLowerCase() === focusPreference.toLowerCase() ? 2 : 0;
    const rightScore = right.focus.toLowerCase() === focusPreference.toLowerCase() ? 2 : 0;
    return (rightScore + (right.minutes ?? 0)) - (leftScore + (left.minutes ?? 0));
  });

  const selected = sorted.find((workout) => workout.focus.toLowerCase() === focusPreference.toLowerCase()) ?? sorted[0] ?? workouts[0];

  if (!selected) {
    return [];
  }

  return [{
    title: selected.title,
    focus: selected.focus,
    minutes: selected.minutes,
    difficulty: selected.difficulty,
    reason: `Matches your recent ${recentType} activity and supports your ${focusPreference} goal.`,
  }];
}

export { User };
