import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    // 1. 채널 ID 찾기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(
        handle
      )}&key=${apiKey}`
    );

    const channelData =
      await channelResponse.json();

    if (!channelResponse.ok) {
      return NextResponse.json(
        {
          error:
            "YouTube 채널 정보를 가져오지 못했습니다.",
          details: channelData,
        },
        { status: 500 }
      );
    }

    if (!channelData.items?.length) {
      return NextResponse.json(
        {
          error:
            "채널을 찾지 못했습니다. handle 값을 확인해주세요.",
        },
        { status: 404 }
      );
    }

    const uploadsPlaylistId =
      channelData.items[0].contentDetails
        .relatedPlaylists.uploads;

    // 2. 최신 영상 50개만 가져오기
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      maxResults: "50",
      playlistId: uploadsPlaylistId,
      key: apiKey,
    });

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );

    const videosData =
      await videosResponse.json();

    if (!videosResponse.ok) {
      console.error(
        "YouTube API 오류:",
        videosData
      );

      return NextResponse.json(
        {
          error:
            "YouTube 영상 목록을 가져오지 못했습니다.",
          details: videosData,
        },
        { status: 500 }
      );
    }

    const items = videosData.items ?? [];

    console.log(
      "최신 YouTube 영상:",
      items.length,
      "개"
    );

    // 3. Supabase 저장용 데이터
    const videos = items
      .filter(
        (item: any) =>
          item.contentDetails?.videoId &&
          item.contentDetails?.videoPublishedAt
      )
      .map((item: any) => ({
        youtube_video_id:
          item.contentDetails.videoId,

        title:
          item.snippet.title,

        description:
          item.snippet.description,

        thumbnail_url:
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url,

        published_at:
          item.contentDetails.videoPublishedAt,

        youtube_url:
          `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      }));

    // 4. 기존 영상은 절대 삭제하지 않고
    //    최신 50개만 추가/업데이트
    if (videos.length > 0) {
      const { error } = await supabase
        .from("videos")
        .upsert(videos, {
          onConflict:
            "youtube_video_id",
        });

      if (error) {
        console.error(
          "Supabase 저장 오류:",
          error
        );

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
      message:
        "최신 50개 영상만 확인하고 저장했습니다.",
    });
  } catch (error) {
    console.error(
      "YouTube 가져오기 오류:",
      error
    );

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
