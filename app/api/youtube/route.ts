import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

function extractYouTubeVideoId(value: string) {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (parts[0] === "shorts" || parts[0] === "embed") {
        return parts[1] ?? null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube API 키가 없습니다." },
        { status: 500 }
      );
    }

    const handle = "@sleepground";

    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(
        handle
      )}&key=${apiKey}`
    );

    const channelData = await channelResponse.json();

    if (!channelResponse.ok) {
      return NextResponse.json(
        {
          error: "YouTube 채널 정보를 가져오지 못했습니다.",
          details: channelData,
        },
        { status: 500 }
      );
    }

    if (!channelData.items?.length) {
      return NextResponse.json(
        {
          error: "채널을 찾지 못했습니다. handle 값을 확인해주세요.",
        },
        { status: 404 }
      );
    }

    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      maxResults: "50",
      playlistId: uploadsPlaylistId,
      key: apiKey,
    });

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );

    const videosData = await videosResponse.json();

    if (!videosResponse.ok) {
      console.error("YouTube API 오류:", videosData);

      return NextResponse.json(
        {
          error: "YouTube 영상 목록을 가져오지 못했습니다.",
          details: videosData,
        },
        { status: 500 }
      );
    }

    const items = videosData.items ?? [];

    const videos = items
      .filter(
        (item: any) =>
          item.contentDetails?.videoId &&
          item.contentDetails?.videoPublishedAt
      )
      .map((item: any) => ({
        youtube_video_id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail_url:
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url,
        published_at: item.contentDetails.videoPublishedAt,
        youtube_url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      }));

    if (videos.length > 0) {
      const { error } = await supabase
        .from("videos")
        .upsert(videos, { onConflict: "youtube_video_id" });

      if (error) {
        console.error("Supabase 저장 오류:", error);

        return NextResponse.json(
          {
            error: "Supabase 저장 실패",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      count: videos.length,
      message: "최신 50개 영상만 확인하고 저장했습니다.",
    });
  } catch (error) {
    console.error("YouTube 가져오기 오류:", error);

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube API 키가 없습니다." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const youtubeUrl =
      typeof body.youtubeUrl === "string"
        ? body.youtubeUrl.trim()
        : "";

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube 링크를 입력해주세요." },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: "올바른 YouTube 영상 링크를 입력해주세요." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      part: "snippet",
      id: videoId,
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "YouTube 영상 정보를 가져오지 못했습니다.",
          details: data,
        },
        { status: 500 }
      );
    }

    const item = data.items?.[0];

    if (!item) {
      return NextResponse.json(
        { error: "해당 YouTube 영상을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const snippet = item.snippet;

    if (!snippet?.publishedAt) {
      return NextResponse.json(
        { error: "영상 게시일을 가져올 수 없습니다." },
        { status: 422 }
      );
    }

    const video = {
      youtube_video_id: videoId,
      title: snippet.title,
      description: snippet.description ?? "",
      thumbnail_url:
        snippet.thumbnails?.high?.url ??
        snippet.thumbnails?.medium?.url ??
        snippet.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      published_at: snippet.publishedAt,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
    };

    const { data: existing, error: existingError } = await supabase
      .from("videos")
      .select("id")
      .eq("youtube_video_id", videoId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          error: "기존 영상 확인에 실패했습니다.",
          details: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        created: false,
        videoId: existing.id,
        video,
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("videos")
      .insert(video)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: "영상 저장에 실패했습니다.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created: true,
      videoId: inserted.id,
      video,
    });
  } catch (error) {
    console.error("YouTube 영상 추가 오류:", error);

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
