import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Category, Person, Video } from "../lib/archive-types";

const VIDEO_PAGE_SIZE = 1000;
const VIDEO_COLUMNS =
  "id,title,thumbnail_url,published_at,youtube_url,type_ids,type_id,series_id";

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [genres, setGenres] = useState<Category[]>([]);
  const [types, setTypes] = useState<Category[]>([]);
  const [series, setSeries] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  useEffect(() => {
    void Promise.all([
      loadVideos(),
      loadPeople(),
      loadGenres(),
      loadTypes(),
      loadSeries(),
    ]);
  }, []);

  async function loadVideos() {
    setLoading(true);

    const allVideos: Video[] = [];
    let from = 0;

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

    const videoIds = allVideos.map((video) => video.id);

    const [
      { data: genreRelations, error: genreError },
      { data: peopleRelations, error: peopleError },
    ] = await Promise.all([
      supabase
        .from("video_genres")
        .select("video, genre")
        .in("video", videoIds),
      supabase
        .from("video_people")
        .select("video, person")
        .in("video", videoIds),
    ]);

    if (genreError) console.error("장르 연결 불러오기 오류:", genreError);
    if (peopleError) console.error("멤버 연결 불러오기 오류:", peopleError);

    const peopleMap = new Map<number, number[]>();
    for (const relation of peopleRelations ?? []) {
      const ids = peopleMap.get(relation.video) ?? [];
      ids.push(relation.person);
      peopleMap.set(relation.video, ids);
    }

    const genreMap = new Map<number, number[]>();
    for (const relation of genreRelations ?? []) {
      const ids = genreMap.get(relation.video) ?? [];
      ids.push(relation.genre);
      genreMap.set(relation.video, ids);
    }

    setVideos(
      allVideos.map((video) => ({
        ...video,
        peopleIds: peopleMap.get(video.id) ?? [],
        genreIds: genreMap.get(video.id) ?? [],
        typeIds: Array.isArray(video.type_ids)
          ? video.type_ids
          : video.type_id != null
            ? [video.type_id]
            : [],
        typeId: video.type_id ?? null,
        seriesId: video.series_id ?? null,
      })),
    );

    setLoading(false);
  }

  async function loadPeople() {
    const { data, error } = await supabase
      .from("people")
      .select("id,name")
      .order("name");

    if (error) {
      console.error("멤버 불러오기 오류:", error);
      return;
    }

    setPeople(data ?? []);
  }

  async function loadGenres() {
    const { data, error } = await supabase
      .from("genres")
      .select("id,name")
      .order("name");

    if (error) {
      console.error("장르 불러오기 오류:", error);
      return;
    }

    setGenres(data ?? []);
  }

  async function loadTypes() {
    const { data, error } = await supabase
      .from("types")
      .select("id,name")
      .order("name");

    if (error) {
      console.error("타입 불러오기 오류:", error);
      return;
    }

    setTypes(data ?? []);
  }

  async function loadSeries() {
    const { data, error } = await supabase
      .from("series")
      .select("id,name")
      .order("name");

    if (error) {
      console.error("시리즈 불러오기 오류:", error);
      return;
    }

    setSeries(data ?? []);
  }

  async function importYouTubeVideos() {
    setImporting(true);
    setImportMessage("");

    try {
      const response = await fetch("/api/youtube");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            "영상 가져오기에 실패했습니다.",
        );
      }

      setImportMessage(`${data.count}개의 영상을 가져왔습니다.`);
      await loadVideos();
    } catch (error) {
      console.error("영상 가져오기 오류:", error);

      setImportMessage(
        error instanceof Error
          ? error.message
          : "영상 가져오기에 실패했습니다.",
      );
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
  };
}
