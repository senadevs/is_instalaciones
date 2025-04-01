import type { APIRoute } from 'astro';
import type { Review, GoogleReview } from '../../lib/type';


const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY;
const PLACE_ID = import.meta.env.GOOGLE_PLACE_ID;

async function fetchGoogleReviews(): Promise<{
  reviews: Review[];
  rating: number;
  reviewCount: number;
}> {
  try {
    // Fetch place details including reviews
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google reviews');
    }

    const data = await response.json();

    // Transform Google reviews to our format
    const reviews: Review[] = data.result.reviews.map((review: GoogleReview) => ({
      initial: review.author_name.charAt(0).toUpperCase(),
      name: review.author_name,
      rating: review.rating,
      text: review.text,
      date: formatRelativeDate(review.time)
    }));

    return {
      reviews,
      rating: data.result.rating,
      reviewCount: data.result.user_ratings_total
    };
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    throw error;
  }
}

function formatRelativeDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return 'hace ' + diffDays + (diffDays === 1 ? ' día' : ' días');
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return 'hace ' + weeks + (weeks === 1 ? ' semana' : ' semanas');
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return 'hace ' + months + (months === 1 ? ' mes' : ' meses');
  } else {
    const years = Math.floor(diffDays / 365);
    return 'hace ' + years + (years === 1 ? ' año' : ' años');
  }
}

export const GET: APIRoute = async () => {
  try {
    // Fetch reviews from Google
    const { reviews, rating, reviewCount } = await fetchGoogleReviews();
    
    return new Response(
      JSON.stringify({
        reviews,
        rating,
        reviewCount,
        googleBusinessId: PLACE_ID
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in reviews API:', error);
    return new Response(
      JSON.stringify({
        error: 'Error fetching reviews'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};