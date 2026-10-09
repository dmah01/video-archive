"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import type { Video } from "@/app/lib/archive-types";
import { useVideos } from "./hooks/useVideos";
import VideoCard from "./components/VideoCard";
import VideoFilters from "./components/VideoFilters";
import VideoEditor from "./components/VideoEditor";
import SiteMenu from "./SiteMenu";

const VIDEOS_PER_PAGE = 12;

export default function Home() {
  const {
    videos,
    setVideos,
    fetchVideoPage,
    people,
    genres,
    types,
    series,
    loading,
    importing,
    importMessage,
    importYouTubeVideos,
    addYouTubeVideo,
    deleteVideo,
  } = useVideos();

  const [relatedCounts, setRelatedCounts] =
    useState<Record<number, number>>({});
  const [filteredTotalCount, setFilteredTotalCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);

  // =============================
  // 필터
  // =============================

  const [search, setSearch] = useState("");
  // 기간 검색을 위한 시작일 및 종료일 상태
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 멤버 / 장르 / 타입 / 시리즈 모두 복수 선택
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);
  const [peopleFilterMode, setPeopleFilterMode] = useState<"all" | "only" | "any">("all");

  const [selectedGenres, setSelectedGenres] =
    useState<number[]>([]);
  const [genreFilterMode, setGenreFilterMode] =
    useState<"all" | "only">("all");

  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<number[]>([]);

  const [sort, setSort] = useState("최신순");

  const [currentPage, setCurrentPage] = useState(1);
  const [pendingVideoCardId, setPendingVideoCardId] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showYouTubeAdd, setShowYouTubeAdd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleAddYouTubeVideo() {
    const url = youtubeUrl.trim();

    if (!isAdmin || !url || importing) return;

    try {
      const result = await addYouTubeVideo(url);

      setYoutubeUrl("");
      setShowYouTubeAdd(false);

      if (result?.videoId != null) {
        setPendingVideoCardId(Number(result.videoId));
      }
    } catch {
      // addYouTubeVideo에서 오류 메시지를 표시합니다.
    }
  }

  // =============================
  // 영상 편집
  // =============================

  const [editingVideo, setEditingVideo] =
    useState<Video | null>(null);

  const [editorPeople, setEditorPeople] =
    useState<number[]>([]);

  const [editorGenres, setEditorGenres] =
    useState<number[]>([]);

  const [editorTypes, setEditorTypes] =
    useState<number[]>([]);

  const [editorSeries, setEditorSeries] =
    useState<number[]>([]);

  const [editorRelatedVideos, setEditorRelatedVideos] =
    useState<number[]>([]);

  const [savingVideo, setSavingVideo] =
    useState(false);
  const videoEditorScrollYRef = useRef(0);

  useEffect(() => {
    if (!isAdmin) {
      setEditingVideo(null);
      setShowYouTubeAdd(false);
      setYoutubeUrl("");
    }
  }, [isAdmin]);

  // =============================
  // 필터 변경
  // =============================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    startDate,
    endDate,
    selectedPeople,
    peopleFilterMode,
    selectedGenres,
    genreFilterMode,
    selectedTypes,
    selectedSeries,
    sort,
  ]);

  // =============================
  // 영상 편집 열기
  // =============================

  async function openVideoEditor(video: Video) {
    if (!isAdmin) return;

    if (typeof window !== "undefined") {
      videoEditorScrollYRef.current =
        document.scrollingElement?.scrollTop ??
        window.scrollY;
    }

    const { data: relationData, error: relationError } = await supabase
      .from("video_relations")
      .select("video_id, related_video_id")
      .or(
        `video_id.eq.${video.id},related_video_id.eq.${video.id}`
      );

    if (relationError) {
      console.error("연계 불러오기 오류:", relationError);
      return;
    }

    const relatedIds = Array.from(
      new Set(
        (relationData ?? []).map((relation) =>
          Number(
            Number(relation.video_id) === video.id
              ? relation.related_video_id
              : relation.video_id
          )
        )
      )
    );

    setEditorRelatedVideos(relatedIds);
    setEditingVideo(video);

    setEditorPeople(
      Array.isArray(video.peopleIds)
        ? video.peopleIds
        : []
    );

    setEditorGenres(
      Array.isArray(video.genreIds)
        ? video.genreIds
        : []
    );

    setEditorTypes(
      Array.isArray(video.typeIds)
        ? video.typeIds
        : video.typeId != null
          ? [video.typeId]
          : []
    );

    const videoWithSeriesIds = video as Video & { seriesIds?: number[] };
    setEditorSeries(
      Array.isArray(videoWithSeriesIds.seriesIds)
        ? videoWithSeriesIds.seriesIds
        : video.seriesId != null
          ? [video.seriesId]
          : []
    );
  }

  // =============================
  // 영상 편집 닫기
  // =============================

  function closeVideoEditor() {
    setEditingVideo(null);
    setEditorPeople([]);
    setEditorGenres([]);
    setEditorTypes([]);
    setEditorSeries([]);
    setEditorRelatedVideos([]);
  }

  async function navigateToVideoCard(videoId: number) {
    if (videos.some((item) => item.id === videoId)) {
      setPendingVideoCardId(videoId);
      closeVideoEditor();
      return;
    }

    const activeFilters = {
      search,
      startDate,
      endDate,
      peopleIds: selectedPeople,
      peopleMode: peopleFilterMode,
      genreIds: selectedGenres,
      genreMode: genreFilterMode,
      typeIds: selectedTypes,
      seriesIds: selectedSeries,
      sort: sort === "최신순" ? "newest" as const : "oldest" as const,
      pageSize: VIDEOS_PER_PAGE,
    };

    async function findVideoPage(
      filters: typeof activeFilters
    ): Promise<number | null> {
      const firstPage = await fetchVideoPage({ ...filters, page: 1 });
      if (firstPage.items.some((item) => item.id === videoId)) return 1;

      const pageCount = Math.ceil(firstPage.totalCount / VIDEOS_PER_PAGE);
      for (let page = 2; page <= pageCount; page += 1) {
        const result = await fetchVideoPage({ ...filters, page });
        if (result.items.some((item) => item.id === videoId)) return page;
      }
      return null;
    }

    try {
      let targetPage = await findVideoPage(activeFilters);

      if (targetPage === null) {
        resetFilters();
        targetPage = await findVideoPage({
          search: "",
          startDate: "",
          endDate: "",
          peopleIds: [],
          peopleMode: "all",
          genreIds: [],
          genreMode: "all",
          typeIds: [],
          seriesIds: [],
          sort: "newest",
          pageSize: VIDEOS_PER_PAGE,
        });
      }

      if (targetPage === null) {
        setPendingVideoCardId(null);
        return;
      }

      setPendingVideoCardId(videoId);
      setCurrentPage(targetPage);
      closeVideoEditor();
    } catch (error) {
      console.error("이동할 영상 조회 오류:", error);
      setPendingVideoCardId(null);
    }
  }

  // =============================
  // 영상 저장
  // =============================

  async function saveVideoRelations() {
    if (!isAdmin || !editingVideo) return;

    if (typeof window !== "undefined") {
      videoEditorScrollYRef.current =
        window.scrollY;
    }

    setSavingVideo(true);

    try {
      const { error: peopleDeleteError } = await supabase
        .from("video_people")
        .delete()
        .eq("video", editingVideo.id);

      if (peopleDeleteError) throw peopleDeleteError;

      if (editorPeople.length > 0) {
        const { error: peopleInsertError } = await supabase
          .from("video_people")
          .insert(
            editorPeople.map((personId) => ({
              video: editingVideo.id,
              person: personId,
            }))
          );

        if (peopleInsertError) throw peopleInsertError;
      }

      const { error: genreDeleteError } = await supabase
        .from("video_genres")
        .delete()
        .eq("video", editingVideo.id);

      if (genreDeleteError) throw genreDeleteError;

      if (editorGenres.length > 0) {
        const { error: genreInsertError } = await supabase
          .from("video_genres")
          .insert(
            editorGenres.map((genreId) => ({
              video: editingVideo.id,
              genre: genreId,
            }))
          );

        if (genreInsertError) throw genreInsertError;
      }

      const { error: videoUpdateError } = await supabase
        .from("videos")
        .update({
          type_ids: editorTypes,
          type_id: editorTypes[0] ?? null,
          series_ids: editorSeries,
          series_id: editorSeries[0] ?? null,
        })
        .eq("id", editingVideo.id);

      if (videoUpdateError) throw videoUpdateError;

      const { error: relationDeleteAError } = await supabase
        .from("video_relations")
        .delete()
        .eq("video_id", editingVideo.id);

      if (relationDeleteAError) throw relationDeleteAError;

      const { error: relationDeleteBError } = await supabase
        .from("video_relations")
        .delete()
        .eq("related_video_id", editingVideo.id);

      if (relationDeleteBError) throw relationDeleteBError;

      const uniqueRelatedIds = Array.from(
        new Set(
          editorRelatedVideos.filter(
            (id) => id !== editingVideo.id
          )
        )
      );

      if (uniqueRelatedIds.length > 0) {
        const relationRows = uniqueRelatedIds.map((relatedId) => ({
          video_id: Math.min(editingVideo.id, relatedId),
          related_video_id: Math.max(editingVideo.id, relatedId),
        }));

        const { error: relationInsertError } = await supabase
          .from("video_relations")
          .insert(relationRows);

        if (relationInsertError) throw relationInsertError;
      }

      setRelatedCounts((current) => {
        const next = { ...current };

        next[editingVideo.id] = uniqueRelatedIds.length;

        uniqueRelatedIds.forEach((relatedId) => {
          next[relatedId] = Math.max(
            next[relatedId] ?? 0,
            1
          );
        });

        return next;
      });

      setVideos((currentVideos) =>
        currentVideos.map((item) =>
          item.id === editingVideo.id
            ? {
                ...item,
                peopleIds: [...editorPeople],
                genreIds: [...editorGenres],
                typeIds: [...editorTypes],
                typeId: editorTypes[0] ?? null,
                seriesIds: [...editorSeries],
                seriesId: editorSeries[0] ?? null,
              }
            : item
        )
      );

      closeVideoEditor();

      if (typeof window !== "undefined") {
        const restoreScroll = () => {
          const y = videoEditorScrollYRef.current;
          window.scrollTo({
            top: y,
            left: 0,
            behavior: "auto",
          });

          const scrollingElement = document.scrollingElement;
          if (scrollingElement) {
            scrollingElement.scrollTop = y;
          }
        };

        restoreScroll();

        requestAnimationFrame(() => {
          restoreScroll();
          requestAnimationFrame(() => {
            restoreScroll();
            window.setTimeout(restoreScroll, 100);
          });
        });
      }
    } catch (error) {
      console.error("영상 정보 저장 오류:", error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(JSON.stringify(error, null, 2));
      }
    } finally {
      setSavingVideo(false);
    }
  }

  // =============================
  // 서버 필터링 및 페이지네이션
  // =============================

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setPageLoading(true);
      try {
        const result = await fetchVideoPage({
          search,
          startDate,
          endDate,
          peopleIds: selectedPeople,
          peopleMode: peopleFilterMode,
          genreIds: selectedGenres,
          genreMode: genreFilterMode,
          typeIds: selectedTypes,
          seriesIds: selectedSeries,
          sort: sort === "최신순" ? "newest" : "oldest",
          page: currentPage,
          pageSize: VIDEOS_PER_PAGE,
        });

        if (!active) return;
        setVideos(result.items);
        setFilteredTotalCount(result.totalCount);

        const nextTotalPages = Math.ceil(result.totalCount / VIDEOS_PER_PAGE);
        if (currentPage > Math.max(1, nextTotalPages)) {
          setCurrentPage(Math.max(1, nextTotalPages));
        }
      } catch (error) {
        if (!active) return;
        console.error("영상 페이지 조회 오류:", error);
        setVideos([]);
        setFilteredTotalCount(0);
      } finally {
        if (active) setPageLoading(false);
      }
    }

    void loadPage();
    return () => {
      active = false;
    };
  }, [
    fetchVideoPage,
    setVideos,
    search,
    startDate,
    endDate,
    selectedPeople,
    peopleFilterMode,
    selectedGenres,
    genreFilterMode,
    selectedTypes,
    selectedSeries,
    sort,
    currentPage,
    importing,
  ]);

  const totalPages = Math.ceil(filteredTotalCount / VIDEOS_PER_PAGE);
  const paginatedVideos = videos;

  useEffect(() => {
    if (pendingVideoCardId === null) return;

    const card = document.querySelector<HTMLElement>(
      `[data-video-id="${pendingVideoCardId}"]`
    );

    if (!card) return;

    card.scrollIntoView({
      behavior: "auto",
      block: "start",
    });

    setPendingVideoCardId(null);
  }, [pendingVideoCardId, paginatedVideos]);

  // =============================
  // 필터 초기화
  // =============================

  function resetFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setSelectedPeople([]);
    setPeopleFilterMode("all");
    setSelectedGenres([]);
    setGenreFilterMode("all");
    setSelectedTypes([]);
    setSelectedSeries([]);
    setSort("최신순");
  }

  // =============================
  // 카드 연계 영상 개수
  // =============================
  // 관련 영상 개수는 useVideos()에서 함께 불러온 값을 사용합니다.
  // 페이지 이동마다 video_relations를 다시 조회하지 않습니다.
  useEffect(() => {
    setRelatedCounts(
      Object.fromEntries(
        videos.map((video) => [
          video.id,
          (video as Video & { relatedCount?: number }).relatedCount ?? 0,
        ])
      )
    );
  }, [videos]);

  // =============================
  // 화면
  // =============================

  return (
    <>
      <style>{`
        .archive-title {
          color: #ffffff !important;
        }

        html[data-theme="light"] .archive-title {
          color: #18181b !important;
        }
      `}</style>
      <main className="site-page min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 sm:py-10 sm:pb-16">

          {/* 헤더 */}
          <header className="mb-8">
            <p className="text-xs font-semibold tracking-[0.25em] text-zinc-600">
              SLEEPGROUND TV ARCHIVE
            </p>

            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="archive-title text-3xl font-bold tracking-tight sm:text-4xl">
                  잠뜰 TV Archive
                </h1>
              </div>

              <SiteMenu
                isAdmin={isAdmin}
                onAdminChange={setIsAdmin}
                importing={importing}
                onImportYouTubeVideos={importYouTubeVideos}
                onOpenYouTubeAdd={() => {
                  setYoutubeUrl("");
                  setShowYouTubeAdd(true);
                }}
              />
            </div>

            {importMessage && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                {importMessage}
              </div>
            )}
          </header>

          {isAdmin && showYouTubeAdd && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setShowYouTubeAdd(false);
                  setYoutubeUrl("");
                }
              }}
            >
              <div
                className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="youtube-add-title"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 id="youtube-add-title" className="text-lg font-bold text-white">
                      YouTube 영상 추가
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowYouTubeAdd(false);
                      setYoutubeUrl("");
                    }}
                    disabled={importing}
                    className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setShowYouTubeAdd(false);
                        setYoutubeUrl("");
                      } else if (
                        e.key === "Enter" &&
                        youtubeUrl.trim() &&
                        !importing
                      ) {
                        e.preventDefault();
                        void handleAddYouTubeVideo();
                      }
                    }}
                    placeholder="https://youtube..."
                    disabled={importing}
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => void handleAddYouTubeVideo()}
                    disabled={importing || !youtubeUrl.trim()}
                    className="theme-action-button shrink-0 rounded-2xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importing ? "추가 중" : "추가"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 필터 */}
          <VideoFilters
            search={search}
            startDate={startDate}
            endDate={endDate}
            selectedPeople={selectedPeople}
            peopleFilterMode={peopleFilterMode}
            setPeopleFilterMode={setPeopleFilterMode}
            selectedGenres={selectedGenres}
            genreFilterMode={genreFilterMode}
            setGenreFilterMode={setGenreFilterMode}
            selectedTypes={selectedTypes}
            selectedSeries={selectedSeries}
            people={people}
            genres={genres}
            types={types}
            series={series}
            setSearch={setSearch}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setSelectedPeople={setSelectedPeople}
            setSelectedGenres={setSelectedGenres}
            setSelectedTypes={setSelectedTypes}
            setSelectedSeries={setSelectedSeries}
            onReset={resetFilters}
          />

          {/* 결과 헤더 */}
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-zinc-900/80 px-2 pb-1 sm:mb-2.5 sm:px-3 sm:pb-1.5 lg:px-4">
            <div className="min-w-0">
              <span className="text-xs font-medium tracking-tight text-zinc-500">
                {filteredTotalCount.toLocaleString()}개
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSort(sort === "최신순" ? "오래된순" : "최신순")}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-800/70 hover:text-zinc-200 active:scale-[0.98] sm:h-8 sm:rounded-lg sm:px-2.5 sm:text-[11px]"
              aria-label={`정렬 변경: 현재 ${sort}`}
            >
              <span>{sort}</span>
              <span className="text-[9px] leading-none text-zinc-600">⇅</span>
            </button>
          </div>

          {/* 로딩 */}
          {(loading || pageLoading) && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 py-24 text-center">
              <p className="text-sm text-zinc-500">
                영상을 불러오는 중
              </p>
            </div>
          )}

          {/* 영상 없음 */}
          {!loading && !pageLoading && filteredTotalCount === 0 && (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center">
              <p className="text-sm text-zinc-500">
                해당 조건의 영상이 없습니다.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
              >
                필터 초기화
              </button>
            </div>
          )}

          {/* 영상 목록 */}
          {!loading && !pageLoading && videos.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedVideos.map((video) => (
                  <div
                    key={`video-card-${video.id}`}
                    data-video-id={video.id}
                  >
                    <VideoCard
                      video={video}
                      people={people}
                      genres={genres}
                      types={types}
                      series={series}
                      relatedCount={relatedCounts[video.id] ?? 0}
                      isAdmin={isAdmin}
                      onEdit={openVideoEditor}
                      onNavigateToVideo={navigateToVideoCard}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="영상 페이지 이동"
                  className="mt-8 flex w-full min-w-0 items-center justify-center overflow-hidden px-0 pb-2"
                >
                  {/* 모바일 */}
                  <div className="flex w-full min-w-0 items-center justify-center gap-1 sm:hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="h-10 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      이전
                    </button>

                    <div className="flex min-w-0 shrink items-center justify-center gap-1">
                      {[currentPage - 1, currentPage, currentPage + 1]
                        .filter((page) => page >= 1 && page <= totalPages)
                        .map((page) => (
                          <button
                            key={`mobile-page-${page}`}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`h-10 min-w-9 shrink-0 rounded-xl px-2 text-sm font-medium transition ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="h-10 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      다음
                    </button>
                  </div>

                  {/* PC */}
                  <div className="hidden items-center gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      이전
                    </button>

                    <div className="flex min-w-0 flex-wrap items-center justify-center gap-1">
                      {(() => {
                        const pages: (number | string)[] = [];

                        if (totalPages <= 7) {
                          for (let page = 1; page <= totalPages; page++) {
                            pages.push(page);
                          }
                        } else {
                          pages.push(1);

                          if (currentPage > 4) pages.push("...");

                          const startPage = Math.max(2, currentPage - 1);
                          const endPage = Math.min(
                            totalPages - 1,
                            currentPage + 1
                          );

                          for (let page = startPage; page <= endPage; page++) {
                            pages.push(page);
                          }

                          if (currentPage < totalPages - 3) pages.push("...");

                          pages.push(totalPages);
                        }

                        return pages.map((page, index) =>
                          page === "..." ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2 text-sm text-zinc-600"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page as number)}
                              className={`min-w-10 shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      다음
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        <footer className="site-footer border-t border-zinc-900 bg-zinc-950">
          <div className="mx-auto max-w-7xl px-5 py-8 text-center sm:px-6">
            <p className="text-xs text-zinc-600">
              SLEEPGROUND TV ARCHIVE | 잠뜰 TV Archive
            </p>
            <p className="mt-2 text-xs text-zinc-700">
              Made by @from_foum 
            </p>
          </div>
        </footer>

        {isAdmin && (
          <VideoEditor
            video={editingVideo}
            people={people}
            genres={genres}
            types={types}
            series={series}
            selectedPeople={editorPeople}
            selectedGenres={editorGenres}
            selectedTypes={editorTypes}
            selectedSeries={editorSeries}
            videos={videos}
            selectedRelatedVideos={editorRelatedVideos}
            saving={savingVideo}
            setSelectedPeople={setEditorPeople}
            setSelectedGenres={setEditorGenres}
            setSelectedTypes={setEditorTypes}
            setSelectedSeries={setEditorSeries}
            setSelectedRelatedVideos={setEditorRelatedVideos}
            onSave={saveVideoRelations}
            onDelete={async () => {
              if (!editingVideo || savingVideo) return;
              const confirmed = window.confirm(
                `"${editingVideo.title}" 영상을 삭제할까요?\n삭제하면 연결된 멤버, 장르, 연계 정보도 함께 삭제됩니다.`
              );
              if (!confirmed) return;
              try {
                setSavingVideo(true);
                await deleteVideo(editingVideo.id);
                closeVideoEditor();
              } catch (error) {
                alert(
                  error instanceof Error
                    ? error.message
                    : "영상 삭제에 실패했습니다."
                );
              } finally {
                setSavingVideo(false);
              }
            }}
            onClose={closeVideoEditor}
            onNavigateToVideo={navigateToVideoCard}
          />
        )}
      </main>
    </>
  );
}