import { supabase } from "./supabase";

export async function getPeople() {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("name");

  if (error) {
    console.error(
      "등장인물 불러오기 오류:",
      error
    );
    throw error;
  }

  return data ?? [];
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error(
      "카테고리 불러오기 오류:",
      error
    );
    throw error;
  }

  return data ?? [];
}

export async function getVideos() {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("published_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "영상 불러오기 오류:",
      error
    );
    throw error;
  }

  const videos = data ?? [];

  if (videos.length === 0) {
    return [];
  }

  const videoIds = videos.map(
    (video) => video.id
  );

  const { data: peopleRelations } =
    await supabase
      .from("video_people")
      .select("video, person")
      .in("video", videoIds);

  const { data: categoryRelations } =
    await supabase
      .from("video_categories")
      .select("video, category")
      .in("video", videoIds);

  return videos.map((video) => ({
    ...video,

    peopleIds: (peopleRelations ?? [])
      .filter(
        (relation) =>
          relation.video === video.id
      )
      .map(
        (relation) => relation.person
      ),

    categoryIds: (categoryRelations ?? [])
      .filter(
        (relation) =>
          relation.video === video.id
      )
      .map(
        (relation) =>
          relation.category
      ),
  }));
}