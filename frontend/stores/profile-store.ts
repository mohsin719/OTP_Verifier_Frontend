"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ProfileState = {
  avatarByUserId: Record<string, string>;
  setAvatarForUser: (userId: string, avatarId: string) => void;
  getAvatarForUser: (userId: string) => string | null;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      avatarByUserId: {},
      setAvatarForUser: (userId, avatarId) =>
        set((state) => ({
          avatarByUserId: { ...state.avatarByUserId, [userId]: avatarId },
        })),
      getAvatarForUser: (userId) => get().avatarByUserId[userId] ?? null,
    }),
    {
      name: "vsms-profile",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ avatarByUserId: state.avatarByUserId }),
    },
  ),
);
