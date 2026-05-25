import { avatarUrlFor, mapUserToResponse } from "./map-user";
import type { UserRecord } from "./users-repository";
import type { WallPostRecord } from "./wall-repository";
import type makeSocialRepository from "./social-repository";

type SocialRepository = ReturnType<typeof makeSocialRepository>;

function formatDate(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("sv-SE");
}

function displayName(user: UserRecord) {
  if (user.name && user.surname) return `${user.name} ${user.surname}`;
  if (user.name) return user.name;
  return user.username;
}

export async function enrichPosts({
  posts,
  usersByName,
  socialRepository,
  viewerUsername,
  transformDate,
}: {
  posts: WallPostRecord[];
  usersByName: Map<string, UserRecord>;
  socialRepository: SocialRepository;
  viewerUsername?: string;
  transformDate: (ts: number) => string;
}) {
  const ids = posts.map((p) => p.id);
  const likeCounts = await socialRepository.getLikeCounts(ids);
  const liked = await socialRepository.getLikedByViewer(ids, viewerUsername);
  const commentsMap = await socialRepository.getCommentsForPosts(ids);

  return posts.map((post) => {
    const author = usersByName.get(post.username);
    const comments = (commentsMap.get(post.id) ?? []).map((c) => {
      const cu = usersByName.get(c.username);
      return {
        id: c.id,
        username: c.username,
        message: c.message,
        created: formatDate(c.created_at),
        author: cu
          ? {
              username: cu.username,
              display_name: displayName(cu),
              avatar_url: avatarUrlFor(cu),
            }
          : { username: c.username, display_name: c.username, avatar_url: "/avatars/1.svg" },
      };
    });

    return {
      id: post.id,
      username: post.username,
      message: post.message,
      created: formatDate(post.created_at),
      has_image: Boolean(post.image_data),
      image_url: post.image_data
        ? `/api/v1/posts/${post.id}/image`
        : null,
      likes_count: likeCounts.get(post.id) ?? 0,
      liked_by_me: liked.has(post.id),
      comments_count: comments.length,
      comments,
      author: author
        ? {
            ...mapUserToResponse(author, transformDate),
            display_name: displayName(author),
          }
        : {
            username: post.username,
            display_name: post.username,
            avatar_url: `/avatars/1.svg`,
          },
    };
  });
}
