export type Person = {
  id: number;
  name: string;
};

export type Category = {
  id: number;
  name: string;
};

export type Video = {
  id: number;
  title: string;
  thumbnail_url: string;
  published_at: string;
  youtube_url: string;
  youtube_video_id?: string | null;
  peopleIds?: number[];
  genreIds?: number[];
  typeIds?: number[];
  type_ids?: number[] | null;
  type_id?: number | null;
  series_id?: number | null;
  seriesId?: number | null;
  typeId?: number | null;
};
