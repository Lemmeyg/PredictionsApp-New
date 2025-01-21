import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testApiKey() {
  try {
    const response = await axios.get('https://v3.football.api-sports.io/status', {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
        'x-apisports-key': process.env.FOOTBALL_API_KEY,
      },
    });

    console.log('API Key Status:', response.data);
  } catch (error: any) {
    console.error('API Key Test Failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
  }
}

testApiKey(); 