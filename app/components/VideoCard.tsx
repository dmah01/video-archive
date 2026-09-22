            "use client";

            import { useLayoutEffect, useRef, useState } from "react";
            import { supabase } from "@/app/lib/supabase";
            import type { Category, Person, Video } from "@/app/lib/archive-types";

            type VideoCardProps = {
              video: Video;
              people: Person[];
              genres: Category[];
              types: Category[];
              series: Category[];
              relatedCount?: number;
              isAdmin?: boolean;
              onEdit: (video: Video) => void;
              onNavigateToVideo: (videoId: number) => void;
            };

            const formatDisplayDate = (value: string) => {
              const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
              return match ? `${match[1]}.${match[2]}.${match[3]}.` : value.slice(0, 10);
            };

            const personColors: Record<string, string> = {
              잠뜰: "bg-sky-400/15 text-sky-300 border-sky-400/25",
              각별: "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
              공룡: "bg-green-400/15 text-green-300 border-green-400/25",
              수현: "bg-purple-500/15 text-purple-300 border-purple-500/25",
              라더: "bg-red-400/15 text-red-300 border-red-400/25",
              덕개: "bg-orange-400/15 text-orange-300 border-orange-400/25",
              요정: "bg-pink-400/15 text-pink-300 border-pink-400/25",
              올멤: "bg-zinc-500/20 text-zinc-300 border-zinc-500/25",
              태쁘: "bg-blue-700/20 text-blue-300 border-blue-700/30",
              팀샐: "bg-lime-400/15 text-lime-300 border-lime-400/25",
            };

            const PERSON_ORDER = [
              "잠뜰",
              "라더",
              "덕개",
              "각별",
              "공룡",
              "수현",
              "올멤",
              "요정",
              "태쁘",
              "팀샐",
              "게스트",
            ];

            const sortPeople = <T extends { name: string }>(items: T[]) =>
              [...items].sort((a, b) => {
                const ai = PERSON_ORDER.indexOf(a.name);
                const bi = PERSON_ORDER.indexOf(b.name);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return a.name.localeCompare(b.name, "ko");
              });

            const GENRE_ORDER = [
              "마인크래프트",
              "종합게임",
              "스토리 / 역할극",
              "공포 / 스릴",
              "예능 / 개그",
              "감동 / 드라마",
              "추리",
              "상황극",
              "미니게임",
              "마피아 / 머더 / 라이어게임",
              "베드워즈 / 스카이블록",
              "야생 / 엔드런",
              "생존",
              "PVP / 전투 / 레이드",
              "탈출 / 추격",
              "파쿠르 / 데스런",
              "숨바꼭질 / 꼬리잡기 / 도능",
              "모드 / 업데이트",
              "크로스오버",
              "실사",
              "토크",
            ];

            const sortGenres = <T extends { name: string }>(items: T[]) =>
              [...items].sort((a, b) => {
                const ai = GENRE_ORDER.indexOf(a.name);
                const bi = GENRE_ORDER.indexOf(b.name);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return a.name.localeCompare(b.name, "ko");
              });

            export default function VideoCard({
              video,
              people,
              genres,
              types,
              series,
              relatedCount = 0,
              isAdmin = false,
              onEdit,
              onNavigateToVideo,
            }: VideoCardProps) {
              const selectedPeople = sortPeople(
                people.filter((person) => (video.peopleIds ?? []).includes(person.id))
              );

              const selectedGenres = sortGenres(
                genres.filter((genre) =>
                  (video.genreIds ?? []).includes(genre.id)
                )
              );

              const selectedTypes = types.filter((type) => {
                const typeIds = Array.isArray(video.typeIds)
                  ? video.typeIds
                  : video.typeId != null
                    ? [video.typeId]
                    : [];

                return typeIds.includes(type.id);
              });

              const videoWithSeriesIds = video as Video & { seriesIds?: number[] };
              const videoSeriesIds = Array.isArray(videoWithSeriesIds.seriesIds)
                ? videoWithSeriesIds.seriesIds
                : video.seriesId != null
                  ? [video.seriesId]
                  : [];
              const videoSeries = series.filter((item) =>
                videoSeriesIds.includes(item.id)
              );

              const tagBaseClass = "inline-flex min-h-7 shrink-0 max-w-full items-center rounded-full border px-2.5 py-1 text-[12px] font-medium leading-4 whitespace-nowrap";

              const allTags = [
                ...selectedGenres.map((genre) => ({
                  id: `genre-${genre.id}`,
                  name: genre.name,
                  className: `${tagBaseClass} border-purple-400/20 bg-purple-400/10 text-purple-300`,
                })),
                ...selectedTypes.map((type) => ({
                  id: `type-${type.id}`,
                  name: type.name,
                  className: `${tagBaseClass} border-indigo-400/20 bg-indigo-400/10 text-indigo-300`,
                })),
                ...videoSeries.map((item) => ({
                  id: `series-${item.id}`,
                  name: item.name,
                  className: `${tagBaseClass} border-emerald-400/20 bg-emerald-400/10 text-emerald-300`,
                })),
                ...selectedPeople.map((person) => ({
                  id: `person-${person.id}`,
                  name: person.name,
                  className: `${tagBaseClass} ${personColors[person.name] ?? "border-zinc-700 bg-zinc-800 text-zinc-400"}`,
                })),
                ...(relatedCount > 0
                  ? [{
                      id: "related",
                      name: `연계 ${relatedCount}`,
                      className: `${tagBaseClass} border-sky-400/20 bg-sky-400/10 text-sky-300`,
                    }]
                  : []),
              ];

              const [showAllTags, setShowAllTags] = useState(false);
              const [showRelated, setShowRelated] = useState(false);
              const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
              const [relatedLoading, setRelatedLoading] = useState(false);
              const [relatedError, setRelatedError] = useState("");

              async function openRelatedVideos() {
                if (relatedCount <= 0) return;

                setShowRelated(true);
                setRelatedError("");

                if (relatedVideos.length > 0) return;

                setRelatedLoading(true);
                try {
                  const { data: relations, error: relationError } = await supabase
                    .from("video_relations")
                    .select("video_id, related_video_id")
                    .or(`video_id.eq.${video.id},related_video_id.eq.${video.id}`);

                  if (relationError) throw relationError;

                  const ids = Array.from(
                    new Set(
                      (relations ?? [])
                        .map((relation) =>
                          Number(relation.video_id) === video.id
                            ? Number(relation.related_video_id)
                            : Number(relation.video_id)
                        )
                        .filter((id) => Number.isFinite(id) && id !== video.id)
                    )
                  );

                  if (ids.length === 0) {
                    setRelatedVideos([]);
                    return;
                  }

                  const { data: videosData, error: videosError } = await supabase
                    .from("videos")
                    .select("id,title,thumbnail_url,published_at,youtube_url,type_ids,type_id,series_id,series_ids")
                    .in("id", ids);

                  if (videosError) throw videosError;

                  const byId = new Map((videosData ?? []).map((item) => [Number(item.id), item as Video]));
                  setRelatedVideos(ids.map((id) => byId.get(id)).filter(Boolean) as Video[]);
                } catch (error) {
                  console.error("연계 영상 불러오기 오류:", error);
                  setRelatedError("연계 영상을 불러오지 못했습니다.");
                } finally {
                  setRelatedLoading(false);
                }
              }
              const [visibleTagCount, setVisibleTagCount] = useState(allTags.length);
              const tagMeasureRef = useRef<HTMLDivElement>(null);

              useLayoutEffect(() => {
                const container = tagMeasureRef.current;
                if (!container) return;

                const measure = () => {
                  const tagElements = Array.from(
                    container.querySelectorAll<HTMLElement>("[data-tag-index]")
                  );
                  const moreButton = container.querySelector<HTMLElement>("[data-more-button]");

                  if (!tagElements.length) {
                    setVisibleTagCount(0);
                    return;
                  }

                  const lineHeight = 24;
                  const fitsTwoLines = (count: number) => {
                    const elements = tagElements.slice(0, count);
                    elements.forEach((element) => {
                      element.style.display = "inline-flex";
                    });
                    tagElements.slice(count).forEach((element) => {
                      element.style.display = "none";
                    });

                    if (moreButton) {
                      moreButton.style.display = count < allTags.length ? "inline-flex" : "none";
                    }

                    const tops = elements
                      .filter((element) => element.offsetParent !== null)
                      .map((element) => element.offsetTop);
                    const moreTop = moreButton && moreButton.offsetParent !== null
                      ? moreButton.offsetTop
                      : null;
                    const allTops = moreTop === null ? tops : [...tops, moreTop];
                    const rows = new Set(allTops);

                    return rows.size <= 2;
                  };

                  let best = allTags.length;
                  if (!fitsTwoLines(best)) {
                    best = 0;
                    for (let count = 1; count <= allTags.length; count += 1) {
                      if (fitsTwoLines(count)) best = count;
                      else break;
                    }
                  }

                  setVisibleTagCount(best);

                  tagElements.forEach((element, index) => {
                    element.style.display = index < best ? "inline-flex" : "none";
                  });
                  if (moreButton) {
                    moreButton.style.display = best < allTags.length ? "inline-flex" : "none";
                  }
                };

                measure();
                const observer = new ResizeObserver(measure);
                observer.observe(container);
                return () => observer.disconnect();
              }, [allTags.length]);

              const hiddenTagCount = Math.max(0, allTags.length - visibleTagCount);

              return (
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/70 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900">
                  <a
                    href={video.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <div className="relative aspect-video overflow-hidden bg-zinc-800">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
                        YouTube
                      </div>
                    </div>
                  </a>

                  <div className="flex flex-1 flex-col p-5">
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <h3 className="line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 text-zinc-100 transition group-hover:text-white">
                        {video.title}
                      </h3>
                    </a>

                    <p className="mt-2 text-xs text-zinc-500">
                      {formatDisplayDate(video.published_at)}
                    </p>

                    <div className="relative mt-4 h-20 shrink-0 overflow-hidden">
                      <div ref={tagMeasureRef} className="flex h-full content-start flex-wrap gap-1.5 overflow-hidden">
                        {allTags.map((tag, index) =>
                          tag.id === "related" ? (
                            <span
                              key={tag.id}
                              data-tag-index={index}
                              role="button"
                              tabIndex={0}
                              onClick={openRelatedVideos}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openRelatedVideos();
                                }
                              }}
                              className={`${tag.className} cursor-pointer`}
                              title="연계 영상 보기"
                            >
                              {tag.name}
                            </span>
                          ) : (
                            <span
                              key={tag.id}
                              data-tag-index={index}
                              className={tag.className}
                              title={tag.name}
                            >
                              {tag.name}
                            </span>
                          )
                        )}

                        <button
              type="button"
              data-more-button
              onClick={() => setShowAllTags(true)}
              className="hidden shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
              aria-label={`태그 ${hiddenTagCount}개 더 보기`}
            >
              <span className="inline-flex h-full items-center justify-center text-[15px] leading-4">
                +{hiddenTagCount}
              </span>
            </button>
                      </div>
                    </div>

                    {showRelated && (
                      <div
                        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                        onClick={() => setShowRelated(false)}
                      >
                        <div
                          className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-zinc-700 bg-zinc-950 shadow-2xl sm:max-h-[80vh] sm:rounded-3xl"
                          onClick={(event) => event.stopPropagation()}
                          role="dialog"
                          aria-modal="true"
                          aria-label="연계 영상"
                        >
                          <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-4 sm:px-5">
                            <div className="min-w-0 pr-3">
                              <h4 className="text-sm font-semibold text-zinc-100">연계 영상</h4>
                              <p className="mt-1 truncate text-[11px] text-zinc-600">{video.title}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowRelated(false)}
                              className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                              닫기
                            </button>
                          </div>

                          <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
                            {relatedLoading && (
                              <p className="py-10 text-center text-xs text-zinc-600">연계 영상을 불러오는 중...</p>
                            )}
                            {!relatedLoading && relatedError && (
                              <p className="py-10 text-center text-xs text-red-300">{relatedError}</p>
                            )}
                            {!relatedLoading && !relatedError && relatedVideos.length === 0 && (
                              <p className="py-10 text-center text-xs text-zinc-600">연계 영상이 없습니다.</p>
                            )}
                            <div className="space-y-2">
                              {!relatedLoading && relatedVideos.map((related) => (
                                <button
                                  key={related.id}
                                  type="button"
                                  onClick={() => {
                                    setShowRelated(false);
                                    onNavigateToVideo(related.id);
                                  }}
                                  className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-2.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
                                >
                                  <img
                                    src={related.thumbnail_url}
                                    alt=""
                                    loading="lazy"
                                    className="h-14 w-24 shrink-0 rounded-xl object-cover sm:h-16 sm:w-28"
                                  />
                                  <div className="min-w-0">
                                    <p className="line-clamp-2 text-xs font-medium leading-5 text-zinc-200">{related.title}</p>
                                    <p className="mt-1 text-[10px] text-zinc-600">{formatDisplayDate(related.published_at)}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {showAllTags && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onClick={() => setShowAllTags(false)}
                      >
                        <div
                          className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
                          onClick={(event) => event.stopPropagation()}
                          role="dialog"
                          aria-modal="true"
                          aria-label="전체 태그"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-zinc-100">전체 태그</h4>
                            <button
                              type="button"
                              onClick={() => setShowAllTags(false)}
                              className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                              닫기
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {allTags.map((tag) => (
                              <span key={tag.id} className={tag.className}>
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onEdit(video)}
                        className="mt-auto flex w-full items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
                      >
                        영상 관리
                      </button>
                    )}
                  </div>
                </article>
              );
            }
