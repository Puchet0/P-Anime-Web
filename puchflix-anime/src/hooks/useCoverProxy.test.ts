import { describe, it, expect } from 'vitest';
import { applyCoverMap, promoteAnilistCover } from './useCoverProxy';

// Mock anime result type (subset of AnimeResult)
interface MockAnime {
  id?: number | null;
  title: string;
  image?: string | null;
  coverImage?: string | null;
  anilistCoverImage?: string | null;
}

describe('useCoverProxy', () => {
  describe('applyCoverMap', () => {
    it('maps anilistCoverImage through the cover map when present', () => {
      const items: MockAnime[] = [
        {
          title: 'Test Anime',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg',
          image: null,
          coverImage: null,
        },
      ];

      const coverMap: Record<string, string> = {
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg':
          '/covers/bx123.jpg',
      };

      const result = applyCoverMap(items, coverMap);
      expect(result[0].anilistCoverImage).toBe('/covers/bx123.jpg');
    });

    it('maps image and coverImage through the cover map', () => {
      const items: MockAnime[] = [
        {
          title: 'Test Anime',
          image: 'https://cdn.jkdesa.com/image1.jpg',
          coverImage: 'https://cdn.jkdesa.com/image2.jpg',
          anilistCoverImage: null,
        },
      ];

      const coverMap: Record<string, string> = {
        'https://cdn.jkdesa.com/image1.jpg': '/covers/image1.jpg',
        'https://cdn.jkdesa.com/image2.jpg': '/covers/image2.jpg',
      };

      const result = applyCoverMap(items, coverMap);
      expect(result[0].image).toBe('/covers/image1.jpg');
      expect(result[0].coverImage).toBe('/covers/image2.jpg');
    });

    it('leaves URLs unchanged when not in cover map', () => {
      const items: MockAnime[] = [
        {
          title: 'Test Anime',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg',
        },
      ];

      const coverMap: Record<string, string> = {};
      const result = applyCoverMap(items, coverMap);
      expect(result[0].anilistCoverImage).toBe('https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg');
    });

    it('maps multiple items in the same array', () => {
      const items: MockAnime[] = [
        {
          title: 'Anime 1',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1.jpg',
        },
        {
          title: 'Anime 2',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx2.jpg',
        },
        {
          title: 'Anime 3',
          anilistCoverImage: null,
          image: 'https://cdn.jkdesa.com/image3.jpg',
        },
      ];

      const coverMap: Record<string, string> = {
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1.jpg': '/covers/bx1.jpg',
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx2.jpg': '/covers/bx2.jpg',
        'https://cdn.jkdesa.com/image3.jpg': '/covers/image3.jpg',
      };

      const result = applyCoverMap(items, coverMap);
      expect(result[0].anilistCoverImage).toBe('/covers/bx1.jpg');
      expect(result[1].anilistCoverImage).toBe('/covers/bx2.jpg');
      expect(result[2].image).toBe('/covers/image3.jpg');
    });
  });

  describe('promoteAnilistCover', () => {
    it('promotes anilistCoverImage to image when it is mapped in coverMap', () => {
      const items: MockAnime[] = [
        {
          title: 'Test Anime',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg',
          image: null,
        },
      ];

      const coverMap: Record<string, string> = {
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg': '/covers/bx123.jpg',
      };

      const result = promoteAnilistCover(items, coverMap);
      expect(result[0].image).toBe('/covers/bx123.jpg');
    });

    it('does not promote when anilistCoverImage is not in coverMap', () => {
      const items: MockAnime[] = [
        {
          title: 'Test Anime',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg',
          image: null,
        },
      ];

      const result = promoteAnilistCover(items, {});
      expect(result[0].image).toBeNull();
    });

    it('does not overwrite existing image', () => {
      const items: MockAnime[] = [
        {
          title: 'Test Anime',
          image: '/covers/proxied.jpg',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg',
        },
      ];

      const result = promoteAnilistCover(items, {});
      expect(result[0].image).toBe('/covers/proxied.jpg');
    });

    it('uses mapped proxy URL when anilistCoverImage is in coverMap', () => {
      const items: MockAnime[] = [
        {
          title: 'Test Anime',
          anilistCoverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg',
          image: null,
        },
      ];

      const coverMap: Record<string, string> = {
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx123.jpg': 'http://localhost:8093/covers/bx123.jpg',
      };

      const result = promoteAnilistCover(items, coverMap);
      expect(result[0].image).toBe('http://localhost:8093/covers/bx123.jpg');
    });
  });
});