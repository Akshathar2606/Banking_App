/**
 * userRepository.ts
 *
 * Mongoose implementation of UserRepository for Member 4 authentication layer.
 * Adapts Deepika's existing User model (src/models/User.js) to the UserRepository interface.
 *
 * NOTE:
 *   Deepika's User.js is preserved completely. We never mutate the schema or replace her file.
 */

import User from '../models/User';
import { UserRepository, UserDocument } from './authService';

/**
 * Normalizes a Mongoose document or plain object to a UserDocument.
 */
function normalizeDoc(doc: any): UserDocument | null {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    _id: raw._id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    passwordHash: raw.passwordHash,
    profileImage: raw.profileImage ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const mongooseUserRepository: UserRepository = {
  async findOneByEmail(email: string): Promise<UserDocument | null> {
    const doc = await User.findOne({ email: email.toLowerCase().trim() });
    return normalizeDoc(doc);
  },

  async findOneByPhone(phone: string): Promise<UserDocument | null> {
    const doc = await User.findOne({ phone: phone.trim() });
    return normalizeDoc(doc);
  },

  async findOneByEmailWithPassword(email: string): Promise<UserDocument | null> {
    const doc = await User.findOne({ email: email.toLowerCase().trim() });
    return normalizeDoc(doc);
  },

  async findById(id: string): Promise<UserDocument | null> {
    const doc = await User.findById(id);
    return normalizeDoc(doc);
  },

  async createUser(data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const doc = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
    });
    const normalized = normalizeDoc(doc);
    if (!normalized) {
      throw new Error('Failed to create user document');
    }
    return normalized;
  },
};
