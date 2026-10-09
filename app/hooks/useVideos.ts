
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import type { Category, Person, Video } from "@/app/lib/archive-types";

export const VIDEOS_PER_PAGE = 12;

export type VideoPageParams = {
  search?: string;
  startDate?: string;
  endDate?: string;
  peopleIds?: number[];
  peopleMode?: "all" | "only" | "any";
  genreIds?: number[];
  genreMode?: "all" | "only";
  typeIds?: number[];
  seriesIds?: number[];
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type VideoPageResult = {
  items: Video[];
  totalCount: number;
};

function parseIdList(value: unknown, fallback: unknown): number[] {
  let values: unknown[] = [];

  if (Array.isArray(value)) {
    values = value;
  } else if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) values = parsed;
    } catch {
      values = [];
    }
  }

  const ids = values
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0);

  if (ids.length > 0) {
    return [...new Set(ids)];
  }

  const fallbackId = Number(fallback);

  return Number.isSafeInteger(fallbackId) && fallbackId > 0
    ? [fallbackId]
    : [];
}

function normalizeVideo(item: Record<string, unknown>): Video {
  const typeIds = parseIdList(item.type_ids, item.type_id);
  const seriesIds = parseIdList(item.series_ids, item.series_id);

  return {
    ...item,
    id: Number(item.id),
    title: String(item.title ?? ""),
    thumbnail_url: String(item.thumbnail_url ?? ""),
    published_at: String(item.published_at ?? ""),
    youtube_url: String(item.youtube_url ?? ""),
    peopleIds: Array.isArray(item.peopleIds)
      ? item.peopleIds.map(Number)
      : [],
    genreIds: Array.isArray(item.genreIds)
      ? item.genreIds.map(Number)
      : [],
    typeIds,
    type_ids: typeIds,
    typeId: item.type_id == null ? null : Number(item.type_id),
    seriesIds,
    series_ids: seriesIds,
    seriesId: item.series_id == null ? null : Number(item.series_id),
    relatedCount: Number(item.relatedCount ?? 0),
  } as Video;
}

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [genres, setGenres] = useState<Category[]>([]);
  const [types, setTypes] = useState<Category[]>([]);
  const [series, setSeries] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const fetchVideoPage = useCallback(
    async (params: VideoPageParams = {}): Promise<VideoPageResult> => {
      const { data, error } = await supabase.rpc("get_filtered_videos", {
        p_search: params.search ?? "",
        p_start_date: params.startDate || null,
        p_end_date: params.endDate || null,
        p_people_ids: params.peopleIds ?? [],
        p_people_mode: params.peopleMode ?? "all",
        p_genre_ids: params.genreIds ?? [],
        p_genre_mode: params.genreMode ?? "all",
        p_type_ids: params.typeIds ?? [],
        p_series_ids: params.seriesIds ?? [],
        p_sort: params.sort ?? "newest",
        p_page: Math.max(1, params.page ?? 1),
        p_page_size: Math.min(
          50,
          Math.max(1, params.pageSize ?? VIDEOS_PER_PAGE)
        ),
      });

      if (error) {
        console.error("동영상 페이지 조회 오류:", error);
        throw error;
      }

      const result = data as {
        items?: Record<string, unknown>[];
        total_count?: number | string;
      };

      
      const items = (result.items ?? []).map(normalizeVideo);
      const videoIds = items.map((video) => video.id);
      const relatedCounts = new Map<number, number>();

      if (videoIds.length > 0) {
        const idSet = new Set(videoIds);
        const idList = videoIds.join(",");

        const { data: relations, error: relationsError } = await supabase
          .from("video_relations")
          .select("video_id, related_video_id")
          .or(
            `video_id.in.(${idList}),related_video_id.in.(${idList})`
          );

        if (relationsError) {
          console.error("연계 영상 개수 조회 오류:", relationsError);
        } else {
          for (const relation of relations ?? []) {
            const videoId = Number(relation.video_id);
            const relatedVideoId = Number(relation.related_video_id);

            if (idSet.has(videoId)) {
              relatedCounts.set(
                videoId,
                (relatedCounts.get(videoId) ?? 0) + 1
              );
            }

            if (idSet.has(relatedVideoId)) {
              relatedCounts.set(
                relatedVideoId,
                (relatedCounts.get(relatedVideoId) ?? 0) + 1
              );
            }
          }
        }
      }

      return {
        items: items.map((video) => ({
          ...video,
          relatedCount:
  relatedCounts.get(video.id) ??
  Number((video as Video & { relatedCount?: number }).relatedCount ?? 0),
        })),
        totalCount: Number(result.total_count ?? 0),
      };
    },
    []
  );

  // 호환성을 위해 유지: 기본 조건의 첫 페이지만 로드합니다.
  const loadVideos = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetchVideoPage({
        page: 1,
        pageSize: VIDEOS_PER_PAGE,
        sort: "newest",
      });

      setVideos(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("동영상 불러오기 오류:", error);
      setVideos([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [fetchVideoPage]);

  const loadPeople = useCallback(async () => {
    const { data, error } = await supabase
      .from("people")
      .select("id,name")
      .order("name");

    if (error) console.error("멤버 불러오기 오류:", error);
    else setPeople((data ?? []) as Person[]);
  }, []);

  const loadGenres = useCallback(async () => {
    const { data, error } = await supabase
      .from("genres")
      .select("id,name")
      .order("name");

    if (error) console.error("장르 불러오기 오류:", error);
    else setGenres((data ?? []) as Category[]);
  }, []);

  const loadTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from("types")
      .select("id,name")
      .order("name");

    if (error) console.error("타입 불러오기 오류:", error);
    else setTypes((data ?? []) as Category[]);
  }, []);

  const loadSeries = useCallback(async () => {
    const { data, error } = await supabase
      .from("series")
      .select("id,name")
      .order("name");

    if (error) console.error("시리즈 불러오기 오류:", error);
    else setSeries((data ?? []) as Category[]);
  }, []);

  useEffect(() => {
    void Promise.all([
      loadVideos(),
      loadPeople(),
      loadGenres(),
      loadTypes(),
      loadSeries(),
    ]);
  }, [loadVideos, loadPeople, loadGenres, loadTypes, loadSeries]);

  async function getAdminHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      throw new Error("관리자 로그인이 필요합니다.");
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  async function importYouTubeVideos() {
    setImporting(true);
    setImportMessage("");

    try {
      const headers = await getAdminHeaders();
      const response = await fetch("/api/youtube", { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "영상 가져오기에 실패했습니다."
        );
      }

      setImportMessage(`${data.count}개의 영상을 가져왔습니다.`);
      await loadVideos();
    } catch (error) {
      console.error("영상 가져오기 오류:", error);
      setImportMessage(
        error instanceof Error
          ? error.message
          : "영상 가져오기에 실패했습니다."
      );
    } finally {
      setImporting(false);
    }
  }

  async function deleteVideo(videoId: number) {
    setImporting(true);
    setImportMessage("");

    try {
      const authHeaders = await getAdminHeaders();
      const response = await fetch("/api/youtube", {
        method: "DELETE",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "영상 삭제에 실패했습니다."
        );
      }

      setVideos((current) =>
        current.filter((video) => video.id !== videoId)
      );
      setTotalCount((current) => Math.max(0, current - 1));
      setImportMessage("영상을 삭제했습니다.");

      return data;
    } catch (error) {
      console.error("영상 삭제 오류:", error);

      const message =
        error instanceof Error
          ? error.message
          : "영상 삭제에 실패했습니다.";

      setImportMessage(message);
      throw error;
    } finally {
      setImporting(false);
    }
  }

  async function addYouTubeVideo(youtubeUrl: string) {
    setImporting(true);
    setImportMessage("");

    try {
      const authHeaders = await getAdminHeaders();
      const response = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "YouTube 영상 추가에 실패했습니다."
        );
      }

      setImportMessage(
        data.created
          ? "YouTube 영상을 추가했습니다."
          : "이미 등록된 YouTube 영상입니다."
      );

      await loadVideos();
      return data;
    } catch (error) {
      console.error("YouTube 영상 추가 오류:", error);

      const message =
        error instanceof Error
          ? error.message
          : "YouTube 영상 추가에 실패했습니다.";

      setImportMessage(message);
      throw error;
    } finally {
      setImporting(false);
    }
  }

  return {
    videos,
    setVideos,
    people,
    genres,
    types,
    series,
    loading,
    importing,
    importMessage,
    totalCount,
    fetchVideoPage,
    loadVideos,
    importYouTubeVideos,
    addYouTubeVideo,
    deleteVideo,
  };
}