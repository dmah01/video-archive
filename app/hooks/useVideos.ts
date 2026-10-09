import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import type { Category, Person, Video } from "@/app/lib/archive-types";

const VIDEO_PAGE_SIZE = 1000;
const VIDEO_COLUMNS =
  "id,title,thumbnail_url,published_at,youtube_url,type_ids,type_id,series_id,series_ids";

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [genres, setGenres] = useState<Category[]>([]);
  const [types, setTypes] = useState<Category[]>([]);
  const [series, setSeries] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const loadVideos = useCallback(async () => {
    setLoading(true);

    try {
      const allVideos: Video[] = [];
      let from = 0;

      // 1. 영상 목록 페이징 수집
      while (true) {
        const { data, error } = await supabase
          .from("videos")
          .select(VIDEO_COLUMNS)
          .order("published_at", { ascending: false })
          .range(from, from + VIDEO_PAGE_SIZE - 1);

        if (error) {
          console.error("영상 불러오기 오류:", error);
          setLoading(false);
          return;
        }

        const currentVideos = (data ?? []) as Video[];
        allVideos.push(...currentVideos);

        if (currentVideos.length < VIDEO_PAGE_SIZE) break;
        from += VIDEO_PAGE_SIZE;
      }

      if (allVideos.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
      }

      // 2. 청크(Chunk) 반복 호출 제거: 전체 관계 데이터를 단 1회의 병렬 요청으로 일괄 수집
      const [
        { data: peopleData, error: peopleError },
        { data: genreData, error: genreError },
        { data: relationData, error: relationError },
      ] = await Promise.all([
        supabase.from("video_people").select("video, person"),
        supabase.from("video_genres").select("video, genre"),
        supabase.from("video_relation_counts").select("video_id, related_count"),
      ]);

      if (peopleError) console.error("멤버 연결 불러오기 오류:", peopleError);
      if (genreError) console.error("장르 연결 불러오기 오류:", genreError);
      if (relationError) console.error("관련 영상 개수 불러오기 오류:", relationError);

      // 3. 데이터를 빠른 조회용 Map으로 변환
      const peopleMap = new Map<number, number[]>();
      for (const relation of peopleData ?? []) {
        const videoId = Number(relation.video);
        const personId = Number(relation.person);
        if (!Number.isFinite(videoId) || !Number.isFinite(personId)) continue;

        const ids = peopleMap.get(videoId) ?? [];
        if (!ids.includes(personId)) ids.push(personId);
        peopleMap.set(videoId, ids);
      }

      const genreMap = new Map<number, number[]>();
      for (const relation of genreData ?? []) {
        const videoId = Number(relation.video);
        const genreId = Number(relation.genre);
        if (!Number.isFinite(videoId) || !Number.isFinite(genreId)) continue;

        const ids = genreMap.get(videoId) ?? [];
        if (!ids.includes(genreId)) ids.push(genreId);
        genreMap.set(videoId, ids);
      }

      const relationCounts: Record<number, number> = {};
      for (const relation of relationData ?? []) {
        relationCounts[Number(relation.video_id)] = Number(relation.related_count) || 0;
      }

      // 4. 최종 데이터 조합
      setVideos(
        allVideos.map((video) => ({
          ...video,
          peopleIds: peopleMap.get(video.id) ?? [],
          genreIds: genreMap.get(video.id) ?? [],
          relatedCount: relationCounts[video.id] ?? 0,
          typeIds: Array.isArray(video.type_ids)
            ? video.type_ids
            : video.type_id != null
              ? [video.type_id]
              : [],
          typeId: video.type_id ?? null,
          seriesId: video.series_id ?? null,
          seriesIds: Array.isArray(video.series_ids)
            ? video.series_ids
            : video.series_id != null
              ? [video.series_id]
              : [],
        }))
      );
    } catch (err) {
      console.error("loadVideos 시스템 오류:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPeople = useCallback(async () => {
    const { data, error } = await supabase.from("people").select("id,name").order("name");
    if (error) console.error("멤버 불러오기 오류:", error);
    else setPeople(data ?? []);
  }, []);

  const loadGenres = useCallback(async () => {
    const { data, error } = await supabase.from("genres").select("id,name").order("name");
    if (error) console.error("장르 불러오기 오류:", error);
    else setGenres(data ?? []);
  }, []);

  const loadTypes = useCallback(async () => {
    const { data, error } = await supabase.from("types").select("id,name").order("name");
    if (error) console.error("타입 불러오기 오류:", error);
    else setTypes(data ?? []);
  }, []);

  const loadSeries = useCallback(async () => {
    const { data, error } = await supabase.from("series").select("id,name").order("name");
    if (error) console.error("시리즈 불러오기 오류:", error.message || JSON.stringify(error));
    else setSeries(data ?? []);
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

  async function getAdminHeaders() {
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
        throw new Error(data.details || data.error || "영상 가져오기에 실패했습니다.");
      }

      setImportMessage(`${data.count}개의 영상을 가져왔습니다.`);
      await loadVideos();
    } catch (error) {
      console.error("영상 가져오기 오류:", error);
      setImportMessage(
        error instanceof Error ? error.message : "영상 가져오기에 실패했습니다."
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
        throw new Error(data.details || data.error || "영상 삭제에 실패했습니다.");
      }

      setVideos((current) => current.filter((video) => video.id !== videoId));
      setImportMessage("영상을 삭제했습니다.");
      return data;
    } catch (error) {
      console.error("영상 삭제 오류:", error);
      const message =
        error instanceof Error ? error.message : "영상 삭제에 실패했습니다.";
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
        error instanceof Error ? error.message : "YouTube 영상 추가에 실패했습니다.";

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
    loadVideos,
    importYouTubeVideos,
    addYouTubeVideo,
    deleteVideo,
  };
}