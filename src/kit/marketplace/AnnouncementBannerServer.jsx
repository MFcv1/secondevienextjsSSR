import { DEFAULT_ANNOUNCEMENT_MESSAGES } from '../../lib/server/galleryPersonalization';

const normalizeMessages = (messages) => {
  const normalized = (Array.isArray(messages) ? messages : [])
    .map((message) => String(message || '').trim())
    .filter(Boolean);
  return normalized.length ? normalized : DEFAULT_ANNOUNCEMENT_MESSAGES;
};

export default function AnnouncementBannerServer({ darkMode = false, messages = DEFAULT_ANNOUNCEMENT_MESSAGES } = {}) {
  const announcementMessages = normalizeMessages(messages);
  const duration = Math.max(announcementMessages.length, 1) * 5;

  return (
    <div
      className={`gallery-announcement-banner ${darkMode ? 'gallery-announcement-banner--dark' : ''}`}
      data-gallery-announcement
      data-announcement-collapsed="false"
    >
      <div className="gallery-announcement-track" aria-live="polite">
        {announcementMessages.map((message, index) => (
          <span
            key={`${message}-${index}`}
            className={`gallery-announcement-message ${announcementMessages.length === 1 ? 'gallery-announcement-message--static' : ''}`}
            style={{
              '--announcement-delay': `${index * 5}s`,
              '--announcement-duration': `${duration}s`,
            }}
          >
            {message}
          </span>
        ))}
      </div>

      <div className="gallery-announcement-language" aria-hidden="true">
        <span>Français</span>
        <span className="gallery-announcement-language-chevron" />
      </div>
    </div>
  );
}
