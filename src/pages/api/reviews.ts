import type { APIRoute } from 'astro';
import type { Review, GoogleReview } from '../../lib/type';

const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY;
const PLACE_ID = import.meta.env.GOOGLE_PLACE_ID;

// Verificar si las API keys están configuradas
if (!GOOGLE_API_KEY || !PLACE_ID) {
  console.error('⚠️ Error: Variables de entorno faltantes');
  console.error(`GOOGLE_API_KEY: ${GOOGLE_API_KEY ? '✅ Configurada' : '❌ Falta'}`);
  console.error(`GOOGLE_PLACE_ID: ${PLACE_ID ? '✅ Configurada' : '❌ Falta'}`);
  console.error('Por favor, configura las variables de entorno en el archivo .env');
}

async function fetchGoogleReviews(): Promise<{
  reviews: Review[];
  rating: number;
  reviewCount: number;
}> {
  // Verificar nuevamente las keys antes de hacer la petición
  if (!GOOGLE_API_KEY || !PLACE_ID) {
    throw new Error('Las variables de entorno GOOGLE_API_KEY y GOOGLE_PLACE_ID son requeridas');
  }

  try {
    // Fetch place details including reviews with maximum count and sorting
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${PLACE_ID}` +
      `&fields=reviews,rating,user_ratings_total` +
      `&reviews_sort=newest` +
      `&reviews_no_translations=true` +
      `&key=${GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google reviews');
    }

    const data = await response.json();
    
    // Log para diagnóstico
    console.log('Google Places API Response:', {
      status: data.status,
      reviewsCount: data.result?.reviews?.length,
      totalRatings: data.result?.user_ratings_total,
      rating: data.result?.rating
    });

    if (!data.result?.reviews) {
      console.error('No reviews found in response:', data);
      return {
        reviews: [],
        rating: data.result?.rating || 0,
        reviewCount: data.result?.user_ratings_total || 0
      };
    }

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