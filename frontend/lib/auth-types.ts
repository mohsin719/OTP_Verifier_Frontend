export type AuthUser = {
  id: string;
  publicId: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  preferredPlatform: string;
  isBanned: boolean;
};
