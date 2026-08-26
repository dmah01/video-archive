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
    const startDate = new Date("2019-06-01T00:00:00Z");

    // 1. 채널 ID 찾기
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

    // 2. 모든 영상 가져오기
    const allVideos: any[] = [];
    let pageToken = "";

    while (true) {
      const url =
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet&maxResults=50` +
        `&playlistId=${uploadsPlaylistId}` +
        `&key=${apiKey}` +
        (pageToken
          ? `&pageToken=${pageToken}`
          : "");

      const videosResponse = await fetch(url);
      const videosData = await videosResponse.json();

      if (!videosResponse.ok) {
        return NextResponse.json(
          {
            error: "YouTube 영상 목록을 가져오지 못했습니다.",
            details: videosData,
          },
          { status: 500 }
        );
      }

      if (!videosData.items) {
        break;
      }

      for (const item of videosData.items) {
        const publishedAt = new Date(
          item.snippet.publishedAt
        );

        // 2019-06-01 이전 영상이면 종료
        if (publishedAt < startDate) {
          break;
        }

        allVideos.push(item);
      }

      // 이번 페이지에 2019-06-01 이전 영상이 있었는지 확인
      const reachedStartDate = videosData.items.some(
        (item: any) =>
          new Date(item.snippet.publishedAt) <
          startDate
      );

      if (
        reachedStartDate ||
        !videosData.nextPageToken
      ) {
        break;
      }

      pageToken = videosData.nextPageToken;
    }

    // 3. Supabase에 저장할 데이터 만들기
    const videos = allVideos.map((item) => ({
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

    // 4. Supabase 저장
    if (videos.length > 0) {
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