export default function Songs({ tracks }) {
    if (!tracks || tracks.length === 0) {
        return null;
    }

    return (
        <div id="tracks-container">
            {tracks.map((track) => (
                <div className="track-card" key={`${track.id}-${track.rank}`}>
                    <p><strong>#{track.rank} - {track.name}</strong></p>
                    <p>Artist: {track.artist}</p>
                    <p>Album: {track.album}</p>
                    <a 
                        className="spotify_button" 
                        href={track.spotifyUrl} 
                        target="_blank" 
                        rel="noreferrer"
                    >
                        Listen on Spotify
                    </a>
                </div>
            ))}
        </div>
    );
}