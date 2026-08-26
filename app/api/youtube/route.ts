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
          error:
            "채널을 찾지 못했습니다. handle 값을 확인해주세요.",
        },
        { status: 404 }
      );
    }

    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists
        .uploads;

    // 2. 2019-06-01까지 영상 가져오기
    const allVideos: any[] = [];

    let pageToken: string | undefined = undefined;
    let reachedStartDate = false;

    while (!reachedStartDate) {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        maxResults: "50",
        playlistId: uploadsPlaylistId,
        key: apiKey,
      });

      if (pageToken) {
        params.set("pageToken", pageToken);
      }

      console.log(
        "YouTube 페이지:",
        pageToken ?? "첫 페이지"
      );

      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
      );

      const videosData = await videosResponse.json();

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

      if (!videosData.items?.length) {
        console.log("더 이상 영상이 없습니다.");
        break;
      }

      const firstDate =
        videosData.items[0]?.contentDetails
          ?.videoPublishedAt;

      const lastDate =
        videosData.items[
          videosData.items.length - 1
        ]?.contentDetails?.videoPublishedAt;

      console.log(
        "이번 페이지:",
        videosData.items.length,
        "개"
      );

      console.log(
        "첫 번째 영상 날짜:",
        firstDate
      );

      console.log(
        "마지막 영상 날짜:",
        lastDate
      );

      for (const item of videosData.items) {
        const videoPublishedAt =
          item.contentDetails?.videoPublishedAt;

        if (!videoPublishedAt) {
          continue;
        }

        const publishedDate = new Date(
          videoPublishedAt
        );

        if (publishedDate < startDate) {
          reachedStartDate = true;
          break;
        }

        allVideos.push(item);
      }

      if (reachedStartDate) {
        console.log(
          "2019-06-01에 도달했습니다."
        );
        break;
      }

      if (!videosData.nextPageToken) {
        console.log(
          "다음 페이지가 없습니다."
        );
        break;
      }

      pageToken = videosData.nextPageToken;
    }

    console.log(
      "최종 가져온 영상 수:",
      allVideos.length
    );

    // 3. Supabase 저장용 데이터
    const videos = allVideos.map((item) => ({
      youtube_video_id:
        item.contentDetails.videoId,

      title: item.snippet.title,

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

    // 4. Supabase 저장
    if (videos.length > 0) {
      const { error } = await supabase
        .from("videos")
        .upsert(videos, {
          onConflict: "youtube_video_id",
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
    });

  } catch (error) {
    console.error(
      "YouTube 가져오기 오류:",
      error
    );

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}