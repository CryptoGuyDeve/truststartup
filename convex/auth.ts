import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* -------------------------------------------------------------------------- */
/* 🛡 Helpers                                                                  */
/* -------------------------------------------------------------------------- */

// Simple hash function (dev only, not secure)
function hashPassword(password: string) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString();
}

// Token generator
function generateToken() {
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

/* -------------------------------------------------------------------------- */
/* 📝 SIGNUP                                                                   */
/* -------------------------------------------------------------------------- */

export const signup = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Email unique
    const existingEmail = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();
    if (existingEmail) throw new Error("Email already registered");

    // Username unique
    const existingUsername = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .unique();
    if (existingUsername)
      throw new Error("Username already taken, choose another");

    const passwordHash = hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      firstName: args.firstName,
      lastName: args.lastName,
      username: args.username,
      email: args.email,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    const token = generateToken();

    await ctx.db.insert("sessions", {
      userId,
      token,
      createdAt: new Date().toISOString(),
    });

    return { token, userId };
  },
});

/* -------------------------------------------------------------------------- */
/* 🔑 LOGIN                                                                    */
/* -------------------------------------------------------------------------- */

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();

    if (!user) throw new Error("User not found");

    const inputHash = hashPassword(args.password);
    if (inputHash !== user.passwordHash)
      throw new Error("Invalid password");

    const token = generateToken();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: new Date().toISOString(),
    });

    return { token, userId: user._id };
  },
});

/* -------------------------------------------------------------------------- */
/* 👤 Get Logged-in User                                                      */
/* -------------------------------------------------------------------------- */

export const getUserFromToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("token"), args.token))
      .unique();

    if (!session) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  },
});

/* -------------------------------------------------------------------------- */
/* ✏️ UPDATE PROFILE                                                           */
/* -------------------------------------------------------------------------- */

export const updateProfile = mutation({
  args: {
    token: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // fetch user by token
    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("token"), args.token))
      .unique();

    if (!session) throw new Error("Unauthorized");

    // username unique
    const conflict = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .unique();

    if (conflict && conflict._id !== session.userId) {
      throw new Error("Username already taken");
    }

    await ctx.db.patch(session.userId, {
      firstName: args.firstName,
      lastName: args.lastName,
      username: args.username,
    });

    return { success: true };
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      createdAt: user.createdAt,
      bio: user.bio ?? "",
      avatar: user.avatar ?? "",
    };
  },
});
