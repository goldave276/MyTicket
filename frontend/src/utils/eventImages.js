// The events table has no image column (see backend/src/validators/eventValidator.js),
// so real events never carry a photo from the API. Rather than pretend otherwise with a
// per-event "Image URL" field the backend silently drops, every event gets a stable,
// category-appropriate placeholder picked from this fixed set.
const CATEGORY_IMAGES = {
  CONCERT: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  FESTIVAL: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  WORKSHOP: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  THEATRE: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=80',
  SPORT: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80';

export function getEventImage(eventType) {
  return CATEGORY_IMAGES[eventType] || DEFAULT_EVENT_IMAGE;
}

export default getEventImage;
