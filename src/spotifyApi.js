const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

export async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        let errorDetails = `HTTP ${response.status}`;
        try {
            const errJson = await response.json();
            errorDetails = errJson.error_description || errJson.error || errorDetails;
        } catch (_) {}
        throw new Error(`Authentication failed (${errorDetails})`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function searchArtist(artistName, token) {
    const query = encodeURIComponent(artistName);
    const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        let details = `HTTP ${response.status}`;
        try {
            const errJson = await response.json();
            if (errJson.error && errJson.error.message) {
                details = `${errJson.error.message} (${response.status})`;
            }
        } catch (_) {}
        throw new Error(`Spotify Search Error: ${details}`);
    }

    const data = await response.json();
    if (!data.artists || data.artists.items.length === 0) {
        return null;
    }
    return data.artists.items[0];
}

export async function getTopTracks(artistId, token) {
    const albumsResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&market=US&limit=10`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!albumsResponse.ok) {
        let details = `HTTP ${albumsResponse.status}`;
        try {
            const errJson = await albumsResponse.json();
            if (errJson.error && errJson.error.message) {
                details = `${errJson.error.message} (${albumsResponse.status})`;
            }
        } catch (_) {}
        throw new Error(`Spotify Album Fetch Error: ${details}`);
    }

    const albumsData = await albumsResponse.json();
    if (albumsData.items.length === 0) {
        return [];
    }

    const albumTrackRequests = albumsData.items.map(album =>
        fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?market=US&limit=20`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(async res => {
            if (!res.ok) {
                return { albumName: album.name, tracks: [] };
            }
            const data = await res.json();
            return { albumName: album.name, tracks: data.items };
        })
    );

    const albumResults = await Promise.all(albumTrackRequests);

    const allTracks = albumResults.flatMap(result =>
        result.tracks.map(track => ({
            id: track.id, // Added id for React list rendering
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            album: result.albumName,
            spotifyUrl: track.external_urls.spotify
        }))
    );

    for (let i = allTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
    }

    return allTracks.slice(0, 20).map((track, idx) => ({ rank: idx + 1, ...track }));
}