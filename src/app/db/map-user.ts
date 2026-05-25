import type { UserRecord } from "./users-repository";

export function avatarUrlFor(row: Pick<UserRecord, "username" | "avatar_id" | "avatar_type">) {
  if (row.avatar_type === "custom") {
    return `/api/v1/users/${encodeURIComponent(row.username)}/avatar`;
  }
  return `/avatars/${row.avatar_id ?? 1}.svg`;
}

export function mapUserToResponse(
  row: UserRecord,
  transformDate: (ts: number) => string
) {
  const created =
    row.created_at instanceof Date
      ? row.created_at.getTime()
      : new Date(row.created_at).getTime();
  const modified =
    row.modified_at instanceof Date
      ? row.modified_at.getTime()
      : new Date(row.modified_at).getTime();

  const user: Record<string, unknown> = {
    username: row.username,
    avatar_id: row.avatar_id ?? 1,
    avatar_type: row.avatar_type ?? "preset",
    avatar_url: avatarUrlFor(row),
    has_custom_avatar: row.avatar_type === "custom",
    cover_color: row.cover_color ?? "#1877f2",
    bio: row.bio ?? "",
    created: transformDate(created),
    modified: transformDate(modified),
  };

  if (row.email) user.email = row.email;
  if (row.name) user.name = row.name;
  if (row.surname) user.surname = row.surname;

  return user;
}
