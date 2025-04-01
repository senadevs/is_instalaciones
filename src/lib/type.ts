export interface Review {
  initial: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
}