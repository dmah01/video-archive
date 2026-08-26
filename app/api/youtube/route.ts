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

    // 잠뜰TV 채널
    const handle = "@sleepground";

    // 1. 채널 ID 및 업로드 재생목록 찾기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(
        handle
      )}&key=${apiKey}`
    );

    const channelData = await channelResponse.json();

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
      channelData.items[0].contentDetails.relatedPlaylists
        .uploads;

    // 2. 여러 페이지에서 영상 가져오기
    let pageToken = "";
    const allVideos: any[] = [];

    while (allVideos.length < 100) {
      const url =
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet&maxResults=50` +
        `&playlistId=${uploadsPlaylistId}` +
        `&key=${apiKey}` +
        (pageToken
          ? `&pageToken=${pageToken}`
          : "");

      const response = await fetch(url);
      const data = await response.json();

      if (!data.items) {
        return NextResponse.json(
          {
            error: "영상 목록을 가져오지 못했습니다.",
            details: data,
          },
          { status: 500 }
        );
      }

      allVideos.push(...data.items);

      if (!data.nextPageToken) {
        break;
      }

      pageToken = data.nextPageToken;
    }

    // 최대 100개
    const selectedVideos = allVideos.slice(0, 100);

    // 3. Supabase에 저장할 데이터 만들기
    const videos = selectedVideos.map((item: any) => ({
      youtube_video_id:
        item.snippet.resourceId.videoId,

      title: item.snippet.title,

      description:
        item.snippet.description,

      thumbnail_url:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url,

      published_at:
        item.snippet.publishedAt,

      youtube_url:
        `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
    }));

    // 4. Supabase에 저장
    const { error } = await supabase
      .from("videos")
      .upsert(videos, {
        onConflict: "youtube_video_id",
      });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error: "Supabase 저장 실패",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}