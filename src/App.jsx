import { useState } from 'react';
import Songs from './components/Songs';
import { getAccessToken, searchArtist, getTopTracks } from './spotifyApi';

export default function App() {
    const [artistInput, setArtistInput] = useState('');
    const [tracks, setTracks] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSearch(e) {
        e.preventDefault(); // Prevents page reload on form submit
        const trimmedName = artistInput.trim();

        setErrorMessage('');
        setTracks([]);

        if (!trimmedName) {
            setErrorMessage('Please enter an artist name first.');
            return;
        }

        setStatusMessage(`Searching for "${trimmedName}"...`);

        try {
            const token = await getAccessToken();
            const artist = await searchArtist(trimmedName, token);

            if (!artist) {
                setStatusMessage(`Couldn't find artist "${trimmedName}". Please check the spelling and try again.`);
                return;
            }

            setStatusMessage(`Loading tracks for ${artist.name}...`);
            const fetchedTracks = await getTopTracks(artist.id, token);

            if (fetchedTracks.length === 0) {
                setStatusMessage(`No tracks or albums found for ${artist.name}.`);
                return;
            }

            setStatusMessage('');
            setTracks(fetchedTracks);
        } catch (err) {
            setStatusMessage('');
            setErrorMessage(err.message);
        }
    }

    return (
        <div>
            <h1>20 Random Songs From an Artist of Your Choice!</h1>
            <h3>Listen to some new-to-you songs from your favorite artists!</h3>

            <form id="fetch_button_container" onSubmit={handleSearch}>
                <input
                    className="fetch_input"
                    type="text"
                    placeholder="e.g. Nirvana, Drake..."
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                />
                <button type="submit" id="fetch_button">Search</button>
            </form>

            {errorMessage && (
                <div className="error-message">
                    <p><strong>Error:</strong> {errorMessage}</p>
                </div>
            )}

            {statusMessage && (
                <p style={{ padding: '10px', fontWeight: 'bold', textAlign: 'center' }}>
                    {statusMessage}
                </p>
            )}

            <Songs tracks={tracks} />
        </div>
    );
}