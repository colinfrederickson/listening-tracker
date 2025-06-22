# 🎵 Listening Tracker

A personal dashboard to track your music and podcast listening habits across Spotify, Nugs.net, and other platforms.

## Features

- 📊 **Spotify Integration** - Automatic tracking of music and podcasts
- 🎸 **Nugs.net Logging** - Manual entry for live concert recordings
- 📈 **Analytics Dashboard** - Visual insights into your listening patterns
- 🎯 **Cross-Platform Analysis** - Compare listening habits across services
- 📱 **Responsive Design** - Works on desktop and mobile

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/listening-tracker.git
   cd listening-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Spotify API credentials**

   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Copy your Client ID and Client Secret
   - Create a `.env` file:
     ```
     SPOTIFY_CLIENT_ID=your_client_id_here
     SPOTIFY_CLIENT_SECRET=your_client_secret_here
     REDIRECT_URI=http://localhost:3000/callback
     ```

4. **Start the server**

   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Development

- **Run in development mode** (with auto-reload):

  ```bash
  npm run dev
  ```

- **Project Structure**:
  ```
  listening-tracker/
  ├── public/           # Frontend files (HTML, CSS, JS)
  ├── server.js         # Express server and API routes
  ├── package.json      # Dependencies and scripts
  └── .env             # Environment variables (not in git)
  ```

## Customization

The dashboard is fully customizable:

- **Colors & Themes**: Edit CSS variables in `public/index.html`
- **Charts**: Modify Chart.js configurations
- **Data Sources**: Add new platforms by extending the API
- **Layout**: Rearrange dashboard sections

## API Endpoints

- `GET /login` - Initiate Spotify OAuth
- `GET /callback` - Handle OAuth callback
- `GET /api/top-tracks` - User's top tracks
- `GET /api/top-artists` - User's top artists
- `GET /api/recently-played` - Recent listening history
- `GET /api/shows` - Followed podcast shows

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Last.fm integration
- [ ] Apple Music support
- [ ] Data export (CSV, JSON)
- [ ] Listening goals and achievements
- [ ] Social sharing features
- [ ] Mobile app version

## Support

If you have questions or run into issues:

- Check the [Issues](https://github.com/yourusername/listening-tracker/issues) page
- Create a new issue with details about your problem
- Include your OS, Node.js version, and error messages
