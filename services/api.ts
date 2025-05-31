interface World {
  name: string;
  shortName: string;
  genre: string;
  developer?: string;
  studio?: string;
  network?: string;
}

interface Universe {
  name: string;
  worlds: World[];
}

interface UniversesResponse {
  universes: Universe[];
}

// For development/testing, you can use this mock data
const MOCK_DATA: UniversesResponse = {
  //We can create a server to get the data from the server
  //We can also check the game usage etc from there
  "universes": [
    {
      "name": "Games",
      "worlds": [
        {
          "name": "Red Dead Redemption",
          "shortName": "RDR",
          "genre": "Western",
          "developer": "Rockstar Games"
        },
        {
          "name": "Assassin's Creed",
          "shortName": "AC",
          "genre": "Action-Adventure",
          "developer": "Ubisoft"
        },
        {
          "name": "Grand Theft Auto",
          "shortName": "GTA",
          "genre": "Open World",
          "developer": "Rockstar Games"
        }
      ]
    },
    {
      "name": "Movie",
      "worlds": [
        {
          "name": "Marvel Cinematic Universe",
          "shortName": "MCU",
          "genre": "Superhero",
          "studio": "Marvel Studios"
        },
        {
          "name": "Star Wars",
          "shortName": "SW",
          "genre": "Sci-Fi",
          "studio": "Lucasfilm"
        }
      ]
    },
    {
      "name": "TV Show",
      "worlds": [
        {
          "name": "Game of Thrones",
          "shortName": "GoT",
          "genre": "Fantasy",
          "network": "HBO"
        },
        {
          "name": "Stranger Things",
          "shortName": "ST",
          "genre": "Sci-Fi Horror",
          "network": "Netflix"
        }
      ]
    }
  ]
};

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private useMockData: boolean;

  private constructor() {
    this.baseUrl = 'https://api.example.com'; // Replace with your actual API endpoint
    this.useMockData = true; // Set to false when using real API
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public async getUniverses(): Promise<UniversesResponse> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_DATA;
    }

    try {
      const response = await fetch(`${this.baseUrl}/universes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as UniversesResponse;
    } catch (error) {
      console.error('Error fetching universes:', error);
      throw error;
    }
  }

  public async getWorldsByUniverse(universeName: string): Promise<World[]> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const universe = MOCK_DATA.universes.find(u => u.name === universeName);
      return universe?.worlds || [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/universes/${universeName}/worlds`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as World[];
    } catch (error) {
      console.error(`Error fetching worlds for universe ${universeName}:`, error);
      throw error;
    }
  }
}

export default ApiService;
export type { Universe, World, UniversesResponse }; 