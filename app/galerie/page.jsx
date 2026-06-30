import GalleryRoutePage, {
  buildGalleryMetadata,
  galleryCanonicalPath,
} from '../../src/kit/marketplace/GalleryRoutePage';

export const revalidate = 300;
export const dynamic = 'force-static';

export const metadata = buildGalleryMetadata(galleryCanonicalPath);

export default function GaleriePage() {
  return <GalleryRoutePage canonicalPath={galleryCanonicalPath} />;
}
